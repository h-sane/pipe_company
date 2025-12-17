/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

// Mock the dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {}
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    quoteRequest: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    },
    product: {
      findMany: jest.fn()
    },
    $transaction: jest.fn()
  }
}))

jest.mock('@/lib/email-utils', () => ({
  sendQuoteNotificationToAdmin: jest.fn().mockResolvedValue(true),
  sendQuoteConfirmationToCustomer: jest.fn().mockResolvedValue(true)
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { GET, POST } from './route'
import { GET as GET_QUOTE, PUT as PUT_QUOTE } from './[id]/route'

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

describe('Quote API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/quotes', () => {
    test('should create quote request with valid data', async () => {
      const validQuoteData = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '555-1234',
        company: 'Test Company',
        message: 'Need pricing for pipes',
        products: [
          { productId: 'prod1', quantity: 10, notes: 'Urgent' }
        ]
      }

      // Mock product existence check
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([
        { id: 'prod1', name: 'Test Pipe' }
      ])

      // Mock duplicate check
      ;(prisma.quoteRequest.findFirst as jest.Mock).mockResolvedValue(null)

      // Mock quote creation
      const mockQuote = {
        id: 'quote1',
        ...validQuoteData,
        status: 'PENDING',
        submittedAt: new Date(),
        products: [{
          product: { id: 'prod1', name: 'Test Pipe', brand: 'TestBrand' },
          quantity: 10,
          notes: 'Urgent'
        }]
      }

      ;(prisma.$transaction as jest.Mock).mockResolvedValue(mockQuote)

      const request = new NextRequest('http://localhost/api/quotes', {
        method: 'POST',
        body: JSON.stringify(validQuoteData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('quote1')
      expect(data.customerName).toBe('John Doe')
    })

    test('should reject invalid quote data', async () => {
      const invalidQuoteData = {
        customerName: '',
        customerEmail: 'invalid-email',
        products: []
      }

      const request = new NextRequest('http://localhost/api/quotes', {
        method: 'POST',
        body: JSON.stringify(invalidQuoteData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })
  })

  describe('GET /api/quotes', () => {
    test('should require admin authentication', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/quotes')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    test('should return quotes for admin users', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'admin1', role: 'ADMIN', email: 'admin@test.com' }
      } as any)

      const mockQuotes = [
        {
          id: 'quote1',
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          status: 'PENDING',
          submittedAt: new Date(),
          products: []
        }
      ]

      ;(prisma.quoteRequest.findMany as jest.Mock).mockResolvedValue(mockQuotes)
      ;(prisma.quoteRequest.count as jest.Mock).mockResolvedValue(1)

      const request = new NextRequest('http://localhost/api/quotes')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.quotes).toHaveLength(1)
      expect(data.quotes[0].id).toBe('quote1')
    })
  })

  describe('PUT /api/quotes/[id]', () => {
    test('should update quote status for admin users', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'admin1', role: 'ADMIN', email: 'admin@test.com' }
      } as any)

      const mockCurrentQuote = {
        id: 'quote1',
        status: 'PENDING',
        products: []
      }

      const mockUpdatedQuote = {
        ...mockCurrentQuote,
        status: 'RESPONDED',
        response: 'Quote processed',
        respondedAt: new Date()
      }

      ;(prisma.quoteRequest.findUnique as jest.Mock).mockResolvedValue(mockCurrentQuote)
      ;(prisma.$transaction as jest.Mock).mockResolvedValue(mockUpdatedQuote)

      const request = new NextRequest('http://localhost/api/quotes/quote1', {
        method: 'PUT',
        body: JSON.stringify({
          status: 'RESPONDED',
          response: 'Quote processed'
        })
      })

      const response = await PUT_QUOTE(request, { params: Promise.resolve({ id: 'quote1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('RESPONDED')
      expect(data.response).toBe('Quote processed')
    })

    test('should reject invalid status updates', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'admin1', role: 'ADMIN', email: 'admin@test.com' }
      } as any)

      const request = new NextRequest('http://localhost/api/quotes/quote1', {
        method: 'PUT',
        body: JSON.stringify({
          status: 'INVALID_STATUS'
        })
      })

      const response = await PUT_QUOTE(request, { params: Promise.resolve({ id: 'quote1' }) })

      expect(response.status).toBe(400)
    })
  })
})