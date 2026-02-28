import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined')
}

const adapter = new PrismaPg({
  connectionString,
})

export const prisma = new PrismaClient({
  adapter,
})
export async function connectDB() {
  try {
    await prisma.$connect()
    console.log('Auth database connected successfully')
  } catch (error) {
    console.error('Failed to connect to database:', error)
    process.exit(1)
  }
}