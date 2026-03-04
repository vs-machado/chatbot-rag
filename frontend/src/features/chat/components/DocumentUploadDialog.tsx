import { useState, useRef } from 'react'
import { FileText, Upload, Database, MessageSquare, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { ALLOWED_TYPES, MAX_FILE_SIZE } from '@/features/DocumentUpload/config'
import { uploadDocument, processTempDocument } from '@/features/DocumentUpload/services'
import type { TempDocumentResponse } from '@/features/DocumentUpload/types'

interface DocumentUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDocumentsProcessed: (documents: Array<{ content: string; filename: string }>) => void
}

type UploadMode = 'persist' | 'temp' | null

export function DocumentUploadDialog({
  open,
  onOpenChange,
  onDocumentsProcessed,
}: DocumentUploadDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadMode, setUploadMode] = useState<UploadMode>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      validateAndSetFiles(files)
    }
  }

  const validateAndSetFiles = (files: File[]) => {
    setError(null)
    const validFiles: File[] = []
    const errors: string[] = []

    files.forEach((file) => {
      // Verifica extensão
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!ALLOWED_TYPES.includes(fileExtension)) {
        errors.push(`${file.name}: Unsupported file type`)
        return
      }

      // Verifica tamanho
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File is too large`)
        return
      }

      validFiles.push(file)
    })

    if (errors.length > 0) {
      setError(errors.join('. '))
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles])
      setUploadMode(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      validateAndSetFiles(files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    if (selectedFiles.length <= 1) {
      setUploadMode(null)
    }
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !uploadMode) return

    setIsUploading(true)
    setError(null)

    try {
      if (uploadMode === 'persist') {
        // Faz upload e persiste no banco (cria embeddings) para todos os arquivos
        for (const file of selectedFiles) {
          await uploadDocument(file)
        }
        // Para persistência, informamos sucesso sem conteúdo - documentos estarão disponíveis no RAG
        onDocumentsProcessed(selectedFiles.map((f) => ({ content: '', filename: f.name })))
      } else {
        // Processa temporariamente (sem persistir) todos os arquivos
        const results: TempDocumentResponse[] = []
        for (const file of selectedFiles) {
          const result = await processTempDocument(file)
          results.push(result)
        }
        onDocumentsProcessed(
          results.map((r) => ({ content: r.content, filename: r.filename }))
        )
      }

      // Reseta estado
      setSelectedFiles([])
      setUploadMode(null)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing files')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setSelectedFiles([])
    setUploadMode(null)
    setError(null)
    onOpenChange(false)
  }

  const totalSize = selectedFiles.reduce((acc, file) => acc + file.size, 0)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Add Documents</DialogTitle>
          <DialogDescription>
            Select one or more files and choose how to use them in this conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Área de drop/Seleção de arquivo */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer',
              'hover:border-primary/50 hover:bg-accent/50 transition-colors'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept={ALLOWED_TYPES.join(',')}
              onChange={handleFileSelect}
            />
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click or drag files here
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, DOCX or TXT (max {MAX_FILE_SIZE / 1024 / 1024}MB each)
            </p>
          </div>

          {/* Lista de arquivos selecionados */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {selectedFiles.length} file(s) selected
                </p>
                <p className="text-xs text-muted-foreground">
                  Total: {(totalSize / 1024).toFixed(1)} KB
                </p>
              </div>
              
              <div className="h-30 overflow-y-auto border rounded-lg p-2">
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-3 p-2 bg-muted rounded-md"
                      style={{ maxWidth: '100%' }}
                    >
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p 
                          className="text-sm font-medium truncate"
                          style={{ maxWidth: '240px' }}
                        >
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Opções de upload */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">How would you like to use these documents?</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setUploadMode('persist')}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-lg border-2 text-left transition-all',
                    uploadMode === 'persist'
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-muted-foreground/50'
                  )}
                >
                  <Database className="h-6 w-6 text-primary" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Save to Knowledge Base</p>
                    <p className="text-xs text-muted-foreground">
                      Available in all conversations
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setUploadMode('temp')}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-lg border-2 text-left transition-all',
                    uploadMode === 'temp'
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-muted-foreground/50'
                  )}
                >
                  <MessageSquare className="h-6 w-6 text-primary" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Use in This Chat</p>
                    <p className="text-xs text-muted-foreground">
                      Only for this chat session
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Mensagem de erro */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || !uploadMode || isUploading}
          >
            {isUploading
              ? 'Processing...'
              : `Confirm (${selectedFiles.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
