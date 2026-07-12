import { useState, useEffect, useRef } from 'react';
import { getRealtimeChannel, broadcastDataChanged } from './realtimeClient';

/**
 * Generic hook to synchronize a piece of state with localStorage and Supabase Storage,
 * with real-time cross-device sync via Supabase Realtime broadcast channels.
 *
 * On mount:
 *  1. Loads from localStorage immediately (instant, no flicker).
 *  2. Fetches from Supabase Storage (server) and updates if newer data exists.
 *  3. Subscribes to the Realtime channel — when another device saves, this
 *     device automatically re-fetches and updates the local state.
 *
 * On state change:
 *  1. Persists to localStorage.
 *  2. Saves to Supabase Storage via /api/sync/{moduleKey}.
 *  3. Broadcasts "data-changed" to all other connected devices.
 */
export function useSyncModule<T>(
  moduleKey: string,
  storageKey: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);
  // Track if we are currently fetching to avoid race conditions
  const isFetching = useRef(false);

  // Function to fetch latest data from server
  const fetchFromServer = async (): Promise<void> => {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      const response = await fetch(`/api/sync/${moduleKey}`);
      if (response.ok) {
        const json = await response.json();
        const remote = json.data;
        if (remote && remote[storageKey] !== undefined) {
          setState(remote[storageKey] as T);
          if (typeof window !== 'undefined') {
            localStorage.setItem(storageKey, JSON.stringify(remote[storageKey]));
          }
        }
      }
    } catch (err) {
      console.error(`useSyncModule fetch ${moduleKey}/${storageKey} error:`, err);
    } finally {
      isFetching.current = false;
    }
  };

  // Load on mount + subscribe to Realtime channel
  useEffect(() => {
    const load = async () => {
      try {
        // 1. Load from localStorage immediately for instant UI
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            setState(JSON.parse(stored) as T);
          }
        }

        // 2. Fetch from server (may be newer, e.g. another device saved)
        await fetchFromServer();
      } finally {
        setIsLoaded(true);
      }
    };

    load();

    // 3. Subscribe to Realtime channel for live updates from other devices
    const channel = getRealtimeChannel(moduleKey);
    if (channel) {
      channel.on('broadcast', { event: 'data-changed' }, () => {
        console.debug(`[Realtime] data-changed received for ${moduleKey}/${storageKey} — re-fetching`);
        fetchFromServer();
      });
    }

    // Cleanup: channels are singletons so we don't unsubscribe on unmount
    // (other components may still be listening on the same channel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleKey, storageKey]);

  // Persist on change + broadcast to other devices
  useEffect(() => {
    if (!isLoaded) return;
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(state));

      const sync = async () => {
        try {
          // Merge with existing remote data to avoid clobbering other slices
          let existing: Record<string, unknown> = {};
          try {
            const res = await fetch(`/api/sync/${moduleKey}`);
            if (res.ok) {
              const json = await res.json();
              existing = json.data || {};
            }
          } catch {
            // If we can't fetch, just save the current slice
          }

          const merged = { ...existing, [storageKey]: state };

          const saveRes = await fetch(`/api/sync/${moduleKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ merged }),
          });

          if (saveRes.ok) {
            // Broadcast to all other connected devices that data has changed
            broadcastDataChanged(moduleKey);
          }
        } catch (err) {
          console.error(`useSyncModule save ${moduleKey}/${storageKey} error:`, err);
        }
      };

      void sync();
    } catch (err) {
      console.error(`useSyncModule localStorage save error:`, err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, moduleKey, storageKey, isLoaded]);

  return [state, setState];
}
