import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

export function createPrismaClient() {
  const missing = ['DATABASE_URL', 'DIRECT_URL'].filter(k => !process.env[k])
  if (missing.length > 0) {
    throw new Error(`Prisma: missing env vars: ${missing.join(', ')}`)
  }

  const poolConfig = { connectionString: process.env.DIRECT_URL!, max: 3 }
  const adapter = new PrismaPg(poolConfig)
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma
  try {
    globalForPrisma.prisma = createPrismaClient()
  } catch (e) {
    console.error('[prisma] failed to initialize:', e)
    throw e
  }
  return globalForPrisma.prisma
}

const _prisma = new Proxy<PrismaClient>({} as PrismaClient, {
  get(_, prop) {
    return getPrisma()[prop as keyof PrismaClient]
  },
})

export const prisma = _prisma