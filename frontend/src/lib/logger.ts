/**
 * Interface para resultado de requisição com timing
 */
interface RequestTiming {
  duration: number
  endpoint: string
  method: string
}

/**
 * Cria um timer para medir duração de requisições
 * @param endpoint - Nome do endpoint
 * @param method - Método HTTP
 * @returns Função para finalizar o timer e logar o resultado
 */
export function createRequestTimer(
  endpoint: string,
  method: string
): () => RequestTiming {
  const startTime = performance.now()

  return () => {
    const duration = Math.round(performance.now() - startTime)
    const result = { duration, endpoint, method }

    if (duration > 1000) {
      console.warn('[Requisição Lenta]', `${method} ${endpoint}`, result)
    } else {
      console.log('[Requisição]', `${method} ${endpoint}`, result)
    }

    return result
  }
}

/**
 * Logger específico para serviços de chat
 */
export const chatLogger = {
  info: (msg: string, data?: unknown) => console.log('[Chat]', msg, data),
  warn: (msg: string, data?: unknown) => console.warn('[Chat]', msg, data),
  error: (msg: string, data?: unknown) => console.error('[Chat]', msg, data),
}

/**
 * Logger específico para serviços de documentos
 */
export const documentLogger = {
  info: (msg: string, data?: unknown) => console.log('[Documents]', msg, data),
  warn: (msg: string, data?: unknown) => console.warn('[Documents]', msg, data),
  error: (msg: string, data?: unknown) => console.error('[Documents]', msg, data),
}

/**
 * Logger específico para API
 */
export const apiLogger = {
  info: (msg: string, data?: unknown) => console.log('[API]', msg, data),
  warn: (msg: string, data?: unknown) => console.warn('[API]', msg, data),
  error: (msg: string, data?: unknown) => console.error('[API]', msg, data),
}

/**
 * Logger geral
 */
export const logger = {
  info: (msg: string, data?: unknown) => console.log('[LOG]', msg, data),
  warn: (msg: string, data?: unknown) => console.warn('[LOG]', msg, data),
  error: (msg: string, data?: unknown) => console.error('[LOG]', msg, data),
}
