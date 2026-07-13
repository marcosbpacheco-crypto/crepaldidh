import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { crmService } from '@/services/crmService'
import type { Company, Contact, Deal, Activity, Task, Proposal, Contract, Seller, CrmClient } from '@/types/crm'

const BASE_KEY = ['crm']

export function useCompaniesQuery() {
  return useQuery({ queryKey: [...BASE_KEY, 'companies'], queryFn: () => crmService.listCompanies() })
}
export function useCompanyQuery(id: string) {
  return useQuery({ queryKey: [...BASE_KEY, 'companies', id], queryFn: () => crmService.listCompanies().then(cs => cs.find(c => c.id === id)), enabled: !!id })
}
export function useCreateCompany() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (i: Partial<Company>) => crmService.createCompany(i), onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'companies'] }) })
}
export function useUpdateCompany() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, ...i }: { id: string } & Partial<Company>) => crmService.updateCompany(id, i), onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'companies'] }) })
}
export function useDeleteCompany() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => crmService.removeCompany(id), onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'companies'] }) })
}

export function useContactsQuery(companyId?: string) {
  return useQuery({ queryKey: [...BASE_KEY, 'contacts', companyId], queryFn: () => crmService.listContacts(companyId), enabled: companyId !== undefined })
}
export function useCreateContact() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (i: Partial<Contact>) => crmService.createContact(i), onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'contacts'] }) })
}
export function useUpdateContact() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, ...i }: { id: string } & Partial<Contact>) => crmService.updateContact(id, i), onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'contacts'] }) })
}
export function useDeleteContact() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => crmService.removeContact(id), onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'contacts'] }) })
}

export function useDealsQuery(companyId?: string) {
  return useQuery({ queryKey: [...BASE_KEY, 'deals', companyId], queryFn: () => crmService.listDeals(companyId), enabled: companyId !== undefined })
}
export function useCreateDeal() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (i: Partial<Deal>) => crmService.createDeal(i), onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'deals'] }) })
}
export function useUpdateDeal() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, ...i }: { id: string } & Partial<Deal>) => crmService.updateDeal(id, i), onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'deals'] }) })
}
export function useDeleteDeal() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => crmService.removeDeal(id), onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'deals'] }) })
}

export function useActivitiesQuery(companyId?: string, dealId?: string) {
  return useQuery({ queryKey: [...BASE_KEY, 'activities', companyId, dealId], queryFn: () => crmService.listActivities(companyId, dealId), enabled: companyId !== undefined || dealId !== undefined })
}
export function useCreateActivity() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (i: Partial<Activity>) => crmService.createActivity(i), onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'activities'] }) })
}
export function useDeleteActivity() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => crmService.removeActivity(id), onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'activities'] }) })
}

export function useTasksQuery(companyId?: string, dealId?: string) {
  return useQuery({ queryKey: [...BASE_KEY, 'tasks', companyId, dealId], queryFn: () => crmService.listTasks(companyId, dealId), enabled: companyId !== undefined || dealId !== undefined })
}
export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (i: Partial<Task>) => crmService.createTask(i), onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'tasks'] }) })
}
export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, ...i }: { id: string } & Partial<Task>) => crmService.updateTask(id, i), onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'tasks'] }) })
}
export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => crmService.removeTask(id), onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'tasks'] }) })
}

export function useProposalsQuery(companyId?: string) {
  return useQuery({ queryKey: [...BASE_KEY, 'proposals', companyId], queryFn: () => crmService.listProposals(companyId), enabled: companyId !== undefined })
}
export function useCreateProposal() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (i: Partial<Proposal>) => crmService.createProposal(i), onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'proposals'] }) })
}
export function useUpdateProposal() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, ...i }: { id: string } & Partial<Proposal>) => crmService.updateProposal(id, i), onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'proposals'] }) })
}
export function useDeleteProposal() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => crmService.removeProposal(id), onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'proposals'] }) })
}

export function useContractsQuery(companyId?: string) {
  return useQuery({ queryKey: [...BASE_KEY, 'contracts', companyId], queryFn: () => crmService.listContracts(companyId), enabled: companyId !== undefined })
}
export function useCreateContract() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (i: Partial<Contract>) => crmService.createContract(i), onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'contracts'] }) })
}
export function useUpdateContract() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, ...i }: { id: string } & Partial<Contract>) => crmService.updateContract(id, i), onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'contracts'] }) })
}
export function useDeleteContract() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => crmService.removeContract(id), onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'contracts'] }) })
}

export function useSellersQuery() {
  return useQuery({ queryKey: [...BASE_KEY, 'sellers'], queryFn: () => crmService.listSellers() })
}

export function useCrmClientsQuery() {
  return useQuery({ queryKey: [...BASE_KEY, 'clients'], queryFn: () => crmService.listCrmClients() })
}
