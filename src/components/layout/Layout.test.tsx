import React from 'react'
import * as fc from 'fast-check'
import { render, screen } from '@testing-library/react'
import { useRouter, usePathname } from 'next/navigation'
import Layout, { PageLayout, AdminLayout } from './Layout'

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

describe('Layout Components', () => {
  test('PageLayout renders children with navigation and footer', () => {
    render(
      <PageLayout>
        <div>Test Content</div>
      </PageLayout>
    )
    
    expect(screen.getByText('Test Content')).toBeInTheDocument()
    expect(screen.getByText('PipeSupply')).toBeInTheDocument() // Logo in navigation
  })

  test('AdminLayout renders children with admin-specific layout', () => {
    render(
      <AdminLayout>
        <div>Admin Content</div>
      </AdminLayout>
    )
    
    expect(screen.getByText('Admin Content')).toBeInTheDocument()
    expect(screen.getByText('PipeSupply')).toBeInTheDocument() // Logo in navigation
  })

  test('default Layout component renders PageLayout', () => {
    render(
      <Layout>
        <div>Default Content</div>
      </Layout>
    )
    
    expect(screen.getByText('Default Content')).toBeInTheDocument()
    expect(screen.getByText('PipeSupply')).toBeInTheDocument()
  })
})