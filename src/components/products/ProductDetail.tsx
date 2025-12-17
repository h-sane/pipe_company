'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ProductWithImages, AvailabilityStatus } from '@/types/product'

interface ProductDetailProps {
  product: ProductWithImages
  alternativeProducts?: ProductWithImages[]
}

export default function ProductDetail({ product, alternativeProducts = [] }: ProductDetailProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)

  const getAvailabilityColor = (status: AvailabilityStatus) => {
    switch (status) {
      case 'IN_STOCK':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'LOW_STOCK':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'OUT_OF_STOCK':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'DISCONTINUED':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      case 'SPECIAL_ORDER':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
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

  const isAvailable = product.availability === 'IN_STOCK' || product.availability === 'LOW_STOCK'
  const selectedImage = product.images[selectedImageIndex]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex mb-8" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/" className="text-gray-700 hover:text-blue-600">
              Home
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <Link href="/products" className="ml-1 text-gray-700 hover:text-blue-600 md:ml-2">
                Products
              </Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="ml-1 text-gray-500 md:ml-2" aria-current="page">
                {product.name}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
        {/* Image Gallery */}
        <div className="flex flex-col-reverse">
          {/* Image Selector */}
          {product.images.length > 1 && (
            <div className="hidden mt-6 w-full max-w-2xl mx-auto sm:block lg:max-w-none">
              <div className="grid grid-cols-4 gap-6">
                {product.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative h-24 bg-white rounded-md flex items-center justify-center text-sm font-medium uppercase text-gray-900 cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring focus:ring-offset-4 focus:ring-blue-500 ${
                      index === selectedImageIndex ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <span className="sr-only">Image {index + 1}</span>
                    <span className="absolute inset-0 rounded-md overflow-hidden">
                      <Image
                        src={image.url}
                        alt={image.alt || `${product.name} view ${index + 1}`}
                        width={96}
                        height={96}
                        loading={index < 4 ? 'eager' : 'lazy'}
                        className="w-full h-full object-center object-cover"
                      />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Image */}
          <div className="w-full aspect-w-1 aspect-h-1">
            {selectedImage ? (
              <div className="relative">
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.alt || product.name}
                  width={600}
                  height={600}
                  priority={selectedImageIndex === 0}
                  loading={selectedImageIndex === 0 ? 'eager' : 'lazy'}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
                  className={`w-full h-96 object-center object-cover sm:rounded-lg cursor-pointer transition-transform duration-200 ${
                    isZoomed ? 'scale-150' : 'hover:scale-105'
                  }`}
                  onClick={() => setIsZoomed(!isZoomed)}
                />
                {product.images.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                    {selectedImageIndex + 1} / {product.images.length}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-96 bg-gray-200 flex items-center justify-center sm:rounded-lg">
                <span className="text-gray-400 text-lg">No Image Available</span>
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{product.name}</h1>
          
          <div className="mt-3">
            <h2 className="sr-only">Product information</h2>
            <p className="text-3xl text-gray-900">${product.basePrice.toFixed(2)}</p>
            <p className="text-sm text-gray-600 mt-1">per {product.pricePerUnit}</p>
          </div>

          {/* Availability */}
          <div className="mt-6">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getAvailabilityColor(product.availability)}`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                product.availability === 'IN_STOCK' ? 'bg-green-400' :
                product.availability === 'LOW_STOCK' ? 'bg-yellow-400' :
                product.availability === 'OUT_OF_STOCK' ? 'bg-red-400' :
                product.availability === 'SPECIAL_ORDER' ? 'bg-blue-400' : 'bg-gray-400'
              }`} />
              {getAvailabilityText(product.availability)}
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-900">Description</h3>
            <div className="mt-2 prose prose-sm text-gray-500">
              <p>{product.description}</p>
            </div>
          </div>

          {/* Specifications */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-900">Specifications</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="border border-gray-200 rounded-lg p-4">
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Category</dt>
                    <dd className="text-sm text-gray-900">{formatCategoryName(product.category)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Brand</dt>
                    <dd className="text-sm text-gray-900">{product.brand}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Material</dt>
                    <dd className="text-sm text-gray-900">{product.material}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Diameter</dt>
                    <dd className="text-sm text-gray-900">{product.diameter}</dd>
                  </div>
                </dl>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Length</dt>
                    <dd className="text-sm text-gray-900">{product.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Pressure Rating</dt>
                    <dd className="text-sm text-gray-900">{product.pressureRating}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Temperature</dt>
                    <dd className="text-sm text-gray-900">{product.temperature}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Currency</dt>
                    <dd className="text-sm text-gray-900">{product.currency}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Standards */}
          {product.standards && product.standards.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Standards</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.standards.map((standard, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {standard}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Applications */}
          {product.applications && product.applications.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Applications</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.applications.map((application, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    {application}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bulk Discounts */}
          {product.bulkDiscounts && product.bulkDiscounts.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Bulk Pricing</h3>
              <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Minimum Quantity
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Discount
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price per {product.pricePerUnit}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {product.bulkDiscounts.map((discount, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {discount.minQuantity}+
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {(discount.discount * 100).toFixed(1)}%
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          ${(product.basePrice * (1 - discount.discount)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex space-x-4">
            <Link
              href={`/quote?product=${product.id}`}
              className={`flex-1 bg-blue-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                !isAvailable ? 'opacity-75' : ''
              }`}
            >
              Request Quote
            </Link>
            <button
              type="button"
              className="flex-1 bg-white border border-gray-300 rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add to Comparison
            </button>
          </div>

          {/* Alternative Products */}
          {!isAvailable && alternativeProducts.length > 0 && (
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-800 mb-3">Alternative Products</h3>
              <div className="space-y-2">
                {alternativeProducts.slice(0, 3).map((altProduct) => (
                  <Link
                    key={altProduct.id}
                    href={`/products/${altProduct.id}`}
                    className="block p-2 bg-white rounded border hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      {altProduct.images[0] && (
                        <Image
                          src={altProduct.images[0].url}
                          alt={altProduct.name}
                          width={40}
                          height={40}
                          loading="lazy"
                          className="w-10 h-10 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {altProduct.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          ${altProduct.basePrice.toFixed(2)} / {altProduct.pricePerUnit}
                        </p>
                      </div>
                      <div className={`px-2 py-1 text-xs rounded-full ${getAvailabilityColor(altProduct.availability)}`}>
                        {getAvailabilityText(altProduct.availability)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}