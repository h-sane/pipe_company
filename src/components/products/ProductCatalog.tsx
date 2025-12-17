'use client'

import { useState, useEffect, useMemo } from 'react'
import { ProductWithImages, ProductCatalogResponse, FilterState } from '@/types/product'
import ProductCard from './ProductCard'
import SearchBar from './SearchBar'
import FilterPanel from './FilterPanel'
import Pagination from './Pagination'
import LoadingSpinner from '../ui/LoadingSpinner'

interface ProductCatalogProps {
  initialProducts?: ProductWithImages[]
  initialPagination?: ProductCatalogResponse['pagination']
}

export default function ProductCatalog({ initialProducts = [], initialPagination }: ProductCatalogProps) {
  const [products, setProducts] = useState<ProductWithImages[]>(initialProducts)
  const [pagination, setPagination] = useState(initialPagination || {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    brand: '',
    material: '',
    availability: '',
    minPrice: '',
    maxPrice: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  // Fetch products based on current filters and pagination
  const fetchProducts = async (page: number = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      })

      if (searchQuery) params.append('search', searchQuery)
      if (filters.category) params.append('category', filters.category)
      if (filters.brand) params.append('brand', filters.brand)
      if (filters.material) params.append('material', filters.material)
      if (filters.availability) params.append('availability', filters.availability)
      if (filters.minPrice) params.append('minPrice', filters.minPrice)
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice)

      const response = await fetch(`/api/products?${params}`)
      if (!response.ok) throw new Error('Failed to fetch products')
      
      const data: ProductCatalogResponse = await response.json()
      setProducts(data.products)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts(1)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, filters])

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchProducts(page)
  }

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      category: '',
      brand: '',
      material: '',
      availability: '',
      minPrice: '',
      maxPrice: ''
    })
    setSearchQuery('')
  }

  // Get unique filter options from current products
  const filterOptions = useMemo(() => {
    const brands = new Set<string>()
    const materials = new Set<string>()
    
    products.forEach(product => {
      brands.add(product.brand)
      materials.add(product.material)
    })

    return {
      brands: Array.from(brands).sort(),
      materials: Array.from(materials).sort()
    }
  }, [products])

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== '') || searchQuery !== ''

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Product Catalog</h1>
        <p className="text-gray-600">
          Browse our comprehensive selection of industrial pipes and fittings
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search by name, brand, material, or specifications..."
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            <span className="ml-2">
              {showFilters ? '−' : '+'}
            </span>
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            filterOptions={filterOptions}
          />
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Active filters:</span>
            {searchQuery && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Search: "{searchQuery}"
              </span>
            )}
            {filters.category && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Category: {filters.category.replace(/_/g, ' ')}
              </span>
            )}
            {filters.brand && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Brand: {filters.brand}
              </span>
            )}
            {filters.material && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Material: {filters.material}
              </span>
            )}
            {filters.availability && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Status: {filters.availability.replace(/_/g, ' ')}
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600">
          {loading ? 'Loading...' : `Showing ${products.length} of ${pagination.total} products`}
        </p>
        {pagination.pages > 1 && (
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.pages}
          </p>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {/* Products Grid */}
      {!loading && (
        <>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">
                {hasActiveFilters 
                  ? 'Try adjusting your search criteria or filters'
                  : 'No products are currently available'
                }
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {!loading && pagination.pages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
}