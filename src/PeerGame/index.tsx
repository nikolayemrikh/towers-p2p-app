import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { PageMain } from '@app/components/PageMain';
import { getStoredKeys } from '@app/core/crypto/keyManagement';
import { applyAction } from '@app/core/game/applyAction';
import { checkIsUserCardAvailableForInitialAction } from '@app/core/game/common/checkIsUserCardAvailableForInitialAction';
import { CARD_VARIANTS } from '@app/core/game/constants';
import { createBlock } from '@app/core/game/createBlock';
import { EGameActionType } from '@app/core/game/enums';
import { IBoard, IGameBlockChain, TGameAction } from '@app/core/game/types';
import { validateBlock } from '@app/core/game/validateBlock';
import { verifyBlock } from '@app/core/game/verifyBlock';
import { ELocalStorageKey } from '@app/core/localStorage/constants';
import { EPeerEventType } from '@app/core/peer/enums';
import { getPeerId } from '@app/core/peer/getPeerId';
import { getUsernameFromPeerId } from '@app/core/peer/getUsernameFromPeerId';
import { IAfterConnectionStartedCheckEvent, TPeerEvent } from '@app/core/peer/types';
import { Stack, Typography } from '@mui/material';
import { produce } from 'immer';
import { DataConnection, Peer } from 'peerjs';
import { useParams } from 'react-router-dom';
import { Card } from './Card';
import { Tower } from './Tower';
import { UserTower } from './UserTower';

const PAGE_PREFIX = 'game';

const getStoredGameBlockchains = (): Record<string, IGameBlockChain> => {
  return JSON.parse(localStorage.getItem(ELocalStorageKey.GameBlockchains) ?? '{}');
};

