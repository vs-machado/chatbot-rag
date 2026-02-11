import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

// Tipos para o estado do upload
type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

interface UploadedDocument {
  id: string
  filename: string
  chunks: number
  uploadedAt: string
}

// Constantes de configuração
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const ALLOWED_TYPES = ['.pdf', '.docx', '.txt']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export function DocumentUpload() {
  // Estados do componente
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [uploadMessage, setUploadMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Validação do arquivo
  const validateFile = (file: File): string | null => {
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`
    
    if (!ALLOWED_TYPES.includes(extension)) {
      return `Tipo de arquivo não suportado. Use: ${ALLOWED_TYPES.join(', ')}`
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`
    }
    
    return null
  }

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
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('chunk_size', '1000')
      formData.append('chunk_overlap', '200')

      const response = await fetch(`${API_URL}/api/v1/documents/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Erro ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
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

  return (
    <div className="space-y-6">
      {/* Card de Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload de Documentos</CardTitle>
          <CardDescription>
            Faça upload de arquivos PDF, DOCX ou TXT para adicionar à base de conhecimento do chatbot
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Área de Drop */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              onChange={handleInputChange}
              className="hidden"
            />
            
            <div className="space-y-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto text-muted-foreground"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
              
              <div className="text-sm text-muted-foreground">
                {selectedFile ? (
                  <span className="font-medium text-foreground">{selectedFile.name}</span>
                ) : (
                  <>
                    <span className="font-medium text-foreground">Clique para selecionar</span>
                    {' '}ou arraste e solte
                  </>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground">
                PDF, DOCX ou TXT até {MAX_FILE_SIZE / 1024 / 1024}MB
              </div>
            </div>
          </div>

          {/* Informações do arquivo selecionado */}
          {selectedFile && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedFile(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
              >
                Remover
              </Button>
            </div>
          )}

          {/* Alertas de status */}
          {uploadStatus === 'error' && (
            <Alert variant="destructive">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{uploadMessage}</AlertDescription>
            </Alert>
          )}

          {uploadStatus === 'success' && (
            <Alert>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <AlertTitle>Sucesso</AlertTitle>
              <AlertDescription>{uploadMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadStatus === 'uploading'}
            className="w-full"
          >
            {uploadStatus === 'uploading' ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processando...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
                Fazer Upload
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Lista de Documentos Uploadados */}
      {uploadedDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documentos Processados</CardTitle>
            <CardDescription>
              {uploadedDocuments.length} documento{uploadedDocuments.length !== 1 ? 's' : ''} na base de conhecimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uploadedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium">{doc.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.chunks} chunks • {doc.uploadedAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Processado</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRemoveDocument(doc.id)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DocumentUpload
