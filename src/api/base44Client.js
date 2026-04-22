/**
 * Local storage-backed client that replaces @base44/sdk.
 * Provides the entities.Reading CRUD interface the pages expect.
 *
 * Readings are scoped by `user_id`:
 *   - Authenticated users: user_id === <auth user id>
 *   - Guests: user_id === null
 * A guest reading can be claimed by a newly-created (or existing) user via
 * Reading.claim(id, userId) so the "save this reading by creating an account"
 * flow attaches the reading on signup.
 */

import { authClient } from './authClient';

const STORAGE_KEY = 'iching_readings';

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAll(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function currentUserId() {
  return authClient.getSession()?.user?.id ?? null;
}

const Reading = {
  async create(data) {
    const records = loadAll();
    const record = {
      id: crypto.randomUUID(),
      user_id: currentUserId(),
      ...data,
      created_date: new Date().toISOString(),
    };
    records.push(record);
    saveAll(records);
    return record;
  },

  async get(id) {
    const records = loadAll();
    const record = records.find((r) => r.id === id) || null;
    if (!record) return null;
    // A reading is readable if it belongs to the current user, OR if it is an
    // unclaimed guest reading (so the final-reading CTA can still render it
    // pre-signup without forcing auth).
    const uid = currentUserId();
    if (record.user_id && record.user_id !== uid) return null;
    return record;
  },

  async list(sort) {
    const uid = currentUserId();
    const records = loadAll().filter((r) =>
      uid ? r.user_id === uid : r.user_id == null
    );
    if (sort) {
      const desc = sort.startsWith('-');
      const field = desc ? sort.slice(1) : sort;
      records.sort((a, b) => {
        const av = a[field] || '';
        const bv = b[field] || '';
        return desc ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1);
      });
    }
    return records;
  },

  async update(id, data) {
    const records = loadAll();
    const idx = records.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    const uid = currentUserId();
    if (records[idx].user_id && records[idx].user_id !== uid) return null;
    records[idx] = { ...records[idx], ...data };
    saveAll(records);
    return records[idx];
  },

  async delete(id) {
    const records = loadAll();
    saveAll(records.filter((r) => r.id !== id));
  },

  /**
   * Attach an unclaimed (guest) reading to a user account.
   * Used by the signup flow when a `claimReading` query param is present.
   */
  async claim(id, userId) {
    if (!id || !userId) return null;
    const records = loadAll();
    const idx = records.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    if (records[idx].user_id && records[idx].user_id !== userId) return null;
    records[idx] = { ...records[idx], user_id: userId };
    saveAll(records);
    return records[idx];
  },
};

export const base44 = {
  entities: { Reading },
};
