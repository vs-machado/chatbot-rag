import { DocumentUpload } from '@/features/DocumentUpload'

export function DocumentUploadPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 mb-10">
        <h2 className="text-3xl font-bold tracking-tight">Gerenciar Base de Conhecimento</h2>
        <p className="text-muted-foreground text-lg">
          Faça upload de documentos para alimentar seu chatbot com conhecimento personalizado
        </p>
      </div>

      <DocumentUpload />
    </div>
  )
}

export default DocumentUploadPage
