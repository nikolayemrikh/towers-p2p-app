import { FC } from 'react';

import { Route, Routes as RouterRoutes } from 'react-router-dom';

import { PeerChat } from '@app/PeerChat';
import { PeerGame } from '@app/PeerGame';
import { PeerLobby } from '@app/PeerLobby';
import { routes } from './routes';

export const Routes: FC = () => {
  return (
    <RouterRoutes>
      <Route path={routes.lobby} element={<PeerLobby />} />
      <Route path={`${routes.game}/:id`} element={<PeerGame />} />
      <Route path={`${routes.chat}/:id`} element={<PeerChat />} />
    </RouterRoutes>
  );
};
