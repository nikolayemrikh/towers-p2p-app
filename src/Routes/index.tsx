import { FC } from 'react';

import { Route, Routes as RouterRoutes } from 'react-router-dom';

import { PeerGame } from '@app/PeerGame';
import { PeerLobby } from '@app/PeerLobby';

export const Routes: FC = () => {
  return (
    <RouterRoutes>
      <Route path="/" element={<PeerLobby />} />
      <Route path="/game/:id" element={<PeerGame />} />
    </RouterRoutes>
  );
};
