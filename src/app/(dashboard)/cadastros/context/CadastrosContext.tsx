'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export interface Unit {
  id: string
  companyId: string
  companyName: string
  name: string
  city: string
  state: string
  status: 'active' | 'inactive'
  createdAt: string
}

export interface Sector {
  id: string
  unitId: string
  unitName: string
  name: string
  description: string
  status: 'active' | 'inactive'
  createdAt: string
}

export interface JobRole {
  id: string
  name: string
  description: string
  department: string
  level: 'junior' | 'pleno' | 'senior' | 'master' | 'estagio' | 'trainee'
  status: 'active' | 'inactive'
  createdAt: string
}

export interface Collaborator {
  id: string
  name: string
  email: string
  phone: string
  document: string
  birthDate: string
  roleId: string
  roleName: string
  sectorId: string
  sectorName: string
  companyId: string
  companyName: string
  status: 'active' | 'inactive' | 'vacation' | 'terminated'
  startDate: string
  endDate: string
  createdAt: string
}

interface CadastrosContextType {
  units: Unit[]
  sectors: Sector[]
  jobRoles: JobRole[]
  collaborators: Collaborator[]
  addUnit: (u: Omit<Unit, 'id' | 'createdAt'>) => Unit
  updateUnit: (id: string, updates: Partial<Unit>) => void
  deleteUnit: (id: string) => void
  addSector: (s: Omit<Sector, 'id' | 'createdAt'>) => Sector
  updateSector: (id: string, updates: Partial<Sector>) => void
  deleteSector: (id: string) => void
  addJobRole: (r: Omit<JobRole, 'id' | 'createdAt'>) => JobRole
  updateJobRole: (id: string, updates: Partial<JobRole>) => void
  deleteJobRole: (id: string) => void
  addCollaborator: (c: Omit<Collaborator, 'id' | 'createdAt'>) => Collaborator
  updateCollaborator: (id: string, updates: Partial<Collaborator>) => void
  deleteCollaborator: (id: string) => void
  getCollaboratorsBySector: (sectorId: string) => Collaborator[]
  getCollaboratorsByCompany: (companyId: string) => Collaborator[]
}

const CadastrosContext = createContext<CadastrosContextType | undefined>(undefined)

const SEED_UNITS: Unit[] = [
  { id: 'unit-1', companyId: 'comp-1', companyName: 'BR Distribuidora', name: 'Matriz Rio', city: 'Rio de Janeiro', state: 'RJ', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'unit-2', companyId: 'comp-1', companyName: 'BR Distribuidora', name: 'Filial São Paulo', city: 'São Paulo', state: 'SP', status: 'active', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'unit-3', companyId: 'comp-2', companyName: 'Vale S.A.', name: 'Complexo Mariana', city: 'Mariana', state: 'MG', status: 'active', createdAt: '2026-02-01T00:00:00Z' },
  { id: 'unit-4', companyId: 'comp-3', companyName: 'Banco Itaú', name: 'Sede Paulista', city: 'São Paulo', state: 'SP', status: 'active', createdAt: '2026-03-01T00:00:00Z' },
]

const SEED_SECTORS: Sector[] = [
  { id: 'sector-1', unitId: 'unit-1', unitName: 'Matriz Rio', name: 'Administrativo', description: 'Setor administrativo e financeiro', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'sector-2', unitId: 'unit-1', unitName: 'Matriz Rio', name: 'Operações', description: 'Operações logísticas e distribuição', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'sector-3', unitId: 'unit-2', unitName: 'Filial São Paulo', name: 'Comercial SP', description: 'Equipe comercial regional', status: 'active', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'sector-4', unitId: 'unit-3', unitName: 'Complexo Mariana', name: 'Mineração', description: 'Operação de mineração', status: 'active', createdAt: '2026-02-01T00:00:00Z' },
  { id: 'sector-5', unitId: 'unit-3', unitName: 'Complexo Mariana', name: 'Segurança do Trabalho', description: 'Equipe de SST', status: 'active', createdAt: '2026-02-01T00:00:00Z' },
]

