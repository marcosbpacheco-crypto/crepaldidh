'use client'
import { useState, useEffect } from 'react'
import { ParticipantsContent } from './ParticipantsContent'

export default function ParticipantsPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return <ParticipantsContent />
}
