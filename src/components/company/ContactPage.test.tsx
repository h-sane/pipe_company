/**
 * Basic tests for ContactPage component
 */

import { render, screen } from '@testing-library/react'
import ContactPage from './ContactPage'

// Mock fetch for testing
global.fetch = jest.fn()

const mockCompanyData = {
  name: 'Test Pipe Supply Co.',
  description: 'Test description',
  phone: '(555) 123-4567',
  email: 'test@example.com',
  address: '123 Test St',
  city: 'Test City',
  state: 'TS',
  zipCode: '12345',
  country: 'USA',
  website: 'https://test.com',
  serviceAreas: ['Test Area 1', 'Test Area 2']
}

describe('ContactPage', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockCompanyData
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders contact page with company information', async () => {
    render(<ContactPage />)
    
    // Should show loading initially
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('displays contact methods when data is loaded', async () => {
    render(<ContactPage />)
    
    // Wait for data to load and check for contact elements
    await screen.findByText(/Multiple Ways to Reach Us/i)
    
    expect(screen.getByText(/Multiple Ways to Reach Us/i)).toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500
    })

    render(<ContactPage />)
    
    // Should show error message
    await screen.findByText(/Failed to load contact information/i)
    expect(screen.getByText(/Failed to load contact information/i)).toBeInTheDocument()
  })
})