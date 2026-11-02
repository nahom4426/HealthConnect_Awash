// The customer site keeps its own small session: it shares nothing with the staff app (no store,
// no router, no module list), so the two can be built and deployed apart.
const KEY = 'customer.session';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!raw?.token) return null;
    if (Date.now() - (raw.at || 0) > MAX_AGE_MS) { localStorage.removeItem(KEY); return null; }
    return raw;
  } catch (e) {
    return null;
  }
}

export const getSession = read;
export const getToken = () => read()?.token || null;
export const currentUser = () => read()?.user || null;
export const isSignedIn = () => !!read();

export function setSession({ token, refreshToken, user }) {
  try { localStorage.setItem(KEY, JSON.stringify({ token, refreshToken, user, at: Date.now() })); } catch (e) { /* private mode: the session lasts until the page closes */ }
}

export function clearSession() {
  try { localStorage.removeItem(KEY); } catch (e) { /* nothing to clear */ }
}

/** Only customers (user type or role CLIENT) may use this site. */
export function isCustomer(user) {
  if (!user) return false;
  return String(user.userType || '').toUpperCase() === 'CLIENT'
    || String(user.roleName || '').toUpperCase() === 'CLIENT';
}

export function fullName(user) {
  return [user?.firstName, user?.fatherName, user?.grandFatherName].filter(Boolean).join(' ').trim();
}
