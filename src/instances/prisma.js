const { PrismaClient } = require('@prisma/client')
const instance = new PrismaClient()

module.exports = instance;