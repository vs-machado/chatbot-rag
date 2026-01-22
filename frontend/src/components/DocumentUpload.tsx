import { useState } from 'react'
import axios from 'axios'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'

export default function DocumentUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [success, setSuccess] = useState<{ message: string; count: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
      setSuccess(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Por favor, selecione um arquivo.")
      return
    }

    setUploading(true)
    setProgress(0)
    setError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      // Assuming backend runs on port 8000. 
      const response = await axios.post('http://localhost:8000/api/v1/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
          setProgress(percentCompleted)
        },
      })

      setSuccess({
        message: response.data.message,
        count: response.data.documents_created
      })
      setFile(null)
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || "Erro ao fazer upload do arquivo. Verifique se o backend está rodando.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Upload de Documentos</CardTitle>
        <CardDescription>
          Envie seus documentos (PDF, DOCX, TXT, XLSX) para serem processados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="file-upload">Documento</Label>
          <Input 
            id="file-upload" 
            type="file" 
            accept=".pdf,.docx,.txt,.xlsx,.csv,.md"
            onChange={handleFileChange} 
            disabled={uploading}
            className="cursor-pointer"
          />
        </div>

        {uploading && (
          <div className="space-y-2">
            <Label>Processando...</Label>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 text-green-900 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Sucesso!</AlertTitle>
            <AlertDescription>
              {success.message} ({success.count} chunks criados)
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleUpload} 
          disabled={!file || uploading} 
          className="w-full"
        >
          {uploading ? (
            <>Enviando...</>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" /> Fazer Upload
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
