import { PEER_ID_SEPARATOR, PEER_PREFIX } from '../constants';

export const getUsernameFromPeerId = (peerId: string) => peerId.split(PEER_PREFIX + PEER_ID_SEPARATOR)[1];
