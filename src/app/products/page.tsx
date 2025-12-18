import { Suspense } from 'react'
import ProductCatalog from '@/components/products/ProductCatalog'
import { PageLayout } from '@/components/layout/Layout'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Products - Pipe Supply Co.',
  description: 'Browse our comprehensive catalog of industrial pipes and fittings',
}

export default function ProductsPage() {
  const breadcrumbItems = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/products', current: true }
  ]

  return (
    <PageLayout 
      title="Product Catalog"
      description="Discover our extensive range of high-quality pipes and fittings for all your industrial needs."
      breadcrumbItems={breadcrumbItems}
      className="bg-gray-50"
    >
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg mb-8 p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Industrial Grade Piping Solutions</h2>
          <p className="text-blue-100 mb-6">
            Professional quality pipes and fittings for every industrial application
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <span className="bg-blue-500 bg-opacity-50 px-3 py-1 rounded-full">✓ Certified Quality</span>
            <span className="bg-blue-500 bg-opacity-50 px-3 py-1 rounded-full">✓ Fast Delivery</span>
            <span className="bg-blue-500 bg-opacity-50 px-3 py-1 rounded-full">✓ Expert Support</span>
          </div>
        </div>
      </div>

      {/* Product Catalog */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading products...</span>
          </div>
        }>
          <ProductCatalog />
        </Suspense>
      </div>

      {/* Call to Action */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Need Help Finding the Right Product?
          </h3>
          <p className="text-blue-700 mb-4">
            Our technical experts are here to help you select the perfect piping solution
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/quote"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 hover:scale-105"
            >
              Request Quote
            </a>
            <a
              href="/contact"
              className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-all duration-200 hover:scale-105"
            >
              Contact Expert
            </a>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}