const SEED_ROLES: JobRole[] = [
  { id: 'role-1', name: 'Analista de RH', description: 'Responsável por processos de RH', department: 'RH', level: 'pleno', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'role-2', name: 'Coordenador de SST', description: 'Coordena segurança do trabalho', department: 'SST', level: 'senior', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'role-3', name: 'Diretor de Operações', description: 'Diretoria operacional', department: 'Operações', level: 'master', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'role-4', name: 'Auxiliar Administrativo', description: 'Suporte administrativo', department: 'Administrativo', level: 'junior', status: 'active', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'role-5', name: 'Estagiário de RH', description: 'Estagiário em RH', department: 'RH', level: 'estagio', status: 'active', createdAt: '2026-02-01T00:00:00Z' },
  { id: 'role-6', name: 'Técnico de Segurança', description: 'Técnico em segurança do trabalho', department: 'SST', level: 'pleno', status: 'active', createdAt: '2026-02-15T00:00:00Z' },
]

const SEED_COLLABORATORS: Collaborator[] = [
  { id: 'colab-1', name: 'João Silva', email: 'joao@br.com.br', phone: '(21) 98888-0001', document: '123.456.789-00', birthDate: '1990-05-15', roleId: 'role-2', roleName: 'Coordenador de SST', sectorId: 'sector-2', sectorName: 'Operações', companyId: 'comp-1', companyName: 'BR Distribuidora', status: 'active', startDate: '2023-03-01', endDate: '', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'colab-2', name: 'Maria Santos', email: 'maria@br.com.br', phone: '(21) 98888-0002', document: '987.654.321-00', birthDate: '1988-11-20', roleId: 'role-1', roleName: 'Analista de RH', sectorId: 'sector-1', sectorName: 'Administrativo', companyId: 'comp-1', companyName: 'BR Distribuidora', status: 'active', startDate: '2024-06-01', endDate: '', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'colab-3', name: 'Carlos Pereira', email: 'carlos@vale.com', phone: '(31) 97777-0001', document: '111.222.333-44', birthDate: '1985-03-10', roleId: 'role-3', roleName: 'Diretor de Operações', sectorId: 'sector-4', sectorName: 'Mineração', companyId: 'comp-2', companyName: 'Vale S.A.', status: 'active', startDate: '2022-01-15', endDate: '', createdAt: '2026-02-01T00:00:00Z' },
  { id: 'colab-4', name: 'Ana Oliveira', email: 'ana@vale.com', phone: '(31) 97777-0002', document: '555.666.777-88', birthDate: '1992-07-22', roleId: 'role-6', roleName: 'Técnico de Segurança', sectorId: 'sector-5', sectorName: 'Segurança do Trabalho', companyId: 'comp-2', companyName: 'Vale S.A.', status: 'active', startDate: '2024-09-01', endDate: '', createdAt: '2026-02-01T00:00:00Z' },
  { id: 'colab-5', name: 'Pedro Costa', email: 'pedro@itau.com.br', phone: '(11) 96666-0001', document: '999.888.777-66', birthDate: '1995-01-30', roleId: 'role-4', roleName: 'Auxiliar Administrativo', sectorId: 'sector-1', sectorName: 'Administrativo', companyId: 'comp-3', companyName: 'Banco Itaú', status: 'vacation', startDate: '2025-02-01', endDate: '', createdAt: '2026-03-01T00:00:00Z' },
]

