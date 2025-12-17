/**
 * Unit tests for AdminDashboard component
 */

import { render, screen, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import AdminDashboard from './AdminDashboard'

// Mock next-auth
jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// Mock child components
jest.mock('./ProductManager', () => {
  return function MockProductManager() {
    return <div data-testid="product-manager">Product Manager</div>
  }
})

jest.mock('./QuoteManager', () => {
  return function MockQuoteManager() {
    return <div data-testid="quote-manager">Quote Manager</div>
  }
})

jest.mock('./MediaUploader', () => {
  return function MockMediaUploader() {
    return <div data-testid="media-uploader">Media Uploader</div>
  }
})

jest.mock('./ContentEditor', () => {
  return function MockContentEditor() {
    return <div data-testid="content-editor">Content Editor</div>
  }
})

// Mock fetch
global.fetch = jest.fn()

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSession.mockReturnValue({
      data: { user: { id: 'admin1', role: 'ADMIN', email: 'admin@test.com' } },
      status: 'authenticated',
      update: jest.fn()
    } as any)
  })

  test('renders dashboard with stats', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pagination: { total: 50 } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pagination: { total: 25 }, quotes: [{ status: 'PENDING' }] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ products: [1, 2, 3] })
      })

    render(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('System Overview')).toBeInTheDocument()
    })

    expect(screen.getByText('50')).toBeInTheDocument() // Total products
    expect(screen.getByText('25')).toBeInTheDocument() // Total quotes
  })

  test('switches between tabs', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ pagination: { total: 0 }, quotes: [], products: [] })
    })

    const { getByText } = render(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('System Overview')).toBeInTheDocument()
    })

    // Click Products tab
    getByText('Products').click()
    await waitFor(() => {
      expect(screen.getByTestId('product-manager')).toBeInTheDocument()
    })

    // Click Quotes tab
    getByText('Quotes').click()
    await waitFor(() => {
      expect(screen.getByTestId('quote-manager')).toBeInTheDocument()
    })
  })
})
