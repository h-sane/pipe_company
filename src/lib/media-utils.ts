type MediaType = 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'OTHER';

export interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  type: MediaType;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadProgress {
  filename: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface BulkUploadResult {
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
  results: Array<{
    success: boolean;
    filename?: string;
    originalName: string;
    error?: string;
    media?: MediaFile;
  }>;
  uploadedMedia: MediaFile[];
}

// File validation utilities
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_BULK_FILES = 20;

export function validateFileType(file: File, expectedType: 'image' | 'document'): boolean {
  const allowedTypes = expectedType === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES;
  return allowedTypes.includes(file.type);
}

export function validateFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  // If there's no dot or the dot is at the start (hidden file), return empty string
  if (parts.length === 1 || (parts.length === 2 && parts[0] === '')) {
    return '';
  }
  return parts.pop()?.toLowerCase() || '';
}

export function isImageFile(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimeType);
}

export function isDocumentFile(mimeType: string): boolean {
  return ALLOWED_DOCUMENT_TYPES.includes(mimeType);
}

// Generate secure download URL for documents
export function generateSecureDownloadUrl(mediaId: string): string {
  return `/api/media/${mediaId}/download`;
}

// Generate thumbnail URL for images
export function getThumbnailUrl(filename: string): string {
  return `/uploads/thumb_${filename}`;
}

// Media organization utilities
export function organizeMediaByType(media: MediaFile[]): {
  images: MediaFile[];
  documents: MediaFile[];
  other: MediaFile[];
} {
  return media.reduce(
    (acc, item) => {
      switch (item.type) {
        case 'IMAGE':
          acc.images.push(item);
          break;
        case 'DOCUMENT':
          acc.documents.push(item);
          break;
        default:
          acc.other.push(item);
      }
      return acc;
    },
    { images: [] as MediaFile[], documents: [] as MediaFile[], other: [] as MediaFile[] }
  );
}

export function filterMediaBySearch(media: MediaFile[], searchTerm: string): MediaFile[] {
  if (!searchTerm.trim()) return media;
  
  const term = searchTerm.toLowerCase();
  return media.filter(item =>
    item.originalName.toLowerCase().includes(term) ||
    item.filename.toLowerCase().includes(term) ||
    item.mimeType.toLowerCase().includes(term)
  );
}

// Progress tracking for bulk uploads
export class BulkUploadTracker {
  private progress: Map<string, UploadProgress> = new Map();
  private listeners: Array<(progress: UploadProgress[]) => void> = [];

  addFile(filename: string): void {
    this.progress.set(filename, {
      filename,
      progress: 0,
      status: 'pending'
    });
    this.notifyListeners();
  }

  updateProgress(filename: string, progress: number, status: UploadProgress['status'], error?: string): void {
    const current = this.progress.get(filename);
    if (current) {
      this.progress.set(filename, {
        ...current,
        progress,
        status,
        error
      });
      this.notifyListeners();
    }
  }

  getProgress(): UploadProgress[] {
    return Array.from(this.progress.values());
  }

  onProgress(listener: (progress: UploadProgress[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    const progress = this.getProgress();
    this.listeners.forEach(listener => listener(progress));
  }

  reset(): void {
    this.progress.clear();
    this.notifyListeners();
  }
}