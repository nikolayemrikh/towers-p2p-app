import { IGameBlockChain, IStepBlock, TGameAction } from '../types';

export const createBlock = async (
  username: string,
  action: TGameAction,
  gameBlockchain: IGameBlockChain
): Promise<IStepBlock> => {
  const previousBlock = gameBlockchain.blocks[gameBlockchain.blocks.length - 1];
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(action)));
  const hashString = Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return {
    username,
    action,
    hash: hashString,
    previousHash: previousBlock?.hash || undefined,
  };
};
