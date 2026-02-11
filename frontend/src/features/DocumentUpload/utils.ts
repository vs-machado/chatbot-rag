import { ALLOWED_TYPES, MAX_FILE_SIZE } from './config'

// Validação do arquivo
export const validateFile = (file: File): string | null => {
  const extension = `.${file.name.split('.').pop()?.toLowerCase()}`
  
  if (!ALLOWED_TYPES.includes(extension)) {
    return `Tipo de arquivo não suportado. Use: ${ALLOWED_TYPES.join(', ')}`
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`
  }
  
  return null
}

// Formata o tamanho do arquivo para exibição
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// Formata data para exibição
export const formatDate = (date: Date): string => {
  return date.toLocaleString('pt-BR')
}
