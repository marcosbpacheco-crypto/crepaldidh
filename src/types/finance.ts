export type ReceivableStatus = 'pending' | 'paid' | 'overdue' | 'canceled'
export type PayableStatus = 'pending' | 'paid' | 'overdue' | 'canceled'
export type RecurrenceFrequency = 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'annual'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'canceled'

export interface FinancialCategory { id: string; name: string; type: 'income' | 'expense'; description: string; createdAt: string }
export interface PaymentMethod { id: string; name: string; active: boolean; createdAt: string }
export interface AccountReceivable {
  id: string; companyId: string; companyName: string; contractId?: string; contractName?: string
  projectId?: string; projectName?: string; serviceName: string; amount: number; dueDate: string
  paymentDate?: string; status: ReceivableStatus; paymentMethodId?: string; paymentMethodName?: string
  notes: string; createdAt: string; invoiceFileUrl?: string; invoiceNumber?: string; invoiceIssuer?: string
}
export interface AccountPayable {
  id: string; supplier: string; categoryId?: string; categoryName?: string; description: string
  amount: number; dueDate: string; paymentDate?: string; status: PayableStatus; attachmentUrl?: string
  notes: string; createdAt: string; invoiceFileUrl?: string; invoiceNumber?: string; invoiceIssuer?: string
}
export interface FinancialTransaction {
  id: string; description: string; amount: number; type: 'income' | 'expense'; transactionDate: string
  paymentMethodId?: string; receivableId?: string; payableId?: string; categoryId?: string; createdAt: string
}
export interface FinancialInvoice {
  id: string; receivableId: string; invoiceNumber: string; issueDate: string; status: InvoiceStatus; fileUrl?: string; createdAt: string
}
export interface RecurringRule {
  id: string; contractId: string; contractName: string; companyId: string; companyName: string
  frequency: RecurrenceFrequency; amount: number; nextBillingDate: string; readjustmentRate: number
  status: 'active' | 'paused' | 'canceled'; serviceName: string; createdAt: string
}
export interface BankTransaction {
  id: string; date: string; description: string; amount: number; type: 'credit' | 'debit'
  category?: string; matchedId?: string; matchedType?: 'receivable' | 'payable'; reconciled: boolean; createdAt: string
}
