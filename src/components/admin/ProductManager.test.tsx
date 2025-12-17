/**
 * Unit tests for ProductManager component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ProductManager from './ProductManager'

// Mock fetch
global.fetch = jest.fn()

describe('ProductManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders product list', async () => {
    const mockProducts = [
      {
        id: 'prod1',
        name: 'Steel Pipe',
        brand: 'TestBrand',
        category: 'STEEL_PIPE',
        basePrice: 100,
        pricePerUnit: 'per foot',
        availability: 'IN_STOCK',
        diameter: '2 inch',
        length: '10 ft',
        material: 'Steel',
        pressureRating: '150 PSI',
        temperature: '200F',
        standards: [],
        applications: [],
        description: 'Test pipe'
      }
    ]

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ products: mockProducts, pagination: { pages: 1 } })
    })

    render(<ProductManager />)

    await waitFor(() => {
      expect(screen.getByText('Steel Pipe')).toBeInTheDocument()
      expect(screen.getByText('TestBrand')).toBeInTheDocument()
    })
  })

  test('opens add product form', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ products: [], pagination: { pages: 1 } })
    })

    render(<ProductManager />)

    await waitFor(() => {
      expect(screen.getByText('Product Management')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: 'Add New Product' })
    fireEvent.click(addButton)

    // Check that the form modal is open by looking for the Create button
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  test('handles bulk selection', async () => {
    const mockProducts = [
      {
        id: 'prod1',
        name: 'Pipe 1',
        brand: 'Brand1',
        category: 'STEEL_PIPE',
        basePrice: 100,
        pricePerUnit: 'per foot',
        availability: 'IN_STOCK',
        diameter: '2 inch',
        length: '10 ft',
        material: 'Steel',
        pressureRating: '150 PSI',
        temperature: '200F',
        standards: [],
        applications: [],
        description: 'Test'
      }
    ]

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ products: mockProducts, pagination: { pages: 1 } })
    })

    render(<ProductManager />)

    await waitFor(() => {
      expect(screen.getByText('Pipe 1')).toBeInTheDocument()
    })

    // Find and click checkbox
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1]) // First product checkbox

    await waitFor(() => {
      expect(screen.getByText(/1 products selected/)).toBeInTheDocument()
    })
  })
})
