import { Suspense } from 'react'
import QuoteRequestForm from '@/components/quotes/QuoteRequestForm'
import { PageLayout } from '@/components/layout/Layout'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Request Quote - Pipe Supply Co.',
  description: 'Request a custom quote for your pipe and fitting requirements',
}

export default function QuotePage() {
  const breadcrumbItems = [
    { name: 'Home', href: '/' },
    { name: 'Request Quote', href: '/quote', current: true }
  ]

  return (
    <PageLayout 
      title="Request a Quote"
      description="Get personalized pricing for your specific pipe and fitting requirements. Our team will respond within 24 hours."
      breadcrumbItems={breadcrumbItems}
      className="bg-gray-50"
    >
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg mb-8 p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Get Your Custom Quote Today</h2>
            <p className="text-blue-100 mb-6">
              Professional pricing for industrial piping solutions - fast, accurate, competitive
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span className="bg-blue-500 bg-opacity-50 px-3 py-1 rounded-full">✓ 24-Hour Response</span>
              <span className="bg-blue-500 bg-opacity-50 px-3 py-1 rounded-full">✓ No Obligation</span>
              <span className="bg-blue-500 bg-opacity-50 px-3 py-1 rounded-full">✓ Expert Consultation</span>
            </div>
          </div>
        </div>

        {/* Quote Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading quote form...</span>
            </div>
          }>
            <QuoteRequestForm />
          </Suspense>
        </div>
        
        {/* Benefits Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-6 text-center">
            Why Choose Our Quote Service?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Fast Response Time</h3>
                <p className="text-blue-700 text-sm">Get detailed quotes within 24 hours of submission</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Competitive Pricing</h3>
                <p className="text-blue-700 text-sm">Industry-leading prices with volume discounts</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Expert Consultation</h3>
                <p className="text-blue-700 text-sm">Technical guidance and product recommendations</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Flexible Terms</h3>
                <p className="text-blue-700 text-sm">Custom payment and delivery options available</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Alternative */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Prefer to Speak with Someone?
          </h3>
          <p className="text-gray-600 mb-4">
            Our sales team is ready to help with complex requirements or urgent needs
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/contact"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 hover:scale-105"
            >
              Contact Sales Team
            </a>
            <a
              href="tel:+1-555-PIPES-1"
              className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-all duration-200 hover:scale-105"
            >
              Call (555) PIPES-1
            </a>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}