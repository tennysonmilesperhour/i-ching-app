/**
 * Local storage-backed client that replaces @base44/sdk.
 * Provides the same entities.Reading CRUD interface the pages expect.
 */

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

const Reading = {
  async create(data) {
    const records = loadAll();
    const record = {
      id: crypto.randomUUID(),
      ...data,
      created_date: new Date().toISOString(),
    };
    records.push(record);
    saveAll(records);
    return record;
  },

  async get(id) {
    const records = loadAll();
    return records.find((r) => r.id === id) || null;
  },

  async list(sort) {
    const records = loadAll();
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
    records[idx] = { ...records[idx], ...data };
    saveAll(records);
    return records[idx];
  },

  async delete(id) {
    const records = loadAll();
    saveAll(records.filter((r) => r.id !== id));
  },
};

export const base44 = {
  entities: { Reading },
};
