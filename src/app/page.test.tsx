import { render, screen } from '@testing-library/react'
import Home from './page'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
}))

describe('Home Page', () => {
  test('renders welcome message', () => {
    render(<Home />)
    
    expect(screen.getByText(/Professional Pipe Supply/i)).toBeInTheDocument()
  })

  test('renders main navigation elements', () => {
    render(<Home />)
    
    expect(screen.getByText('Products')).toBeInTheDocument()
    expect(screen.getByText('Quote Request')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
  })
})