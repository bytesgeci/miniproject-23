type CacheEntry = {
  expiresAt: number;
  data?: unknown;
  promise?: Promise<unknown>;
};

const clientJsonCache = new Map<string, CacheEntry>();

interface FetchJsonCachedOptions {
  ttlMs?: number;
  signal?: AbortSignal;
  init?: RequestInit;
}

function cloneCachedValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

export async function fetchJsonCached<T>(
  cacheKey: string,
  url: string,
  options: FetchJsonCachedOptions = {},
): Promise<T> {
  const { ttlMs = 30_000, signal, init } = options;
  const now = Date.now();
  const existing = clientJsonCache.get(cacheKey);

  if (existing?.data !== undefined && existing.expiresAt > now) {
    return cloneCachedValue(existing.data as T);
  }

  if (existing?.promise) {
    const awaited = (await existing.promise) as T;
    return cloneCachedValue(awaited);
  }

  const requestPromise = (async () => {
    const response = await fetch(url, {
      ...init,
      signal,
      cache: "no-store",
      method: init?.method ?? "GET",
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = (await response.json()) as T;
    clientJsonCache.set(cacheKey, {
      data,
      expiresAt: Date.now() + ttlMs,
    });

    return data;
  })();

  clientJsonCache.set(cacheKey, {
    expiresAt: 0,
    promise: requestPromise,
  });

  try {
    const data = (await requestPromise) as T;
    return cloneCachedValue(data);
  } catch (error) {
    clientJsonCache.delete(cacheKey);
    throw error;
  }
}

export function invalidateClientJsonCache(cacheKey: string) {
  clientJsonCache.delete(cacheKey);
}
