// Constantes de configuração do upload
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export const ALLOWED_TYPES = ['.pdf', '.docx', '.txt']
export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
export const CHUNK_SIZE = 1000
export const CHUNK_OVERLAP = 200
