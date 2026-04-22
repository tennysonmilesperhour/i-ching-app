/**
 * Auth client — localStorage-backed stub.
 *
 * This is a drop-in stub so the UI layer (AuthContext, Login/Signup pages,
 * guest-claim flow) can be built out against a stable interface. It is NOT
 * production-grade: passwords are stored hashed client-side only, which is
 * useless against anyone with DevTools. Swap the implementation with a real
 * provider (Supabase, Clerk, Auth0, custom backend, etc.) by replacing the
 * functions below — the shape of the exports is what AuthContext consumes.
 *
 *   signup({ email, password, displayName })  -> { user, token }
 *   login({ email, password })                -> { user, token }
 *   logout()                                  -> void
 *   getSession()                              -> { user, token } | null
 *   updateProfile(patch)                      -> user
 *
 * `user` shape: { id, email, displayName, created_at }
 */
const USERS_KEY = 'iching_users';
const SESSION_KEY = 'iching_session';

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(`${salt}:${password}`));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function publicUser(u) {
  const { password_hash, salt, ...safe } = u;
  return safe;
}

function writeSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export const authClient = {
  async signup({ email, password, displayName }) {
    const normalized = (email || '').trim().toLowerCase();
    if (!normalized || !password) throw new Error('Email and password are required.');
    if (password.length < 6) throw new Error('Password must be at least 6 characters.');

    const users = loadUsers();
    if (users.some((u) => u.email === normalized)) {
      throw new Error('An account with that email already exists.');
    }
    const salt = crypto.randomUUID();
    const password_hash = await hashPassword(password, salt);
    const user = {
      id: crypto.randomUUID(),
      email: normalized,
      displayName: displayName?.trim() || normalized.split('@')[0],
      created_at: new Date().toISOString(),
      salt,
      password_hash,
    };
    users.push(user);
    saveUsers(users);

    const session = { user: publicUser(user), token: crypto.randomUUID() };
    writeSession(session);
    return session;
  },

  async login({ email, password }) {
    const normalized = (email || '').trim().toLowerCase();
    const users = loadUsers();
    const user = users.find((u) => u.email === normalized);
    if (!user) throw new Error('Invalid email or password.');
    const attempted = await hashPassword(password, user.salt);
    if (attempted !== user.password_hash) throw new Error('Invalid email or password.');

    const session = { user: publicUser(user), token: crypto.randomUUID() };
    writeSession(session);
    return session;
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },

  getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (!session?.user?.id) return null;
      return session;
    } catch {
      return null;
    }
  },

  updateProfile(patch) {
    const session = this.getSession();
    if (!session) throw new Error('Not signed in.');
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === session.user.id);
    if (idx === -1) throw new Error('Account not found.');
    users[idx] = { ...users[idx], ...patch };
    saveUsers(users);
    const updated = publicUser(users[idx]);
    writeSession({ ...session, user: updated });
    return updated;
  },
};
