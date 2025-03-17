import { importPublicKey } from '@app/core/crypto/keyManagement';
import { IStepBlock } from '../types';

export const verifyBlock = async (block: IStepBlock, publicKey: string): Promise<boolean> => {
  const importedKeyPair = await importPublicKey(publicKey);

  const signatureArray = Uint8Array.from(atob(block.signature), (c) => c.charCodeAt(0));

  const verified = await crypto.subtle.verify(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    importedKeyPair,
    signatureArray,
    new TextEncoder().encode(JSON.stringify(block.action))
  );
  return verified;
};
