'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { automationService, type AutomationRule, type AutomationRun } from '@/services/automationService'
import {
  Zap, Plus, Edit2, Trash2, Play, Check, X, Clock, AlertCircle,
  Loader2, RefreshCw, History, ChevronRight, ToggleLeft, ToggleRight,
  Activity, FileText, Bell, Mail, Tag, Eye
} from 'lucide-react'

const EVENT_LABELS: Record<string, string> = {
  opportunity_inactive: 'Oportunidade sem interação',
  task_overdue: 'Tarefa vencida',
  proposal_expiring: 'Proposta próxima do vencimento',
}

const EVENT_DESCRIPTIONS: Record<string, string> = {
  opportunity_inactive: 'Quando uma oportunidade ficar N dias sem interação',
  task_overdue: 'Quando uma tarefa estiver com data vencida',
  proposal_expiring: 'Quando uma proposta estiver há N dias no mesmo status',
}

const ACTION_LABELS: Record<string, string> = {
  create_task: 'Criar tarefa',
  create_alert: 'Criar alerta',
  log_activity: 'Registrar atividade',
  update_status: 'Alterar status',
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  create_task: <FileText className="w-3.5 h-3.5" />,
  create_alert: <Bell className="w-3.5 h-3.5" />,
  log_activity: <Activity className="w-3.5 h-3.5" />,
  update_status: <Tag className="w-3.5 h-3.5" />,
}

