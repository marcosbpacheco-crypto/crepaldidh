// @ts-nocheck
import { createClient } from '@supabase/supabase-js'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1cm93Y2N5anFib2Jnem1sbGFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NTM0ODcsImV4cCI6MjA5NDAyOTQ4N30.cuoz3845XjI1PG08CZUS2w2NpAQNfxXUsGrLurkfKfU'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1cm93Y2N5anFib2Jnem1sbGFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODQ1MzQ4NywiZXhwIjoyMDk0MDI5NDg3fQ.VWVol0wWwneQI1CF1JARnmGNAwJduuWFH0cdIlRI4OY'

const supabase = createClient('https://durowccyjqbobgzmllak.supabase.co', ANON_KEY)
const service = createClient('https://durowccyjqbobgzmllak.supabase.co', SERVICE_KEY)

let pass = 0, fail = 0
function a(label: string, ok: boolean, detail = '') {
  if (ok) { pass++; console.log(`  \u2705 ${label}`) }
  else { fail++; console.log(`  \u274c ${label}${detail ? ' \u2014 ' + detail : ''}`) }
}

async function main() {
  console.log('========================================')
  console.log('  TESTE COMPLETO - TODOS OS MODULOS')
  console.log('========================================\n')

  const ts = Date.now()
  const ucnpj = `${String(ts).slice(0,2)}.${String(ts).slice(2,5)}.${String(ts).slice(5,8)}/0001-${String(ts).slice(-2)}`
  const testEmail = `teste-${ts}@crepaldidh.com.br`

  // 1. AUTH
  console.log('1. AUTH / CRIAR USUARIO')
  const { data: u, error: ue } = await service.auth.admin.createUser({
    email: testEmail, password: 'Teste@123', email_confirm: true,
    user_metadata: { name: 'Usuario Teste', role_id: 'role-commercial', role_name: 'Comercial' }
  })
  a('Auth user criado', !ue, ue?.message)
  const uid = u!.user.id
  const adminId = '3b7fae3a-7abc-4b0a-9454-dbe14ae3e40f'

  const { data: prof } = await service.from('profiles').select('role_id,role_name,active').eq('id', uid).single()
  a('Profile auto-criado com role_id correto', prof.role_id === 'role-commercial', `got ${prof.role_id}`)
  a('Profile ativo', prof.active === true)

  // 2. CRIAR CLIENTE (client_list)
  console.log('\n2. CRIAR CLIENTE')
  const { data: c, error: ce } = await service.from('client_list').insert({
    company_name: 'Empresa Teste Dashboard', company_trade_name: 'Teste Dashboard',
    cnpj: ucnpj, segment: 'Consultoria RH', city: 'Curitiba', state: 'PR',
    status: 'active', contract_type: 'first',
    services: [{ name: 'Consultoria', status: 'not_started' }],
    monthly_value: 15000, total_value: 180000, internal_responsible: 'Admin', notes: 'Teste dashboard'
  }).select()
  a('Cliente criado', !ce, ce?.message)
  const cid = c![0].id
  a('company_name correto', c![0].company_name === 'Empresa Teste Dashboard')
  a('status active', c![0].status === 'active')

  // 3. CRM COMPANY (simula syncClientToCRM)
  console.log('\n3. CRM COMPANY (cross-sync client -> crm)')
  const { data: cc, error: cce } = await service.from('crm_companies').insert({
    name: 'Empresa Teste Dashboard', trade_name: 'Teste Dashboard',
    cnpj: ucnpj, segment: 'Consultoria RH', city: 'Curitiba', state: 'PR',
    status: 'active', resp_principal: 'Admin', notes: 'Cross-sync from Clients module'
  }).select()
  a('CRM company criada', !cce, cce?.message)
  const ccid = cc![0].id
  a('CRM name no DB', cc![0].name === 'Empresa Teste Dashboard')
  console.log(`  \ud83d\udcca DASHBOARD mostraria: company.name = "${cc![0].name}" (count: 1)`)

  // 4. CONTATOS
  console.log('\n4. CONTATOS')
  const { data: ct1 } = await service.from('client_contacts').insert({
    client_id: cid, name: 'Maria Silva', role: 'Diretora RH',
    phone: '(41)98888-7777', email: 'maria@teste.com', is_primary: true
  }).select()
  a('Contato primario criado', ct1?.length > 0)
  const { data: ct2 } = await service.from('client_contacts').insert({
    client_id: cid, name: 'Joao Pereira', role: 'Gerente', is_primary: false
  }).select()
  a('Segundo contato criado', ct2?.length > 0)

  // 5. INTERACOES
  console.log('\n5. INTERACOES')
  const { error: ie1 } = await service.from('client_interactions').insert({
    client_id: cid, type: 'call', title: 'Ligacao inicial', description: 'Primeiro contato', author: 'Admin'
  })
  const { error: ie2 } = await service.from('client_interactions').insert({
    client_id: cid, type: 'meeting', title: 'Reuniao proposta', description: 'Comercial', author: 'Admin'
  })
  a('Interacoes criadas', !ie1 && !ie2, `${ie1?.message || ''} ${ie2?.message || ''}`)

  // 6. FEEDBACKS
  console.log('\n6. FEEDBACKS')
  const { data: fb } = await service.from('client_feedbacks').insert({
    client_id: cid, score: 9, comment: 'Excelente!'
  }).select()
  a('Feedback criado', fb?.length > 0)
  a('Score 9', fb![0].score === 9)

  // 7. DEALS (stage NOT NULL, sem coluna status)
  console.log('\n7. DEALS')
  const { data: dl } = await service.from('crm_deals').insert([
    { company_id: ccid, title: 'Consultoria RH', service: 'Consultoria', value: 50000, stage: 'proposta_enviada', seller_id: 'Admin' },
    { company_id: ccid, title: 'Treinamento Lideranca', service: 'Treinamento', value: 15000, stage: 'negociacao', seller_id: 'Admin' }
  ]).select()
  a('2 deals criados', dl?.length === 2, `got ${dl?.length}`)
  const did = dl![0].id

  // 8. PROPOSTAS (sem coluna title, service NOT NULL, status: draft|sent|negotiation|approved|rejected)
  console.log('\n8. PROPOSTAS')
  const { data: pp } = await service.from('crm_proposals').insert({
    company_id: ccid, service: 'Consultoria RH', value: 50000, status: 'sent', notes: 'Proposta completa'
  }).select()
  a('Proposta criada', pp?.length > 0, pp ? '' : 'insert returned null')
  const pid = pp![0].id

  // 9. CONTRATOS (status: draft|active|expired|terminated)
  console.log('\n9. CONTRATOS')
  const { data: ctr, error: ctre } = await service.from('crm_contracts').insert({
    company_id: ccid, proposal_id: pid, title: 'Contrato RH', value: 50000,
    status: 'active', start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 365*86400000).toISOString().split('T')[0]
  }).select()
  a('Contrato criado', !ctre, ctre?.message)
  a('Contrato active', ctr![0].status === 'active')

  // 10. ATIVIDADES CRM (sem status, sem due_date, sem assigned_to)
  console.log('\n10. ATIVIDADES')
  const { data: act } = await service.from('crm_activities').insert({
    company_id: ccid, deal_id: did, type: 'call', title: 'Follow-up proposta',
    description: 'Ligar para cliente na sexta', author: 'Admin'
  }).select()
  a('Atividade criada', act?.length > 0)

  // 11. TASKS CRM
  console.log('\n11. TASKS CRM')
  const { data: tk } = await service.from('crm_tasks').insert({
    company_id: ccid, deal_id: did, title: 'Enviar documentacao',
    due_date: new Date().toISOString().split('T')[0], status: 'pending', priority: 'medium'
  }).select()
  a('Task CRM criada', tk?.length > 0)

  // 12. PROJETOS
  console.log('\n12. PROJETOS')
  const { data: pj } = await service.from('projects').insert({
    name: 'Projeto RH Completo', company_id: ccid, description: 'Implementacao de RH',
    status: 'em_andamento', start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 180*86400000).toISOString().split('T')[0],
    created_by: adminId
  }).select()
  a('Projeto criado', pj?.length > 0)
  const pjid = pj![0].id

  // 13. PROJECT TASKS
  console.log('\n13. PROJECT TASKS')
  const { data: pt } = await service.from('project_tasks').insert({
    project_id: pjid, title: 'Diagnostico inicial', description: 'Levantar dados',
    status: 'pending', priority: 'high', assigned_to: adminId,
    due_date: new Date().toISOString().split('T')[0], created_by: adminId
  }).select()
  a('Task do projeto criada', pt?.length > 0)

  // 14. CALENDARIO (event_type: meeting|training|deadline|reminder|appointment|other)
  console.log('\n14. CALENDARIO')
  const { data: ev } = await service.from('calendar_events').insert({
    title: 'Reuniao com Cliente', description: 'Apresentacao inicial',
    event_type: 'meeting',
    start_time: new Date().toISOString(), end_time: new Date(Date.now()+7200000).toISOString(),
    location: 'Presencial', status: 'confirmed', created_by: 'Admin', company_id: ccid
  }).select()
  a('Evento calendario criado', ev?.length > 0)

  // 15. TREINAMENTOS (type: Palestra|Treinamento|Workshop|..., modality: presencial|online|hibrido, status: planejado|agendado|...)
  console.log('\n15. TREINAMENTOS')
  const { data: tr } = await service.from('training_events').insert({
    company_id: ccid, type: 'Treinamento', name: 'Lideranca Corporativa',
    theme: 'Desenvolvimento de Lideres', facilitator: 'Admin',
    modality: 'presencial', location: 'Sala 01',
    event_date: new Date().toISOString().split('T')[0],
    start_time: '08:00', end_time: '18:00', hours_duration: 24,
    expected_participants: 20, status: 'planejado'
  }).select()
  a('Treinamento criado', tr?.length > 0)
  const teid = tr![0].id

  // 16. PARTICIPANTES TREINAMENTO
  console.log('\n16. PARTICIPANTES TREINAMENTO')
  const { data: tp } = await service.from('training_participants').insert({
    event_id: teid, name: 'Carlos Aluno', company_name: 'Empresa Teste',
    email: 'carlos@teste.com', role: 'Gerente'
  }).select()
  a('Participante treinamento criado', tp?.length > 0)

  // 17. CERTIFICADOS (validation_code NOT NULL)
  console.log('\n17. CERTIFICADOS')
  const { data: cert } = await service.from('training_certificates').insert({
    participant_id: tp![0].id, event_id: teid, validation_code: `CERT-${ts}`,
    issued_at: new Date().toISOString()
  }).select()
  a('Certificado criado', cert?.length > 0)

  // 18. DOCUMENTOS
  console.log('\n18. DOCUMENTOS')
  const { data: doc } = await service.from('documents').insert({
    title: 'Contrato Social', type: 'contract', description: 'Documento da empresa',
    company_id: ccid, status: 'active', category: 'juridico',
    tags: ['contrato'], file_url: '/uploads/teste.pdf', file_size: 1024,
    mime_type: 'application/pdf', uploaded_by: 'Admin'
  }).select()
  a('Documento criado', doc?.length > 0)

  // 19. FINANCEIRO (amount NOT NULL - sem coluna value)
  console.log('\n19. FINANCEIRO')
  const { data: rec } = await service.from('financial_accounts_receivable').insert({
    company_id: ccid, service_name: 'Mensalidade RH', amount: 15000,
    due_date: new Date().toISOString().split('T')[0], status: 'pending'
  }).select()
  a('Recebivel criado', rec?.length > 0)

  const { data: pay } = await service.from('financial_accounts_payable').insert({
    supplier: 'Ferramenta RH Ltda', amount: 3000,
    due_date: new Date().toISOString().split('T')[0], status: 'pending',
    description: 'Ferramenta de RH'
  }).select()
  a('Pagavel criado', pay?.length > 0)

  // 20. MENTORIA (company_name NOT NULL, role NOT NULL, email NOT NULL, start_date NOT NULL)
  console.log('\n20. MENTORIA')
  const { data: mp } = await service.from('mentoring_participants').insert({
    name: 'Jose Silva', company_name: 'Empresa Teste',
    role: 'Gerente', email: 'jose@teste.com', start_date: new Date().toISOString().split('T')[0]
  }).select()
  a('Participante mentoria criado', mp?.length > 0)
  const memId = mp![0].id

  // 21. SESSAO MENTORIA (type NOT NULL, title NOT NULL, date NOT NULL, duration NOT NULL)
  console.log('\n21. SESSAO MENTORIA')
  const { data: ms } = await service.from('mentoring_sessions').insert({
    type: 'individual', title: 'Sessao de lideranca',
    date: new Date().toISOString().split('T')[0], duration: 60,
    objective: 'Desenvolver habilidades', status: 'realizada'
  }).select()
  a('Sessao mentoria criada', ms?.length > 0)

  // 22. PDI (title NOT NULL)
  console.log('\n22. PDI')
  const { data: pdi } = await service.from('pdi_plans').insert({
    participant_id: memId, title: 'PDI 2026 - Jose Silva', period: '2026'
  }).select()
  a('PDI criado', pdi?.length > 0)

  // 23. NR-01 (nr01_projects -> nr01_diagnostics FK)
  console.log('\n23. NR-01')
  const { data: nrp } = await service.from('nr01_projects').insert({
    name: 'Projeto NR-01', client_id: cid, type: 'diagnostico',
    status: 'planejamento'
  }).select()
  const nrpId = nrp![0].id
  const { data: nr } = await service.from('nr01_diagnostics').insert({
    project_id: nrpId, title: 'Diagnostico NR-01', status: 'planejamento',
    objective: 'Levantar riscos ocupacionais'
  }).select()
  a('Diagnostico NR-01 criado', nr?.length > 0)

  // 24. VERIFICACAO FINAL
  console.log('\n24. VERIFICACAO FINAL')
  const checks: [string, string, any][] = [
    ['client_list', 'id', cid],
    ['client_contacts', 'client_id', cid],
    ['client_interactions', 'client_id', cid],
    ['client_feedbacks', 'client_id', cid],
    ['crm_companies', 'id', ccid],
    ['crm_deals', 'company_id', ccid],
    ['crm_proposals', 'company_id', ccid],
    ['crm_contracts', 'company_id', ccid],
    ['crm_activities', 'company_id', ccid],
    ['crm_tasks', 'company_id', ccid],
    ['projects', 'id', pjid],
    ['project_tasks', 'project_id', pjid],
    ['calendar_events', 'company_id', ccid],
    ['training_events', 'id', teid],
    ['training_participants', 'event_id', teid],
    ['training_certificates', 'event_id', teid],
    ['documents', 'company_id', ccid],
    ['financial_accounts_receivable', 'company_id', ccid],
    ['financial_accounts_payable', 'id', pay![0].id],
    ['mentoring_participants', 'id', memId],
    ['pdi_plans', 'participant_id', memId],
    ['nr01_diagnostics', 'id', nr![0].id],
  ]
  for (const [table, col, val] of checks) {
    const { data: d } = await service.from(table).select('id').eq(col, val).limit(1)
    a(`${table}: registros encontrados`, d && d.length > 0)
  }

  // 25. DASHBOARD SIMULATION
  console.log('\n25. \ud83d\udcca SIMULACAO DO DASHBOARD')
  const { data: activeCompanies } = await service.from('crm_companies')
    .select('id,name,status').eq('status', 'active')
  a('CRM companies ativas', activeCompanies && activeCompanies.length > 0)
  console.log(`  Empresas ativas no CRM: ${activeCompanies?.length || 0}`)
  activeCompanies?.forEach(co => console.log(`    - ${co.name} (${co.status})`))
  
  const { data: allClients } = await service.from('client_list').select('id,company_name,status')
  console.log(`  Total clientes: ${allClients?.length || 0}`)
  
  const { data: dashboardDeals } = await service.from('crm_deals').select('id,title,value,stage')
  console.log(`  Total deals: ${dashboardDeals?.length || 0}`)

  // 26. LIMPEZA
  console.log('\n26. LIMPEZA')
  const deletes = [
    ['nr01_projects', { id: nrpId }],
    ['nr01_diagnostics', { id: nr![0].id }],
    ['pdi_plans', { participant_id: memId }],
    ['mentoring_sessions', { id: ms![0].id }],
    ['mentoring_participants', { id: memId }],
    ['financial_accounts_payable', { id: pay![0].id }],
    ['financial_accounts_receivable', { company_id: ccid }],
    ['documents', { company_id: ccid }],
    ['training_certificates', { event_id: teid }],
    ['training_participants', { event_id: teid }],
    ['training_events', { id: teid }],
    ['calendar_events', { company_id: ccid }],
    ['project_tasks', { project_id: pjid }],
    ['projects', { id: pjid }],
    ['crm_tasks', { company_id: ccid }],
    ['crm_activities', { company_id: ccid }],
    ['crm_contracts', { company_id: ccid }],
    ['crm_proposals', { company_id: ccid }],
    ['crm_deals', { company_id: ccid }],
    ['client_feedbacks', { client_id: cid }],
    ['client_interactions', { client_id: cid }],
    ['client_contacts', { client_id: cid }],
    ['client_list', { id: cid }],
    ['crm_companies', { id: ccid }],
    ['profiles', { id: uid }],
  ]
  for (const [table, filter] of deletes) {
    const { error: de } = await service.from(table).delete().match(filter)
    if (de) console.log(`  \u26a0 ${table}: ${de.message}`)
  }
  const { error: due } = await service.auth.admin.deleteUser(uid)
  a('Dados de teste removidos', !due, due?.message)

  console.log(`\n========================================`)
  console.log(`  RESULTADO: ${pass} \u2705  |  ${fail} \u274c`)
  if (fail > 0) process.exit(1)
  else console.log(`  TODOS OS TESTES PASSARAM!`)
  console.log(`========================================`)
}

main().catch(err => { console.error('FATAL:', err); process.exit(1) })
