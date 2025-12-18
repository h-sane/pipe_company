import { Suspense } from 'react'
import ProductCatalog from '@/components/products/ProductCatalog'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Products - PipeSupply',
  description: 'Browse our comprehensive catalog of industrial pipes and fittings',
}

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Product Catalog
          </h1>
          <p className="text-lg text-gray-600">
            Discover our extensive range of high-quality pipes and fittings for all your industrial needs.
          </p>
        </div>
        
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        }>
          <ProductCatalog />
        </Suspense>
      </div>
    </div>
  )
}