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
  const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(hash)));

  const importedKeyPair = await importKeys(keyPair);
  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    importedKeyPair.privateKey,
    new TextEncoder().encode(JSON.stringify(action))
  );

  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return {
    username,
    action,
    hash: hashBase64,
    previousHash: previousBlock?.hash || undefined,
    signature: signatureBase64,
  };
};
