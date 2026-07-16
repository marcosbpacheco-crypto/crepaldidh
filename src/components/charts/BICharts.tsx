'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { Download } from 'lucide-react'

const fmt = (v: number) => {
  if (v === 0) return 'R$ 0'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function ChartCard({ title, subtitle, children, onExport }: { title: string; subtitle?: string; children: React.ReactNode; onExport?: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-xs sm:text-sm font-black text-slate-800 truncate">{title}</h3>
          {subtitle && <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="h-48 sm:h-56">
        {children}
      </div>
    </div>
  )
}

function PieChartCard({ data, title, subtitle }: { data: { name: string; value: number; color: string }[]; title: string; subtitle?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-xs sm:text-sm font-black text-slate-800 truncate">{title}</h3>
          {subtitle && <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="h-48 sm:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip formatter={(v: unknown) => fmt(Number(v ?? 0))} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function BIBarChart({ data, title, subtitle }: { data: { month: string; value: number }[]; title: string; subtitle?: string }) {
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#8b5cf6" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function BIAreaChart({ data, title, subtitle }: { data: { month: string; value: number }[]; title: string; subtitle?: string }) {
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
          <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function BIBarChartVertical({ data, title, subtitle }: { data: { name: string; value: number }[]; title: string; subtitle?: string }) {
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="#8b5cf6" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function BIPieChart({ data, title, subtitle }: { data: { name: string; value: number; color: string }[]; title: string; subtitle?: string }) {
  return <PieChartCard data={data} title={title} subtitle={subtitle} />
}