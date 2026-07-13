import { getClient, handleError } from './base'
import type { AccountReceivable, AccountPayable, FinancialCategory, PaymentMethod, RecurringRule, FinancialTransaction, FinancialInvoice, BankTransaction } from '@/types/finance'

const RECEIVABLES_TABLE = 'financial_accounts_receivable'
const PAYABLES_TABLE = 'financial_accounts_payable'
const CATEGORIES_TABLE = 'financial_categories'
const PAYMENT_METHODS_TABLE = 'financial_payment_methods'
const RECURRING_TABLE = 'financial_recurring_rules'
const TRANSACTIONS_TABLE = 'financial_transactions'
const INVOICES_TABLE = 'financial_invoices'
const BANK_TABLE = 'fin_bank_transactions'

export const financeService = {
  async saveAll(data: {
    categories?: FinancialCategory[]
    paymentMethods?: PaymentMethod[]
    receivables?: AccountReceivable[]
    payables?: AccountPayable[]
    transactions?: FinancialTransaction[]
    invoices?: FinancialInvoice[]
    recurringRules?: RecurringRule[]
    bankTransactions?: BankTransaction[]
  }): Promise<void> {
    const supabase = getClient()
    const jobs: Promise<any>[] = []
    if (data.categories?.length) jobs.push(Promise.resolve(supabase.from(CATEGORIES_TABLE).upsert(data.categories.map(mc))))
    if (data.paymentMethods?.length) jobs.push(Promise.resolve(supabase.from(PAYMENT_METHODS_TABLE).upsert(data.paymentMethods.map(mpm))))
    if (data.receivables?.length) jobs.push(Promise.resolve(supabase.from(RECEIVABLES_TABLE).upsert(data.receivables.map(mrRow))))
    if (data.payables?.length) jobs.push(Promise.resolve(supabase.from(PAYABLES_TABLE).upsert(data.payables.map(mpRow))))
    if (data.transactions?.length) jobs.push(Promise.resolve(supabase.from(TRANSACTIONS_TABLE).upsert(data.transactions.map(mtRow))))
    if (data.invoices?.length) jobs.push(Promise.resolve(supabase.from(INVOICES_TABLE).upsert(data.invoices.map(minvRow))))
    if (data.recurringRules?.length) jobs.push(Promise.resolve(supabase.from(RECURRING_TABLE).upsert(data.recurringRules.map(mrrRow))))
    if (data.bankTransactions?.length) jobs.push(Promise.resolve(supabase.from(BANK_TABLE).upsert(data.bankTransactions.map(mbtRow))))
    await Promise.allSettled(jobs)
  },
  // Categories
  async listCategories(): Promise<FinancialCategory[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(CATEGORIES_TABLE).select('*').order('name')
    if (error) handleError(error, 'financeService.listCategories')
    return data || []
  },
  async createCategory(input: Partial<FinancialCategory>): Promise<FinancialCategory> {
    const supabase = getClient()
    const { data, error } = await supabase.from(CATEGORIES_TABLE).insert(mc(input)).select().single()
    if (error) handleError(error, 'financeService.createCategory')
    return data!
  },
  async removeCategory(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(CATEGORIES_TABLE).delete().eq('id', id)
    if (error) handleError(error, 'financeService.removeCategory')
  },
  // Payment methods
  async listPaymentMethods(): Promise<PaymentMethod[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(PAYMENT_METHODS_TABLE).select('*').order('name')
    if (error) handleError(error, 'financeService.listPaymentMethods')
    return data || []
  },
  async createPaymentMethod(input: Partial<PaymentMethod>): Promise<PaymentMethod> {
    const supabase = getClient()
    const { data, error } = await supabase.from(PAYMENT_METHODS_TABLE).insert(mpm(input)).select().single()
    if (error) handleError(error, 'financeService.createPaymentMethod')
    return data!
  },
  // Receivables
  async listReceivables(): Promise<AccountReceivable[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(RECEIVABLES_TABLE).select('*').order('due_date')
    if (error) handleError(error, 'financeService.listReceivables')
    return (data || []).map(mr)
  },
  async createReceivable(input: Partial<AccountReceivable>): Promise<AccountReceivable> {
    const supabase = getClient()
    const { data, error } = await supabase.from(RECEIVABLES_TABLE).insert(mrRow(input)).select().single()
    if (error) handleError(error, 'financeService.createReceivable')
    return mr(data!)
  },
  async updateReceivable(id: string, input: Partial<AccountReceivable>): Promise<AccountReceivable> {
    const supabase = getClient()
    const { data, error } = await supabase.from(RECEIVABLES_TABLE).update(mrRow(input)).eq('id', id).select().single()
    if (error) handleError(error, 'financeService.updateReceivable')
    return mr(data!)
  },
  async removeReceivable(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(RECEIVABLES_TABLE).delete().eq('id', id)
    if (error) handleError(error, 'financeService.removeReceivable')
  },
  // Payables
  async listPayables(): Promise<AccountPayable[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(PAYABLES_TABLE).select('*').order('due_date')
    if (error) handleError(error, 'financeService.listPayables')
    return (data || []).map(mp)
  },
  async createPayable(input: Partial<AccountPayable>): Promise<AccountPayable> {
    const supabase = getClient()
    const { data, error } = await supabase.from(PAYABLES_TABLE).insert(mpRow(input)).select().single()
    if (error) handleError(error, 'financeService.createPayable')
    return mp(data!)
  },
  async updatePayable(id: string, input: Partial<AccountPayable>): Promise<AccountPayable> {
    const supabase = getClient()
    const { data, error } = await supabase.from(PAYABLES_TABLE).update(mpRow(input)).eq('id', id).select().single()
    if (error) handleError(error, 'financeService.updatePayable')
    return mp(data!)
  },
  async removePayable(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(PAYABLES_TABLE).delete().eq('id', id)
    if (error) handleError(error, 'financeService.removePayable')
  },
  // Recurring rules
  async listRecurringRules(): Promise<RecurringRule[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(RECURRING_TABLE).select('*').order('next_billing_date')
    if (error) handleError(error, 'financeService.listRecurringRules')
    return (data || []).map(mrr)
  },
  async createRecurringRule(input: Partial<RecurringRule>): Promise<RecurringRule> {
    const supabase = getClient()
    const { data, error } = await supabase.from(RECURRING_TABLE).insert(mrrRow(input)).select().single()
    if (error) handleError(error, 'financeService.createRecurringRule')
    return mrr(data!)
  },
  async updateRecurringRule(id: string, input: Partial<RecurringRule>): Promise<RecurringRule> {
    const supabase = getClient()
    const { data, error } = await supabase.from(RECURRING_TABLE).update(mrrRow(input)).eq('id', id).select().single()
    if (error) handleError(error, 'financeService.updateRecurringRule')
    return mrr(data!)
  },
  async removeRecurringRule(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(RECURRING_TABLE).delete().eq('id', id)
    if (error) handleError(error, 'financeService.removeRecurringRule')
  },
  // Transactions
  async listTransactions(): Promise<FinancialTransaction[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(TRANSACTIONS_TABLE).select('*').order('transaction_date', { ascending: false })
    if (error) handleError(error, 'financeService.listTransactions')
    return (data || []).map(mt)
  },
  // Invoices
  async listInvoices(): Promise<FinancialInvoice[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(INVOICES_TABLE).select('*')
    if (error) handleError(error, 'financeService.listInvoices')
    return data || []
  },
  async createInvoice(input: Partial<FinancialInvoice>): Promise<FinancialInvoice> {
    const supabase = getClient()
    const { data, error } = await supabase.from(INVOICES_TABLE).insert(minvRow(input)).select().single()
    if (error) handleError(error, 'financeService.createInvoice')
    return data!
  },
  // Bank transactions
  async listBankTransactions(): Promise<BankTransaction[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(BANK_TABLE).select('*').order('date', { ascending: false })
    if (error) handleError(error, 'financeService.listBankTransactions')
    return data || []
  },
  async createBankTransaction(input: Partial<BankTransaction>): Promise<BankTransaction> {
    const supabase = getClient()
    const { data, error } = await supabase.from(BANK_TABLE).insert(mbtRow(input)).select().single()
    if (error) handleError(error, 'financeService.createBankTransaction')
    return data!
  },
}

