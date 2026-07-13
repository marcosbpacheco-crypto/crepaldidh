import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentService } from '@/services/documentService'
import type { Document, DocumentVersion, DocumentCategory, DocumentAccessLog } from '@/types/documents'

const DOC_KEY = ['documents']
const CAT_KEY = ['documents', 'categories']

export function useDocumentsQuery() { return useQuery({ queryKey: DOC_KEY, queryFn: () => documentService.list() }) }
export function useCreateDocument() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<Document>) => documentService.create(i), onSuccess: () => qc.invalidateQueries({ queryKey: DOC_KEY }) }) }
export function useUpdateDocument() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, ...i }: { id: string } & Partial<Document>) => documentService.update(id, i), onSuccess: () => qc.invalidateQueries({ queryKey: DOC_KEY }) }) }
export function useDeleteDocument() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => documentService.remove(id), onSuccess: () => qc.invalidateQueries({ queryKey: DOC_KEY }) }) }

export function useDocumentVersionsQuery(documentId: string) { return useQuery({ queryKey: [...DOC_KEY, documentId, 'versions'], queryFn: () => documentService.listVersions(documentId), enabled: !!documentId }) }
export function useCreateDocumentVersion() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<DocumentVersion>) => documentService.createVersion(i), onSuccess: () => qc.invalidateQueries({ queryKey: DOC_KEY }) }) }

export function useDocumentAccessLogsQuery(documentId: string) { return useQuery({ queryKey: [...DOC_KEY, documentId, 'accessLogs'], queryFn: () => documentService.listAccessLogs(documentId), enabled: !!documentId }) }
export function useLogDocumentAccess() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<DocumentAccessLog>) => documentService.logAccess(i), onSuccess: () => qc.invalidateQueries({ queryKey: DOC_KEY }) }) }

export function useDocumentCategoriesQuery() { return useQuery({ queryKey: CAT_KEY, queryFn: () => documentService.listCategories() }) }
