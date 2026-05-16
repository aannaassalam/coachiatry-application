import ImageResizer from '@bam.tech/react-native-image-resizer';
import RNFS from 'react-native-fs';
import { storage } from '../helpers/utils';
import {
  AVATAR_CACHE_DIR,
  AVATAR_MAX_DIMENSION,
  AVATAR_META_KEY,
  AVATAR_TTL_MS,
} from './constants';

interface AvatarMetaEntry {
  // Local file path (no scheme prefix).
  path: string;
  // Last-validated/written timestamp (ms).
  ts: number;
  // The remote URL minus volatile query params (used as dedup signal).
  key: string;
}

type AvatarMeta = Record<string, AvatarMetaEntry>;

// In-flight downloads coalesced so a burst of notifications from the same
// sender doesn't kick off N parallel fetches of the same image.
const inFlight = new Map<string, Promise<string | undefined>>();

const ensureDir = async () => {
  const exists = await RNFS.exists(AVATAR_CACHE_DIR);
  if (!exists) {
    await RNFS.mkdir(AVATAR_CACHE_DIR);
  }
};

const readMeta = (): AvatarMeta => {
  const raw = storage.getString(AVATAR_META_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as AvatarMeta;
  } catch {
    return {};
  }
};

const writeMeta = (meta: AvatarMeta) => {
  storage.set(AVATAR_META_KEY, JSON.stringify(meta));
};

// Deterministic cache key from the URL path, ignoring query string. S3 URLs
// commonly include signed-query params that change every request — using the
// raw URL as the key would cause re-downloads on every notification.
const cacheKeyFor = (url: string): string => {
  try {
    const parsed = new URL(url);
    // Bucket/key path is what identifies the image.
    const ident = `${parsed.host}${parsed.pathname}`;
    return djb2(ident);
  } catch {
    return djb2(url);
  }
};

// Small, dependency-free hash. Stable across processes (Headless JS included)
// because it operates on string contents alone.
const djb2 = (str: string): string => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
};

const toFileUri = (path?: string) =>
  path ? (path.startsWith('file://') ? path : `file://${path}`) : undefined;

const stripQuery = (url: string) => {
  const idx = url.indexOf('?');
  return idx >= 0 ? url.slice(0, idx) : url;
};

const downloadAndResize = async (
  url: string,
  destPath: string,
): Promise<string | undefined> => {
  await ensureDir();
  const tmpPath = `${destPath}.dl`;

  const result = await RNFS.downloadFile({
    fromUrl: url,
    toFile: tmpPath,
    cacheable: true,
    connectionTimeout: 10_000,
    readTimeout: 15_000,
  }).promise;

  if (result.statusCode < 200 || result.statusCode >= 300) {
    try {
      await RNFS.unlink(tmpPath);
    } catch {}
    return undefined;
  }

  try {
    const resized = await ImageResizer.createResizedImage(
      tmpPath,
      AVATAR_MAX_DIMENSION,
      AVATAR_MAX_DIMENSION,
      'PNG',
      80,
      0,
      AVATAR_CACHE_DIR,
    );
    // Move resized output to deterministic destination path.
    if (await RNFS.exists(destPath)) {
      try {
        await RNFS.unlink(destPath);
      } catch {}
    }
    await RNFS.moveFile(resized.uri.replace('file://', ''), destPath);
    try {
      await RNFS.unlink(tmpPath);
    } catch {}
    return destPath;
  } catch {
    // Resize failed — fall back to raw download.
    try {
      await RNFS.moveFile(tmpPath, destPath);
      return destPath;
    } catch {
      return undefined;
    }
  }
};

const fetchAndCache = async (url: string): Promise<string | undefined> => {
  const key = cacheKeyFor(url);
  const meta = readMeta();
  const destPath = `${AVATAR_CACHE_DIR}/${key}.png`;
  const now = Date.now();
  const existing = meta[key];

  if (existing) {
    const fresh = now - existing.ts < AVATAR_TTL_MS;
    const onDisk = await RNFS.exists(existing.path).catch(() => false);
    if (fresh && onDisk) {
      return existing.path;
    }
    if (!onDisk) {
      delete meta[key];
      writeMeta(meta);
    }
  }

  try {
    const path = await downloadAndResize(url, destPath);
    if (!path) return undefined;
    const next = readMeta();
    next[key] = { path, ts: now, key: stripQuery(url) };
    writeMeta(next);
    return path;
  } catch {
    return undefined;
  }
};

/**
 * Resolve a candidate avatar source (remote URL or already-local path) to a
 * `file://`-prefixed URI that Notifee can render on both Android and iOS.
 *
 * Returns `undefined` if the candidate cannot be resolved, in which case the
 * caller should fall back to a bundled asset (or simply omit the image so the
 * platform shows initials/default).
 */
export const resolveAvatar = async (
  candidate?: string,
): Promise<string | undefined> => {
  if (!candidate) return undefined;

  if (candidate.startsWith('file://')) return candidate;
  if (candidate.startsWith('/')) return toFileUri(candidate);
  if (!/^https?:\/\//.test(candidate)) return undefined;

  // Coalesce concurrent fetches of the same URL.
  const key = cacheKeyFor(candidate);
  const existing = inFlight.get(key);
  if (existing) {
    const path = await existing;
    return toFileUri(path);
  }

  const promise = fetchAndCache(candidate).finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, promise);

  const path = await promise;
  return toFileUri(path);
};

/**
 * Convenience helper used by the display layer — resolves a per-message sender
 * avatar and a conversation/group avatar in parallel.
 */
export const resolveAvatarPair = async ({
  senderImage,
  chatImage,
}: {
  senderImage?: string;
  chatImage?: string;
}) => {
  const [personIcon, largeIcon] = await Promise.all([
    resolveAvatar(senderImage),
    resolveAvatar(chatImage || senderImage),
  ]);

  return {
    personIcon,
    largeIcon: largeIcon || personIcon,
  };
};

/**
 * Removes the oldest cached avatars when the cache grows beyond `maxEntries`.
 * Call sporadically (e.g. once on app start) to keep on-disk usage bounded.
 */
export const trimAvatarCache = async (maxEntries = 200) => {
  const meta = readMeta();
  const entries = Object.entries(meta);
  if (entries.length <= maxEntries) return;
  entries.sort((a, b) => a[1].ts - b[1].ts);
  const drop = entries.slice(0, entries.length - maxEntries);
  for (const [key, entry] of drop) {
    try {
      await RNFS.unlink(entry.path);
    } catch {}
    delete meta[key];
  }
  writeMeta(meta);
};

export const clearAvatarCache = async () => {
  try {
    await RNFS.unlink(AVATAR_CACHE_DIR);
  } catch {}
  storage.remove(AVATAR_META_KEY);
};
