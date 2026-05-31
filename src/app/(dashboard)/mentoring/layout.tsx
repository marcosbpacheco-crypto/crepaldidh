'use client'

import { MentoringProvider } from './context/MentoringContext'

export default function MentoringLayout({ children }: { children: React.ReactNode }) {
  return (
    <MentoringProvider>
      {children}
    </MentoringProvider>
  )
}
