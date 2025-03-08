import { FC, useEffect, useState } from 'react';

import { routes } from '@app/Routes/routes';
import { PageMain } from '@app/components/PageMain';
import { createBoard } from '@app/core/game/createBoard';
import { EGameActionType } from '@app/core/game/enums';
import { IGame, TGameAction } from '@app/core/game/types';
import { ELocalStorageKey } from '@app/core/localStorage/constants';
import { getPeerId } from '@app/core/peer/getPeerId';
import { getUsernameFromPeerId } from '@app/core/peer/getUsernameFromPeerId';
import { Button, Stack, TextField, Typography } from '@mui/material';
import { produce } from 'immer';
import Peer, { DataConnection } from 'peerjs';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';

export const PeerLobby: FC = () => {
  // const { id } = useParams();
  // const [peer, setPeer] = useState<Peer | null>(null);
  const navigate = useNavigate();
  const [username, setUsername] = useState(localStorage.getItem('username') ?? '');
  const [currentUsername, setCurrentUsername] = useState(username);
  const [peerId, setPeerId] = useState('');
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
    if (!playersConnections) return;
    const handler = (data: unknown) => {
      const event = JSON.parse(data as string) as TGameAction;
      if (event.type === EGameActionType.InitializeGame) {
        const game = event.params;
        navigate(`${routes.game}/${game.id}`);
        const games = JSON.parse(localStorage.getItem(ELocalStorageKey.Games) ?? '{}');
        games[game.id] = game;
        localStorage.setItem(ELocalStorageKey.Games, JSON.stringify(games));
      }
    };
    for (const connection of Object.values(playersConnections)) {
      connection.on('data', handler as (data: unknown) => void);
    }

    return () => {
      for (const connection of Object.values(playersConnections)) {
        connection.off('data', handler as (data: unknown) => void);
      }
    };
  }, [navigate, playersConnections]);

  const broadcastAction = (action: TGameAction) => {
    for (const connection of Object.values(playersConnections)) {
      connection.send(JSON.stringify(action));
    }
  };

  return (
    <PageMain>
      <Stack direction="column" gap={2}>
        <Typography variant="h1">Peer lobby</Typography>

        {username ? (
          <Stack direction="column" gap={2}>
            <Typography variant="body1">Юзернейм: {username}</Typography>
            <Button
              onClick={() => {
                localStorage.removeItem(ELocalStorageKey.Username);
                setUsername('');
              }}
            >
              Сменить юзернейм
            </Button>
          </Stack>
        ) : (
          <Stack direction="column" gap={2}>
            <Typography variant="body1">Придумайте юзернейм</Typography>
            <TextField value={currentUsername} onChange={(e) => setCurrentUsername(e.target.value)} />
            <Button
              onClick={() => {
                localStorage.setItem(ELocalStorageKey.Username, currentUsername);
                setUsername(currentUsername);
                setCurrentUsername('');
              }}
            >
              Сохранить
            </Button>
          </Stack>
        )}

        {peer && (
          <Stack direction="column" gap={2}>
            <Typography variant="body1">Подключиться к игроку</Typography>
            <TextField value={peerId} onChange={(e) => setPeerId(e.target.value)} />
            <Button
              onClick={() => {
                const connection = peer.connect(getPeerId(peerId));
                setPlayersConnections((prev) =>
                  produce(prev, (draft) => {
                    draft[connection.peer] = connection;
                  })
                );
              }}
            >
              Подключиться
            </Button>
          </Stack>
        )}

        <Stack direction="column" gap={2}>
          <Typography variant="body1">Подключенные игроки</Typography>
          {Object.values(playersConnections).map((connection) => (
            <Typography variant="body1" key={connection.peer}>
              {connection.peer}
            </Typography>
          ))}
        </Stack>

        {Object.values(playersConnections).length > 0 && (
          <Button
            onClick={async () => {
              const gameId = uuid();
              const games = JSON.parse(localStorage.getItem(ELocalStorageKey.Games) ?? '{}');

              const players = [
                ...Object.values(playersConnections).map((connection) => getUsernameFromPeerId(connection.peer)),
                username,
              ];
              const game: IGame = {
                id: gameId,
                players,
                createdAt: new Date(),
                board: createBoard(players),
              };
              games[gameId] = game;
              localStorage.setItem(ELocalStorageKey.Games, JSON.stringify(games));
              broadcastAction({ type: EGameActionType.InitializeGame, params: game });
              navigate(`${routes.game}/${gameId}`);
            }}
          >
            Начать новую игру
          </Button>
        )}
      </Stack>
    </PageMain>
  );
};
