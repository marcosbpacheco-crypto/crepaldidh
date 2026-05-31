import React, { useEffect } from 'react'
import { useSupabase } from '@/app/(dashboard)/crm/context/SupabaseProvider'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// ---------------------------------------------------
// Company type matching Supabase schema
// ---------------------------------------------------
export type Company = {
  id?: string
  name: string
  trade_name?: string // UI field for "Nome Fantasia"
  cnpj: string
  segment?: string
  employees_count?: number
  city?: string
  state?: string
  website?: string
  instagram?: string
  status?: 'active' | 'inactive'
  notes?: string
}

// ---------------------------------------------------
// Validation schema for the form (uses UI field names)
// ---------------------------------------------------
const schema = z.object({
  name: z.string().min(1, 'Razão Social é obrigatória'),
  trade_name: z.string().optional(),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/[0-9]{4}-[0-9]{2}$/, 'CNPJ deve estar no formato 00.000.000/0000-00'),
  segment: z.string().optional(),
  employees_count: z.coerce.number().int().positive().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  website: z.string().url().optional(),
  instagram: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  notes: z.string().optional()
})

type FormData = z.infer<typeof schema>

interface Props {
  /** If `company` is passed the form works in edit mode. */
  company?: Company
  /** Callback after successful save */
  onSuccess?: () => void
}

export const CompanyForm: React.FC<Props> = ({ company, onSuccess }) => {
  const { supabase } = useSupabase()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({ resolver: zodResolver(schema) as any })

  // Populate fields when editing an existing company
  useEffect(() => {
    if (company) {
      reset({
        name: company.name,
        trade_name: company.trade_name,
        cnpj: company.cnpj,
        segment: company.segment,
        employees_count: company.employees_count,
        city: company.city,
        state: company.state,
        website: company.website,
        instagram: company.instagram,
        status: company.status,
        notes: company.notes
      })
    }
  }, [company, reset])

  const onSubmit = async (data: FormData) => {
    const payload = {
      name: data.name,
      trade_name: data.trade_name,
      cnpj: data.cnpj,
      segment: data.segment,
      employees_count: data.employees_count,
      city: data.city,
      state: data.state,
      website: data.website,
      instagram: data.instagram,
      status: data.status ?? 'active',
      notes: data.notes
    }
    if (company?.id) {
      await supabase.from('companies').update(payload).eq('id', company.id)
    } else {
      await supabase.from('companies').insert(payload)
    }
    if (onSuccess) onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4 p-4 bg-white rounded shadow-lg max-w-xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800">{company ? 'Editar Empresa' : 'Cadastrar Empresa'}</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700">Razão Social *</label>
        <input {...register('name')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-teal focus:ring-brand-teal" />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Nome Fantasia</label>
        <input {...register('trade_name')} className="mt-1 block w-full rounded-md border-gray-300" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">CNPJ *</label>
        <input {...register('cnpj')} className="mt-1 block w-full rounded-md border-gray-300" />
        {errors.cnpj && <p className="mt-1 text-xs text-red-600">{errors.cnpj.message}</p>}
      </div>
      <div className="flex space-x-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Segmento</label>
          <input {...register('segment')} className="mt-1 block w-full rounded-md border-gray-300" />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Colaboradores</label>
          <input type="number" {...register('employees_count')} className="mt-1 block w-full rounded-md border-gray-300" />
        </div>
      </div>
      <div className="flex space-x-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Cidade</label>
          <input {...register('city')} className="mt-1 block w-full rounded-md border-gray-300" />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Estado</label>
          <input {...register('state')} className="mt-1 block w-full rounded-md border-gray-300" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Website</label>
        <input {...register('website')} className="mt-1 block w-full rounded-md border-gray-300" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Instagram</label>
        <input {...register('instagram')} className="mt-1 block w-full rounded-md border-gray-300" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Status</label>
        <select {...register('status')} className="mt-1 block w-full rounded-md border-gray-300">
          <option value="active">Ativa</option>
          <option value="inactive">Inativa</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Observações</label>
        <textarea {...register('notes')} rows={3} className="mt-1 block w-full rounded-md border-gray-300" />
      </div>
      <button type="submit" disabled={isSubmitting} className="w-full bg-brand-teal text-white py-2 px-4 rounded hover:bg-brand-blue transition">
        {isSubmitting ? 'Salvando...' : company ? 'Atualizar' : 'Cadastrar'}
      </button>
    </form>
  )
}
