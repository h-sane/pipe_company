import React from 'react'
import * as fc from 'fast-check'
import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter, usePathname } from 'next/navigation'
import Navigation from './Navigation'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}))

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe('Navigation Component', () => {
  const mockPush = jest.fn()
  
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    })
    mockUsePathname.mockReturnValue('/')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('renders navigation items correctly', () => {
    render(<Navigation />)
    
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Products')).toBeInTheDocument()
    expect(screen.getByText('Quote Request')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
  })

  test('shows admin login when not in admin area', () => {
    mockUsePathname.mockReturnValue('/')
    
    render(<Navigation />)
    
    expect(screen.getByText('Admin Login')).toBeInTheDocument()
  })

  test('shows sign out when in admin area', () => {
    mockUsePathname.mockReturnValue('/admin')
    
    render(<Navigation />)
    
    expect(screen.getByText('Sign Out')).toBeInTheDocument()
    expect(screen.getByText('Welcome, Admin User')).toBeInTheDocument()
  })

  test('mobile menu toggles correctly', () => {
    render(<Navigation />)
    
    const menuButton = screen.getByRole('button', { name: /open main menu/i })
    fireEvent.click(menuButton)
    
    // Mobile menu should be visible
    const mobileNav = screen.getByText('Home').closest('div')
    expect(mobileNav).toBeInTheDocument()
  })
})