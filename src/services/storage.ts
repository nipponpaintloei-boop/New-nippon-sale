import { LOCAL_STORAGE_PREFIX, STORE_KEYS } from '../data/constants';
import { SaleEntry } from '../types';
import { getSavedGoogleProfile } from './auth';

declare global {
  interface Window {
    storage?: {
      get: (key: string) => Promise<{ value: string } | null>;
      set: (key: string, value: string) => Promise<boolean>;
    };
  }
}

/**
 * Local-first, account-scoped storage.
 * Every Google account gets an isolated namespace on the device.
 */
function getAccountNamespace(): string {
  const profile = getSavedGoogleProfile();
  const identity = profile?.sub || profile?.email?.trim().toLowerCase();
  if (!identity) return `${LOCAL_STORAGE_PREFIX}anonymous:`;
  const safe = encodeURIComponent(identity).replace(/%/g, '_');
  return `${LOCAL_STORAGE_PREFIX}account:${safe}:`;
}

export function getAccountStorageNamespace(): string {
  return getAccountNamespace();
}

export async function storageGet(key: string): Promise<{ value: string } | null> {
  try {
    const value = localStorage.getItem(getAccountNamespace() + key);
    if (value !== null) return { value };
  } catch (e) {
    console.warn('localStorage.getItem failed:', e);
  }

  try {
    if (window.storage && typeof window.storage.get === 'function') {
      const s = await window.storage.get(`${getAccountNamespace()}${key}`);
      if (s && typeof s.value === 'string') return s;
    }
  } catch (e) {
    console.warn('window.storage.get failed:', e);
  }

  return null;
}

export async function storageSet(key: string, value: string): Promise<boolean> {
  let saved = false;
  const namespacedKey = getAccountNamespace() + key;
  try {
    localStorage.setItem(namespacedKey, value);
    saved = true;
  } catch (e) {
    console.error('localStorage.setItem failed:', e);
  }

  try {
    if (window.storage && typeof window.storage.set === 'function') {
      await window.storage.set(namespacedKey, value);
      saved = true;
    }
  } catch (e) {
    console.warn('window.storage.set failed:', e);
  }

  return saved;
}

/** Legacy cloud hooks are retained as local no-ops so existing call sites remain stable. */
export async function fetchSalesTable(): Promise<SaleEntry[] | null> {
  return null;
}

export async function upsertSalesRows(_entries: SaleEntry[]): Promise<boolean> {
  return true;
}

export async function deleteSalesRow(_id: string): Promise<boolean> {
  return true;
}

export async function clearSalesTable(): Promise<boolean> {
  return true;
}

export { STORE_KEYS };
