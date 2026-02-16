import axios from 'axios'
import { api } from '@/services/api'
import type { Message, ChatSession } from '../types/types'
import { chatLogger, createRequestTimer } from '@/lib/logger'

// Tipos da API backend
export interface ChatSessionResponse {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
  message_count: number
}

export interface ChatSessionListResponse {
  sessions: ChatSessionResponse[]
  total: number
  page: number
  page_size: number
}

export interface ChatMessageResponse {
  id: string
  session_id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp: string
  metadata?: string
}

export interface DocumentSource {
  id: string
  title: string
  score: number
}

export interface ChatRAGResponse {
  user_message: ChatMessageResponse
  assistant_message: ChatMessageResponse
  sources: DocumentSource[]
  context_used: boolean
  title?: string
}

// Request types
export interface CreateSessionRequest {
  title?: string
}

export interface SendRAGMessageRequest {
  content: string
  top_k?: number
}

// Mappers: converte respostas da API para tipos do domínio do frontend
const toMessage = (apiMessage: ChatMessageResponse): Message => ({
  id: apiMessage.id,
  role: apiMessage.role as 'user' | 'assistant',
  content: apiMessage.content,
  timestamp: new Date(apiMessage.timestamp),
})

const toChatSession = (apiSession: ChatSessionResponse, messages: Message[] = []): ChatSession => ({
  id: apiSession.id,
  title: apiSession.title,
  date: new Date(apiSession.created_at),
  messages,
})

// Cria uma nova sessão de chat
export const createChatSession = async (title?: string): Promise<ChatSession> => {
  const endTimer = createRequestTimer('/api/v1/chat/sessions', 'POST')
  chatLogger.info('Iniciando criação de sessão', { title })

  try {
    const response = await api.post<ChatSessionResponse>('/api/v1/chat/sessions', {
      title: title || 'Nova Conversa',
    })

    endTimer()
    chatLogger.info('Sessão criada com sucesso', { sessionId: response.data.id })
    return toChatSession(response.data)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.detail || error.message
      chatLogger.error('Erro ao criar sessão', { error: message })
      throw new Error(`Erro ao criar sessão: ${message}`)
    }
    throw error
  }
}

// Lista todas as sessões de chat
export const listChatSessions = async (): Promise<ChatSession[]> => {
  const endTimer = createRequestTimer('/api/v1/chat/sessions', 'GET')
  chatLogger.info('Listando sessões de chat')

  try {
    const response = await api.get<ChatSessionListResponse>('/api/v1/chat/sessions')

    endTimer()
    chatLogger.info('Sessões listadas com sucesso', { count: response.data.sessions.length })
    return response.data.sessions.map(session => toChatSession(session))
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.detail || error.message
      chatLogger.error('Erro ao listar sessões', { error: message })
      throw new Error(`Erro ao listar sessões: ${message}`)
    }
    throw error
  }
}

// Obtém detalhes de uma sessão com mensagens
export const getChatSession = async (sessionId: string): Promise<ChatSession> => {
  const endTimer = createRequestTimer(`/api/v1/chat/sessions/${sessionId}`, 'GET')
  chatLogger.info('Obtendo detalhes da sessão', { sessionId })

  try {
    const response = await api.get<ChatSessionResponse & { messages: ChatMessageResponse[] }>(
      `/api/v1/chat/sessions/${sessionId}`
    )

    endTimer()
    chatLogger.info('Detalhes da sessão obtidos', { sessionId, messageCount: response.data.messages?.length || 0 })
    const messages = response.data.messages?.map(toMessage) || []

    return toChatSession(response.data, messages)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.detail || error.message
      chatLogger.error('Erro ao obter sessão', { sessionId, error: message })
      throw new Error(`Erro ao obter sessão: ${message}`)
    }
    throw error
  }
}

// Envia mensagem usando RAG (Retrieval-Augmented Generation)
export const sendMessageWithRAG = async (
  sessionId: string,
  content: string,
  topK: number = 5
): Promise<{ message: Message; sources: DocumentSource[]; contextUsed: boolean; title?: string }> => {
  const endTimer = createRequestTimer(`/api/v1/chat/sessions/${sessionId}/rag`, 'POST')
  chatLogger.info('Enviando mensagem com RAG', { sessionId, contentLength: content.length, topK })
  const startTime = performance.now()

  try {
    const response = await api.post<ChatRAGResponse>(
      `/api/v1/chat/sessions/${sessionId}/rag`,
      {
        content,
        top_k: topK,
      }
    )

    const duration = Math.round(performance.now() - startTime)
    endTimer()
    chatLogger.info('Mensagem enviada com sucesso', {
      sessionId,
      duration,
      sourcesCount: response.data.sources.length,
      contextUsed: response.data.context_used,
      title: response.data.title
    })

    const assistantMessage = toMessage(response.data.assistant_message)

    return {
      message: assistantMessage,
      sources: response.data.sources,
      contextUsed: response.data.context_used,
      title: response.data.title,
    }
  } catch (error) {
    const duration = Math.round(performance.now() - startTime)
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.detail || error.message
      chatLogger.error('Erro ao enviar mensagem', { sessionId, duration, error: message })
      throw new Error(`Erro ao enviar mensagem: ${message}`)
    }
    chatLogger.error('Erro ao enviar mensagem', { sessionId, duration, error })
    throw error
  }
}

// Deleta uma sessão de chat
export const deleteChatSession = async (sessionId: string): Promise<void> => {
  try {
    await api.delete(`/api/v1/chat/sessions/${sessionId}`)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.detail || error.message
      throw new Error(`Erro ao deletar sessão: ${message}`)
    }
    throw error
  }
}

// Mantém função sendMessage antiga para compatibilidade, mas usa RAG internamente
export const sendMessage = async (
  message: string,
  sessionId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _history: Array<{ role: Message['role']; content: string }>
): Promise<{ response: string; message_id: string; session_id: string }> => {
  const result = await sendMessageWithRAG(sessionId, message)

  return {
    response: result.message.content,
    message_id: result.message.id,
    session_id: sessionId,
  }
}
