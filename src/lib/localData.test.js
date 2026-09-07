import test from 'node:test';
import assert from 'node:assert/strict';
import { APP_LOCAL_STORAGE_KEYS, eraseLocalAppData } from './localData.js';

test('erases only the app-owned local storage keys', () => {
  const values = new Map(APP_LOCAL_STORAGE_KEYS.map((key) => [key, 'saved']));
  values.set('another_product_key', 'keep');
  const storage = {
    removeItem(key) {
      values.delete(key);
    },
  };

  eraseLocalAppData(storage);

  assert.equal(values.get('another_product_key'), 'keep');
  APP_LOCAL_STORAGE_KEYS.forEach((key) => assert.equal(values.has(key), false));
});
