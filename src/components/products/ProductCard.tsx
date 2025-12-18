'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ProductWithImages, AvailabilityStatus } from '@/types/product'

interface ProductCardProps {
  product: ProductWithImages
}

export default function ProductCard({ product }: ProductCardProps) {
  const getAvailabilityColor = (status: AvailabilityStatus) => {
    switch (status) {
      case 'IN_STOCK':
        return 'text-green-600 bg-green-50'
      case 'LOW_STOCK':
        return 'text-yellow-600 bg-yellow-50'
      case 'OUT_OF_STOCK':
        return 'text-red-600 bg-red-50'
      case 'DISCONTINUED':
        return 'text-gray-600 bg-gray-50'
      case 'SPECIAL_ORDER':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getAvailabilityText = (status: AvailabilityStatus) => {
    switch (status) {
      case 'IN_STOCK':
        return 'In Stock'
      case 'LOW_STOCK':
        return 'Low Stock'
      case 'OUT_OF_STOCK':
        return 'Out of Stock'
      case 'DISCONTINUED':
        return 'Discontinued'
      case 'SPECIAL_ORDER':
        return 'Special Order'
      default:
        return 'Unknown'
    }
  }

  const formatCategoryName = (category: string) => {
    return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const primaryImage = product.images?.[0]

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg smooth-transition hover-glow interactive-scale overflow-hidden touch-target">
      <Link href={`/products/${product.id}`}>
        <div className="aspect-w-16 aspect-h-9 bg-gray-200">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt || product.name}
              width={400}
              height={225}
              loading="lazy"
              className="w-full h-48 object-cover interactive-scale smooth-transition"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-sm">No Image Available</span>
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            <Link href={`/products/${product.id}`} className="text-gray-900 hover:text-blue-600 transition-colors">
              {product.name}
            </Link>
          </h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAvailabilityColor(product.availability)}`}>
            {getAvailabilityText(product.availability)}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 mb-2">{formatCategoryName(product.category)}</p>
        
        <div className="space-y-1 text-sm text-gray-600 mb-3">
          <div className="flex justify-between">
            <span>Brand:</span>
            <span className="font-medium">{product.brand}</span>
          </div>
          <div className="flex justify-between">
            <span>Material:</span>
            <span className="font-medium">{product.material}</span>
          </div>
          <div className="flex justify-between">
            <span>Diameter:</span>
            <span className="font-medium">{product.diameter}</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-700 line-clamp-2 mb-3">
          {product.description}
        </p>
        
        <div className="flex justify-between items-center">
          <div className="text-lg font-bold text-gray-900">
            ${product.basePrice.toFixed(2)}
            <span className="text-sm font-normal text-gray-600 ml-1">
              / {product.pricePerUnit}
            </span>
          </div>
          <Link
            href={`/products/${product.id}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 smooth-transition interactive-scale touch-target focus-ring"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}