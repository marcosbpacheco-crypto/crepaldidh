import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assessoriaService } from '@/services/assessoriaService'
import type { Diagnostico, Okr, Swot, PlanoAcao, Kpi, KpiMeta, Relatorio, Checkin, Ferramenta } from '@/types/assessoria'

const D_KEY = ['assessoria', 'diagnosticos']
const O_KEY = ['assessoria', 'okrs']
const S_KEY = ['assessoria', 'swots']
const P_KEY = ['assessoria', 'planos']
const K_KEY = ['assessoria', 'kpis']
const M_KEY = ['assessoria', 'metas']
const R_KEY = ['assessoria', 'relatorios']
const C_KEY = ['assessoria', 'checkins']
const F_KEY = ['assessoria', 'ferramentas']

export function useDiagnosticosQuery(empresa?: string) { return useQuery({ queryKey: [...D_KEY, empresa], queryFn: () => assessoriaService.listDiagnosticos(empresa), enabled: empresa !== undefined }) }
export function useCreateDiagnostico() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<Diagnostico>) => assessoriaService.createDiagnostico(i), onSuccess: () => qc.invalidateQueries({ queryKey: D_KEY }) }) }
export function useUpdateDiagnostico() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, ...i }: { id: string } & Partial<Diagnostico>) => assessoriaService.updateDiagnostico(id, i), onSuccess: () => qc.invalidateQueries({ queryKey: D_KEY }) }) }
export function useDeleteDiagnostico() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => assessoriaService.removeDiagnostico(id), onSuccess: () => qc.invalidateQueries({ queryKey: D_KEY }) }) }

export function useOkrsQuery(empresa?: string) { return useQuery({ queryKey: [...O_KEY, empresa], queryFn: () => assessoriaService.listOkrs(empresa), enabled: empresa !== undefined }) }
export function useCreateOkr() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<Okr>) => assessoriaService.createOkr(i), onSuccess: () => qc.invalidateQueries({ queryKey: O_KEY }) }) }
export function useUpdateOkr() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, ...i }: { id: string } & Partial<Okr>) => assessoriaService.updateOkr(id, i), onSuccess: () => qc.invalidateQueries({ queryKey: O_KEY }) }) }
export function useDeleteOkr() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => assessoriaService.removeOkr(id), onSuccess: () => qc.invalidateQueries({ queryKey: O_KEY }) }) }

export function useSwotsQuery(empresa?: string) { return useQuery({ queryKey: [...S_KEY, empresa], queryFn: () => assessoriaService.listSwots(empresa), enabled: empresa !== undefined }) }
export function useCreateSwot() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<Swot>) => assessoriaService.createSwot(i), onSuccess: () => qc.invalidateQueries({ queryKey: S_KEY }) }) }
export function useUpdateSwot() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, ...i }: { id: string } & Partial<Swot>) => assessoriaService.updateSwot(id, i), onSuccess: () => qc.invalidateQueries({ queryKey: S_KEY }) }) }
export function useDeleteSwot() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => assessoriaService.removeSwot(id), onSuccess: () => qc.invalidateQueries({ queryKey: S_KEY }) }) }

export function usePlanosQuery(empresa?: string) { return useQuery({ queryKey: [...P_KEY, empresa], queryFn: () => assessoriaService.listPlanos(empresa), enabled: empresa !== undefined }) }
export function useCreatePlano() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<PlanoAcao>) => assessoriaService.createPlano(i), onSuccess: () => qc.invalidateQueries({ queryKey: P_KEY }) }) }
export function useUpdatePlano() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, ...i }: { id: string } & Partial<PlanoAcao>) => assessoriaService.updatePlano(id, i), onSuccess: () => qc.invalidateQueries({ queryKey: P_KEY }) }) }
export function useDeletePlano() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => assessoriaService.removePlano(id), onSuccess: () => qc.invalidateQueries({ queryKey: P_KEY }) }) }

export function useKpisQuery(empresa?: string) { return useQuery({ queryKey: [...K_KEY, empresa], queryFn: () => assessoriaService.listKpis(empresa), enabled: empresa !== undefined }) }
export function useCreateKpi() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<Kpi>) => assessoriaService.createKpi(i), onSuccess: () => qc.invalidateQueries({ queryKey: K_KEY }) }) }
export function useUpdateKpi() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, ...i }: { id: string } & Partial<Kpi>) => assessoriaService.updateKpi(id, i), onSuccess: () => qc.invalidateQueries({ queryKey: K_KEY }) }) }
export function useDeleteKpi() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => assessoriaService.removeKpi(id), onSuccess: () => qc.invalidateQueries({ queryKey: K_KEY }) }) }

export function useMetasQuery(kpiId?: string) { return useQuery({ queryKey: [...M_KEY, kpiId], queryFn: () => assessoriaService.listMetas(kpiId), enabled: kpiId !== undefined }) }
export function useCreateMeta() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<KpiMeta>) => assessoriaService.createMeta(i), onSuccess: () => qc.invalidateQueries({ queryKey: M_KEY }) }) }

export function useRelatoriosQuery(empresa?: string) { return useQuery({ queryKey: [...R_KEY, empresa], queryFn: () => assessoriaService.listRelatorios(empresa), enabled: empresa !== undefined }) }
export function useCreateRelatorio() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<Relatorio>) => assessoriaService.createRelatorio(i), onSuccess: () => qc.invalidateQueries({ queryKey: R_KEY }) }) }

export function useCheckinsQuery(empresa?: string) { return useQuery({ queryKey: [...C_KEY, empresa], queryFn: () => assessoriaService.listCheckins(empresa), enabled: empresa !== undefined }) }
export function useCreateCheckin() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<Checkin>) => assessoriaService.createCheckin(i), onSuccess: () => qc.invalidateQueries({ queryKey: C_KEY }) }) }

export function useFerramentasQuery() { return useQuery({ queryKey: F_KEY, queryFn: () => assessoriaService.listFerramentas() }) }
