import { FC, useEffect, useMemo, useState } from 'react';

import { PageMain } from '@app/components/PageMain';
import { applyAction } from '@app/core/game/applyAction';
import { CARD_VARIANTS } from '@app/core/game/constants';
import { createBlock } from '@app/core/game/createBlock';
import { EGameActionType } from '@app/core/game/enums';
import { IBoard, IGameBlockChain, TGameAction } from '@app/core/game/types';
import { validateBlock } from '@app/core/game/validateBlock';
import { ELocalStorageKey } from '@app/core/localStorage/constants';
import { EPeerEventType } from '@app/core/peer/enums';
import { getPeerId } from '@app/core/peer/getPeerId';
import { getUsernameFromPeerId } from '@app/core/peer/getUsernameFromPeerId';
import { IAfterConnectionStartedCheckEvent, TPeerEvent } from '@app/core/peer/types';
import { Stack, Typography } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { produce } from 'immer';
import { DataConnection, Peer } from 'peerjs';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from './Card';
import { Tower } from './Tower';
import { UserTower } from './UserTower';

const PAGE_PREFIX = 'game';

const getStoredGameBlockchains = (): Record<string, IGameBlockChain> => {
  return JSON.parse(localStorage.getItem(ELocalStorageKey.GameBlockchains) ?? '{}');
};

