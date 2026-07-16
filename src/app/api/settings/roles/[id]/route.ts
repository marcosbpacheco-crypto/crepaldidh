import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ACTIONS = ['canView', 'canCreate', 'canEdit', 'canDelete', 'canExport'] as const

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roleId } = await params
    if (!roleId) {
      return NextResponse.json({ error: 'ID do perfil é obrigatório' }, { status: 400 })
    }

    const body = await request.json()
    const { name, description, permissions } = body

    const existingRole = await prisma.admin_roles.findUnique({
      where: { id: roleId },
    })
    if (!existingRole) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    if (existingRole.name === 'admin') {
      const adminUsers = await prisma.admin_users.count({
        where: { role_id: roleId, active: true },
      })
      if (adminUsers <= 1 && name && name !== 'admin') {
        return NextResponse.json({ error: 'Não é permitido alterar o perfil do último Super Administrador' }, { status: 403 })
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      if (name || description !== undefined) {
        await tx.admin_roles.update({
          where: { id: roleId },
          data: {
            ...(name && { name, label: name }),
            ...(description !== undefined && { description }),
          },
        })
      }

      if (Array.isArray(permissions)) {
        for (const perm of permissions) {
          const { id, module, ...fields } = perm
          const updateData: any = {}
          for (const action of ACTIONS) {
            if (fields[action] !== undefined) {
              updateData[action] = fields[action]
            }
          }
          if (Object.keys(updateData).length > 0 && id) {
            await tx.admin_permissions.update({
              where: { id },
              data: updateData,
            })
          }
        }
      }

      await tx.admin_audit_logs.create({
        data: {
          user_id: body.auditUserId || null,
          user_name: body.auditUserName || 'Sistema',
          user_role: body.auditUserRole || 'admin',
          action: 'update',
          entity: 'role_permissions',
          entity_id: roleId,
          description: `Atualizou permissões do perfil: ${name || existingRole.name}`,
          ip_address: '127.0.0.1',
        },
      })

      const updatedRole = await tx.admin_roles.findUnique({
        where: { id: roleId },
      })
      const updatedPerms = await tx.admin_permissions.findMany({
        where: { role_id: roleId },
      })

      return { role: updatedRole, permissions: updatedPerms }
    })

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
