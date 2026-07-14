import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [
      categories,
      paymentMethods,
      receivables,
      payables,
      recurringRules,
      transactions,
      invoices,
    ] = await Promise.all([
      prisma.financial_categories.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.financial_payment_methods.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.financial_accounts_receivable.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.financial_accounts_payable.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.financial_recurring_rules.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.financial_transactions.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.financial_invoices.findMany({ orderBy: { created_at: 'desc' } }),
    ])
    return NextResponse.json({ categories, paymentMethods, receivables, payables, recurringRules, transactions, invoices })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { _type, id, ...data } = body

    if (_type === 'category' || !_type) {
      const catId = id || crypto.randomUUID()
      const category = await prisma.financial_categories.upsert({
        where: { id: catId },
        create: { id: catId, name: data.name, type: data.type, description: data.description || null },
        update: { name: data.name, type: data.type, description: data.description || null },
      })
      return NextResponse.json({ category })
    }

    if (_type === 'paymentMethod') {
      const pmId = id || crypto.randomUUID()
      const paymentMethod = await prisma.financial_payment_methods.upsert({
        where: { id: pmId },
        create: { id: pmId, name: data.name, active: data.active ?? true },
        update: { name: data.name, active: data.active ?? true },
      })
      return NextResponse.json({ paymentMethod })
    }

    if (_type === 'receivable') {
      const recId = id || crypto.randomUUID()
      const receivable = await prisma.financial_accounts_receivable.upsert({
        where: { id: recId },
        create: {
          id: recId,
          company_id: data.companyId || data.company_id || null,
          contract_id: data.contractId || data.contract_id || null,
          project_id: data.projectId || data.project_id || null,
          service_name: data.serviceName || data.service_name || null,
          amount: data.amount ?? 0,
          due_date: new Date(data.dueDate || data.due_date),
          payment_date: data.paymentDate || data.payment_date ? new Date(data.paymentDate || data.payment_date) : null,
          status: data.status || 'pending',
          payment_method_id: data.paymentMethodId || data.payment_method_id || null,
          notes: data.notes || null,
        },
        update: {
          company_id: data.companyId || data.company_id || null,
          contract_id: data.contractId || data.contract_id || null,
          project_id: data.projectId || data.project_id || null,
          service_name: data.serviceName || data.service_name || null,
          amount: data.amount ?? 0,
          due_date: new Date(data.dueDate || data.due_date),
          payment_date: data.paymentDate || data.payment_date ? new Date(data.paymentDate || data.payment_date) : null,
          status: data.status || 'pending',
          payment_method_id: data.paymentMethodId || data.payment_method_id || null,
          notes: data.notes || null,
        },
      })
      return NextResponse.json({ receivable })
    }

    if (_type === 'payable') {
      const payId = id || crypto.randomUUID()
      const payable = await prisma.financial_accounts_payable.upsert({
        where: { id: payId },
        create: {
          id: payId,
          supplier: data.supplier,
          category_id: data.categoryId || data.category_id || null,
          description: data.description || null,
          amount: data.amount ?? 0,
          due_date: new Date(data.dueDate || data.due_date),
          payment_date: data.paymentDate || data.payment_date ? new Date(data.paymentDate || data.payment_date) : null,
          status: data.status || 'pending',
          attachment_url: data.attachmentUrl || data.attachment_url || null,
          notes: data.notes || null,
        },
        update: {
          supplier: data.supplier,
          category_id: data.categoryId || data.category_id || null,
          description: data.description || null,
          amount: data.amount ?? 0,
          due_date: new Date(data.dueDate || data.due_date),
          payment_date: data.paymentDate || data.payment_date ? new Date(data.paymentDate || data.payment_date) : null,
          status: data.status || 'pending',
          attachment_url: data.attachmentUrl || data.attachment_url || null,
          notes: data.notes || null,
        },
      })
      return NextResponse.json({ payable })
    }

    if (_type === 'recurringRule') {
      const rrId = id || crypto.randomUUID()
      const recurringRule = await prisma.financial_recurring_rules.upsert({
        where: { id: rrId },
        create: {
          id: rrId,
          contract_id: data.contractId || data.contract_id,
          frequency: data.frequency,
          amount: data.amount ?? 0,
          next_billing_date: new Date(data.nextBillingDate || data.next_billing_date),
          readjustment_rate: data.readjustmentRate ?? data.readjustment_rate ?? 0,
          status: data.status || 'active',
        },
        update: {
          contract_id: data.contractId || data.contract_id,
          frequency: data.frequency,
          amount: data.amount ?? 0,
          next_billing_date: new Date(data.nextBillingDate || data.next_billing_date),
          readjustment_rate: data.readjustmentRate ?? data.readjustment_rate ?? 0,
          status: data.status || 'active',
        },
      })
      return NextResponse.json({ recurringRule })
    }

    if (_type === 'invoice') {
      const invId = id || crypto.randomUUID()
      const invoice = await prisma.financial_invoices.upsert({
        where: { id: invId },
        create: {
          id: invId,
          receivable_id: data.receivableId || data.receivable_id,
          invoice_number: data.invoiceNumber || data.invoice_number,
          issue_date: new Date(data.issueDate || data.issue_date),
          status: data.status || 'draft',
          file_url: data.fileUrl || data.file_url || null,
        },
        update: {
          receivable_id: data.receivableId || data.receivable_id,
          invoice_number: data.invoiceNumber || data.invoice_number,
          issue_date: new Date(data.issueDate || data.issue_date),
          status: data.status || 'draft',
          file_url: data.fileUrl || data.file_url || null,
        },
      })
      return NextResponse.json({ invoice })
    }

    if (_type === 'transaction') {
      const txId = id || crypto.randomUUID()
      const transaction = await prisma.financial_transactions.upsert({
        where: { id: txId },
        create: {
          id: txId,
          description: data.description,
          amount: data.amount ?? 0,
          type: data.type,
          transaction_date: new Date(data.transactionDate || data.transaction_date),
          payment_method_id: data.paymentMethodId || data.payment_method_id || null,
          receivable_id: data.receivableId || data.receivable_id || null,
          payable_id: data.payableId || data.payable_id || null,
          category_id: data.categoryId || data.category_id || null,
        },
        update: {
          description: data.description,
          amount: data.amount ?? 0,
          type: data.type,
          transaction_date: new Date(data.transactionDate || data.transaction_date),
          payment_method_id: data.paymentMethodId || data.payment_method_id || null,
          receivable_id: data.receivableId || data.receivable_id || null,
          payable_id: data.payableId || data.payable_id || null,
          category_id: data.categoryId || data.category_id || null,
        },
      })
      return NextResponse.json({ transaction })
    }

    return NextResponse.json({ error: 'Invalid _type' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { _type, id, ...data } = body

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    if (_type === 'category') {
      const category = await prisma.financial_categories.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.type && { type: data.type }),
          ...(data.description !== undefined && { description: data.description }),
        },
      })
      return NextResponse.json({ category })
    }

    if (_type === 'paymentMethod') {
      const paymentMethod = await prisma.financial_payment_methods.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.active !== undefined && { active: data.active }),
        },
      })
      return NextResponse.json({ paymentMethod })
    }

    if (_type === 'payable') {
      const payable = await prisma.financial_accounts_payable.update({
        where: { id },
        data: {
          ...(data.supplier && { supplier: data.supplier }),
          ...(data.categoryId && { category_id: data.categoryId }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.amount !== undefined && { amount: data.amount }),
          ...(data.dueDate && { due_date: new Date(data.dueDate) }),
          ...(data.paymentDate !== undefined && { payment_date: data.paymentDate ? new Date(data.paymentDate) : null }),
          ...(data.status && { status: data.status }),
          ...(data.attachmentUrl !== undefined && { attachment_url: data.attachmentUrl }),
          ...(data.notes !== undefined && { notes: data.notes }),
        },
      })
      return NextResponse.json({ payable })
    }

    if (_type === 'recurringRule') {
      const recurringRule = await prisma.financial_recurring_rules.update({
        where: { id },
        data: {
          ...(data.frequency && { frequency: data.frequency }),
          ...(data.amount !== undefined && { amount: data.amount }),
          ...(data.nextBillingDate && { next_billing_date: new Date(data.nextBillingDate) }),
          ...(data.readjustmentRate !== undefined && { readjustment_rate: data.readjustmentRate }),
          ...(data.status && { status: data.status }),
        },
      })
      return NextResponse.json({ recurringRule })
    }

    if (_type === 'invoice') {
      const invoice = await prisma.financial_invoices.update({
        where: { id },
        data: {
          ...(data.receivableId && { receivable_id: data.receivableId }),
          ...(data.invoiceNumber && { invoice_number: data.invoiceNumber }),
          ...(data.issueDate && { issue_date: new Date(data.issueDate) }),
          ...(data.status && { status: data.status }),
          ...(data.fileUrl !== undefined && { file_url: data.fileUrl }),
        },
      })
      return NextResponse.json({ invoice })
    }

    if (_type === 'transaction') {
      const transaction = await prisma.financial_transactions.update({
        where: { id },
        data: {
          ...(data.description && { description: data.description }),
          ...(data.amount !== undefined && { amount: data.amount }),
          ...(data.type && { type: data.type }),
          ...(data.transactionDate && { transaction_date: new Date(data.transactionDate) }),
          ...(data.paymentMethodId !== undefined && { payment_method_id: data.paymentMethodId }),
          ...(data.receivableId !== undefined && { receivable_id: data.receivableId }),
          ...(data.payableId !== undefined && { payable_id: data.payableId }),
          ...(data.categoryId !== undefined && { category_id: data.categoryId }),
        },
      })
      return NextResponse.json({ transaction })
    }

    const receivable = await prisma.financial_accounts_receivable.update({
      where: { id },
      data: {
        ...(data.serviceName && { service_name: data.serviceName }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.dueDate && { due_date: new Date(data.dueDate) }),
        ...(data.paymentDate !== undefined && { payment_date: data.paymentDate ? new Date(data.paymentDate) : null }),
        ...(data.status && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    })
    return NextResponse.json({ receivable })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id, _type } = body

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    if (_type === 'category') {
      await prisma.financial_categories.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'paymentMethod') {
      await prisma.financial_payment_methods.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'receivable') {
      await prisma.financial_accounts_receivable.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'payable') {
      await prisma.financial_accounts_payable.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'recurringRule') {
      await prisma.financial_recurring_rules.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'invoice') {
      await prisma.financial_invoices.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'transaction') {
      await prisma.financial_transactions.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    await prisma.financial_accounts_receivable.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
