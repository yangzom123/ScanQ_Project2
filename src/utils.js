const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const p2 = (n) => String(n).padStart(2, '0');

// "dd MMM yyyy"  e.g. 05 Oct 2026
export const formatDate = (d = new Date()) => `${p2(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

// "hh:mm a" or "hh:mm:ss a"
export const formatTime = (d = new Date(), withSeconds = false) => {
  let h = d.getHours();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${p2(h)}:${p2(d.getMinutes())}${withSeconds ? ':' + p2(d.getSeconds()) : ''} ${ap}`;
};

// 8-character random token (same length as UUID.take(8))
export const randomToken = () => {
  const chars = 'abcdef0123456789';
  let t = '';
  for (let i = 0; i < 8; i++) t += chars[Math.floor(Math.random() * chars.length)];
  return t;
};

export const tsMillis = (ts) => (ts && ts.toMillis ? ts.toMillis() : 0);

export const authErrorMessage = (e) => {
  switch (e?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/user-not-found':
    case 'auth/user-disabled':
      return 'This account no longer exists or has been disabled.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      return `Login failed: ${e?.message}`;
  }
};

export const isValidEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
