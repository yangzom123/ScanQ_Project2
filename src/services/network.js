import NetInfo from '@react-native-community/netinfo';

export const OFFLINE_MESSAGE = "You're offline. Check your internet connection and try again.";

export function withTimeout(promise, timeoutMs = 12000, message = 'REQUEST_TIMEOUT') {
  let timer;
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]).finally(() => clearTimeout(timer));
}

export function isOfflineError(error) {
  const code = String(error?.code || '').toLowerCase();
  const message = String(error?.message || error || '').toLowerCase();
  return code === 'unavailable'
    || code === 'deadline-exceeded'
    || code === 'network-request-failed'
    || code === 'auth/network-request-failed'
    || message === 'offline'
    || message.includes('client is offline')
    || message.includes('network-request-failed')
    || message.includes('network request failed')
    || message.includes('network error')
    || message.includes('could not reach')
    || message.includes('network is unreachable')
    || message.includes('unable to contact')
    || message.includes('internet connection')
    || message.includes('failed to fetch')
    || message.includes('fetch failed')
    || message.includes('unavailable');
}

export function friendlyError(error, fallback = 'Something went wrong. Please try again.') {
  if (isOfflineError(error)) return OFFLINE_MESSAGE;
  if (error?.message === 'WRITE_TIMEOUT') return 'The request is taking too long. Check your connection and try again.';
  return error?.message || fallback;
}

export async function runOnlineWrite(write, timeoutMs = 12000) {
  const network = await NetInfo.fetch();
  if (network.isConnected === false || network.isInternetReachable === false) {
    throw new Error('OFFLINE');
  }

  let timeout;
  try {
    return await Promise.race([
      Promise.resolve().then(write),
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error('WRITE_TIMEOUT')), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}