export function CadastrosProvider({ children }: { children: React.ReactNode }) {
  const [units, setUnits] = useState<Unit[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [jobRoles, setJobRoles] = useState<JobRole[]>([])
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])

  useEffect(() => {
    try {
      const u = localStorage.getItem('cad_units'); setUnits(u ? JSON.parse(u) : SEED_UNITS)
      const s = localStorage.getItem('cad_sectors'); setSectors(s ? JSON.parse(s) : SEED_SECTORS)
      const r = localStorage.getItem('cad_roles'); setJobRoles(r ? JSON.parse(r) : SEED_ROLES)
      const c = localStorage.getItem('cad_collaborators'); setCollaborators(c ? JSON.parse(c) : SEED_COLLABORATORS)
    } catch { setUnits(SEED_UNITS); setSectors(SEED_SECTORS); setJobRoles(SEED_ROLES); setCollaborators(SEED_COLLABORATORS) }
  }, [])

  useEffect(() => { try { localStorage.setItem('cad_units', JSON.stringify(units)) } catch {} }, [units])
  useEffect(() => { try { localStorage.setItem('cad_sectors', JSON.stringify(sectors)) } catch {} }, [sectors])
  useEffect(() => { try { localStorage.setItem('cad_roles', JSON.stringify(jobRoles)) } catch {} }, [jobRoles])
  useEffect(() => { try { localStorage.setItem('cad_collaborators', JSON.stringify(collaborators)) } catch {} }, [collaborators])

  const addUnit = useCallback((u: Omit<Unit, 'id' | 'createdAt'>) => {
    const newUnit: Unit = { ...u, id: `unit-${Date.now()}`, createdAt: new Date().toISOString() }
    setUnits(prev => [newUnit, ...prev])
    return newUnit
  }, [])

  const updateUnit = useCallback((id: string, updates: Partial<Unit>) => {
    setUnits(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u))
  }, [])

  const deleteUnit = useCallback((id: string) => {
    setUnits(prev => prev.filter(u => u.id !== id))
  }, [])

  const addSector = useCallback((s: Omit<Sector, 'id' | 'createdAt'>) => {
    const newSector: Sector = { ...s, id: `sector-${Date.now()}`, createdAt: new Date().toISOString() }
    setSectors(prev => [newSector, ...prev])
    return newSector
  }, [])

  const updateSector = useCallback((id: string, updates: Partial<Sector>) => {
    setSectors(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
  }, [])

  const deleteSector = useCallback((id: string) => {
    setSectors(prev => prev.filter(s => s.id !== id))
  }, [])

  const addJobRole = useCallback((r: Omit<JobRole, 'id' | 'createdAt'>) => {
    const newRole: JobRole = { ...r, id: `role-${Date.now()}`, createdAt: new Date().toISOString() }
    setJobRoles(prev => [newRole, ...prev])
    return newRole
  }, [])

  const updateJobRole = useCallback((id: string, updates: Partial<JobRole>) => {
    setJobRoles(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
  }, [])

  const deleteJobRole = useCallback((id: string) => {
    setJobRoles(prev => prev.filter(r => r.id !== id))
  }, [])

  const addCollaborator = useCallback((c: Omit<Collaborator, 'id' | 'createdAt'>) => {
    const newCollab: Collaborator = { ...c, id: `colab-${Date.now()}`, createdAt: new Date().toISOString() }
    setCollaborators(prev => [newCollab, ...prev])
    return newCollab
  }, [])

  const updateCollaborator = useCallback((id: string, updates: Partial<Collaborator>) => {
    setCollaborators(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }, [])

  const deleteCollaborator = useCallback((id: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== id))
  }, [])

  const getCollaboratorsBySector = useCallback((sectorId: string) => {
    return collaborators.filter(c => c.sectorId === sectorId)
  }, [collaborators])

  const getCollaboratorsByCompany = useCallback((companyId: string) => {
    return collaborators.filter(c => c.companyId === companyId)
  }, [collaborators])

  return (
    <CadastrosContext.Provider value={{
      units, sectors, jobRoles, collaborators,
      addUnit, updateUnit, deleteUnit,
      addSector, updateSector, deleteSector,
      addJobRole, updateJobRole, deleteJobRole,
      addCollaborator, updateCollaborator, deleteCollaborator,
      getCollaboratorsBySector, getCollaboratorsByCompany,
    }}>
      {children}
    </CadastrosContext.Provider>
  )
}

export function useCadastros() {
  const ctx = useContext(CadastrosContext)
  if (!ctx) throw new Error('useCadastros must be used within CadastrosProvider')
  return ctx
}
