'use server'

import { createClient } from '@supabase/supabase-js'

const STORAGE_BUCKET = 'app-sync'

// Maps collection keys from contexts to actual DB table names
const TABLE_MAP: Record<string, Record<string, string>> = {
  crm: {
    companies: 'crm_companies',
    contacts: 'crm_contacts',
    deals: 'crm_deals',
    activities: 'crm_activities',
    tasks: 'crm_tasks',
    proposals: 'crm_proposals',
    contracts: 'crm_contracts',
  },
}

// camelCase ↔ snake_case field mapping per table
// key = app field name, value = DB column name
const FIELD_MAP: Record<string, Record<string, string>> = {
  crm_companies: {
    tradeName: 'trade_name',
    respPrincipal: 'resp_principal',
    respRH: 'resp_rh',
    respFinanceiro: 'resp_financeiro',
    createdAt: 'created_at',
  },
  crm_contacts: {
    companyId: 'company_id',
    createdAt: 'created_at',
  },
  crm_deals: {
    companyId: 'company_id',
    sellerId: 'seller_id',
    dueDate: 'due_date',
    lostReason: 'lost_reason',
    createdAt: 'created_at',
  },
  crm_proposals: {
    companyId: 'company_id',
    generatedContent: 'generated_content',
    createdAt: 'created_at',
  },
  crm_contracts: {
    companyId: 'company_id',
    proposalId: 'proposal_id',
    startDate: 'start_date',
    endDate: 'end_date',
    autoRenew: 'auto_renew',
    createdAt: 'created_at',
  },
  crm_activities: {
    companyId: 'company_id',
    dealId: 'deal_id',
  },
  crm_tasks: {
    companyId: 'company_id',
    dealId: 'deal_id',
    dueDate: 'due_date',
    createdAt: 'created_at',
  },
}

// Build reverse map (DB column → app field)
function buildReverseMap(table: string): Record<string, string> {
  const fwd = FIELD_MAP[table] || {}
  const rev: Record<string, string> = {}
  for (const [appField, dbCol] of Object.entries(fwd)) {
    rev[dbCol] = appField
  }
  return rev
}

// Convert camelCase to snake_case for any common pattern
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, m => '_' + m.toLowerCase())
}

// Convert an object's fields using the provided map
function mapFields(obj: Record<string, any>, mapping: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    const targetKey = mapping[key] || key
    result[targetKey] = value
  }
  return result
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function saveModuleToSupabase(moduleKey: string, data: Record<string, unknown>): Promise<void> {
  try {
    const supabase = getServiceClient()
    if (!supabase) return

    const tableMap = TABLE_MAP[moduleKey]
    if (!tableMap) {
      await saveToStorage(supabase, moduleKey, data)
      return
    }

    const unknownCollections: Record<string, unknown> = {}

    for (const [key, records] of Object.entries(data)) {
      const table = tableMap[key]
      if (table && Array.isArray(records)) {
        try {
          const mapping = FIELD_MAP[table] || {}
          const dbRecords = records.map(r => mapFields(r as Record<string, any>, mapping))
          const { error } = await supabase.from(table).upsert(dbRecords, { onConflict: 'id', ignoreDuplicates: false })
          if (error) {
            console.error(`syncService DB upsert ${table}: ${error.message}`)
            unknownCollections[key] = records
          }
        } catch (e: any) {
          console.error(`syncService DB upsert ${table}: ${e?.message || e}`)
          unknownCollections[key] = records
        }
      } else {
        unknownCollections[key] = records
      }
    }

    if (Object.keys(unknownCollections).length > 0) {
      try {
        await saveToStorage(supabase, moduleKey, unknownCollections)
      } catch (e: any) {
        console.error(`syncService Storage save ${moduleKey}: ${e?.message || e}`)
      }
    }
  } catch (err: any) {
    console.error(`syncService.saveModule(${moduleKey}) error:`, err?.message)
    throw err
  }
}

export async function loadModuleFromSupabase(moduleKey: string): Promise<Record<string, unknown> | null> {
  try {
    const supabase = getServiceClient()
    if (!supabase) return null

    const tableMap = TABLE_MAP[moduleKey]
    if (!tableMap) {
      return await loadFromStorage(supabase, moduleKey)
    }

    const result: Record<string, unknown> = {}
    const promises = Object.entries(tableMap).map(async ([key, table]) => {
      const { data, error } = await supabase.from(table).select('*')
      if (error) throw new Error(`DB select ${table}: ${error.message}`)
      if (data) {
        const reverseMap = buildReverseMap(table)
        result[key] = data.map(r => mapFields(r as Record<string, any>, reverseMap))
      } else {
        result[key] = []
      }
    })

    await Promise.all(promises)

    const storageData = await loadFromStorage(supabase, moduleKey)
    if (storageData) {
      for (const [key, value] of Object.entries(storageData)) {
        if (!(key in result)) {
          result[key] = value
        }
      }
    }

    return result
  } catch (err: any) {
    console.error(`syncService.loadModule(${moduleKey}) error:`, err?.message)
    throw err
  }
}

async function saveToStorage(supabase: any, moduleKey: string, data: Record<string, unknown>): Promise<void> {
  const json = JSON.stringify(data)
  const fileName = `${moduleKey}-data.json`
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, json, {
    upsert: true,
    contentType: 'application/json',
  })
  if (error) throw new Error(error.message)
}

async function loadFromStorage(supabase: any, moduleKey: string): Promise<Record<string, unknown> | null> {
  const fileName = `${moduleKey}-data.json`
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(fileName)
  if (error) {
    if (error.message === 'Object not found' || error.message.includes('does not exist')) return null
    throw new Error(error.message)
  }
  if (data) {
    const text = await data.text()
    return JSON.parse(text)
  }
  return null
}
