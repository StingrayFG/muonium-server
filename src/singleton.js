const { PrismaClient } = require('@prisma/client')
const { mockDeep, mockReset, DeepMockProxy } = require('jest-mock-extended')

const prisma = require('./instances/prisma.js')
const prismaMock = prisma

jest.mock('./instances/prisma.js', () => mockDeep())

beforeEach(() => {
  mockReset(prismaMock)
})

module.exports = prismaMock
