import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useDocumentUpload } from './hooks'
import { DropZone } from './components/DropZone'
import { FilePreview } from './components/FilePreview'
import { UploadAlert } from './components/UploadAlert'
import { UploadButton } from './components/UploadButton'
import { DocumentList } from './components/DocumentList'

export function DocumentUpload() {
  const {
    selectedFile,
    uploadStatus,
    uploadMessage,
    isDragging,
    uploadedDocuments,
    fileInputRef,
    handleInputChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleUpload,
    handleRemoveDocument,
    handleBrowseClick,
    setSelectedFile,
  } = useDocumentUpload()

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
          <DropZone
            isDragging={isDragging}
            selectedFile={selectedFile}
            fileInputRef={fileInputRef}
            onInputChange={handleInputChange}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
          />

          {selectedFile && (
            <FilePreview
              file={selectedFile}
              onRemove={() => setSelectedFile(null)}
            />
          )}

          <UploadAlert status={uploadStatus} message={uploadMessage} />
        </CardContent>

        <CardFooter>
          <UploadButton
            status={uploadStatus}
            disabled={!selectedFile}
            onClick={handleUpload}
          />
        </CardFooter>
      </Card>

      <DocumentList
        documents={uploadedDocuments}
        onRemove={handleRemoveDocument}
      />
    </div>
  )
}

export default DocumentUpload
