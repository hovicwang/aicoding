/**
 * IndexedDB 视频存储层
 * 把上传的原始视频与裂变变体持久化到浏览器，刷新后仍可播放。
 * 按 projectId 索引，删除项目时一并清理。
 */

const DB_NAME = "clipforge";
const DB_VERSION = 1;
const STORE_SOURCE = "sourceVideos"; // 原始视频：key = projectId
const STORE_VARIANT = "variantVideos"; // 变体视频：key = variantId

let dbPromise: Promise<IDBDatabase> | null = null;
let dbAvailable = true; // 隐私模式/不支持时置 false，避免反复尝试

function openDB(): Promise<IDBDatabase> {
  if (!dbAvailable) return Promise.reject(new Error("IndexedDB 不可用"));
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_SOURCE))
          db.createObjectStore(STORE_SOURCE);
        if (!db.objectStoreNames.contains(STORE_VARIANT))
          db.createObjectStore(STORE_VARIANT);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbAvailable = false;
        dbPromise = null;
        reject(req.error ?? new Error("IndexedDB 打开失败"));
      };
    } catch (e) {
      dbAvailable = false;
      dbPromise = null;
      reject(e);
    }
  });
  return dbPromise;
}

function put(store: string, key: string, blob: Blob): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(store, "readwrite");
        tx.objectStore(store).put(blob, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  ).catch(() => {
    // IDB 不可用时静默失败，调用方应检查返回值
  });
}

function get(store: string, key: string): Promise<Blob | undefined> {
  return openDB().then(
    (db) =>
      new Promise<Blob | undefined>((resolve, reject) => {
        const tx = db.transaction(store, "readonly");
        const r = tx.objectStore(store).get(key);
        r.onsuccess = () => resolve(r.result as Blob | undefined);
        r.onerror = () => reject(r.error);
      }),
  ).catch(() => undefined as Blob | undefined);
}

function del(store: string, key: string): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(store, "readwrite");
        tx.objectStore(store).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  ).catch(() => {
    // 删除失败不阻塞主流程
  });
}

/* ---------- 原始视频 ---------- */
export const saveSourceVideo = (projectId: string, blob: Blob) =>
  put(STORE_SOURCE, projectId, blob);
export const getSourceVideo = (projectId: string) => get(STORE_SOURCE, projectId);
export const deleteSourceVideo = (projectId: string) => del(STORE_SOURCE, projectId);

/* ---------- 变体视频 ---------- */
export const saveVariantVideo = (variantId: string, blob: Blob) =>
  put(STORE_VARIANT, variantId, blob);
export const getVariantVideo = (variantId: string) => get(STORE_VARIANT, variantId);
export const deleteVariantVideo = (variantId: string) => del(STORE_VARIANT, variantId);

/** 删除项目时清理原始视频及其全部变体 */
export async function deleteProjectVideos(
  projectId: string,
  variantIds: string[],
): Promise<void> {
  await deleteSourceVideo(projectId);
  await Promise.all(variantIds.map((id) => deleteVariantVideo(id)));
}

/* ---------- blob URL 缓存（避免重复 createObjectURL） ---------- */
const urlCache = new Map<string, string>();

export async function getSourceVideoUrl(projectId: string): Promise<string | null> {
  const cached = urlCache.get(`src-${projectId}`);
  if (cached) return cached;
  const blob = await getSourceVideo(projectId);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urlCache.set(`src-${projectId}`, url);
  return url;
}

export async function getVariantVideoUrl(variantId: string): Promise<string | null> {
  const cached = urlCache.get(`var-${variantId}`);
  if (cached) return cached;
  const blob = await getVariantVideo(variantId);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urlCache.set(`var-${variantId}`, url);
  return url;
}

export function revokeProjectUrls(projectId: string, variantIds: string[]) {
  const srcKey = `src-${projectId}`;
  const srcUrl = urlCache.get(srcKey);
  if (srcUrl) {
    URL.revokeObjectURL(srcUrl);
    urlCache.delete(srcKey);
  }
  for (const id of variantIds) {
    const key = `var-${id}`;
    const url = urlCache.get(key);
    if (url) {
      URL.revokeObjectURL(url);
      urlCache.delete(key);
    }
  }
}
