import { importPublicKey } from '@app/core/crypto/keyManagement';
import { IStepBlock } from '../types';

export const verifyBlock = async (block: IStepBlock, publicKey: string): Promise<boolean> => {
  const importedKeyPair = await importPublicKey(publicKey);

  // Convert hex signature string back to Uint8Array
  const signatureArray = new Uint8Array(block.signature.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);

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
