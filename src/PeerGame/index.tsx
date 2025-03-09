import { FC, useEffect, useMemo, useState } from 'react';

import { PageMain } from '@app/components/PageMain';
import { applyAction } from '@app/core/game/applyAction';
import { applyBlock } from '@app/core/game/applyBlock';
import { CARD_VARIANTS } from '@app/core/game/constants';
import { createBlock } from '@app/core/game/createBlock';
import { EGameActionType } from '@app/core/game/enums';
import { IBoard, IGameBlockChain, IStepBlock, TGameAction } from '@app/core/game/types';
import { ELocalStorageKey } from '@app/core/localStorage/constants';
import { getPeerId } from '@app/core/peer/getPeerId';
import { Stack, Typography } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { produce } from 'immer';
import { DataConnection, Peer } from 'peerjs';
import { useParams } from 'react-router-dom';
import { Card } from './Card';
import { Tower } from './Tower';
import { UserTower } from './UserTower';

export const PeerGame: FC = () => {
  const { id } = useParams();
  if (!id) throw new Error('id is required');

  const username = localStorage.getItem(ELocalStorageKey.Username);
  if (!username) throw new Error('username is required');

  const gameBlockchain = useMemo(
    () => JSON.parse(localStorage.getItem(ELocalStorageKey.GameBlockchains) ?? '{}')[id] as IGameBlockChain,
    [id]
  );
  const [board, setBoard] = useState<IBoard>(() => {
    const board = gameBlockchain.initialBoard;
    for (const block of gameBlockchain.blocks) {
      produce(board, (draft) => applyBlock(gameBlockchain, draft, block));
    }
    return board;
  });
  const [peer, setPeer] = useState<Peer | null>(null);
  const [playersConnections, setPlayersConnections] = useState<Record<string, DataConnection>>({});

  useEffect(() => {
    const peer = new Peer(getPeerId(username));
    setPeer(peer);

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

    return () => {
      peer.destroy();
    };
  }, [username]);

  useEffect(() => {
    if (!peer) return;
    setPlayersConnections((prev) =>
      produce(prev, (draft) => {
        for (const player of gameBlockchain.players) {
          const connectionId = getPeerId(player);
          if (player === username) continue;
          if (draft[connectionId]) continue;
          draft[connectionId] = peer.connect(connectionId);
        }
      })
    );
  }, [peer, username, gameBlockchain.players]);

  useEffect(() => {
    const handler = async (data: unknown) => {
      if (typeof data !== 'object') return;
      const event = data as IStepBlock;

      setBoard((prev) => produce(prev, (draft) => applyBlock(gameBlockchain, draft, event)));
    };
    for (const connection of Object.values(playersConnections)) {
      connection.on('data', handler as (data: unknown) => void);
    }

    return () => {
      for (const connection of Object.values(playersConnections)) {
        connection.off('data', handler as (data: unknown) => void);
      }
    };
  }, [playersConnections, gameBlockchain]);

  const broadcastBlock = async (block: IStepBlock) => {
    await Promise.all(Object.values(playersConnections).map((connection) => connection.send(block)));
  };
  const makeAction = async (action: TGameAction) => {
    const block = await createBlock(username, action, gameBlockchain);
    await broadcastBlock(block);
    setBoard((prev) => produce(prev, (draft) => applyAction(draft, block.action)));
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
          {gameBlockchain.players.map((player) => (
            <Typography key={player}>{player}</Typography>
          ))}
        </Stack>
      </Stack>
      <div style={{ height: '100%', padding: '16px' }}>
        <div>
          <div>Deck ({board.closedCardNumbers.length})</div>
          <button
            disabled={
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
    </PageMain>
  );
};
