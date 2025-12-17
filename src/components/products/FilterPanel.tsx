'use client'

import { ProductCategory, AvailabilityStatus, FilterState, FilterOptions } from '@/types/product'

interface FilterPanelProps {
  filters: FilterState
  onFilterChange: (filters: Partial<FilterState>) => void
  onClearFilters: () => void
  filterOptions: FilterOptions
}

const PRODUCT_CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: ProductCategory.STEEL_PIPE, label: 'Steel Pipe' },
  { value: ProductCategory.PVC_PIPE, label: 'PVC Pipe' },
  { value: ProductCategory.COPPER_PIPE, label: 'Copper Pipe' },
  { value: ProductCategory.GALVANIZED_PIPE, label: 'Galvanized Pipe' },
  { value: ProductCategory.CAST_IRON_PIPE, label: 'Cast Iron Pipe' },
  { value: ProductCategory.FLEXIBLE_PIPE, label: 'Flexible Pipe' },
  { value: ProductCategory.SPECIALTY_PIPE, label: 'Specialty Pipe' }
]

const AVAILABILITY_OPTIONS: { value: AvailabilityStatus; label: string }[] = [
  { value: AvailabilityStatus.IN_STOCK, label: 'In Stock' },
  { value: AvailabilityStatus.LOW_STOCK, label: 'Low Stock' },
  { value: AvailabilityStatus.OUT_OF_STOCK, label: 'Out of Stock' },
  { value: AvailabilityStatus.SPECIAL_ORDER, label: 'Special Order' },
  { value: AvailabilityStatus.DISCONTINUED, label: 'Discontinued' }
]

export default function FilterPanel({ 
  filters, 
  onFilterChange, 
  onClearFilters, 
  filterOptions 
}: FilterPanelProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ category: e.target.value as ProductCategory | '' })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Brand Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Brand
          </label>
          <select
            value={filters.brand}
            onChange={(e) => onFilterChange({ brand: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Brands</option>
            {filterOptions.brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>

        {/* Material Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Material
          </label>
          <select
            value={filters.material}
            onChange={(e) => onFilterChange({ material: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Materials</option>
            {filterOptions.materials.map((material) => (
              <option key={material} value={material}>
                {material}
              </option>
            ))}
          </select>
        </div>

        {/* Availability Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Availability
          </label>
          <select
            value={filters.availability}
            onChange={(e) => onFilterChange({ availability: e.target.value as AvailabilityStatus | '' })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            {AVAILABILITY_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Price
          </label>
          <input
            type="number"
            value={filters.minPrice}
            onChange={(e) => onFilterChange({ minPrice: e.target.value })}
            placeholder="$0"
            min="0"
            step="0.01"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Price
          </label>
          <input
            type="number"
            value={filters.maxPrice}
            onChange={(e) => onFilterChange({ maxPrice: e.target.value })}
            placeholder="No limit"
            min="0"
            step="0.01"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Clear Filters Button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={onClearFilters}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  )
}