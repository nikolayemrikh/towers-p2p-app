import { IKeyPair, importKeys } from '@app/core/crypto/keyManagement';
import { IGameBlockChain, IStepBlock, TGameAction } from '../types';

export const createBlock = async (
  username: string,
  action: TGameAction,
  gameBlockchain: IGameBlockChain,
  keyPair: IKeyPair
): Promise<IStepBlock> => {
  const previousBlock = gameBlockchain.blocks[gameBlockchain.blocks.length - 1];
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(action)));
  const hashString = Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  const importedKeyPair = await importKeys(keyPair);
  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    importedKeyPair.privateKey,
    new TextEncoder().encode(JSON.stringify(action))
  );

  const signatureString = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return {
    username,
    action,
    hash: hashString,
    previousHash: previousBlock?.hash || undefined,
    signature: signatureString,
  };
};