export default function AutomationsPage() {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [runs, setRuns] = useState<AutomationRun[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<{ name: string; description: string; event: string; conditions: { field: string; operator: string; value: string }[]; actions: { action_type: string; action_config: Record<string, string> }[] }>({ name: '', description: '', event: 'opportunity_inactive', conditions: [{ field: 'days_without_contact', operator: 'greater_than', value: '7' }], actions: [{ action_type: 'create_task', action_config: { title_template: 'Follow-up: {label}', priority: 'medium', due_days: '2' } }] })
  const [formError, setFormError] = useState('')
  const [checking, setChecking] = useState<string | false>(false)
  const [checkResult, setCheckResult] = useState<{ ruleId?: string; status: string; result?: string; error?: string } | null>(null)
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [r, rn] = await Promise.all([automationService.listRules(), automationService.getRuns()])
      setRules(r)
      setRuns(rn)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('Nome é obrigatório'); return }
    setFormError('')
    try {
      if (editingId) {
        await automationService.updateRule(editingId, form)
      } else {
        await automationService.createRule(form)
      }
      setShowForm(false)
      setEditingId(null)
      setForm({ name: '', description: '', event: 'opportunity_inactive', conditions: [{ field: 'days_without_contact', operator: 'greater_than', value: '7' }], actions: [{ action_type: 'create_task', action_config: { title_template: 'Follow-up: {label}', priority: 'medium', due_days: '2' } }] })
      load()
    } catch (err: any) {
      setFormError(err.message)
    }
  }

  const handleEdit = (rule: AutomationRule) => {
    setEditingId(rule.id)
    setForm({ name: rule.name, description: rule.description || '', event: rule.event, conditions: rule.conditions.map(c => ({ field: c.field, operator: c.operator, value: c.value })), actions: rule.actions.map(a => ({ action_type: a.action_type, action_config: a.action_config })) })
    setShowForm(true)
  }

  const handleToggle = async (id: string, active: boolean) => {
    await automationService.toggleRule(id, active)
    load()
  }

  const handleCheck = async (ruleId?: string) => {
    setChecking(ruleId || 'all')
    setCheckResult(null)
    try {
      const result = await automationService.checkRules(ruleId)
      setCheckResult(ruleId ? { ...result, ruleId } : result)
      load()
    } catch (err: any) {
      setCheckResult({ status: 'failure', error: err.message })
    } finally {
      setChecking(false)
    }
  }

  const handleDelete = async (id: string) => {
    await automationService.deleteRule(id)
    setDeletingId(null)
    load()
  }

  const openNew = () => {
    setEditingId(null)
    setForm({ name: '', description: '', event: 'opportunity_inactive', conditions: [{ field: 'days_without_contact', operator: 'greater_than', value: '7' }], actions: [{ action_type: 'create_task', action_config: { title_template: 'Follow-up: {label}', priority: 'medium', due_days: '2' } }] })
    setShowForm(true)
  }

  const selectedRuns = selectedRuleId ? runs.filter(r => r.rule_id === selectedRuleId) : runs

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-brand-teal" />
          <h2 className="text-lg font-black text-slate-800">Automações</h2>
          <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-500">MOTOR QUANDO/SE/ENTÃO</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleCheck()} disabled={checking === 'all'} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-teal text-white text-[10px] font-bold rounded-xl hover:bg-brand-teal/90 transition-all disabled:opacity-50">
            {checking === 'all' ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Verificando...</> : <><Play className="w-3.5 h-3.5" /> Executar Todas</>}
          </button>
          <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue text-white text-[10px] font-bold rounded-xl hover:bg-brand-blue/90 transition-all">
            <Plus className="w-3.5 h-3.5" /> Nova Regra
          </button>
        </div>
      </div>

      {checkResult && (
        <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${checkResult.status === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div><span className="font-bold">{checkResult.status === 'success' ? 'Execução concluída' : 'Erro na execução'}</span><p className="text-[11px] mt-0.5">{checkResult.result || checkResult.error}</p></div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-brand-teal" /></div>
      ) : rules.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-12 text-center">
          <Zap className="w-12 h-12 text-slate-200 mx-auto mb-2" />
          <p className="text-xs text-slate-400 mb-3">Nenhuma regra de automação criada.</p>
          <button onClick={openNew} className="px-4 py-2 bg-brand-teal text-white text-xs font-bold rounded-xl hover:bg-brand-teal/90 transition-all">Criar Primeira Regra</button>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${rule.active ? 'bg-brand-teal/10 text-brand-teal' : 'bg-slate-100 text-slate-400'}`}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-800">{rule.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{rule.description || EVENT_DESCRIPTIONS[rule.event] || rule.event}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] font-semibold text-slate-500">{EVENT_LABELS[rule.event] || rule.event}</span>
                      {rule.actions.map((a, i) => (
                        <span key={i} className="px-2 py-0.5 bg-brand-blue/5 border border-brand-blue/10 rounded text-[9px] font-semibold text-brand-blue flex items-center gap-1">
                          {ACTION_ICONS[a.action_type]}{ACTION_LABELS[a.action_type] || a.action_type}
                        </span>
                      ))}
                      {rule.last_run_at && <span className="text-[9px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(rule.last_run_at).toLocaleString('pt-BR')}</span>}
                      <span className="text-[9px] text-slate-400">{rule._count?.runs || 0} execução(ões)</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleCheck(rule.id)} disabled={checking === rule.id} className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600" title="Testar regra">
                    {checking === rule.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => setSelectedRuleId(selectedRuleId === rule.id ? null : rule.id)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600" title="Histórico">
                    <History className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleEdit(rule)} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600" title="Editar"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleToggle(rule.id, !rule.active)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400" title={rule.active ? 'Desativar' : 'Ativar'}>
                    {rule.active ? <ToggleRight className="w-3.5 h-3.5 text-emerald-600" /> : <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                  <button onClick={() => setDeletingId(rule.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" title="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              {selectedRuleId === rule.id && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Últimas Execuções</h5>
                  {runs.filter(r => r.rule_id === rule.id).length === 0 ? (
                    <p className="text-[10px] text-slate-400">Nenhuma execução registrada.</p>
                  ) : (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {runs.filter(r => r.rule_id === rule.id).slice(0, 10).map(run => (
                        <div key={run.id} className="flex items-center gap-2 text-[10px] bg-slate-50 p-2 rounded-lg">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${run.status === 'success' ? 'bg-emerald-500' : run.status === 'skipped' ? 'bg-amber-400' : 'bg-red-500'}`} />
                          <span className="text-slate-500">{new Date(run.executed_at).toLocaleString('pt-BR')}</span>
                          <span className="font-semibold text-slate-600">{run.status}</span>
                          {run.result && <span className="text-slate-400 truncate">{run.result}</span>}
                          {run.error && <span className="text-red-500 truncate">{run.error}</span>}
                          {run.entity_id && <span className="text-[9px] text-slate-400">ID: {run.entity_id.slice(0, 8)}...</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Rule Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={() => { setShowForm(false); setEditingId(null) }}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-brand-teal" />{editingId ? 'Editar Regra' : 'Nova Regra de Automação'}</h3>

            <div className="space-y-4">
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Nome *</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" /></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Descrição</label><textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20 resize-none" /></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Evento (QUANDO)</label>
                <select value={form.event} onChange={e => setForm(p => ({ ...p, event: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20">
                  <option value="opportunity_inactive">Oportunidade sem interação</option>
                  <option value="task_overdue">Tarefa vencida</option>
                  <option value="proposal_expiring">Proposta próxima do vencimento</option>
                </select></div>

              {/* Conditions */}
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-2">Condições (SE)</label>
                {form.conditions.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <select value={c.field} onChange={e => { const nc = [...form.conditions]; nc[i] = { ...nc[i], field: e.target.value }; setForm(p => ({ ...p, conditions: nc })) }} className="flex-1 text-[11px] border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-teal/20">
                      <option value="days_without_contact">Dias sem contato</option>
                      <option value="days_in_status">Dias no status</option>
                      <option value="due_date_passed">Data vencida</option>
                    </select>
                    <span className="text-[10px] text-slate-500">≥</span>
                    <input value={c.value} onChange={e => { const nc = [...form.conditions]; nc[i] = { ...nc[i], value: e.target.value }; setForm(p => ({ ...p, conditions: nc })) }} className="w-16 text-[11px] border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-teal/20 text-center" />
                    <span className="text-[10px] text-slate-500">dias</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-2">Ações (ENTÃO)</label>
                {form.actions.map((a, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-3 mb-2">
                    <select value={a.action_type} onChange={e => { const na = [...form.actions]; na[i] = { ...na[i], action_type: e.target.value }; setForm(p => ({ ...p, actions: na })) }} className="w-full text-[11px] border border-slate-200 rounded-lg px-2 py-1.5 mb-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20">
                      <option value="create_task">Criar tarefa</option>
                      <option value="log_activity">Registrar atividade</option>
                      <option value="update_status">Alterar status</option>
                    </select>
                    {a.action_type === 'create_task' && (
                      <div className="space-y-2">
                        <input value={a.action_config.title_template || ''} onChange={e => { const na = [...form.actions]; na[i] = { ...na[i], action_config: { ...na[i].action_config, title_template: e.target.value } }; setForm(p => ({ ...p, actions: na })) }} placeholder="Título (use {label})" className="w-full text-[11px] border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
                        <div className="flex gap-2">
                          <select value={a.action_config.priority || 'medium'} onChange={e => { const na = [...form.actions]; na[i] = { ...na[i], action_config: { ...na[i].action_config, priority: e.target.value } }; setForm(p => ({ ...p, actions: na })) }} className="flex-1 text-[11px] border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-teal/20">
                            <option value="high">Alta prioridade</option>
                            <option value="medium">Média prioridade</option>
                            <option value="low">Baixa prioridade</option>
                          </select>
                          <div className="flex items-center gap-1"><input value={a.action_config.due_days || '2'} onChange={e => { const na = [...form.actions]; na[i] = { ...na[i], action_config: { ...na[i].action_config, due_days: e.target.value } }; setForm(p => ({ ...p, actions: na })) }} className="w-10 text-[11px] border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-teal/20 text-center" /><span className="text-[10px] text-slate-500">dias</span></div>
                        </div>
                      </div>
                    )}
                    {a.action_type === 'log_activity' && (
                      <input value={a.action_config.title_template || ''} onChange={e => { const na = [...form.actions]; na[i] = { ...na[i], action_config: { ...na[i].action_config, title_template: e.target.value } }; setForm(p => ({ ...p, actions: na })) }} placeholder="Título (use {label})" className="w-full text-[11px] border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
                    )}
                    {a.action_type === 'update_status' && (
                      <select value={a.action_config.status || 'Negociação'} onChange={e => { const na = [...form.actions]; na[i] = { ...na[i], action_config: { ...na[i].action_config, status: e.target.value } }; setForm(p => ({ ...p, actions: na })) }} className="w-full text-[11px] border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-teal/20">
                        <option value="Negociação">Negociação</option>
                        <option value="Contrato aprovado">Contrato aprovado</option>
                      </select>
                    )}
                  </div>
                ))}
              </div>

              {formError && <p className="text-[11px] text-red-500">{formError}</p>}
            </div>

            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
              <button onClick={handleSave} className="flex-1 px-3 py-2 bg-brand-teal text-white text-[11px] font-bold rounded-xl hover:bg-brand-teal/90 transition-all">{editingId ? 'Salvar' : 'Criar Regra'}</button>
              <button onClick={() => { setShowForm(false); setEditingId(null) }} className="px-3 py-2 border border-slate-200 text-[11px] font-semibold rounded-xl hover:bg-slate-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={() => setDeletingId(null)}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-500" /></div>
              <div><h3 className="text-sm font-black text-slate-800">Excluir Regra</h3><p className="text-[10px] text-slate-500">Esta ação não pode ser desfeita.</p></div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleDelete(deletingId)} className="flex-1 px-3 py-2 bg-red-600 text-white text-[11px] font-bold rounded-xl hover:bg-red-700">Confirmar Exclusão</button>
              <button onClick={() => setDeletingId(null)} className="px-3 py-2 border border-slate-200 text-[11px] font-semibold rounded-xl hover:bg-slate-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
