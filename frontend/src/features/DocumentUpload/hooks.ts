import { useState, useRef, useCallback } from 'react'
import type { UploadStatus, UploadedDocument, UseDocumentUploadReturn } from './types'
import { validateFile } from './utils'
import { uploadDocument } from './services'

export const useDocumentUpload = (): UseDocumentUploadReturn => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [uploadMessage, setUploadMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handler para seleção de arquivo
  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) {
      setSelectedFile(null)
      return
    }

    const error = validateFile(file)
    if (error) {
      setUploadStatus('error')
      setUploadMessage(error)
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
    setUploadStatus('idle')
    setUploadMessage('')
  }, [])

  // Handler para input de arquivo
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    handleFileSelect(file)
  }

  // Handlers para drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    handleFileSelect(file)
  }, [handleFileSelect])

  // Handler para upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('error')
      setUploadMessage('Por favor, selecione um arquivo primeiro')
      return
    }

    setUploadStatus('uploading')
    setUploadMessage('')

    try {
      const data = await uploadDocument(selectedFile)
      
      // Adiciona o documento à lista
      const newDoc: UploadedDocument = {
        id: data.document_ids?.[0] || Date.now().toString(),
        filename: selectedFile.name,
        chunks: data.documents_created || 0,
        uploadedAt: new Date().toLocaleString('pt-BR'),
      }
      
      setUploadedDocuments(prev => [newDoc, ...prev])
      setUploadStatus('success')
      setUploadMessage(data.message || 'Documento processado com sucesso!')
      setSelectedFile(null)
      
      // Limpa o input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      setUploadStatus('error')
      setUploadMessage(
        error instanceof Error 
          ? error.message 
          : 'Erro ao fazer upload do documento. Tente novamente.'
      )
    }
  }

  // Handler para remover documento da lista (visual apenas)
  const handleRemoveDocument = (id: string) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== id))
  }

  // Handler para abrir seletor de arquivo
  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  return {
    selectedFile,
    uploadStatus,
    uploadMessage,
    isDragging,
    uploadedDocuments,
    fileInputRef,
    handleFileSelect,
    handleInputChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleUpload,
    handleRemoveDocument,
    handleBrowseClick,
    setSelectedFile,
  }
}
