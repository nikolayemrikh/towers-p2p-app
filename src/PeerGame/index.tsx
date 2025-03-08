import { FC, useEffect, useMemo, useState } from 'react';

import { PageMain } from '@app/components/PageMain';
import { CARD_VARIANTS } from '@app/core/game/constants';
import { IGame, TGameAction } from '@app/core/game/types';
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

  const game = useMemo(() => JSON.parse(localStorage.getItem(ELocalStorageKey.Games) ?? '{}')[id] as IGame, [id]);
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
        for (const player of game.players) {
          const connectionId = getPeerId(player);
          if (draft[connectionId]) continue;
          draft[connectionId] = peer.connect(connectionId);
        }
      })
    );
  }, [peer, game]);

  const broadcastAction = (action: TGameAction) => {
    for (const connection of Object.values(playersConnections)) {
      connection.send(JSON.stringify(action));
    }
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
          {game.players.map((player) => (
            <Typography key={player}>{player}</Typography>
          ))}
        </Stack>
      </Stack>
      <div style={{ height: '100%', padding: '16px' }}>
        <div>
          <div>Deck ({game.board.closedCardNumbers.length})</div>
          <button
            disabled={
              game.board.turnUsername !== username ||
              pullCardMutation.isPending ||
              !game.board.closedCardNumbers.length ||
              !!game.board.pulledCardNumberToChange ||
              !!game.board.openedCardNumberToUse
            }
            onClick={() => pullCardMutation.mutate()}
          >
            pull card
          </button>
          <div>Pulled card</div>
          {game.board.pulledCardNumberToChange && (
            <Card
              number={game.board.pulledCardNumberToChange}
              power={CARD_VARIANTS.find((card) => card.number === game.board.pulledCardNumberToChange)!.power}
              isActionAvailable={false}
              isProtected={false}
            />
          )}
          <div>Opened cards</div>
          {game.board.openCardNumbers.map((openedCardNumber) => (
            <Card
              key={openedCardNumber}
              number={openedCardNumber}
              power={CARD_VARIANTS.find((card) => card.number === openedCardNumber)!.power}
              isActionAvailable={false}
              isProtected={false}
              onClick={() => {
                if (game.board.openedCardNumberToUse) return;
                if (selectOpenedCardMutation.isPending) return;
                selectOpenedCardMutation.mutate({ boardId: board.id, cardNumber: openedCardNumber });
              }}
            />
          ))}
          <div>Selected opened card</div>
          {game.board.openedCardNumberToUse && (
            <Card
              number={game.board.openedCardNumberToUse}
              power={CARD_VARIANTS.find((card) => card.number === game.board.openedCardNumberToUse)!.power}
              isActionAvailable={false}
              isProtected={false}
            />
          )}
          <div>Discard pile ({game.board.discardedCardNumbers.length})</div>
        </div>
        <div>Towers</div>
        {/* Decks horizontal list */}
        <Stack direction="row" justifyContent="space-between" paddingX={1}>
          <UserTower
            boardId={id}
            turnUserId={game.board.turnUsername ?? null}
            cards={game.board.towers[username].cards}
            userId={username}
            openedCardToUse={game.board.openedCardNumberToUse ?? null}
            pulledCardToChange={game.board.pulledCardNumberToChange ?? null}
            makeAction={(action) => {
              broadcastAction(action);
            }}
          />
          {Object.entries(game.board.towers)
            .filter(([towerUsername]) => towerUsername !== username)
            .map(([towerUsername, tower]) => (
              <Tower key={towerUsername} cards={tower.cards} />
            ))}
        </Stack>
      </div>
    </PageMain>
  );
};
