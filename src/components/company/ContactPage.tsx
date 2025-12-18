'use client'

import { useState, useEffect } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface CompanyContent {
  id?: string
  name: string
  description?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  phone?: string
  email?: string
  website?: string
  serviceAreas?: string[]
}

interface ContactMethod {
  type: 'phone' | 'email' | 'address' | 'website'
  label: string
  value: string
  href?: string
  icon: string
  description: string
}

export default function ContactPage() {
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
        setError('Failed to load contact information')
      }
    } catch (error) {
      setError('Failed to load contact information')
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
        <p className="text-red-600">{error || 'Contact information not available'}</p>
      </div>
    )
  }

  const formatAddress = () => {
    const parts = [content.address, content.city, content.state, content.zipCode, content.country]
    return parts.filter(Boolean).join(', ')
  }

  const getGoogleMapsUrl = () => {
    const address = formatAddress()
    if (!address) return null
    return `https://maps.google.com/?q=${encodeURIComponent(address)}`
  }

  const contactMethods: ContactMethod[] = [
    ...(content.phone ? [{
      type: 'phone' as const,
      label: 'Phone',
      value: content.phone,
      href: `tel:${content.phone.replace(/[^\d+]/g, '')}`,
      icon: '📞',
      description: 'Call us during business hours for immediate assistance'
    }] : []),
    ...(content.email ? [{
      type: 'email' as const,
      label: 'Email',
      value: content.email,
      href: `mailto:${content.email}`,
      icon: '✉️',
      description: 'Send us an email and we\'ll respond within 24 hours'
    }] : []),
    ...(formatAddress() ? [{
      type: 'address' as const,
      label: 'Address',
      value: formatAddress(),
      href: getGoogleMapsUrl() || undefined,
      icon: '📍',
      description: 'Visit our facility or use this address for deliveries'
    }] : []),
    ...(content.website ? [{
      type: 'website' as const,
      label: 'Website',
      value: content.website,
      href: content.website,
      icon: '🌐',
      description: 'Browse our complete product catalog online'
    }] : [])
  ]

  const businessHours = [
    { day: 'Monday - Friday', hours: '7:00 AM - 6:00 PM' },
    { day: 'Saturday', hours: '8:00 AM - 4:00 PM' },
    { day: 'Sunday', hours: 'Closed' }
  ]

  return (
    <div className="bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Contact {content.name}
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Get in touch with our team for quotes, technical support, or any questions about our pipe supply services.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Contact Methods Grid */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Multiple Ways to Reach Us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
                <div className="text-center">
                  <div className="text-4xl mb-4">{method.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {method.label}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {method.description}
                  </p>
                  {method.href ? (
                    <a
                      href={method.href}
                      target={method.type === 'website' || method.type === 'address' ? '_blank' : undefined}
                      rel={method.type === 'website' || method.type === 'address' ? 'noopener noreferrer' : undefined}
                      className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                      {method.type === 'phone' && 'Call Now'}
                      {method.type === 'email' && 'Send Email'}
                      {method.type === 'address' && 'View Map'}
                      {method.type === 'website' && 'Visit Website'}
                    </a>
                  ) : (
                    <p className="text-gray-800 font-medium">{method.value}</p>
                  )}
                  <div className="mt-3 text-sm text-gray-700 font-mono">
                    {method.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Location and Business Hours */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Location Details */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Location</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              {formatAddress() && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Facility Address
                  </h3>
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {formatAddress()}
                  </p>
                  {getGoogleMapsUrl() && (
                    <a
                      href={getGoogleMapsUrl()!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View on Google Maps
                      <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              )}

              {/* Service Areas */}
              {content.serviceAreas && content.serviceAreas.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Service Areas
                  </h3>
                  <p className="text-gray-700 mb-3">
                    We provide delivery and services to the following areas:
                  </p>
                  <ul className="space-y-2">
                    {content.serviceAreas.map((area, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                        <span className="text-gray-800">{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          {/* Business Hours */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Business Hours</h2>
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="space-y-4">
                {businessHours.map((schedule, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-blue-200 last:border-b-0">
                    <span className="font-medium text-gray-900">{schedule.day}</span>
                    <span className="text-gray-700">{schedule.hours}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-100 rounded-md">
                <h4 className="font-semibold text-blue-900 mb-2">Emergency Services</h4>
                <p className="text-blue-800 text-sm">
                  For urgent pipe supply needs outside business hours, please call our emergency line. 
                  Additional charges may apply for after-hours service.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Professional Services Information */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Professional Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔧</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Technical Consultation</h3>
              <p className="text-gray-700">
                Our experienced team provides expert technical consultation to help you select the right pipes for your specific application and requirements.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Custom Quotes</h3>
              <p className="text-gray-700">
                Get detailed, competitive quotes for your projects. We provide transparent pricing and can accommodate special requirements and bulk orders.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚚</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Delivery Services</h3>
              <p className="text-gray-700">
                Fast and reliable delivery services to your job site. We coordinate with your schedule to ensure materials arrive when you need them.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Form CTA */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Whether you need a quick quote, technical advice, or want to place an order, 
            we're here to help. Contact us using any of the methods above or request a quote online.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/quote"
              className="bg-white text-blue-600 px-6 py-3 rounded-md font-semibold hover:bg-gray-100 transition-colors"
            >
              Request Quote
            </a>
            <a
              href="/products"
              className="bg-blue-800 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-900 transition-colors border border-blue-500"
            >
              Browse Products
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}