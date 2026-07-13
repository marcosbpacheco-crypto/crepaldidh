import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { financeService } from '@/services/financeService'
import type { AccountReceivable, AccountPayable, FinancialCategory, PaymentMethod, RecurringRule } from '@/types/finance'

const R_KEY = ['finance', 'receivables']
const P_KEY = ['finance', 'payables']
const C_KEY = ['finance', 'categories']
const PM_KEY = ['finance', 'paymentMethods']
const RR_KEY = ['finance', 'recurring']

export function useReceivablesQuery() { return useQuery({ queryKey: R_KEY, queryFn: () => financeService.listReceivables() }) }
export function useCreateReceivable() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<AccountReceivable>) => financeService.createReceivable(i), onSuccess: () => qc.invalidateQueries({ queryKey: R_KEY }) }) }
export function useUpdateReceivable() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, ...i }: { id: string } & Partial<AccountReceivable>) => financeService.updateReceivable(id, i), onSuccess: () => qc.invalidateQueries({ queryKey: R_KEY }) }) }
export function useDeleteReceivable() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => financeService.removeReceivable(id) }) }

export function usePayablesQuery() { return useQuery({ queryKey: P_KEY, queryFn: () => financeService.listPayables() }) }
export function useCreatePayable() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<AccountPayable>) => financeService.createPayable(i), onSuccess: () => qc.invalidateQueries({ queryKey: P_KEY }) }) }
export function useUpdatePayable() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, ...i }: { id: string } & Partial<AccountPayable>) => financeService.updatePayable(id, i), onSuccess: () => qc.invalidateQueries({ queryKey: P_KEY }) }) }
export function useDeletePayable() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => financeService.removePayable(id) }) }

export function useCategoriesQuery() { return useQuery({ queryKey: C_KEY, queryFn: () => financeService.listCategories() }) }
export function useCreateCategory() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<FinancialCategory>) => financeService.createCategory(i), onSuccess: () => qc.invalidateQueries({ queryKey: C_KEY }) }) }
export function useDeleteCategory() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => financeService.removeCategory(id) }) }

export function usePaymentMethodsQuery() { return useQuery({ queryKey: PM_KEY, queryFn: () => financeService.listPaymentMethods() }) }
export function useCreatePaymentMethod() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<PaymentMethod>) => financeService.createPaymentMethod(i), onSuccess: () => qc.invalidateQueries({ queryKey: PM_KEY }) }) }

export function useRecurringRulesQuery() { return useQuery({ queryKey: RR_KEY, queryFn: () => financeService.listRecurringRules() }) }
export function useCreateRecurringRule() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<RecurringRule>) => financeService.createRecurringRule(i), onSuccess: () => qc.invalidateQueries({ queryKey: RR_KEY }) }) }
export function useUpdateRecurringRule() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, ...i }: { id: string } & Partial<RecurringRule>) => financeService.updateRecurringRule(id, i), onSuccess: () => qc.invalidateQueries({ queryKey: RR_KEY }) }) }
export function useDeleteRecurringRule() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => financeService.removeRecurringRule(id) }) }
