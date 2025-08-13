import { logRenderer } from '@/utils/logger';

function get<T = any>(key: string): T | null {
  const storage = window.localStorage;
  try {
    return JSON.parse(storage.getItem(key)!);
  } catch (e) {
    logRenderer.error('[localStorage.get]', e);
  }
  return null;
}

function set(key: string, value: any): boolean {
  const storage = window.localStorage;
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    logRenderer.error('[localStorage.set]', e);
  }
  return false;
}

function remove(key: string): boolean {
  const storage = window.localStorage;
  if (storage) {
    storage.removeItem(key);
    return true;
  }
  return false;
}

export default {
  get,
  set,
  remove,
};
