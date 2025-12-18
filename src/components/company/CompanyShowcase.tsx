'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface Certification {
  name: string
  issuer: string
  validUntil?: string
  documentUrl?: string
}

interface CompanyContent {
  id?: string
  name: string
  description?: string
  history?: string
  mission?: string
  vision?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  phone?: string
  email?: string
  website?: string
  certifications?: Certification[]
  serviceAreas?: string[]
  specialties?: string[]
}

export default function CompanyShowcase() {
  const [content, setContent] = useState<CompanyContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCompanyContent()
  }, [])

  const fetchCompanyContent = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/company')
      if (response.ok) {
        const data = await response.json()
        setContent(data)
      } else {
        setError('Failed to load company information')
      }
    } catch (error) {
      setError('Failed to load company information')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Company information not available'}</p>
      </div>
    )
  }

  const formatAddress = () => {
    const parts = [content.address, content.city, content.state, content.zipCode, content.country]
    return parts.filter(Boolean).join(', ')
  }

  const isValidCertification = (cert: Certification) => {
    if (!cert.validUntil) return true
    const validDate = new Date(cert.validUntil)
    return validDate > new Date()
  }

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {content.name}
            </h1>
            {content.description && (
              <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
                {content.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Business Overview Section */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">About Our Company</h2>
              {content.history && (
                <div className="prose prose-lg text-gray-700 mb-6">
                  <p className="whitespace-pre-line">{content.history}</p>
                </div>
              )}
              
              {content.mission && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Our Mission</h3>
                  <p className="text-gray-700 whitespace-pre-line">{content.mission}</p>
                </div>
              )}

              {content.vision && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Our Vision</h3>
                  <p className="text-gray-700 whitespace-pre-line">{content.vision}</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Facts</h3>
              <div className="space-y-4">
                {content.phone && (
                  <div className="flex items-center">
                    <span className="text-blue-600 mr-3">📞</span>
                    <div>
                      <span className="font-medium text-gray-900">Phone:</span>
                      <a href={`tel:${content.phone}`} className="ml-2 text-blue-600 hover:underline">
                        {content.phone}
                      </a>
                    </div>
                  </div>
                )}
                
                {content.email && (
                  <div className="flex items-center">
                    <span className="text-blue-600 mr-3">✉️</span>
                    <div>
                      <span className="font-medium text-gray-900">Email:</span>
                      <a href={`mailto:${content.email}`} className="ml-2 text-blue-600 hover:underline">
                        {content.email}
                      </a>
                    </div>
                  </div>
                )}

                {formatAddress() && (
                  <div className="flex items-start">
                    <span className="text-blue-600 mr-3 mt-1">📍</span>
                    <div>
                      <span className="font-medium text-gray-900">Address:</span>
                      <p className="ml-2 text-gray-700">{formatAddress()}</p>
                    </div>
                  </div>
                )}

                {content.website && (
                  <div className="flex items-center">
                    <span className="text-blue-600 mr-3">🌐</span>
                    <div>
                      <span className="font-medium text-gray-900">Website:</span>
                      <a 
                        href={content.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:underline"
                      >
                        {content.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Certifications Section */}
        {content.certifications && content.certifications.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Certifications & Standards
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.certifications.map((cert, index) => (
                <div 
                  key={index} 
                  className={`bg-white border rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow ${
                    isValidCertification(cert) ? 'border-green-200' : 'border-yellow-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {cert.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        Issued by: {cert.issuer}
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      isValidCertification(cert) ? 'bg-green-400' : 'bg-yellow-400'
                    }`} />
                  </div>

                  {cert.validUntil && (
                    <div className="mb-3">
                      <span className="text-sm text-gray-500">
                        Valid until: {new Date(cert.validUntil).toLocaleDateString()}
                      </span>
                      {!isValidCertification(cert) && (
                        <span className="ml-2 text-xs text-yellow-600 font-medium">
                          (Renewal in progress)
                        </span>
                      )}
                    </div>
                  )}

                  {cert.documentUrl && (
                    <Link
                      href={cert.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Certificate
                      <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Service Areas and Technical Expertise */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Service Areas */}
          {content.serviceAreas && content.serviceAreas.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Service Areas</h2>
              <div className="bg-blue-50 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  We proudly serve customers across multiple regions:
                </p>
                <ul className="space-y-3">
                  {content.serviceAreas.map((area, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                      <span className="text-gray-800 font-medium">{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Technical Expertise */}
          {content.specialties && content.specialties.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Technical Expertise</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  Our specialized capabilities include:
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {content.specialties.map((specialty, index) => (
                    <div key={index} className="flex items-center bg-white rounded-md p-3 shadow-sm">
                      <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-bold text-sm">✓</span>
                      </span>
                      <span className="text-gray-800 font-medium">{specialty}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Call to Action */}
        <section className="mt-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Ready to Work With Us?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Contact us today to discuss your pipe supply needs and discover how our expertise can benefit your project.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-white text-blue-600 px-6 py-3 rounded-md font-semibold hover:bg-gray-100 transition-colors"
            >
              Contact Us
            </Link>
            <Link
              href="/quote"
              className="bg-blue-800 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-900 transition-colors border border-blue-500"
            >
              Request Quote
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}