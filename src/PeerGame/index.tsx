import { FC, useEffect, useMemo, useState } from 'react';

import { PageMain } from '@app/components/PageMain';
import { IGame } from '@app/core/game/types';
import { ELocalStorageKey } from '@app/core/localStorage/constants';
import { getPeerId } from '@app/core/peer/getPeerId';
import { Stack, Typography } from '@mui/material';
import { produce } from 'immer';
import { DataConnection, Peer } from 'peerjs';
import { useParams } from 'react-router-dom';

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
    </PageMain>
  );
};
