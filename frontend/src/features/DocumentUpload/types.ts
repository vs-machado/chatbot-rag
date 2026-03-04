// Tipos para o estado do upload
export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

export interface UploadedDocument {
  id: string
  filename: string
  chunks: number
  uploadedAt: string
}

export interface UploadResponse {
  message: string
  documents_created: number
  document_ids?: string[]
}

export interface TempDocumentResponse {
  filename: string
  content: string
  content_type: string
}

export interface UseDocumentUploadReturn {
  selectedFile: File | null
  uploadStatus: UploadStatus
  uploadMessage: string
  isDragging: boolean
  uploadedDocuments: UploadedDocument[]
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleFileSelect: (file: File | null) => void
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleDragOver: (e: React.DragEvent) => void
  handleDragLeave: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
  handleUpload: () => Promise<void>
  handleRemoveDocument: (id: string) => void
  handleBrowseClick: () => void
  setSelectedFile: (file: File | null) => void
}
