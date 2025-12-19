import { PrismaClient } from '@prisma/client'

export async function GET() {
  const prisma = new PrismaClient()
  await prisma.$queryRaw`SELECT 1`
  return Response.json({ ok: true })
}