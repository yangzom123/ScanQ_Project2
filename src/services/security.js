import * as Crypto from 'expo-crypto';
import { randomToken } from '../utils';

// The enrollment key is never stored in plain text: we store SHA-256(salt:key) and a random salt.
export const newSalt = () => randomToken() + randomToken();
export const hashKey = (key, salt) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${key.trim()}`);
