export function safeArray<T>(value: T[] | undefined | null, fallback: T[] = []): T[] {
  if (Array.isArray(value)) return value
  if (typeof value !== 'undefined' && value !== null) {
    console.warn('[safeArray] expected array, got:', typeof value)
  }
  return fallback
}
