import type { AccountReceivable, AccountPayable, FinancialCategory, PaymentMethod, RecurringRule, FinancialTransaction, FinancialInvoice, BankTransaction } from '@/types/finance'

const BASE = '/api/prisma/financial'

async function api(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const financeService = {
  async saveAll(data: {
    categories?: FinancialCategory[]
    paymentMethods?: PaymentMethod[]
    receivables?: AccountReceivable[]
    payables?: AccountPayable[]
    recurringRules?: RecurringRule[]
    invoices?: FinancialInvoice[]
    transactions?: FinancialTransaction[]
    bankTransactions?: BankTransaction[]
  }): Promise<void> {
    const jobs: Promise<any>[] = []
    for (const c of data.categories || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'category', ...c }) }).catch(() => {}))
    }
    for (const p of data.paymentMethods || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'paymentMethod', ...p }) }).catch(() => {}))
    }
    for (const r of data.receivables || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'receivable', ...mrRow(r) }) }).catch(() => {}))
    }
    for (const p of data.payables || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'payable', ...mpRow(p) }) }).catch(() => {}))
    }
    for (const r of data.recurringRules || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'recurringRule', ...mrrRow(r) }) }).catch(() => {}))
    }
    for (const i of data.invoices || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'invoice', ...minvRow(i) }) }).catch(() => {}))
    }
    for (const t of data.transactions || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'transaction', ...mtRow(t) }) }).catch(() => {}))
    }
    for (const b of data.bankTransactions || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'bankTransaction', ...mbtRow(b) }) }).catch(() => {}))
    }
    await Promise.allSettled(jobs)
  },

  // Categories
  async listCategories(): Promise<FinancialCategory[]> {
    const data = await api(BASE)
    return data.categories || []
  },
  async createCategory(input: Partial<FinancialCategory>): Promise<FinancialCategory> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'category', ...input }),
    })
    return data.category
  },
  async removeCategory(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'category', id }),
    })
  },

  // Payment methods
  async listPaymentMethods(): Promise<PaymentMethod[]> {
    const data = await api(BASE)
    return data.paymentMethods || []
  },
  async createPaymentMethod(input: Partial<PaymentMethod>): Promise<PaymentMethod> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'paymentMethod', ...input }),
    })
    return data.paymentMethod
  },

  // Receivables
  async listReceivables(): Promise<AccountReceivable[]> {
    const data = await api(BASE)
    return (data.receivables || []).map(mr)
  },
  async createReceivable(input: Partial<AccountReceivable>): Promise<AccountReceivable> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'receivable', ...input }),
    })
    return mr(data.receivable)
  },
  async updateReceivable(id: string, input: Partial<AccountReceivable>): Promise<AccountReceivable> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...input }),
    })
    return mr(data.receivable)
  },
  async removeReceivable(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'receivable', id }),
    })
  },

  // Payables
  async listPayables(): Promise<AccountPayable[]> {
    const data = await api(BASE)
    return (data.payables || []).map(mp)
  },
  async createPayable(input: Partial<AccountPayable>): Promise<AccountPayable> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'payable', ...input }),
    })
    return mp(data.payable)
  },
  async updatePayable(id: string, input: Partial<AccountPayable>): Promise<AccountPayable> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'payable', id, ...input }),
    })
    return mp(data.payable)
  },
  async removePayable(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'payable', id }),
    })
  },

  // Recurring rules
  async listRecurringRules(): Promise<RecurringRule[]> {
    const data = await api(BASE)
    return (data.recurringRules || []).map(mrr)
  },
  async createRecurringRule(input: Partial<RecurringRule>): Promise<RecurringRule> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'recurringRule', ...input }),
    })
    return mrr(data.recurringRule)
  },
  async updateRecurringRule(id: string, input: Partial<RecurringRule>): Promise<RecurringRule> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'recurringRule', id, ...input }),
    })
    return mrr(data.recurringRule)
  },
  async removeRecurringRule(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'recurringRule', id }),
    })
  },

  // Transactions
  async listTransactions(): Promise<FinancialTransaction[]> {
    const data = await api(BASE)
    return (data.transactions || []).map(mt)
  },

  // Invoices
  async listInvoices(): Promise<FinancialInvoice[]> {
    const data = await api(BASE)
    return data.invoices || []
  },
  async createInvoice(input: Partial<FinancialInvoice>): Promise<FinancialInvoice> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'invoice', ...input }),
    })
    return data.invoice
  },

  // Bank transactions
  async listBankTransactions(): Promise<BankTransaction[]> {
    const data = await api(BASE)
    return data.bankTransactions || []
  },
  async createBankTransaction(input: Partial<BankTransaction>): Promise<BankTransaction> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'bankTransaction', ...input }),
    })
    return data.bankTransaction
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
