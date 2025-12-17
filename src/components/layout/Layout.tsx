'use client'

import { ReactNode } from 'react'
import Navigation from './Navigation'
import Footer from './Footer'
import Breadcrumb from './Breadcrumb'

interface LayoutProps {
  children: ReactNode
  showBreadcrumbs?: boolean
  breadcrumbItems?: Array<{
    name: string
    href: string
    current?: boolean
  }>
  className?: string
}

export default function Layout({ 
  children, 
  showBreadcrumbs = true, 
  breadcrumbItems,
  className = '' 
}: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <Navigation />
      
      {/* Breadcrumbs */}
      {showBreadcrumbs && (
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className={`flex-1 ${className}`}>
        {children}
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}

// Convenience components for different layout types
export function PageLayout({ 
  children, 
  title, 
  description,
  breadcrumbItems,
  className = '' 
}: {
  children: ReactNode
  title?: string
  description?: string
  breadcrumbItems?: Array<{
    name: string
    href: string
    current?: boolean
  }>
  className?: string
}) {
  return (
    <Layout breadcrumbItems={breadcrumbItems} className={className}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(title || description) && (
          <div className="mb-8">
            {title && (
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
            )}
            {description && (
              <p className="text-lg text-gray-600">{description}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </Layout>
  )
}

export function AdminLayout({ 
  children, 
  title,
  className = '' 
}: {
  children: ReactNode
  title?: string
  className?: string
}) {
  const breadcrumbItems = [
    { name: 'Home', href: '/' },
    { name: 'Admin Dashboard', href: '/admin', current: !title },
    ...(title ? [{ name: title, href: '#', current: true }] : [])
  ]

  return (
    <Layout breadcrumbItems={breadcrumbItems} className={className}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {title && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          </div>
        )}
        {children}
      </div>
    </Layout>
  )
}