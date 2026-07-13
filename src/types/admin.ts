export type ModuleName = 'crm' | 'clients' | 'projects' | 'nr01' | 'mentoring' | 'trainings' | 'financial' | 'calendar' | 'portal' | 'documents' | 'bi' | 'ai' | 'admin' | 'tasks' | 'alerts' | 'import' | 'assessoria'

export interface Role {
  id: string; name: string; label: string; description: string; isExternal: boolean
}

export interface User {
  id: string; name: string; email: string; phone: string; avatar: string
  roleId: string; roleName: string; isExternal: boolean
  companyId?: string; companyName?: string
  active: boolean; password: string; lastLogin?: string
  loginAttempts: number; mfaEnabled: boolean; createdAt: string; tenantId?: string
}

export interface Permission {
  id: string; roleId?: string; userId?: string; module: ModuleName
  canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean; canExport: boolean
}

export interface AuditLog {
  id: string; userId: string; userName: string; userRole: string
  action: string; entity: string; entityId?: string; description: string
  ipAddress: string; createdAt: string
}

export interface LgpdConsent {
  id: string; userId: string; consentType: string; legalBasis: string
  granted: boolean; grantedAt?: string; revokedAt?: string; version: string
}

export interface PrivacyRequest {
  id: string; userId: string; userName: string; requestType: string
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  description: string; processedBy?: string; processedAt?: string
  responseNotes?: string; createdAt: string
}
