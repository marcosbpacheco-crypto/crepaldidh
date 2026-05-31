'use client'

import { TrainingsProvider } from './context/TrainingsContext'
import { CrmProvider } from '../crm/context/CrmContext'

export default function TrainingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  )
}
