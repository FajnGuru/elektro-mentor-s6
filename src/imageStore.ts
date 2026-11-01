// Trvalá složka ilustrací: IndexedDB, ukládá ORIGINÁLNÍ Bloby (bez zmenšování / převodu formátu).
export type StoredImage = {
  key: string;
  blob: Blob;
  mime: string;
  fileName: string;
  title: string;
  mode: string; // 'analogy' | 'technical' | 'import'
  source: 'ai' | 'import';
  createdAt: string;
};

const DB = 'elektromentor-s6';
const STORE = 'images';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB není k dispozici'));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const r = fn(t.objectStore(STORE));
    t.oncomplete = () => { resolve(r.result); db.close(); };
    t.onerror = () => { reject(t.error); db.close(); };
    t.onabort = () => { reject(t.error); db.close(); };
  });
}

export const loadAllImages = () => tx<StoredImage[]>('readonly', (s) => s.getAll() as IDBRequest<StoredImage[]>);
export const putImage = (img: StoredImage) => tx('readwrite', (s) => s.put(img));
export const deleteImage = (key: string) => tx('readwrite', (s) => s.delete(key));

export async function requestPersist(): Promise<boolean> {
  try { return (await navigator.storage?.persist?.()) ?? false; } catch { return false; }
}
export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  try {
    const e = await navigator.storage?.estimate?.();
    return e ? { usage: e.usage || 0, quota: e.quota || 0 } : null;
  } catch { return null; }
}

const EXT: Record<string, string> = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif',
  'image/svg+xml': 'svg', 'image/avif': 'avif', 'image/bmp': 'bmp', 'image/heic': 'heic', 'image/heif': 'heif'
};
const MIME: Record<string, string> = Object.fromEntries(Object.entries(EXT).map(([m, e]) => [e, m]));
MIME.jpeg = 'image/jpeg';

export function extOf(mime: string, fileName?: string): string {
  const fromName = fileName?.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  return fromName || EXT[mime] || 'img';
}
export function mimeOf(fileName: string, fallback = ''): string {
  if (fallback && fallback.startsWith('image/')) return fallback;
  const e = fileName.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() || '';
  return MIME[e] || fallback || 'application/octet-stream';
}
export const isImageName = (n: string) => /\.(png|jpe?g|webp|gif|svg|avif|bmp|heic|heif)$/i.test(n);

export function slug(s: string, max = 50): string {
  return (s || '')
    .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, max);
}

/** Název pro „Stáhnout vše“ – jde importovat zpět: {klíč}__{titulek}.{přípona originálu} */
export const exportFileName = (key: string, title: string, mime: string, fileName?: string) =>
  `${key}__${slug(title) || 'obrazek'}.${extOf(mime, fileName)}`;

/**
 * Odhad klíče z názvu souboru: quiz-img-12 / q-12 → quiz-img-12; topic-hierarchie / topic-3 / t-3 → topic-{id};
 * custom-mentor-img; vzor {klíč}__{titulek}. Číslo u tématu = pořadí (od 1). Vrací null, když nic nesedí.
 */
export function guessKey(fileName: string, quizIds: (number | string)[], topicIds: string[]):
  { key: string; titleHint?: string } | null {
  const base = fileName.replace(/^.*[\\/]/, '').replace(/\.[a-z0-9]+$/i, '');
  const [head, ...rest] = base.split('__');
  const titleHint = rest.length ? rest.join(' ').replace(/[-_]+/g, ' ').trim() : undefined;
  const h = head.trim().toLowerCase();
  if (h === 'custom-mentor-img') return { key: h, titleHint };
  let m = h.match(/^(?:quiz-img|quiz|q)[-_ ]?(\d+)\b/);
  if (m) {
    const id = quizIds.find((q) => String(q) === String(Number(m![1])));
    return id !== undefined ? { key: `quiz-img-${id}`, titleHint } : null;
  }
  m = h.match(/^(?:topic|t)[-_ ](.+)$/);
  if (m) {
    const v = m[1];
    if (topicIds.includes(v)) return { key: `topic-${v}`, titleHint };
    if (/^\d+$/.test(v) && topicIds[Number(v) - 1]) return { key: `topic-${topicIds[Number(v) - 1]}`, titleHint };
    const pref = topicIds.find((t) => v.startsWith(t + '-') || v.startsWith(t + '_'));
    return pref ? { key: `topic-${pref}`, titleHint } : null;
  }
  return null;
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}
export const fmtMB = (b: number) => `${(b / 1048576).toFixed(b < 10485760 ? 1 : 0)} MB`;

/** data:URL → Blob bez fetch() (spolehlivé i ve WebView). Bajty zůstávají beze změny. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  const meta = dataUrl.slice(5, comma);
  const mime = meta.split(';')[0] || 'application/octet-stream';
  const body = dataUrl.slice(comma + 1);
  if (/;base64/i.test(meta)) {
    const bin = atob(body);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }
  return new Blob([decodeURIComponent(body)], { type: mime });
}

/** URL obrázku (data: nebo blob:) → Blob */
export async function urlToBlob(url: string): Promise<Blob> {
  if (url.startsWith('data:')) return dataUrlToBlob(url);
  return (await fetch(url)).blob();
}

/** Klíč pro starší verzi obrázku (nic se nepřepisuje) */
export const versionKey = (key: string) => `${key}~${Date.now()}`;
export const baseKey = (key: string) => key.split('~')[0];
