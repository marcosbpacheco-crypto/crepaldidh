'use client'

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { useCrm } from '@/app/(dashboard)/crm/context/CrmContext'
import { useCalendar } from '@/app/(dashboard)/calendar/context/CalendarContext'

export interface OperationalAlert {
  id: string
  type: 'project_delayed' | 'task_overdue' | 'client_no_interaction' | 'contract_expiring' | 'document_pending' | 'training_upcoming'
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  entityId: string
  entityType: string
  createdAt: string
  isRead: boolean
}

interface AlertsContextType {
  alerts: OperationalAlert[]
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  unreadCount: number
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined)

export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const { companies, tasks, contracts } = useCrm()
  const { events } = useCalendar()
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const stored = localStorage.getItem('alerts_read_ids')
      if (stored) setReadIds(new Set(JSON.parse(stored)))
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem('alerts_read_ids', JSON.stringify([...readIds])) } catch {}
  }, [readIds])

  const alerts = useMemo<OperationalAlert[]>(() => {
    const result: OperationalAlert[] = []
    const now = new Date()

    // 1. Tarefas atrasadas
    tasks.filter(t => t.status === 'pending').forEach(t => {
      const due = new Date(t.dueDate)
      if (due < now) {
        const daysOverdue = Math.floor((now.getTime() - due.getTime()) / 86400000)
        const company = companies.find(c => c.id === t.companyId)
        result.push({
          id: `alert-task-${t.id}`,
          type: 'task_overdue',
          title: 'Tarefa atrasada',
          description: `"${t.title}" está ${daysOverdue} dia(s) atrasada${company ? ` - ${company.name}` : ''}`,
          severity: daysOverdue > 7 ? 'critical' : daysOverdue > 3 ? 'high' : 'medium',
          entityId: t.id, entityType: 'task',
          createdAt: new Date(now.getTime() - daysOverdue * 86400000).toISOString(),
          isRead: readIds.has(`alert-task-${t.id}`),
        })
      }
    })

    // 2. Projetos atrasados (projetos com data final vencida - from localStorage)
    try {
      const stored = localStorage.getItem('erp_projects')
      if (stored) {
        const projects = JSON.parse(stored)
        projects.forEach((p: any) => {
          if ((p.status === 'em_andamento' || p.status === 'planejado') && new Date(p.endDate) < now) {
            const daysOverdue = Math.floor((now.getTime() - new Date(p.endDate).getTime()) / 86400000)
            result.push({
              id: `alert-project-${p.id}`,
              type: 'project_delayed',
              title: 'Projeto atrasado',
              description: `"${p.name}" está ${daysOverdue} dia(s) atrasado (vencimento: ${new Date(p.endDate).toLocaleDateString('pt-BR')})`,
              severity: daysOverdue > 30 ? 'critical' : daysOverdue > 15 ? 'high' : 'medium',
              entityId: p.id, entityType: 'project',
              createdAt: new Date(now.getTime() - daysOverdue * 86400000).toISOString(),
              isRead: readIds.has(`alert-project-${p.id}`),
            })
          }
        })
      }
    } catch {}

    // 3. Contratos vencendo (30, 15, 7 dias)
    contracts.filter(c => c.status === 'active').forEach(c => {
      const end = new Date(c.endDate)
      const daysLeft = Math.floor((end.getTime() - now.getTime()) / 86400000)
      if (daysLeft <= 30 && daysLeft >= 0) {
        const company = companies.find(co => co.id === c.companyId)
        result.push({
          id: `alert-contract-${c.id}`,
          type: 'contract_expiring',
          title: 'Contrato próximo do vencimento',
          description: `Contrato "${c.title}"${company ? ` (${company.name})` : ''} vence em ${daysLeft} dia(s) (${new Date(c.endDate).toLocaleDateString('pt-BR')})`,
          severity: daysLeft <= 7 ? 'critical' : daysLeft <= 15 ? 'high' : 'medium',
          entityId: c.id, entityType: 'contract',
          createdAt: now.toISOString(),
          isRead: readIds.has(`alert-contract-${c.id}`),
        })
      }
    })

    // 4. Treinamentos próximos (7 dias)
    events.filter(e => {
      const eventDate = e.startTime ? new Date(e.eventDate + `T${e.startTime}`) : new Date(e.eventDate + 'T23:59:59')
      const daysUntil = Math.floor((eventDate.getTime() - now.getTime()) / 86400000)
      return daysUntil <= 7 && daysUntil >= 0
    }).forEach(e => {
      const eventDate = e.startTime ? new Date(e.eventDate + `T${e.startTime}`) : new Date(e.eventDate + 'T23:59:59')
      const daysUntil = Math.floor((eventDate.getTime() - now.getTime()) / 86400000)
      const company = companies.find(c => c.id === e.companyId)
      result.push({
        id: `alert-training-${e.id}`,
        type: 'training_upcoming',
        title: 'Evento/treinamento próximo',
        description: `"${e.title}"${company ? ` (${company.name})` : ''} ocorre em ${daysUntil === 0 ? 'hoje' : `${daysUntil} dia(s)`}`,
        severity: daysUntil === 0 ? 'high' : 'medium',
        entityId: e.id, entityType: 'event',
        createdAt: now.toISOString(),
        isRead: readIds.has(`alert-training-${e.id}`),
      })
    })

    // 5. Clientes sem interação (90+ dias)
    // Activity tracking is via CRM activities
    try {
      const activitiesRaw = localStorage.getItem('crm_activities')
      if (activitiesRaw) {
        const allActivities = JSON.parse(activitiesRaw)
        companies.filter(c => c.status === 'active').forEach(comp => {
          const lastActivity = allActivities
            .filter((a: any) => a.companyId === comp.id)
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
          const daysSinceLast = lastActivity
            ? Math.floor((now.getTime() - new Date(lastActivity.date).getTime()) / 86400000)
            : 999
          if (daysSinceLast >= 90) {
            result.push({
              id: `alert-client-interaction-${comp.id}`,
              type: 'client_no_interaction',
              title: 'Cliente sem interação',
              description: `${comp.name} está há ${daysSinceLast} dia(s) sem interação registrada`,
              severity: daysSinceLast >= 180 ? 'critical' : daysSinceLast >= 120 ? 'high' : 'medium',
              entityId: comp.id, entityType: 'company',
              createdAt: now.toISOString(),
              isRead: readIds.has(`alert-client-interaction-${comp.id}`),
            })
          }
        })
      }
    } catch {}

    // Ordenar: mais recentes primeiro, críticos primeiro
    return result.sort((a, b) => {
      if (a.severity !== b.severity) {
        const order = { critical: 0, high: 1, medium: 2, low: 3 }
        return order[a.severity] - order[b.severity]
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [tasks, companies, contracts, events, readIds])

  const unreadCount = alerts.filter(a => !a.isRead).length

  const markAsRead = (id: string) => {
    setReadIds(prev => new Set([...prev, id]))
  }

  const markAllAsRead = () => {
    setReadIds(prev => new Set([...prev, ...alerts.map(a => a.id)]))
  }

  return (
    <AlertsContext.Provider value={{ alerts, markAsRead, markAllAsRead, unreadCount }}>
      {children}
    </AlertsContext.Provider>
  )
}

export function useAlerts() {
  const ctx = useContext(AlertsContext)
  if (!ctx) throw new Error('useAlerts must be used within AlertsProvider')
  return ctx
}