function mc(r: any) {
  const { createdAt, ...rest } = r
  return { ...rest, created_at: r.created_at }
}
function mpm(r: any) {
  const { createdAt, ...rest } = r
  return { ...rest, created_at: r.created_at }
}
function mrRow(r: any) {
  const { companyName, contractName, projectName, serviceName, dueDate, paymentDate, paymentMethodId, paymentMethodName, invoiceFileUrl, invoiceNumber, invoiceIssuer, createdAt, ...rest } = r
  return { ...rest, company_name: r.companyName, contract_name: r.contractName, project_name: r.projectName, service_name: r.serviceName, due_date: r.dueDate, payment_date: r.paymentDate, payment_method_id: r.paymentMethodId, payment_method_name: r.paymentMethodName, invoice_file_url: r.invoiceFileUrl, invoice_number: r.invoiceNumber, invoice_issuer: r.invoiceIssuer, created_at: r.createdAt }
}
function mpRow(r: any) {
  const { categoryName, dueDate, paymentDate, attachmentUrl, invoiceFileUrl, invoiceNumber, invoiceIssuer, createdAt, ...rest } = r
  return { ...rest, category_name: r.categoryName, due_date: r.dueDate, payment_date: r.paymentDate, attachment_url: r.attachmentUrl, invoice_file_url: r.invoiceFileUrl, invoice_number: r.invoiceNumber, invoice_issuer: r.invoiceIssuer, created_at: r.createdAt }
}
function mrrRow(r: any) {
  const { contractName, companyName, nextBillingDate, readjustmentRate, serviceName, createdAt, ...rest } = r
  return { ...rest, contract_name: r.contractName, company_name: r.companyName, next_billing_date: r.nextBillingDate, readjustment_rate: r.readjustmentRate, service_name: r.serviceName, created_at: r.createdAt }
}
function mtRow(r: any) {
  const { transactionDate, paymentMethodId, receivableId, payableId, categoryId, createdAt, ...rest } = r
  return { ...rest, transaction_date: r.transactionDate, payment_method_id: r.paymentMethodId, receivable_id: r.receivableId, payable_id: r.payableId, category_id: r.categoryId, created_at: r.createdAt }
}
function minvRow(r: any) {
  const { receivableId, issueDate, fileUrl, createdAt, ...rest } = r
  return { ...rest, receivable_id: r.receivableId, issue_date: r.issueDate, file_url: r.fileUrl, created_at: r.createdAt }
}
function mbtRow(r: any) {
  const { createdAt, ...rest } = r
  return { ...rest, created_at: r.createdAt }
}
function mr(r: any): AccountReceivable {
  return { ...r, companyName: r.company_name, contractName: r.contract_name, projectName: r.project_name, serviceName: r.service_name, dueDate: r.due_date, paymentDate: r.payment_date, paymentMethodId: r.payment_method_id, paymentMethodName: r.payment_method_name, invoiceFileUrl: r.invoice_file_url, invoiceNumber: r.invoice_number, invoiceIssuer: r.invoice_issuer, createdAt: r.created_at }
}
function mp(r: any): AccountPayable {
  return { ...r, categoryName: r.category_name, dueDate: r.due_date, paymentDate: r.payment_date, attachmentUrl: r.attachment_url, invoiceFileUrl: r.invoice_file_url, invoiceNumber: r.invoice_number, invoiceIssuer: r.invoice_issuer, createdAt: r.created_at }
}
function mrr(r: any): RecurringRule {
  return { ...r, contractName: r.contract_name, companyName: r.company_name, nextBillingDate: r.next_billing_date, readjustmentRate: r.readjustment_rate, serviceName: r.service_name, createdAt: r.created_at }
}
function mt(r: any): FinancialTransaction {
  return { ...r, transactionDate: r.transaction_date, paymentMethodId: r.payment_method_id, receivableId: r.receivable_id, payableId: r.payable_id, categoryId: r.category_id, createdAt: r.created_at }
}
