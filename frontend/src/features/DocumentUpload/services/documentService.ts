import axios from 'axios'
import { api } from '@/services/api'
import { CHUNK_SIZE, CHUNK_OVERLAP } from '../config'
import type { UploadResponse, TempDocumentResponse } from '../types'

export const uploadDocument = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('chunk_size', CHUNK_SIZE.toString())
  formData.append('chunk_overlap', CHUNK_OVERLAP.toString())

  try {
    const response = await api.post<UploadResponse>('/api/v1/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.detail || error.message
      throw new Error(message)
    }
    throw error
  }
}

export const processTempDocument = async (file: File): Promise<TempDocumentResponse> => {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await api.post<TempDocumentResponse>('/api/v1/documents/process-temp', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.detail || error.message
      throw new Error(message)
    }
    throw error
  }
}
