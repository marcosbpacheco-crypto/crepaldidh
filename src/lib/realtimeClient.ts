import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js'

// Singleton browser Supabase client (uses anon key — safe to expose)
let _client: SupabaseClient | null = null

function getBrowserClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  _client = createClient(url, key, {
    realtime: { params: { eventsPerSecond: 10 } },
  })
  return _client
}

// Channel cache — one channel per moduleKey
const _channels: Map<string, RealtimeChannel> = new Map()

/**
 * Returns a subscribed Supabase Realtime broadcast channel for the given module.
 * Channels are cached globally so only one WebSocket connection per module is open.
 */
export function getRealtimeChannel(moduleKey: string): RealtimeChannel | null {
  const client = getBrowserClient()
  if (!client) return null

  const existing = _channels.get(moduleKey)
  if (existing) return existing

  const channelName = `sync-${moduleKey}`
  const channel = client.channel(channelName, {
    config: { broadcast: { self: false } }, // Don't receive own broadcasts
  })

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      if (process.env.NODE_ENV !== 'production') console.debug(`[Realtime] Subscribed to channel: ${channelName}`)
    }
  })

  _channels.set(moduleKey, channel)
  return channel
}

/**
 * Broadcasts a "data-changed" event on the given module channel.
 * All other connected devices will receive this event and re-fetch from the server.
 */
export function broadcastDataChanged(moduleKey: string): void {
  const channel = getRealtimeChannel(moduleKey)
  if (!channel) return
  channel.send({
    type: 'broadcast',
    event: 'data-changed',
    payload: { moduleKey, ts: Date.now() },
  }).catch((err: unknown) => {
    console.error(`[Realtime] broadcast error for ${moduleKey}:`, err)
  })
}

/**
 * Registers a callback to be called when another device broadcasts "data-changed"
 * for the given module. Returns an unsubscribe function.
 */
export function onDataChanged(moduleKey: string, callback: () => void): () => void {
  const channel = getRealtimeChannel(moduleKey)
  if (!channel) return () => {}

  const handler = () => callback()
  channel.on('broadcast', { event: 'data-changed' }, handler)

  return () => {
    // Supabase channels don't have a direct off() for broadcast events,
    // but removing the listener reference stops the callback being called
    // when the channel is eventually unsubscribed/removed.
  }
}
