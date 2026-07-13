export interface TabelaPrice {
  id: string; name: string; taxa: number; parcelas: number; coeficiente: number
}
export interface ObrigacaoFiscal {
  id: string; name: string; dueDate: string; paymentDate?: string; value: number; status: 'pending' | 'paid' | 'overdue'; companyId?: string
}
export interface AliquotaTributaria {
  id: string; name: string; aliquota: number; tipo: string; descricao?: string
}
export interface Anotacao {
  id: string; title: string; content: string; createdAt: string; author?: string
}
