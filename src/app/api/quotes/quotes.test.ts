// Mock Prisma
const mockPrisma = {
  quoteRequest: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
}

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

// Mock auth helper
jest.mock('@/lib/auth-helper', () => ({
  getSession: jest.fn()
}))

import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth-helper'
import { GET, POST } from './route'

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>

describe('Quote API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/quotes', () => {
    test('should require admin authentication', async () => {
      mockGetSession.mockReturnValue(null)

      const request = new NextRequest('http://localhost/api/quotes')
      const response = await GET(request)
      
      expect(response.status).toBe(401)
    })

    test('should return quotes for admin users', async () => {
      mockGetSession.mockReturnValue({
        user: { id: 'admin1', role: 'ADMIN', email: 'admin@test.com', name: 'Admin User' }
      })

      mockPrisma.quoteRequest.findMany.mockResolvedValue([
        { id: 'quote1', customerName: 'Test Customer', status: 'PENDING' }
      ])
      mockPrisma.quoteRequest.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost/api/quotes')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.quotes).toHaveLength(1)
    })
  })

  describe('POST /api/quotes', () => {
    test('should create quote without authentication', async () => {
      const quoteData = {
        customerName: 'Test Customer',
        email: 'test@example.com',
        message: 'Test quote request'
      }

      mockPrisma.quoteRequest.create.mockResolvedValue({
        id: 'quote1',
        ...quoteData,
        status: 'PENDING'
      })

      const request = new NextRequest('http://localhost/api/quotes', {
        method: 'POST',
        body: JSON.stringify(quoteData)
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.customerName).toBe(quoteData.customerName)
    })
  })
})