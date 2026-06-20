'use client'

export const KEYS_TO_KEEP = new Set([
  'admin_users',
  'admin_permissions',
  'admin_audit_logs',
  'admin_lgpd_consents',
  'admin_privacy_requests',
  'fin_categories',
  'fin_payment_methods',
  'mentoring_competencies',
  'mentoring_tools',
])

export function resetSystem(): void {
  if (typeof window === 'undefined') return

  const keysToRemove: string[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && !KEYS_TO_KEEP.has(key)) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key))

  sessionStorage.clear()
}

export function getSystemStats(): { totalKeys: number; ficticiousKeys: string[] } {
  if (typeof window === 'undefined') return { totalKeys: 0, ficticiousKeys: [] }

  const ficticiousKeys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && !KEYS_TO_KEEP.has(key)) {
      ficticiousKeys.push(key)
    }
  }

  return { totalKeys: localStorage.length, ficticiousKeys }
}
