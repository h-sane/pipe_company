'use client'

import { useState, useRef } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface UploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
  url?: string
}

interface MediaUploaderProps {
  onUploadComplete?: (urls: string[]) => void
  acceptedTypes?: string[]
  maxFileSize?: number
  maxFiles?: number
}

export default function MediaUploader({
  onUploadComplete,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain'],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 10
}: MediaUploaderProps) {
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(file => {
      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        alert(`File type ${file.type} is not supported`)
        return false
      }
      
      // Check file size
      if (file.size > maxFileSize) {
        alert(`File ${file.name} is too large. Maximum size is ${maxFileSize / 1024 / 1024}MB`)
        return false
      }
      
      return true
    })

    if (uploads.length + validFiles.length > maxFiles) {
      alert(`Cannot upload more than ${maxFiles} files at once`)
      return
    }

    // Add files to upload queue
    const newUploads: UploadProgress[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }))

    setUploads(prev => [...prev, ...newUploads])
    
    // Start uploading files
    newUploads.forEach((upload, index) => {
      uploadFile(upload, uploads.length + index)
    })
  }

  const uploadFile = async (upload: UploadProgress, index: number) => {
    try {
      // Update status to uploading
      setUploads(prev => prev.map((u, i) => 
        i === index ? { ...u, status: 'uploading' as const } : u
      ))

      const formData = new FormData()
      formData.append('file', upload.file)

      // Determine upload endpoint based on file type
      const isImage = upload.file.type.startsWith('image/')
      const endpoint = isImage ? '/api/media/upload' : '/api/documents'

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      // Update status to completed
      setUploads(prev => prev.map((u, i) => 
        i === index ? { 
          ...u, 
          status: 'completed' as const, 
          progress: 100,
          url: result.url || result.downloadUrl
        } : u
      ))

    } catch (error) {
      // Update status to error
      setUploads(prev => prev.map((u, i) => 
        i === index ? { 
          ...u, 
          status: 'error' as const, 
          error: error instanceof Error ? error.message : 'Upload failed'
        } : u
      ))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const removeUpload = (index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index))
  }

  const clearCompleted = () => {
    const completedUrls = uploads
      .filter(u => u.status === 'completed' && u.url)
      .map(u => u.url!)
    
    if (completedUrls.length > 0 && onUploadComplete) {
      onUploadComplete(completedUrls)
    }
    
    setUploads(prev => prev.filter(u => u.status !== 'completed'))
  }

  const retryFailed = () => {
    uploads.forEach((upload, index) => {
      if (upload.status === 'error') {
        uploadFile(upload, index)
      }
    })
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    } else if (fileType === 'application/pdf') {
      return (
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    } else {
      return (
        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  }

  const completedCount = uploads.filter(u => u.status === 'completed').length
  const errorCount = uploads.filter(u => u.status === 'error').length
  const uploadingCount = uploads.filter(u => u.status === 'uploading').length

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports images (JPEG, PNG, WebP), PDFs, and text files up to {maxFileSize / 1024 / 1024}MB
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Select Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Upload Progress ({uploads.length} files)
            </h3>
            <div className="flex space-x-2">
              {completedCount > 0 && (
                <button
                  onClick={clearCompleted}
                  className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Clear Completed ({completedCount})
                </button>
              )}
              {errorCount > 0 && (
                <button
                  onClick={retryFailed}
                  className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Retry Failed ({errorCount})
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {uploads.map((upload, index) => (
              <div key={index} className="bg-white border rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  {getFileIcon(upload.file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {upload.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {upload.status === 'uploading' && (
                      <div className="flex items-center space-x-2">
                        <LoadingSpinner />
                        <span className="text-sm text-gray-600">Uploading...</span>
                      </div>
                    )}
                    {upload.status === 'completed' && (
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-green-600">Completed</span>
                      </div>
                    )}
                    {upload.status === 'error' && (
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-sm text-red-600">Failed</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeUpload(index)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                {upload.error && (
                  <p className="mt-2 text-sm text-red-600">{upload.error}</p>
                )}
              </div>
            ))}
          </div>

          {/* Overall Progress Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span>Progress: {completedCount + errorCount} / {uploads.length}</span>
              <span>
                {uploadingCount > 0 && `${uploadingCount} uploading`}
                {completedCount > 0 && ` • ${completedCount} completed`}
                {errorCount > 0 && ` • ${errorCount} failed`}
              </span>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${uploads.length > 0 ? ((completedCount + errorCount) / uploads.length) * 100 : 0}%`
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}