export const PeerGame: FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  if (!id) throw new Error('id is required');

  const username = localStorage.getItem(ELocalStorageKey.Username);
  if (!username) throw new Error('username is required');

  const players = useMemo(() => getStoredGameBlockchains()[id].players, [id]);
  const [board, setBoard] = useState<IBoard>(() => {
    const gameBlockchain = getStoredGameBlockchains()[id];
    const board = gameBlockchain.initialBoard;
    for (let i = 0; i < gameBlockchain.blocks.length; i++) {
      const block = gameBlockchain.blocks[i];
      const previousBlock = gameBlockchain.blocks[i - 1];
      if (previousBlock && previousBlock.hash !== block.previousHash) {
        throw new Error('Invalid block');
      }
      applyAction(board, block.action);
    }

    return board;
  });
  const [peer, setPeer] = useState<Peer | null>(null);
  const [playersConnections, setPlayersConnections] = useState<Record<string, DataConnection>>({});
  const [playersLastBlockHashes, setPlayersLastBlockHashes] = useState<Record<string, string | undefined>>({});
  const [isAllPlayersSynced, setIsAllPlayersSynced] = useState(false);

  const isAllPlayersConnected = Object.keys(playersLastBlockHashes).length === players.length - 1;

  useEffect(() => {
    const peer = new Peer(getPeerId(PAGE_PREFIX, username));
    peer.once('open', () => {
      setPeer(peer);
    });

    peer.on('connection', (connection) => {
      setPlayersConnections((prev) =>
        produce(prev, (draft) => {
          draft[connection.peer] = connection;
        })
      );
    });
    peer.on('disconnected', (connectionId) => {
      setPlayersConnections((prev) =>
        produce(prev, (draft) => {
          delete draft[connectionId];
        })
      );
    });

    window.addEventListener('beforeunload', () => {
      peer.destroy();
      setPeer(null);
    });

    return () => {
      peer.destroy();
      setPeer(null);
    };
  }, [username]);

  useEffect(() => {
    if (!peer) return;
    setTimeout(() => {
      setPlayersConnections((prev) =>
        produce(prev, (draft) => {
          for (const player of players) {
            const connectionId = getPeerId(PAGE_PREFIX, player);
            if (player === username) continue;
            if (draft[connectionId]) continue;
            const connection = peer.connect(connectionId, { serialization: 'json' });
            draft[connectionId] = connection;
          }
        })
      );
    }, 1000);
  }, [peer, username, players]);

  useEffect(() => {
    const gameBlockchain = getStoredGameBlockchains()[id];
    const ownLastBlock = gameBlockchain.blocks[gameBlockchain.blocks.length - 1];
    const isAllPlayersLastBlockHashesEqual =
      gameBlockchain.players.length === Object.keys(playersLastBlockHashes).length + 1 &&
      Object.values(playersLastBlockHashes).every((hash) => hash === ownLastBlock?.hash);

    setIsAllPlayersSynced(isAllPlayersLastBlockHashesEqual);
  }, [id, playersLastBlockHashes]);

  useEffect(() => {
    if (!Object.keys(playersConnections).length) return;

    for (const connection of Object.values(playersConnections)) {
      connection.once('open', async () => {
        const gameBlockchain = getStoredGameBlockchains()[id];
        await connection.send({
          type: EPeerEventType.afterConnectionStartedCheck,
          data: {
            lastBlockHash: gameBlockchain.blocks[gameBlockchain.blocks.length - 1].hash,
          },
        } satisfies IAfterConnectionStartedCheckEvent);
      });
      connection.once('close', () => {
        setPlayersConnections((prev) =>
          produce(prev, (draft) => {
            delete draft[connection.peer];
          })
        );
        setPlayersLastBlockHashes((prev) =>
          produce(prev, (draft) => {
            delete draft[getUsernameFromPeerId(PAGE_PREFIX, connection.peer)];
          })
        );
        setIsAllPlayersSynced(false);
      });
    }
  }, [id, playersConnections]);

  useEffect(() => {
    for (const connection of Object.values(playersConnections)) {
      const handler = async (data: unknown) => {
        if (typeof data !== 'object') return;
        const event = data as TPeerEvent;
        const gameBlockchain = getStoredGameBlockchains()[id];
        if (event.type === EPeerEventType.action) {
          const block = event.data;
          if (!validateBlock(gameBlockchain, block)) {
            throw new Error('Invalid block');
          }
          setBoard((prev) => produce(prev, (draft) => applyAction(draft, block.action)));
          const gameBlockchains = getStoredGameBlockchains();
          gameBlockchains[id].blocks.push(block);
          localStorage.setItem(ELocalStorageKey.GameBlockchains, JSON.stringify(gameBlockchains));

          await connection.send({
            type: EPeerEventType.afterConnectionStartedCheck,
            data: {
              lastBlockHash: gameBlockchain.blocks[gameBlockchain.blocks.length - 1].hash,
            },
          } satisfies IAfterConnectionStartedCheckEvent);
        } else if (event.type === EPeerEventType.afterConnectionStartedCheck) {
          const receivedLastBlockHash = event.data.lastBlockHash;

          setPlayersLastBlockHashes((prev) =>
            produce(prev, (draft) => {
              draft[getUsernameFromPeerId(PAGE_PREFIX, connection.peer)] = receivedLastBlockHash;
            })
          );
        }
      };
      connection.on('data', handler as (data: unknown) => void);
    }

    return () => {
      for (const connection of Object.values(playersConnections)) {
        connection.off('data');
      }
    };
  }, [id, playersConnections]);

  const broadcastEvent = async (event: TPeerEvent) => {
    await Promise.all(Object.values(playersConnections).map((connection) => connection.send(event)));
  };
  const makeAction = async (action: TGameAction) => {
    const gameBlockchain = getStoredGameBlockchains()[id];
    const block = await createBlock(username, action, gameBlockchain);

    setIsAllPlayersSynced(false);
    await broadcastEvent({ type: EPeerEventType.action, data: block });
    setBoard((prev) => produce(prev, (draft) => applyAction(draft, block.action)));
    const gameBlockchains = getStoredGameBlockchains();
    gameBlockchains[id].blocks.push(block);
    localStorage.setItem(ELocalStorageKey.GameBlockchains, JSON.stringify(gameBlockchains));
  };

  const pullCardMutation = useMutation({
    mutationFn: () => {
      return Promise.resolve();
    },
  });
  const selectOpenedCardMutation = useMutation({
    mutationFn: () => {
      return Promise.resolve();
    },
  });

  return (
    <PageMain>
      <Stack>
        <Typography variant="h1">Peer Game</Typography>
        <Typography variant="h2">Players</Typography>
        <Stack>
          {players.map((player) => (
            <Typography key={player}>{player}</Typography>
          ))}
        </Stack>
      </Stack>
      {isAllPlayersConnected ? (
        <div style={{ height: '100%', padding: '16px' }}>
          <div>
            <div>Deck ({board.closedCardNumbers.length})</div>
            <button
              disabled={
                !isAllPlayersSynced ||
                board.turnUsername !== username ||
                pullCardMutation.isPending ||
                !board.closedCardNumbers.length ||
                !!board.pulledCardNumberToChange ||
                !!board.openedCardNumberToUse
              }
              onClick={() => {
                makeAction({
                  type: EGameActionType.PullCard,
                  params: { currentUsername: username },
                });
              }}
            >
              pull card
            </button>
            <div>Pulled card</div>
            {board.pulledCardNumberToChange && (
              <Card
                number={board.pulledCardNumberToChange}
                power={CARD_VARIANTS.find((card) => card.number === board.pulledCardNumberToChange)!.power}
                isActionAvailable={false}
                isProtected={false}
              />
            )}
            <div>Opened cards</div>
            {board.openCardNumbers.map((openedCardNumber) => (
              <Card
                key={openedCardNumber}
                number={openedCardNumber}
                power={CARD_VARIANTS.find((card) => card.number === openedCardNumber)!.power}
                isActionAvailable={false}
                isProtected={false}
                onClick={() => {
                  if (board.openedCardNumberToUse) return;
                  if (selectOpenedCardMutation.isPending) return;
                  selectOpenedCardMutation.mutate({ boardId: board.id, cardNumber: openedCardNumber });
                }}
              />
            ))}
            <div>Selected opened card</div>
            {board.openedCardNumberToUse && (
              <Card
                number={board.openedCardNumberToUse}
                power={CARD_VARIANTS.find((card) => card.number === board.openedCardNumberToUse)!.power}
                isActionAvailable={false}
                isProtected={false}
              />
            )}
            <div>Discard pile ({board.discardedCardNumbers.length})</div>
          </div>
          <div>Towers</div>
          {/* Decks horizontal list */}
          <Stack direction="row" justifyContent="space-between" paddingX={1}>
            <UserTower
              boardId={id}
              turnUserId={board.turnUsername ?? null}
              cards={board.towers[username].cards}
              userId={username}
              openedCardToUse={board.openedCardNumberToUse ?? null}
              pulledCardToChange={board.pulledCardNumberToChange ?? null}
              makeAction={(action) => {
                makeAction(action);
              }}
            />
            {Object.entries(board.towers)
              .filter(([towerUsername]) => towerUsername !== username)
              .map(([towerUsername, tower]) => (
                <Tower key={towerUsername} cards={tower.cards} />
              ))}
          </Stack>
        </div>
      ) : (
        <div>Waiting for all players to join...</div>
      )}
    </PageMain>
  );
};
