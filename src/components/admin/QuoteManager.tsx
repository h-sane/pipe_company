'use client'

import { useState, useEffect } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

// QuoteManager component for managing customer quote requests 

// Define enum values to match Prisma schema
const QuoteStatus = {
  PENDING: 'PENDING',
  RESPONDED: 'RESPONDED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED'
} as const

type QuoteStatus = typeof QuoteStatus[keyof typeof QuoteStatus]

interface QuoteProduct {
  id: string
  quantity: number
  notes?: string
  product: {
    id: string
    name: string
    brand: string
    basePrice: number
    currency: string
    diameter: string
    length: string
    material: string
    availability: string
  }
}

interface Quote {
  id: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  company?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  message?: string
  status: QuoteStatus
  submittedAt: string
  respondedAt?: string
  response?: string
  products: QuoteProduct[]
}

interface QuoteFilters {
  status: QuoteStatus | ''
  customerEmail: string
  company: string
  dateFrom: string
  dateTo: string
}

export default function QuoteManager() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [filters, setFilters] = useState<QuoteFilters>({
    status: '',
    customerEmail: '',
    company: '',
    dateFrom: '',
    dateTo: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [responseText, setResponseText] = useState('')

  useEffect(() => {
    fetchQuotes()
  }, [currentPage, filters])

  const fetchQuotes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })
      
      if (filters.status) params.append('status', filters.status)
      if (filters.customerEmail) params.append('customerEmail', filters.customerEmail)
      if (filters.company) params.append('company', filters.company)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)

      const response = await fetch(`/api/quotes?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setQuotes(data.quotes)
        setTotalPages(data.pagination.pages)
      } else {
        setError('Failed to fetch quotes')
      }
    } catch (error) {
      setError('Failed to fetch quotes')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (quoteId: string, newStatus: QuoteStatus) => {
    try {
      setSubmitting(true)
      setError('')
      
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        setSuccess('Quote status updated successfully')
        fetchQuotes()
        if (selectedQuote && selectedQuote.id === quoteId) {
          const updatedQuote = await response.json()
          setSelectedQuote(updatedQuote)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update quote status')
      }
    } catch (error) {
      setError('Failed to update quote status')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResponseSubmit = async (quoteId: string) => {
    if (!responseText.trim()) {
      setError('Response text is required')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          response: responseText,
          status: QuoteStatus.RESPONDED
        })
      })

      if (response.ok) {
        setSuccess('Response sent successfully')
        setResponseText('')
        fetchQuotes()
        if (selectedQuote && selectedQuote.id === quoteId) {
          const updatedQuote = await response.json()
          setSelectedQuote(updatedQuote)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to send response')
      }
    } catch (error) {
      setError('Failed to send response')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteQuote = async (quoteId: string) => {
    if (!confirm('Are you sure you want to delete this quote? This action cannot be undone.')) {
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess('Quote deleted successfully')
        fetchQuotes()
        if (selectedQuote && selectedQuote.id === quoteId) {
          setSelectedQuote(null)
          setShowDetails(false)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete quote')
      }
    } catch (error) {
      setError('Failed to delete quote')
    } finally {
      setSubmitting(false)
    }
  }

  const openQuoteDetails = async (quote: Quote) => {
    try {
      // Fetch full quote details
      const response = await fetch(`/api/quotes/${quote.id}`)
      if (response.ok) {
        const fullQuote = await response.json()
        setSelectedQuote(fullQuote)
        setResponseText(fullQuote.response || '')
        setShowDetails(true)
      } else {
        setError('Failed to fetch quote details')
      }
    } catch (error) {
      setError('Failed to fetch quote details')
    }
  }

  const getStatusColor = (status: QuoteStatus) => {
    switch (status) {
      case QuoteStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800'
      case QuoteStatus.RESPONDED:
        return 'bg-blue-100 text-blue-800'
      case QuoteStatus.CLOSED:
        return 'bg-green-100 text-green-800'
      case QuoteStatus.CANCELLED:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateQuoteTotal = (products: QuoteProduct[]) => {
    return products.reduce((total, qp) => {
      return total + (qp.product.basePrice * qp.quantity)
    }, 0)
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Quote Management</h2>
        <div className="flex space-x-2">
          <span className="text-sm text-gray-600">
            {quotes.length} quotes found
          </span>
        </div>
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

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value as QuoteStatus | ''})}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Statuses</option>
            {Object.values(QuoteStatus).map(status => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Customer email..."
            value={filters.customerEmail}
            onChange={(e) => setFilters({...filters, customerEmail: e.target.value})}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <input
            type="text"
            placeholder="Company..."
            value={filters.company}
            onChange={(e) => setFilters({...filters, company: e.target.value})}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div className="mt-4 flex space-x-2">
          <button
            onClick={() => {
              setFilters({
                status: '',
                customerEmail: '',
                company: '',
                dateFrom: '',
                dateTo: ''
              })
              setCurrentPage(1)
            }}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Quotes Table */}
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{quote.customerName}</div>
                        <div className="text-sm text-gray-500">{quote.customerEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {quote.company || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {quote.products.length} item{quote.products.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quote.status)}`}>
                        {quote.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(quote.submittedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => openQuoteDetails(quote)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View
                      </button>
                      <select
                        value={quote.status}
                        onChange={(e) => handleStatusUpdate(quote.id, e.target.value as QuoteStatus)}
                        disabled={submitting}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        {Object.values(QuoteStatus).map(status => (
                          <option key={status} value={status}>
                            {status.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDeleteQuote(quote.id)}
                        disabled={submitting}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quote Details Modal */}
      {showDetails && selectedQuote && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Quote Details - {selectedQuote.customerName}</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Customer Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div><strong>Name:</strong> {selectedQuote.customerName}</div>
                    <div><strong>Email:</strong> {selectedQuote.customerEmail}</div>
                    {selectedQuote.customerPhone && (
                      <div><strong>Phone:</strong> {selectedQuote.customerPhone}</div>
                    )}
                    {selectedQuote.company && (
                      <div><strong>Company:</strong> {selectedQuote.company}</div>
                    )}
                    {selectedQuote.address && (
                      <div>
                        <strong>Address:</strong> {selectedQuote.address}
                        {selectedQuote.city && `, ${selectedQuote.city}`}
                        {selectedQuote.state && `, ${selectedQuote.state}`}
                        {selectedQuote.zipCode && ` ${selectedQuote.zipCode}`}
                        {selectedQuote.country && `, ${selectedQuote.country}`}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quote Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Quote Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div><strong>Status:</strong> 
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedQuote.status)}`}>
                        {selectedQuote.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div><strong>Submitted:</strong> {formatDate(selectedQuote.submittedAt)}</div>
                    {selectedQuote.respondedAt && (
                      <div><strong>Responded:</strong> {formatDate(selectedQuote.respondedAt)}</div>
                    )}
                    <div><strong>Total Estimated Value:</strong> ${calculateQuoteTotal(selectedQuote.products).toFixed(2)}</div>
                  </div>
                </div>

                {selectedQuote.message && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Customer Message</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {selectedQuote.message}
                    </div>
                  </div>
                )}
              </div>

              {/* Products and Response */}
              <div className="space-y-4">
                {/* Products */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Requested Products</h4>
                  <div className="space-y-3">
                    {selectedQuote.products.map((qp) => (
                      <div key={qp.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{qp.product.name}</h5>
                            <p className="text-sm text-gray-600">{qp.product.brand}</p>
                            <p className="text-sm text-gray-600">
                              {qp.product.diameter} × {qp.product.length} - {qp.product.material}
                            </p>
                            <p className="text-sm text-gray-600">
                              Availability: {qp.product.availability.replace('_', ' ')}
                            </p>
                            {qp.notes && (
                              <p className="text-sm text-gray-600 mt-1">
                                <strong>Notes:</strong> {qp.notes}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium">Qty: {qp.quantity}</p>
                            <p className="text-sm text-gray-600">
                              ${qp.product.basePrice} each
                            </p>
                            <p className="font-medium">
                              ${(qp.product.basePrice * qp.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Response Section */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Response</h4>
                  {selectedQuote.response ? (
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <p className="text-sm text-gray-700">{selectedQuote.response}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-4">No response sent yet.</p>
                  )}
                  
                  <div className="space-y-3">
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Enter your response to the customer..."
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    <button
                      onClick={() => handleResponseSubmit(selectedQuote.id)}
                      disabled={submitting || !responseText.trim()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? 'Sending...' : 'Send Response'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
