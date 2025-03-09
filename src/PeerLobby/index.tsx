import { FC, useEffect, useState } from 'react';

import { routes } from '@app/Routes/routes';
import { PageMain } from '@app/components/PageMain';
import { createBoard } from '@app/core/game/createBoard';
import { IGame, IGameBlockChain } from '@app/core/game/types';
import { ELocalStorageKey } from '@app/core/localStorage/constants';
import { EPeerEventType } from '@app/core/peer/enums';
import { getPeerId } from '@app/core/peer/getPeerId';
import { getUsernameFromPeerId } from '@app/core/peer/getUsernameFromPeerId';
import { TPeerEvent } from '@app/core/peer/types';
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
    const handler = (data: unknown) => {
      if (typeof data !== 'object') return;
      const event = data as TPeerEvent;
      if (event.type === EPeerEventType.initializeGame) {
        const game = event.data;
        navigate(`${routes.game}/${game.id}`);
        const gameBlockchains = JSON.parse(localStorage.getItem(ELocalStorageKey.GameBlockchains) ?? '{}');
        const gameBlockchain: IGameBlockChain = {
          initialBoard: game.board,
          players: game.players,
          blocks: [],
        };
        gameBlockchains[game.id] = gameBlockchain;
        localStorage.setItem(ELocalStorageKey.GameBlockchains, JSON.stringify(gameBlockchains));
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

  const broadcastEvent = (event: TPeerEvent) => {
    for (const connection of Object.values(playersConnections)) {
      connection.send(event);
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
              const gameBlockchains = JSON.parse(localStorage.getItem(ELocalStorageKey.GameBlockchains) ?? '{}');

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
              broadcastEvent({ type: EPeerEventType.initializeGame, data: game });
              const gameBlockchain: IGameBlockChain = {
                initialBoard: game.board,
                players,
                blocks: [],
              };
              gameBlockchains[gameId] = gameBlockchain;
              localStorage.setItem(ELocalStorageKey.GameBlockchains, JSON.stringify(gameBlockchains));
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
