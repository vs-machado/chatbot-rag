import { API_URL, CHUNK_SIZE, CHUNK_OVERLAP } from './config'
import type { UploadResponse } from './types'

export const uploadDocument = async (
  file: File
): Promise<UploadResponse> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('chunk_size', CHUNK_SIZE.toString())
  formData.append('chunk_overlap', CHUNK_OVERLAP.toString())

  const response = await fetch(`${API_URL}/api/v1/documents/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `Erro ${response.status}: ${response.statusText}`)
  }

  return response.json()
}
