export type DocType = 'contract' | 'proposal' | 'report' | 'diagnostic' | 'inventory' | 'action_plan' | 'certificate' | 'attendance_list' | 'training_material' | 'evidence' | 'meeting_minutes' | 'financial'
export type DocVisibility = 'internal' | 'portal' | 'restricted' | 'financial' | 'technical'
export type DocStatus = 'draft' | 'approved' | 'rejected' | 'archived' | 'expired'
export type DocApproval = 'pending' | 'approved' | 'rejected'
export type DocAction = 'view' | 'download' | 'edit' | 'delete' | 'share' | 'upload' | 'version'
export type DocViewMode = 'cards' | 'table'

export interface Document {
  id: string; name: string; type: DocType; description?: string; companyId?: string; companyName?: string
  projectId?: string; projectName?: string; module?: string; visibility: DocVisibility; status: DocStatus
  fileUrl?: string; fileSize?: number; fileType?: string; currentVersion: number; signatureCode?: string
  signedAt?: string; signedBy?: string; validUntil?: string; approvalStatus: DocApproval
  createdBy?: string; createdAt: string; updatedAt: string
}
export interface DocumentVersion {
  id: string; documentId: string; versionNumber: number; fileUrl?: string; fileSize?: number; fileType?: string
  changeDescription?: string; uploadedBy?: string; uploadedAt: string
}
export interface AccessLog {
  id: string; documentId: string; userId?: string; userName?: string; action: DocAction; createdAt: string
}
export interface DocFilter {
  search: string; type: DocType | 'all'; companyId: string | 'all'; projectId: string | 'all'; status: DocStatus | 'all'; visibility: DocVisibility | 'all'
}
export interface DocumentCategory {
  id: string; name: string; description?: string; icon?: string; color?: string
}
export interface DocumentAccessLog {
  id: string; documentId: string; userId?: string; userName?: string; action: DocAction; accessedAt: string; createdAt: string
}
