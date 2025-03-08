import { PEER_ID_SEPARATOR, PEER_PREFIX } from '../constants';

export const getPeerId = (username: string) => PEER_PREFIX + PEER_ID_SEPARATOR + username;