export const PeerGame: FC = () => {
  const { id } = useParams();

  if (!id) throw new Error('id is required');

  const keyPair = useMemo(() => getStoredKeys(), []);
  if (!keyPair) throw new Error('keyPair is required');

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
  const winnerUsername: string | null = useMemo(() => {
    for (const [player, tower] of Object.entries(board.towers)) {
      const isTowerSorted = tower.cards.every((card, index, arr) => {
        const nextCard = arr[index + 1];
        return !nextCard || card.number > nextCard.number;
      });
      if (!isTowerSorted) continue;
      return player;
    }
    return null;
  }, [board]);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [playersConnections, setPlayersConnections] = useState<Record<string, DataConnection>>({});
  const [playersLastBlockHashes, setPlayersLastBlockHashes] = useState<Record<string, string | undefined>>({});
  const [isAllPlayersSynced, setIsAllPlayersSynced] = useState(false);

  const isAllPlayersConnected = Object.keys(playersLastBlockHashes).length === players.length - 1;

  const handleNewConnection = useCallback(
    (connection: DataConnection) => {
      connection.on('open', async () => {
        console.debug('connection opened', connection.peer);

        setPlayersConnections((prev) =>
          produce(prev, (draft) => {
            draft[connection.peer] = connection;
          })
        );
        const gameBlockchain = getStoredGameBlockchains()[id];
        console.debug('last block sent to connection');
        await connection.send({
          type: EPeerEventType.afterConnectionStartedCheck,
          data: {
            lastBlockHash: gameBlockchain.blocks[gameBlockchain.blocks.length - 1]?.hash,
          },
        } satisfies IAfterConnectionStartedCheckEvent);
      });
      connection.on('close', () => {
        console.debug('connection closed', connection.peer);
        setPlayersConnections((prev) =>
          produce(prev, (draft) => {
            delete draft[connection.peer];
          })
        );
        setPlayersLastBlockHashes((prev) =>
          produce(prev, (draft) => {
            delete draft[connection.peer];
          })
        );
        setIsAllPlayersSynced(false);
      });

      const handleData = async (data: unknown) => {
        console.debug('data received', data);

        if (typeof data !== 'object') return;
        const event = data as TPeerEvent;
        const gameBlockchain = getStoredGameBlockchains()[id];
        if (event.type === EPeerEventType.action) {
          const block = event.data;
          if (!validateBlock(gameBlockchain, block)) {
            throw new Error('Invalid block');
          }
          const playerPublicKey = gameBlockchain.players.find(
            (player) => player.username === getUsernameFromPeerId(PAGE_PREFIX, connection.peer)
          )?.publicKey;
          if (!playerPublicKey) throw new Error('Player public key not found');

          if (!(await verifyBlock(block, playerPublicKey))) {
            throw new Error('Invalid signature');
          }

          setBoard((prev) => produce(prev, (draft) => applyAction(draft, block.action)));
          const gameBlockchains = getStoredGameBlockchains();
          gameBlockchains[id].blocks.push(block);
          localStorage.setItem(ELocalStorageKey.GameBlockchains, JSON.stringify(gameBlockchains));

          await connection.send({
            type: EPeerEventType.afterConnectionStartedCheck,
            data: {
              lastBlockHash: gameBlockchains[id].blocks[gameBlockchains[id].blocks.length - 1].hash,
            },
          } satisfies IAfterConnectionStartedCheckEvent);
        } else if (event.type === EPeerEventType.afterConnectionStartedCheck) {
          const receivedLastBlockHash = event.data.lastBlockHash;

          setPlayersLastBlockHashes((prev) =>
            produce(prev, (draft) => {
              draft[connection.peer] = receivedLastBlockHash;
            })
          );
        }
      };
      connection.on('data', handleData);
    },
    [id]
  );

  useEffect(() => {
    const peer = new Peer(getPeerId(PAGE_PREFIX, username));
    peer.on('open', () => {
      setPeer(peer);
    });

    peer.on('connection', async (connection) => {
      console.debug('connection received', connection.peer);

      handleNewConnection(connection);
    });
    peer.on('disconnected', (connectionId) => {
      console.debug('disconnected', connectionId);
      // setPlayersConnections((prev) =>
      //   produce(prev, (draft) => {
      //     delete draft[connectionId];
      //   })
      // );
      // setPlayersLastBlockHashes((prev) =>
      //   produce(prev, (draft) => {
      //     delete draft[connectionId];
      //   })
      // );
      // setIsAllPlayersSynced(false);
    });

    window.addEventListener('beforeunload', () => {
      peer.destroy();
      setPeer(null);
    });

    return () => {
      peer.destroy();
      setPeer(null);
    };
  }, [username, handleNewConnection]);

  useEffect(() => {
    if (!peer) return;

    setPlayersConnections((prev) =>
      produce(prev, (draft) => {
        for (const player of players) {
          const connectionId = getPeerId(PAGE_PREFIX, player.username);
          if (player.username === username) continue;
          if (draft[connectionId]) continue;
          const connection: DataConnection | undefined = peer.connect(connectionId, { serialization: 'json' });
          // could be undefined if peer is destroyed
          if (!connection) return;
          draft[connectionId] = connection;
          console.debug('connection created', connection.peer);
          handleNewConnection(connection);
        }
      })
    );

    return () => {
      setPlayersConnections((prev) =>
        produce(prev, (draft) => {
          for (const connection of Object.values(draft)) {
            connection.close();
            delete draft[connection.peer];
          }
        })
      );
    };
  }, [peer, username, players, handleNewConnection]);

  useEffect(() => {
    const gameBlockchain = getStoredGameBlockchains()[id];
    const ownLastBlock = gameBlockchain.blocks[gameBlockchain.blocks.length - 1];
    const isAllPlayersLastBlockHashesEqual =
      gameBlockchain.players.length === Object.keys(playersLastBlockHashes).length + 1 &&
      Object.values(playersLastBlockHashes).every((hash) => hash === ownLastBlock?.hash);

    setIsAllPlayersSynced(isAllPlayersLastBlockHashesEqual);
  }, [id, playersLastBlockHashes]);

  const broadcastEvent = async (event: TPeerEvent) => {
    await Promise.all(Object.values(playersConnections).map((connection) => connection.send(event)));
  };
  const makeAction = async (action: TGameAction) => {
    const gameBlockchain = getStoredGameBlockchains()[id];

    const block = await createBlock(username, action, gameBlockchain, keyPair.privateKey);

    setIsAllPlayersSynced(false);
    await broadcastEvent({ type: EPeerEventType.action, data: block });
    setBoard((prev) => produce(prev, (draft) => applyAction(draft, block.action)));
    const gameBlockchains = getStoredGameBlockchains();
    gameBlockchains[id].blocks.push(block);
    localStorage.setItem(ELocalStorageKey.GameBlockchains, JSON.stringify(gameBlockchains));
  };

  return (
    <PageMain>
      <Stack>
        <Typography variant="h1">Peer Game</Typography>
      </Stack>
      {isAllPlayersConnected ? (
        <div style={{ height: '100%', padding: '16px' }}>
          <div>
            <div>Deck ({board.closedCardNumbers.length})</div>
            {winnerUsername && <div>Winner: {winnerUsername}</div>}
            <button
              disabled={
                !isAllPlayersSynced ||
                !!winnerUsername ||
                board.turnUsername !== username ||
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
                width={230}
                number={board.pulledCardNumberToChange}
                power={CARD_VARIANTS.find((card) => card.number === board.pulledCardNumberToChange)!.power}
                isActionAvailable={false}
                isProtected={false}
              />
            )}
            <div>Opened cards</div>
            {board.openCardNumbers.map((openedCardNumber) => (
              <Card
                width={230}
                key={openedCardNumber}
                number={openedCardNumber}
                power={CARD_VARIANTS.find((card) => card.number === openedCardNumber)!.power}
                isActionAvailable={
                  isAllPlayersSynced &&
                  !winnerUsername &&
                  username === board.turnUsername &&
                  !board.openedCardNumberToUse &&
                  !board.pulledCardNumberToChange &&
                  board.towers[username].cards.some((card, index) =>
                    checkIsUserCardAvailableForInitialAction(
                      index,
                      card.isProtected,
                      CARD_VARIANTS.find((card) => card.number === openedCardNumber)!.power,
                      board.towers[username].cards
                    )
                  )
                }
                isProtected={false}
                onClick={() => {
                  makeAction({
                    type: EGameActionType.SelectOpenedCard,
                    params: { currentUsername: username, cardNumber: openedCardNumber },
                  });
                }}
              />
            ))}
            <div>Selected opened card</div>
            {board.openedCardNumberToUse && (
              <Card
                width={230}
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
              isGameFinished={!!winnerUsername}
              makeAction={(action) => {
                makeAction(action);
              }}
            />
            {Object.entries(board.towers)
              .filter(([towerUsername]) => towerUsername !== username)
              .map(([towerUsername, tower]) => (
                <Tower key={towerUsername} cards={tower.cards} userId={towerUsername} />
              ))}
          </Stack>
        </div>
      ) : (
        <div>Waiting for all players to join...</div>
      )}
    </PageMain>
  );
};
