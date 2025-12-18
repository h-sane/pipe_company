import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import AdminDashboard from './AdminDashboard'

// Mock the child components
jest.mock('./ProductManager', () => {
  return function MockProductManager() {
    return <div>Product Manager</div>
  }
})

jest.mock('./QuoteManager', () => {
  return function MockQuoteManager() {
    return <div>Quote Manager</div>
  }
})

jest.mock('./MediaUploader', () => {
  return function MockMediaUploader() {
    return <div>Media Uploader</div>
  }
})

jest.mock('./ContentEditor', () => {
  return function MockContentEditor() {
    return <div>Content Editor</div>
  }
})

// Mock fetch for API calls
global.fetch = jest.fn()

describe('AdminDashboard', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear()
  })

  test('renders dashboard tabs', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ pagination: { total: 10 } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ pagination: { total: 5 } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ products: [] })
      })

    render(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument()
      expect(screen.getByText('Products')).toBeInTheDocument()
      expect(screen.getByText('Quotes')).toBeInTheDocument()
      expect(screen.getByText('Media')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  test('displays loading state initially', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<AdminDashboard />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})