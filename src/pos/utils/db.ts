/**
 * طبقة تخزين IndexedDB لنظام الكاشير.
 * IndexedDB يتحمّل مئات الميجابايت (صور منتجات، آلاف الطلبات) بينما
 * localStorage محدود بـ ~5MB. نحتفظ بـ localStorage كنسخة احتياطية
 * وكجسر للتحميل الفوري عند الإقلاع.
 */
import type { Settings } from '@/pos/types';

const DB_NAME = 'pos_db';
const DB_VERSION = 1;
const STORE = 'kv';
const SETTINGS_KEY = 'settings';

let dbPromise: Promise<IDBDatabase> | null = null;

function isSupported(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise<T | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** قراءة الإعدادات من IndexedDB (يرجع undefined إن لم توجد أو غير مدعوم). */
export async function loadSettingsFromDb(): Promise<Settings | undefined> {
  if (!isSupported()) return undefined;
  try {
    return await idbGet<Settings>(SETTINGS_KEY);
  } catch {
    return undefined;
  }
}

/** حفظ الإعدادات في IndexedDB. يرجع false عند الفشل. */
export async function saveSettingsToDb(settings: Settings): Promise<boolean> {
  if (!isSupported()) return false;
  try {
    await idbSet(SETTINGS_KEY, settings);
    return true;
  } catch {
    return false;
  }
}

/** حالة الاتصال — تُستخدم لاحقًا في المزامنة مع السيرفر. */
export function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}
