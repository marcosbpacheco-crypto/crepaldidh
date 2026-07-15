'use client'

import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRightIcon } from 'lucide-react';

export interface CompanyRow {
  id: string;
  name: string;
  trade_name: string;
  cnpj: string;
  segment: string;
  employees: number;
  city: string;
  state: string;
  website: string;
  instagram: string;
  status: string;
  notes: string;
}

const CompaniesList = () => {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = async () => {
    const { data, error } = await supabase.from('companies').select('*');
    if (error) console.error('Error fetching companies', error);
    else setCompanies(data as CompanyRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  if (loading) return <div className="p-8 text-center">Carregando empresas...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-brand-blue">Empresas</h1>
        <Link href="/crm/companies/new" className="bg-brand-teal text-white px-4 py-2 rounded hover:bg-brand-teal/80 transition">
          Nova Empresa
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((c) => (
          <Link key={c.id} href={`/crm/companies/${c.id}`} className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold text-brand-blue">{c.name}</h2>
            <p className="text-sm text-gray-600">{c.trade_name}</p>
            <p className="mt-2 text-sm text-gray-500">CNPJ: {c.cnpj}</p>
            <p className="text-sm text-gray-500">Segmento: {c.segment}</p>
            <p className="text-sm text-gray-500">{c.city}/{c.state}</p>
            <div className="mt-4 flex items-center text-sm text-gray-400">
              <span className={`px-2 py-1 rounded ${c.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{c.status}</span>
              <ChevronRightIcon className="ml-auto w-5 h-5 text-gray-300" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CompaniesList;
