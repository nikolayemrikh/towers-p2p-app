import { FC, useEffect, useState } from 'react';

import { routes } from '@app/Routes/routes';
import { PageMain } from '@app/components/PageMain';
import { createBoard } from '@app/core/game/createBoard';
import { IGame } from '@app/core/game/types';
import { ELocalStorageKey } from '@app/core/localStorage/constants';
import { getPeerId } from '@app/core/peer/getPeerId';
import { Button, Stack, TextField, Typography } from '@mui/material';
import Peer, { DataConnection } from 'peerjs';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';

interface INewGameEvent {
  type: 'new-game';
  game: IGame;
}

export const PeerLobby: FC = () => {
  // const { id } = useParams();
  // const [peer, setPeer] = useState<Peer | null>(null);
  const navigate = useNavigate();
  const [username, setUsername] = useState(localStorage.getItem('username') ?? '');
  const [currentUsername, setCurrentUsername] = useState(username);
  const [peerId, setPeerId] = useState('');
  const [peer, setPeer] = useState<Peer | null>(null);
  const [connection, setConnection] = useState<DataConnection | null>(null);
  const [connectedIds, setConnectedIds] = useState<string[]>([]);

  useEffect(() => {
    const peer = new Peer(getPeerId(username));
    setPeer(peer);

    peer.on('connection', (connection) => {
      setConnection(connection);
    });

    return () => {
      peer.destroy();
    };
  }, [username]);

  useEffect(() => {
    if (!connection) return;
    connection.on('open', () => {
      setConnectedIds((prev) => [...prev, connection.peer]);
    });
    connection.on('close', () => {
      setConnectedIds((prev) => prev.filter((id) => id !== connection.peer));
    });
    connection.on('data', (data) => {
      if (typeof data !== 'object') return;
      const event = data as INewGameEvent;
      if (event.type === 'new-game') {
        const { game } = event;
        navigate(`${routes.game}/${game.id}`);
        const games = JSON.parse(localStorage.getItem(ELocalStorageKey.Games) ?? '{}');
        games[game.id] = game;
        localStorage.setItem(ELocalStorageKey.Games, JSON.stringify(games));
      }
    });

    return () => {
      connection.close();
    };
  }, [navigate, connection]);

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
                setConnection(connection);
              }}
            >
              Подключиться
            </Button>
          </Stack>
        )}

        <Stack direction="column" gap={2}>
          <Typography variant="body1">Подключенные игроки</Typography>
          {connectedIds.map((id) => (
            <Typography variant="body1" key={id}>
              {id}
            </Typography>
          ))}
        </Stack>

        {connection && (
          <Button
            onClick={async () => {
              const gameId = uuid();
              const games = JSON.parse(localStorage.getItem(ELocalStorageKey.Games) ?? '{}');

              const players = [...connectedIds, getPeerId(username)];
              const game: IGame = {
                id: gameId,
                players,
                createdAt: new Date(),
                board: createBoard(players),
              };
              games[gameId] = game;
              localStorage.setItem(ELocalStorageKey.Games, JSON.stringify(games));
              connection.send({ type: 'new-game', game });
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
