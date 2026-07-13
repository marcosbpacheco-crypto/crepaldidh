export interface Diagnostico {
  id: string; titulo: string; empresa: string; responsavel: string; areasAvaliadas: string[]
  pontuacaoGeral: number; status: 'rascunho' | 'concluido'; dataCriacao: string; observacoes: string
}
export interface Okr {
  id: string; objetivo: string; empresa: string; ciclo: string
  keyResults: { descricao: string; meta: number; atual: number; unidade: string }[]
  status: 'ativo' | 'concluido' | 'cancelado'; dataCriacao: string
}
export interface Swot {
  id: string; empresa: string; forcas: string[]; fraquezas: string[]; oportunidades: string[]; ameacas: string[]; dataCriacao: string
}
export interface PlanoAcao {
  id: string; titulo: string; empresa: string; responsavel: string
  itens: { acao: string; prazo: string; responsavel: string; status: 'pendente' | 'andamento' | 'concluido' }[]
  status: 'ativo' | 'concluido'; dataCriacao: string
}
export interface Kpi {
  id: string; nome: string; empresa: string; meta: number; atual: number; unidade: string; periodo: string; tendencia: 'subindo' | 'descendo' | 'estavel'
}
export interface KpiMeta {
  id: string; kpiId: string; mes: string; valor: number; observacao?: string
}
export interface Relatorio {
  id: string; titulo: string; empresa: string; tipo: string
  dataInicio: string; dataFim: string; conteudo: string; status: 'rascunho' | 'concluido'; criadoPor: string; dataCriacao: string
}
export interface Checkin {
  id: string; empresa: string; data: string; status: string
  pontosPositivos: string; pontosMelhoria: string; acoes: string; proximoCheckin: string; responsavel: string
}
export interface Ferramenta {
  id: string; nome: string; descricao: string; tipo: string; icone: string
}
