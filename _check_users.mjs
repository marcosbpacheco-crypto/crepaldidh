import { prisma } from './src/lib/prisma.ts'

const users = await prisma.admin_users.findMany({ orderBy: { created_at: 'desc' } })
console.log(JSON.stringify(users, null, 2))
await prisma.$disconnect()
