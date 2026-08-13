import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const LIBRARY_CATEGORIES = [
  { id: 'documentos', label: 'Documentos', description: 'Documentos gerais e contratuais' },
  { id: 'dinamicas', label: 'Dinâmicas', description: 'Dinâmicas de grupo e interação' },
  { id: 'modelos', label: 'Modelos e Templates', description: 'Modelos e templates reutilizáveis' },
  { id: 'materiais', label: 'Materiais', description: 'Materiais de apoio' },
  { id: 'formularios', label: 'Formulários', description: 'Formulários de coleta e registros' },
  { id: 'avaliacoes', label: 'Avaliações', description: 'Instrumentos de avaliação' },
  { id: 'relatorios', label: 'Relatórios', description: 'Relatórios e entregáveis' },
  { id: 'outros', label: 'Outros', description: 'Outros recursos da central' },
]

function safeJson(v: unknown) {
  return Array.isArray(v) ? v : []
}

export async function GET() {
  try {
    const [documents, tools, dynamics, usage, links, favorites] = await Promise.all([
      prisma.documents.findMany({
        where: { deleted_at: null },
        include: {
          document_versions: true,
          document_access_logs: true,
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.knowledge_tools.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.knowledge_dynamics.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.knowledge_usage.findMany({ orderBy: { data: 'desc' } }),
      prisma.knowledge_links.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.knowledge_favorites.findMany({ orderBy: { created_at: 'desc' } }),
    ])
    const normalized = documents.map(d => ({
      ...d,
      type: d.type && typeof d.type === 'string' ? d.type.trim().toLowerCase() || 'other' : 'other',
      status: d.status && typeof d.status === 'string' ? d.status.trim().toLowerCase() || 'draft' : 'draft',
      visibility: d.visibility && typeof d.visibility === 'string' ? d.visibility.trim().toLowerCase() || 'internal' : 'internal',
      tags: Array.isArray(d.tags) ? d.tags : [],
    }))
    const normalizedTools = tools.map(t => ({
      ...t,
      tags: safeJson(t.tags),
      services: safeJson(t.services),
      arquivos: safeJson(t.arquivos),
      historico: safeJson(t.historico),
    }))
    const normalizedDynamics = dynamics.map(d => ({
      ...d,
      tags: safeJson(d.tags),
      arquivos: safeJson(d.arquivos),
      historico: safeJson(d.historico),
    }))
    return NextResponse.json({
      documents: normalized,
      tools: normalizedTools,
      dynamics: normalizedDynamics,
      usage,
      links,
      favorites,
      categories: LIBRARY_CATEGORIES,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { _type, id, ...data } = body

    if (_type === 'tool') {
      const toolId = id || crypto.randomUUID()
      const tool = await prisma.knowledge_tools.upsert({
        where: { id: toolId },
        create: {
          id: toolId,
          tenant_id: data.tenantId || data.tenant_id || null,
          name: data.name,
          description: data.description || null,
          finalidade: data.finalidade || null,
          categoria: data.categoria || 'Personalizada',
          tipo: data.tipo || null,
          servico_relacionado: data.servicoRelacionado || data.servico_relacionado || null,
          publico_alvo: data.publicoAlvo || data.publico_alvo || null,
          duracao_estimada: data.duracaoEstimada || data.duracao_estimada || null,
          objetivo: data.objetivo || null,
          preparacao: data.preparacao || null,
          passo_a_passo: data.passoAPasso || data.passo_a_passo || null,
          orientacoes: data.orientacoes || null,
          cuidados: data.cuidados || null,
          resultado_esperado: data.resultadoEsperado || data.resultado_esperado || null,
          materiais: data.materiais || null,
          equipamentos: data.equipamentos || null,
          documentos_complementares: data.documentosComplementares || data.documentos_complementares || null,
          status: data.status || 'rascunho',
          tags: safeJson(data.tags),
          services: safeJson(data.services),
          arquivo_principal_url: data.arquivoPrincipalUrl || data.arquivo_principal_url || null,
          arquivos: safeJson(data.arquivos),
          historico: safeJson(data.historico),
          is_client_visible: data.isClientVisible ?? data.is_client_visible ?? false,
          versao: data.versao ?? 1,
          origem_id: data.origemId || data.origem_id || null,
          criado_por: data.criadoPor || data.criado_por || null,
          atualizado_por: data.atualizadoPor || data.atualizado_por || null,
        },
        update: {
          name: data.name,
          description: data.description || null,
          finalidade: data.finalidade || null,
          categoria: data.categoria || 'Personalizada',
          tipo: data.tipo || null,
          servico_relacionado: data.servicoRelacionado || data.servico_relacionado || null,
          publico_alvo: data.publicoAlvo || data.publico_alvo || null,
          duracao_estimada: data.duracaoEstimada || data.duracao_estimada || null,
          objetivo: data.objetivo || null,
          preparacao: data.preparacao || null,
          passo_a_passo: data.passoAPasso || data.passo_a_passo || null,
          orientacoes: data.orientacoes || null,
          cuidados: data.cuidados || null,
          resultado_esperado: data.resultadoEsperado || data.resultado_esperado || null,
          materiais: data.materiais || null,
          equipamentos: data.equipamentos || null,
          documentos_complementares: data.documentosComplementares || data.documentos_complementares || null,
          status: data.status || 'rascunho',
          tags: safeJson(data.tags),
          services: safeJson(data.services),
          arquivo_principal_url: data.arquivoPrincipalUrl || data.arquivo_principal_url || null,
          arquivos: safeJson(data.arquivos),
          historico: safeJson(data.historico),
          is_client_visible: data.isClientVisible ?? data.is_client_visible ?? false,
          versao: data.versao ?? 1,
          origem_id: data.origemId || data.origem_id || null,
          criado_por: data.criadoPor || data.criado_por || null,
          atualizado_por: data.atualizadoPor || data.atualizado_por || null,
          updated_at: new Date(),
        },
      })
      return NextResponse.json({ tool })
    }

    if (_type === 'dynamic') {
      const dyId = id || crypto.randomUUID()
      const dynamic = await prisma.knowledge_dynamics.upsert({
        where: { id: dyId },
        create: {
          id: dyId,
          tenant_id: data.tenantId || data.tenant_id || null,
          name: data.name,
          objetivo: data.objetivo || null,
          publico: data.publico || null,
          num_participantes: data.numParticipantes || data.num_participantes || null,
          duracao: data.duracao || null,
          dificuldade: data.dificuldade || null,
          contexto: data.contexto || null,
          materiais: data.materiais || null,
          preparacao: data.preparacao || null,
          passo_a_passo: data.passoAPasso || data.passo_a_passo || null,
          perguntas_discussao: data.perguntasDiscussao || data.perguntas_discussao || null,
          resultado_esperado: data.resultadoEsperado || data.resultado_esperado || null,
          observacoes_facilitador: data.observacoesFacilitador || data.observacoes_facilitador || null,
          categoria: data.categoria || 'Outro',
          tags: safeJson(data.tags),
          status: data.status || 'rascunho',
          is_client_visible: data.isClientVisible ?? data.is_client_visible ?? false,
          arquivos: safeJson(data.arquivos),
          historico: safeJson(data.historico),
          versao: data.versao ?? 1,
          origem_id: data.origemId || data.origem_id || null,
          criado_por: data.criadoPor || data.criado_por || null,
          atualizado_por: data.atualizadoPor || data.atualizado_por || null,
        },
        update: {
          name: data.name,
          objetivo: data.objetivo || null,
          publico: data.publico || null,
          num_participantes: data.numParticipantes || data.num_participantes || null,
          duracao: data.duracao || null,
          dificuldade: data.dificuldade || null,
          contexto: data.contexto || null,
          materiais: data.materiais || null,
          preparacao: data.preparacao || null,
          passo_a_passo: data.passoAPasso || data.passo_a_passo || null,
          perguntas_discussao: data.perguntasDiscussao || data.perguntas_discussao || null,
          resultado_esperado: data.resultadoEsperado || data.resultado_esperado || null,
          observacoes_facilitador: data.observacoesFacilitador || data.observacoes_facilitador || null,
          categoria: data.categoria || 'Outro',
          tags: safeJson(data.tags),
          status: data.status || 'rascunho',
          is_client_visible: data.isClientVisible ?? data.is_client_visible ?? false,
          arquivos: safeJson(data.arquivos),
          historico: safeJson(data.historico),
          versao: data.versao ?? 1,
          origem_id: data.origemId || data.origem_id || null,
          criado_por: data.criadoPor || data.criado_por || null,
          atualizado_por: data.atualizadoPor || data.atualizado_por || null,
          updated_at: new Date(),
        },
      })
      return NextResponse.json({ dynamic })
    }

    if (_type === 'usage') {
      const uId = id || crypto.randomUUID()
      const usage = await prisma.knowledge_usage.upsert({
        where: { id: uId },
        create: {
          id: uId,
          tenant_id: data.tenantId || data.tenant_id || null,
          resource_type: data.resourceType || data.resource_type,
          resource_id: data.resourceId || data.resource_id,
          target_type: data.targetType || data.target_type,
          target_id: data.targetId || data.target_id || null,
          target_name: data.targetName || data.target_name,
          client_id: data.clientId || data.client_id || null,
          company_id: data.companyId || data.company_id || null,
          responsavel: data.responsavel || null,
          data: data.data ? new Date(data.data) : new Date(),
          observacao: data.observacao || null,
          resultado: data.resultado || null,
        },
        update: {
          tenant_id: data.tenantId || data.tenant_id || null,
          resource_type: data.resourceType || data.resource_type,
          resource_id: data.resourceId || data.resource_id,
          target_type: data.targetType || data.target_type,
          target_id: data.targetId || data.target_id || null,
          target_name: data.targetName || data.target_name,
          client_id: data.clientId || data.client_id || null,
          company_id: data.companyId || data.company_id || null,
          responsavel: data.responsavel || null,
          data: data.data ? new Date(data.data) : new Date(),
          observacao: data.observacao || null,
          resultado: data.resultado || null,
        },
      })
      return NextResponse.json({ usage })
    }

    if (_type === 'link') {
      const lId = id || crypto.randomUUID()
      const link = await prisma.knowledge_links.upsert({
        where: { id: lId },
        create: {
          id: lId,
          tenant_id: data.tenantId || data.tenant_id || null,
          resource_type: data.resourceType || data.resource_type,
          resource_id: data.resourceId || data.resource_id,
          target_type: data.targetType || data.target_type,
          target_id: data.targetId || data.target_id || null,
          target_name: data.targetName || data.target_name,
        },
        update: {
          tenant_id: data.tenantId || data.tenant_id || null,
          resource_type: data.resourceType || data.resource_type,
          resource_id: data.resourceId || data.resource_id,
          target_type: data.targetType || data.target_type,
          target_id: data.targetId || data.target_id || null,
          target_name: data.targetName || data.target_name,
        },
      })
      return NextResponse.json({ link })
    }

    if (_type === 'favorite') {
      const fId = id || crypto.randomUUID()
      const favorite = await prisma.knowledge_favorites.upsert({
        where: { id: fId },
        create: {
          id: fId,
          user_id: data.userId || data.user_id,
          resource_type: data.resourceType || data.resource_type,
          resource_id: data.resourceId || data.resource_id,
        },
        update: {
          user_id: data.userId || data.user_id,
          resource_type: data.resourceType || data.resource_type,
          resource_id: data.resourceId || data.resource_id,
        },
      })
      return NextResponse.json({ favorite })
    }

    if (_type === 'document' || !_type) {
      const docId = id || crypto.randomUUID()
      const document = await prisma.documents.upsert({
        where: { id: docId },
        create: {
          id: docId,
          title: data.title,
          description: data.description || null,
          type: data.type,
          file_url: data.fileUrl || data.file_url || null,
          file_size: data.fileSize ?? data.file_size ?? null,
          mime_type: data.mimeType || data.mime_type || null,
          company_id: data.companyId || data.company_id || null,
          uploaded_by: data.uploadedBy || data.uploaded_by || null,
          tags: safeJson(data.tags),
          category: data.category || null,
          visibility: data.visibility || 'internal',
          status: data.status || 'draft',
          current_version: data.currentVersion ?? data.current_version ?? 1,
          approval_status: data.approvalStatus || data.approval_status || 'pending',
          signature_code: data.signatureCode || data.signature_code || null,
          signed_at: data.signedAt || data.signed_at ? new Date(data.signedAt || data.signed_at) : null,
          signed_by: data.signedBy || data.signed_by || null,
          valid_until: data.validUntil || data.valid_until ? new Date(data.validUntil || data.valid_until) : null,
          module: data.module || null,
          project_id: data.projectId || data.project_id || null,
          tenant_id: data.tenantId || data.tenant_id || null,
        },
        update: {
          title: data.title,
          description: data.description || null,
          type: data.type,
          file_url: data.fileUrl || data.file_url || null,
          file_size: data.fileSize ?? data.file_size ?? null,
          mime_type: data.mimeType || data.mime_type || null,
          company_id: data.companyId || data.company_id || null,
          uploaded_by: data.uploadedBy || data.uploaded_by || null,
          tags: safeJson(data.tags),
          category: data.category || null,
          visibility: data.visibility || 'internal',
          status: data.status || 'draft',
          current_version: data.currentVersion ?? data.current_version ?? 1,
          approval_status: data.approvalStatus || data.approval_status || 'pending',
          signature_code: data.signatureCode || data.signature_code || null,
          signed_at: data.signedAt || data.signed_at ? new Date(data.signedAt || data.signed_at) : null,
          signed_by: data.signedBy || data.signed_by || null,
          valid_until: data.validUntil || data.valid_until ? new Date(data.validUntil || data.valid_until) : null,
          module: data.module || null,
          project_id: data.projectId || data.project_id || null,
          tenant_id: data.tenantId || data.tenant_id || null,
        },
      })
      return NextResponse.json({ document })
    }

    if (_type === 'version') {
      const vId = id || crypto.randomUUID()
      const version = await prisma.document_versions.upsert({
        where: { id: vId },
        create: {
          id: vId,
          document_id: data.documentId || data.document_id,
          version_number: data.versionNumber ?? data.version_number ?? 1,
          file_url: data.fileUrl || data.file_url,
          file_size: data.fileSize ?? data.file_size ?? null,
          uploaded_by: data.uploadedBy || data.uploaded_by || null,
          change_notes: data.changeNotes || data.change_notes || null,
        },
        update: {
          document_id: data.documentId || data.document_id,
          version_number: data.versionNumber ?? data.version_number ?? 1,
          file_url: data.fileUrl || data.file_url,
          file_size: data.fileSize ?? data.file_size ?? null,
          uploaded_by: data.uploadedBy || data.uploaded_by || null,
          change_notes: data.changeNotes || data.change_notes || null,
        },
      })
      return NextResponse.json({ version })
    }

    if (_type === 'accessLog') {
      const alId = id || crypto.randomUUID()
      const accessLog = await prisma.document_access_logs.upsert({
        where: { id: alId },
        create: {
          id: alId,
          document_id: data.documentId || data.document_id,
          user_id: data.userId || data.user_id || null,
          user_name: data.userName || data.user_name || null,
          action: data.action,
        },
        update: {
          document_id: data.documentId || data.document_id,
          user_id: data.userId || data.user_id || null,
          user_name: data.userName || data.user_name || null,
          action: data.action,
        },
      })
      return NextResponse.json({ accessLog })
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

    if (_type === 'tool') {
      const tool = await prisma.knowledge_tools.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.finalidade !== undefined && { finalidade: data.finalidade }),
          ...(data.categoria !== undefined && { categoria: data.categoria }),
          ...(data.tipo !== undefined && { tipo: data.tipo }),
          ...(data.servicoRelacionado !== undefined && { servico_relacionado: data.servicoRelacionado }),
          ...(data.servico_relacionado !== undefined && { servico_relacionado: data.servico_relacionado }),
          ...(data.publicoAlvo !== undefined && { publico_alvo: data.publicoAlvo }),
          ...(data.publico_alvo !== undefined && { publico_alvo: data.publico_alvo }),
          ...(data.duracaoEstimada !== undefined && { duracao_estimada: data.duracaoEstimada }),
          ...(data.duracao_estimada !== undefined && { duracao_estimada: data.duracao_estimada }),
          ...(data.objetivo !== undefined && { objetivo: data.objetivo }),
          ...(data.preparacao !== undefined && { preparacao: data.preparacao }),
          ...(data.passoAPasso !== undefined && { passo_a_passo: data.passoAPasso }),
          ...(data.passo_a_passo !== undefined && { passo_a_passo: data.passo_a_passo }),
          ...(data.orientacoes !== undefined && { orientacoes: data.orientacoes }),
          ...(data.cuidados !== undefined && { cuidados: data.cuidados }),
          ...(data.resultadoEsperado !== undefined && { resultado_esperado: data.resultadoEsperado }),
          ...(data.resultado_esperado !== undefined && { resultado_esperado: data.resultado_esperado }),
          ...(data.materiais !== undefined && { materiais: data.materiais }),
          ...(data.equipamentos !== undefined && { equipamentos: data.equipamentos }),
          ...(data.documentosComplementares !== undefined && { documentos_complementares: data.documentosComplementares }),
          ...(data.documentos_complementares !== undefined && { documentos_complementares: data.documentos_complementares }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.tags !== undefined && { tags: data.tags }),
          ...(data.services !== undefined && { services: data.services }),
          ...(data.arquivoPrincipalUrl !== undefined && { arquivo_principal_url: data.arquivoPrincipalUrl }),
          ...(data.arquivo_principal_url !== undefined && { arquivo_principal_url: data.arquivo_principal_url }),
          ...(data.arquivos !== undefined && { arquivos: data.arquivos }),
          ...(data.historico !== undefined && { historico: data.historico }),
          ...(data.isClientVisible !== undefined && { is_client_visible: data.isClientVisible }),
          ...(data.is_client_visible !== undefined && { is_client_visible: data.is_client_visible }),
          ...(data.versao !== undefined && { versao: data.versao }),
          ...(data.origemId !== undefined && { origem_id: data.origemId }),
          ...(data.criadoPor !== undefined && { criado_por: data.criadoPor }),
          ...(data.atualizadoPor !== undefined && { atualizado_por: data.atualizadoPor }),
          updated_at: new Date(),
        },
      })
      return NextResponse.json({ tool })
    }

    if (_type === 'dynamic') {
      const dynamic = await prisma.knowledge_dynamics.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.objetivo !== undefined && { objetivo: data.objetivo }),
          ...(data.publico !== undefined && { publico: data.publico }),
          ...(data.numParticipantes !== undefined && { num_participantes: data.numParticipantes }),
          ...(data.num_participantes !== undefined && { num_participantes: data.num_participantes }),
          ...(data.duracao !== undefined && { duracao: data.duracao }),
          ...(data.dificuldade !== undefined && { dificuldade: data.dificuldade }),
          ...(data.contexto !== undefined && { contexto: data.contexto }),
          ...(data.materiais !== undefined && { materiais: data.materiais }),
          ...(data.preparacao !== undefined && { preparacao: data.preparacao }),
          ...(data.passoAPasso !== undefined && { passo_a_passo: data.passoAPasso }),
          ...(data.passo_a_passo !== undefined && { passo_a_passo: data.passo_a_passo }),
          ...(data.perguntasDiscussao !== undefined && { perguntas_discussao: data.perguntasDiscussao }),
          ...(data.perguntas_discussao !== undefined && { perguntas_discussao: data.perguntas_discussao }),
          ...(data.resultadoEsperado !== undefined && { resultado_esperado: data.resultadoEsperado }),
          ...(data.resultado_esperado !== undefined && { resultado_esperado: data.resultado_esperado }),
          ...(data.observacoesFacilitador !== undefined && { observacoes_facilitador: data.observacoesFacilitador }),
          ...(data.observacoes_facilitador !== undefined && { observacoes_facilitador: data.observacoes_facilitador }),
          ...(data.categoria !== undefined && { categoria: data.categoria }),
          ...(data.tags !== undefined && { tags: data.tags }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.isClientVisible !== undefined && { is_client_visible: data.isClientVisible }),
          ...(data.is_client_visible !== undefined && { is_client_visible: data.is_client_visible }),
          ...(data.arquivos !== undefined && { arquivos: data.arquivos }),
          ...(data.historico !== undefined && { historico: data.historico }),
          ...(data.versao !== undefined && { versao: data.versao }),
          ...(data.origemId !== undefined && { origem_id: data.origemId }),
          ...(data.criadoPor !== undefined && { criado_por: data.criadoPor }),
          ...(data.atualizadoPor !== undefined && { atualizado_por: data.atualizadoPor }),
          updated_at: new Date(),
        },
      })
      return NextResponse.json({ dynamic })
    }

    if (_type === 'usage') {
      const usage = await prisma.knowledge_usage.update({
        where: { id },
        data: {
          ...(data.resourceType !== undefined && { resource_type: data.resourceType }),
          ...(data.resource_type !== undefined && { resource_type: data.resource_type }),
          ...(data.resourceId !== undefined && { resource_id: data.resourceId }),
          ...(data.resource_id !== undefined && { resource_id: data.resource_id }),
          ...(data.targetType !== undefined && { target_type: data.targetType }),
          ...(data.target_type !== undefined && { target_type: data.target_type }),
          ...(data.targetId !== undefined && { target_id: data.targetId }),
          ...(data.target_id !== undefined && { target_id: data.target_id }),
          ...(data.targetName !== undefined && { target_name: data.targetName }),
          ...(data.target_name !== undefined && { target_name: data.target_name }),
          ...(data.clientId !== undefined && { client_id: data.clientId }),
          ...(data.client_id !== undefined && { client_id: data.client_id }),
          ...(data.companyId !== undefined && { company_id: data.companyId }),
          ...(data.company_id !== undefined && { company_id: data.company_id }),
          ...(data.responsavel !== undefined && { responsavel: data.responsavel }),
          ...(data.data !== undefined && { data: new Date(data.data) }),
          ...(data.observacao !== undefined && { observacao: data.observacao }),
          ...(data.resultado !== undefined && { resultado: data.resultado }),
        },
      })
      return NextResponse.json({ usage })
    }

    if (_type === 'restore') {
      const document = await prisma.documents.update({
        where: { id },
        data: { deleted_at: null, status: 'active' },
      })
      return NextResponse.json({ document })
    }

    const document = await prisma.documents.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type && { type: data.type }),
        ...(data.fileUrl !== undefined && { file_url: data.fileUrl }),
        ...(data.file_url !== undefined && { file_url: data.file_url }),
        ...(data.fileSize !== undefined && { file_size: data.fileSize }),
        ...(data.mimeType !== undefined && { mime_type: data.mimeType }),
        ...(data.mime_type !== undefined && { mime_type: data.mime_type }),
        ...(data.companyId && { company_id: data.companyId }),
        ...(data.tags && { tags: data.tags }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.visibility && { visibility: data.visibility }),
        ...(data.status && { status: data.status }),
        ...(data.currentVersion !== undefined && { current_version: data.currentVersion }),
        ...(data.approvalStatus && { approval_status: data.approvalStatus }),
        ...(data.signatureCode !== undefined && { signature_code: data.signatureCode }),
        ...(data.signedAt && { signed_at: new Date(data.signedAt) }),
        ...(data.signed_by && { signed_by: data.signed_by }),
        ...(data.validUntil && { valid_until: new Date(data.validUntil) }),
        ...(data.module !== undefined && { module: data.module }),
        ...(data.projectId && { project_id: data.projectId }),
      },
    })
    return NextResponse.json({ document })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id, _type } = body

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    if (_type === 'tool') {
      await prisma.knowledge_tools.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'dynamic') {
      await prisma.knowledge_dynamics.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'usage') {
      await prisma.knowledge_usage.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'link') {
      await prisma.knowledge_links.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'favorite') {
      await prisma.knowledge_favorites.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'version') {
      await prisma.document_versions.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'accessLog') {
      await prisma.document_access_logs.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    await prisma.documents.update({
      where: { id },
      data: { deleted_at: new Date(), status: 'archived' },
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}