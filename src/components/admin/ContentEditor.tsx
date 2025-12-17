'use client'

import { useState, useEffect } from 'react'
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

export default function ContentEditor() {
  const [content, setContent] = useState<CompanyContent>({
    name: '',
    description: '',
    history: '',
    mission: '',
    vision: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
    email: '',
    website: '',
    certifications: [],
    serviceAreas: [],
    specialties: []
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeSection, setActiveSection] = useState<'basic' | 'contact' | 'about' | 'certifications'>('basic')

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
        setError('Failed to fetch company content')
      }
    } catch (error) {
      setError('Failed to fetch company content')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const response = await fetch('/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
      })

      if (response.ok) {
        setSuccess('Company content updated successfully')
        const updatedContent = await response.json()
        setContent(updatedContent)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update company content')
      }
    } catch (error) {
      setError('Failed to update company content')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof CompanyContent, value: string) => {
    setContent(prev => ({ ...prev, [field]: value }))
  }

  const handleArrayChange = (field: 'serviceAreas' | 'specialties', index: number, value: string) => {
    setContent(prev => ({
      ...prev,
      [field]: prev[field]?.map((item, i) => i === index ? value : item) || []
    }))
  }

  const addArrayItem = (field: 'serviceAreas' | 'specialties') => {
    setContent(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), '']
    }))
  }

  const removeArrayItem = (field: 'serviceAreas' | 'specialties', index: number) => {
    setContent(prev => ({
      ...prev,
      [field]: prev[field]?.filter((_, i) => i !== index) || []
    }))
  }

  const handleCertificationChange = (index: number, field: keyof Certification, value: string) => {
    setContent(prev => ({
      ...prev,
      certifications: prev.certifications?.map((cert, i) => 
        i === index ? { ...cert, [field]: value } : cert
      ) || []
    }))
  }

  const addCertification = () => {
    setContent(prev => ({
      ...prev,
      certifications: [...(prev.certifications || []), { name: '', issuer: '' }]
    }))
  }

  const removeCertification = (index: number) => {
    setContent(prev => ({
      ...prev,
      certifications: prev.certifications?.filter((_, i) => i !== index) || []
    }))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Company Content Management</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Section Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'basic', label: 'Basic Information' },
            { key: 'contact', label: 'Contact Details' },
            { key: 'about', label: 'About Company' },
            { key: 'certifications', label: 'Certifications & Services' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        {/* Basic Information Section */}
        {activeSection === 'basic' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                value={content.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Enter company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Description
              </label>
              <textarea
                value={content.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Brief description of your company"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                value={content.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="https://www.example.com"
              />
            </div>
          </div>
        )}

        {/* Contact Details Section */}
        {activeSection === 'contact' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Contact Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={content.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={content.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="contact@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address
              </label>
              <input
                type="text"
                value={content.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={content.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  value={content.state || ''}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="State"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={content.zipCode || ''}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="12345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={content.country || ''}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Country"
                />
              </div>
            </div>
          </div>
        )}

        {/* About Company Section */}
        {activeSection === 'about' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">About Company</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company History
              </label>
              <textarea
                value={content.history || ''}
                onChange={(e) => handleInputChange('history', e.target.value)}
                rows={6}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Tell the story of your company's founding and growth..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mission Statement
              </label>
              <textarea
                value={content.mission || ''}
                onChange={(e) => handleInputChange('mission', e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="What is your company's mission?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vision Statement
              </label>
              <textarea
                value={content.vision || ''}
                onChange={(e) => handleInputChange('vision', e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="What is your company's vision for the future?"
              />
            </div>
          </div>
        )}

        {/* Certifications & Services Section */}
        {activeSection === 'certifications' && (
          <div className="space-y-8">
            <h3 className="text-lg font-medium text-gray-900">Certifications & Services</h3>
            
            {/* Certifications */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-gray-900">Certifications</h4>
                <button
                  onClick={addCertification}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Add Certification
                </button>
              </div>
              
              <div className="space-y-4">
                {content.certifications?.map((cert, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Certification Name
                        </label>
                        <input
                          type="text"
                          value={cert.name}
                          onChange={(e) => handleCertificationChange(index, 'name', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="e.g., ISO 9001"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Issuing Organization
                        </label>
                        <input
                          type="text"
                          value={cert.issuer}
                          onChange={(e) => handleCertificationChange(index, 'issuer', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="e.g., International Organization for Standardization"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Valid Until (Optional)
                        </label>
                        <input
                          type="date"
                          value={cert.validUntil || ''}
                          onChange={(e) => handleCertificationChange(index, 'validUntil', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Document URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={cert.documentUrl || ''}
                          onChange={(e) => handleCertificationChange(index, 'documentUrl', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => removeCertification(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove Certification
                      </button>
                    </div>
                  </div>
                ))}
                
                {(!content.certifications || content.certifications.length === 0) && (
                  <p className="text-gray-500 text-center py-4">
                    No certifications added yet. Click "Add Certification" to get started.
                  </p>
                )}
              </div>
            </div>

            {/* Service Areas */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-gray-900">Service Areas</h4>
                <button
                  onClick={() => addArrayItem('serviceAreas')}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Add Service Area
                </button>
              </div>
              
              <div className="space-y-2">
                {content.serviceAreas?.map((area, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => handleArrayChange('serviceAreas', index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                      placeholder="e.g., Greater Metropolitan Area"
                    />
                    <button
                      onClick={() => removeArrayItem('serviceAreas', index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                
                {(!content.serviceAreas || content.serviceAreas.length === 0) && (
                  <p className="text-gray-500 text-center py-4">
                    No service areas added yet. Click "Add Service Area" to get started.
                  </p>
                )}
              </div>
            </div>

            {/* Specialties */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-gray-900">Technical Specialties</h4>
                <button
                  onClick={() => addArrayItem('specialties')}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Add Specialty
                </button>
              </div>
              
              <div className="space-y-2">
                {content.specialties?.map((specialty, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => handleArrayChange('specialties', index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                      placeholder="e.g., High-pressure systems, Industrial piping"
                    />
                    <button
                      onClick={() => removeArrayItem('specialties', index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                
                {(!content.specialties || content.specialties.length === 0) && (
                  <p className="text-gray-500 text-center py-4">
                    No specialties added yet. Click "Add Specialty" to get started.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}