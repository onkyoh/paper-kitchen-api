import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkConnection() {
    try {
        // Try to make a simple query
        await prisma.$connect()
        console.log('Connected to the database successfully')
    } catch (error) {
        console.error('Failed to connect to the database', error)
    } finally {
        // Optionally, you can disconnect from the database after the check
        await prisma.$disconnect()
    }
}

checkConnection()

export default prisma
