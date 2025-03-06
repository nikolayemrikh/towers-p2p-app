import { FC, useEffect, useState } from 'react';

import { IGameBlockChain, initializeGameState } from '@app/PeerGame';
import { PageMain } from '@app/components/PageMain';
import { Button, Stack, TextField, Typography } from '@mui/material';
import Peer, { DataConnection } from 'peerjs';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';

const PEER_PREFIX = 'magic-towers';

const PEER_ID_SEPARATOR = '-';

const getPeerId = (username: string) => PEER_PREFIX + PEER_ID_SEPARATOR + username;

interface INewGameEvent {
  type: 'new-game';
  game: IGame;
}

interface IGame {
  id: string;
  players: string[];
  createdAt: Date;
  opponentPublicKey: string;
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
        navigate(`/peer-game/${game.id}`);
        const games = JSON.parse(localStorage.getItem('games') ?? '{}');
        games[game.id] = game;
        localStorage.setItem('games', JSON.stringify(games));
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
                localStorage.removeItem('username');
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
                localStorage.setItem('username', currentUsername);
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
              const games = JSON.parse(localStorage.getItem('games') ?? '{}');
              const keyPair = await crypto.subtle.generateKey(
                {
                  name: 'ECDSA',
                  namedCurve: 'P-256', // Можно использовать "P-384" или "P-521"
                },
                true, // Доступен ли экспорт ключей
                ['sign', 'verify']
              );
              const exportPublicKey = async (publicKey: CryptoKey) => {
                const exported = await crypto.subtle.exportKey('spki', publicKey);
                return btoa(String.fromCharCode(...new Uint8Array(exported))); // Кодируем в base64
              };

              // const storeKeyInIndexedDB = (key: CryptoKey) => {
              //   const db = indexedDB.open('asd');
              //   const store = db.result.createObjectStore('key');
              //   store.add(key);
              // };
              // storeKeyInIndexedDB(keyPair.publicKey);

              const publicKey = await exportPublicKey(keyPair.publicKey);

              const game: IGame = {
                id: gameId,
                players: [...connectedIds, getPeerId(username)],
                createdAt: new Date(),
                opponentPublicKey: publicKey,
              };
              const gameState = initializeGameState(game);
              games[gameId] = game;
              localStorage.setItem('games', JSON.stringify(games));
              const gameStates = JSON.parse(localStorage.getItem('game-states') ?? '{}');
              localStorage.setItem(
                'game-states',
                JSON.stringify({
                  ...gameStates,
                  [game.id]: {
                    initialBoard: gameState,
                    blocks: [
                      {
                        createdAt: new Date().toISOString(),
                        turnUsername: game.players[0],
                        prevBlockHash: '',
                        hash: '',
                      },
                    ],
                  } satisfies IGameBlockChain,
                } satisfies Record<string, IGameBlockChain>)
              );
              connection.send({ type: 'new-game', game });
              navigate(`/peer-game/${gameId}`);
            }}
          >
            Начать новую игру
          </Button>
        )}
      </Stack>
    </PageMain>
  );
};
