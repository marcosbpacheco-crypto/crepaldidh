export interface SingleFlight<T> {
  get(): Promise<T>
  invalidate(): void
}

export function createSingleFlight<T>(fetcher: () => Promise<T>, ttl = 8000): SingleFlight<T> {
  let cache: { promise: Promise<T>; ts: number } | null = null
  return {
    get(): Promise<T> {
      const now = Date.now()
      if (cache && now - cache.ts < ttl) {
        return cache.promise
      }
      const promise = fetcher()
      cache = { promise, ts: now }
      promise.catch(() => {
        if (cache?.promise === promise) cache = null
      })
      return promise
    },
    invalidate() {
      cache = null
    },
  }
}