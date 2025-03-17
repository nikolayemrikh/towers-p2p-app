import { ELocalStorageKey } from '../localStorage/constants';

export interface IKeyPair {
  publicKey: string;
  privateKey: string;
}

export const generateKeys = async (): Promise<CryptoKeyPair> => {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify']
  );

  return keyPair;
};

export const exportKeys = async (keyPair: CryptoKeyPair): Promise<IKeyPair> => {
  const publicKeyString = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKeyString = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKeyString))),
    privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKeyString))),
  };
};

export const storeKeys = async (keyPair: IKeyPair): Promise<void> => {
  localStorage.setItem(ELocalStorageKey.PublicKey, keyPair.publicKey);
  localStorage.setItem(ELocalStorageKey.PrivateKey, keyPair.privateKey);
};

// export const generateAndStoreKeys = async (): Promise<IKeyPair> => {
//   const storedPublicKey = localStorage.getItem(ELocalStorageKey.PublicKey);
//   const storedPrivateKey = localStorage.getItem(ELocalStorageKey.PrivateKey);

//   if (storedPublicKey && storedPrivateKey) {
//     return {
//       publicKey: storedPublicKey,
//       privateKey: storedPrivateKey,
//     };
//   }

//   const keyPair = await crypto.subtle.generateKey(
//     {
//       name: 'ECDSA',
//       namedCurve: 'P-256',
//     },
//     true,
//     ['sign', 'verify']
//   );

//   // Convert CryptoKey to string format
//   const publicKeyString = await crypto.subtle.exportKey('spki', keyPair.publicKey);
//   const privateKeyString = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

//   // Convert ArrayBuffer to base64 string
//   const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyString)));
//   const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyString)));

//   localStorage.setItem(ELocalStorageKey.PublicKey, publicKeyBase64);
//   localStorage.setItem(ELocalStorageKey.PrivateKey, privateKeyBase64);

//   return {
//     publicKey: publicKeyBase64,
//     privateKey: privateKeyBase64,
//   };
// };

export const getStoredKeys = (): IKeyPair | null => {
  const publicKey = localStorage.getItem(ELocalStorageKey.PublicKey);
  const privateKey = localStorage.getItem(ELocalStorageKey.PrivateKey);

  if (!publicKey || !privateKey) {
    return null;
  }

  return {
    publicKey,
    privateKey,
  };
};
