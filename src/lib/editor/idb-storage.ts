// IndexedDB storage for media blobs — survives page reloads
// Stores media file blobs so user doesn't have to re-upload after reload

import type { MediaSource } from "./types";

const DB_NAME = "video-editor-studio";
const DB_VERSION = 1;
const STORE_NAME = "media";
const META_STORE = "media-meta";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

interface StoredMedia {
  id: string;
  blob: Blob;
  name: string;
  type: string; // mime type
}

interface MediaMeta {
  id: string;
  name: string;
  kind: string; // 'video' | 'image' | 'audio'
  type: string; // mime
  duration?: number;
  width?: number;
  height?: number;
  size: number; // bytes
  createdAt: number;
}

/**
 * Save a media blob to IndexedDB. Returns the meta to be stored in the editor state.
 */
export async function saveMediaToIDB(
  id: string,
  blob: Blob,
  source: { name: string; kind: string; duration?: number; width?: number; height?: number }
): Promise<MediaMeta> {
  const db = await openDB();
  // Store blob
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const record: StoredMedia = { id, blob, name: source.name, type: blob.type };
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  // Store meta
  const meta: MediaMeta = {
    id,
    name: source.name,
    kind: source.kind,
    type: blob.type,
    duration: source.duration,
    width: source.width,
    height: source.height,
    size: blob.size,
    createdAt: Date.now(),
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(META_STORE, "readwrite");
    const store = tx.objectStore(META_STORE);
    const req = store.put(meta);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  return meta;
}

/**
 * Restore a media blob from IndexedDB as a fresh object URL.
 */
export async function loadMediaFromIDB(id: string): Promise<{ url: string; blob: Blob; meta: MediaMeta } | null> {
  const db = await openDB();
  const blob = await new Promise<Blob | null>((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve((req.result as StoredMedia)?.blob ?? null);
    req.onerror = () => resolve(null);
  });
  if (!blob) return null;
  const meta = await new Promise<MediaMeta | null>((resolve) => {
    const tx = db.transaction(META_STORE, "readonly");
    const store = tx.objectStore(META_STORE);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result as MediaMeta | null);
    req.onerror = () => resolve(null);
  });
  if (!meta) return null;
  const url = URL.createObjectURL(blob);
  return { url, blob, meta };
}

/**
 * List all stored media metadata (without blobs).
 */
export async function listMediaMetaFromIDB(): Promise<MediaMeta[]> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(META_STORE, "readonly");
    const store = tx.objectStore(META_STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as MediaMeta[]);
    req.onerror = () => resolve([]);
  });
}

/**
 * Delete a media blob from IndexedDB.
 */
export async function deleteMediaFromIDB(id: string): Promise<void> {
  const db = await openDB();
  await Promise.all([
    new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    }),
    new Promise<void>((resolve) => {
      const tx = db.transaction(META_STORE, "readwrite");
      const store = tx.objectStore(META_STORE);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    }),
  ]);
}

/**
 * Estimate storage usage. Returns { usage, quota } in bytes.
 */
export async function getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (!("storage" in navigator) || !navigator.storage.estimate) return null;
  try {
    const est = await navigator.storage.estimate();
    return { usage: est.usage ?? 0, quota: est.quota ?? 0 };
  } catch {
    return null;
  }
}

/**
 * Restore all media from IndexedDB into MediaSource[] (with fresh blob URLs).
 */
export async function restoreAllMediaFromIDB(): Promise<MediaSource[]> {
  const metas = await listMediaMetaFromIDB();
  const sources: MediaSource[] = [];
  for (const meta of metas) {
    try {
      const loaded = await loadMediaFromIDB(meta.id);
      if (loaded) {
        sources.push({
          id: meta.id,
          kind: meta.kind as any,
          url: loaded.url,
          name: meta.name,
          duration: meta.duration,
          width: meta.width,
          height: meta.height,
        });
      }
    } catch {
      // skip broken entries
    }
  }
  return sources;
}

/**
 * Persist a MediaSource to IDB by fetching its blob (if it's a blob URL).
 */
export async function persistMediaToIDB(source: MediaSource): Promise<void> {
  if (!source.url.startsWith("blob:")) return; // only persist blob URLs
  try {
    const res = await fetch(source.url);
    const blob = await res.blob();
    await saveMediaToIDB(source.id, blob, {
      name: source.name,
      kind: source.kind,
      duration: source.duration,
      width: source.width,
      height: source.height,
    });
  } catch {
    // ignore — non-critical
  }
}

/**
 * Clear all media from IDB (used when user wants a clean state).
 */
export async function clearAllMediaFromIDB(): Promise<void> {
  const db = await openDB();
  await Promise.all([
    new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    }),
    new Promise<void>((resolve) => {
      const tx = db.transaction(META_STORE, "readwrite");
      const store = tx.objectStore(META_STORE);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    }),
  ]);
}
