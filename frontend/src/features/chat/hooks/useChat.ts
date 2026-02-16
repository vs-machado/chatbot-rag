import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ChatSession, Message } from '../types/types'
import {
  createChatSession,
  getChatSession,
  listChatSessions,
  sendMessageWithRAG,
} from '../services/chatService'
import { NEW_CHAT_TITLE, NEW_CHAT_WELCOME_MESSAGE } from '../constants'

const createLocalId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export interface UseChatReturn {
  sessions: ChatSession[]
  activeSessionId: string
  activeSession: ChatSession | null
  activeMessages: Message[]
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  handleSelectSession: (sessionId: string) => void
  handleNewChat: () => Promise<void>
  handleSendMessage: (content: string) => Promise<void>
}

export const useChat = (): UseChatReturn => {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Carrega sessões do backend na inicialização
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const backendSessions = await listChatSessions()
        if (backendSessions.length > 0) {
          setSessions(backendSessions)
          setActiveSessionId(backendSessions[0].id)

          // Carrega mensagens da primeira sessão automaticamente
          try {
            const sessionWithMessages = await getChatSession(backendSessions[0].id)
            setSessions((currentSessions) =>
              currentSessions.map((s) =>
                s.id === backendSessions[0].id ? sessionWithMessages : s
              )
            )
          } catch (err) {
            console.error('Erro ao carregar mensagens da sessão inicial:', err)
          }
        }
        setIsInitialized(true)
      } catch (err) {
        console.error('Erro ao carregar sessões:', err)
        setIsInitialized(true)
      }
    }

    loadSessions()
  }, [])

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [sessions, activeSessionId]
  )

  const activeMessages = activeSession?.messages ?? []

  const handleSelectSession = useCallback(async (sessionId: string) => {
    setActiveSessionId(sessionId)
    setError(null)

    // Busca mensagens da sessão se ainda não estiverem carregadas
    const session = sessions.find((s) => s.id === sessionId)
    if (session && session.messages.length === 0) {
      try {
        setIsLoading(true)
        const sessionWithMessages = await getChatSession(sessionId)
        setSessions((currentSessions) =>
          currentSessions.map((s) =>
            s.id === sessionId ? sessionWithMessages : s
          )
        )
      } catch (err) {
        console.error('Erro ao carregar mensagens da sessão:', err)
        setError(
          err instanceof Error
            ? err.message
            : 'Erro ao carregar mensagens. Tente novamente.'
        )
      } finally {
        setIsLoading(false)
      }
    }
  }, [sessions])

  const handleNewChat = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Cria sessão no backend
      const now = new Date()
      const backendSession = await createChatSession(NEW_CHAT_TITLE)

      // Adiciona mensagem de boas-vindas localmente
      const newSession: ChatSession = {
        ...backendSession,
        messages: [
          {
            id: createLocalId(),
            role: NEW_CHAT_WELCOME_MESSAGE.role,
            content: NEW_CHAT_WELCOME_MESSAGE.content,
            timestamp: now,
          },
        ],
      }

      setSessions((currentSessions) => [newSession, ...currentSessions])
      setActiveSessionId(newSession.id)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao criar nova conversa. Tente novamente.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!isInitialized || !activeSessionId || isLoading) return

      const now = new Date()
      const userMessage: Message = {
        id: createLocalId(),
        role: 'user',
        content,
        timestamp: now,
      }

      // Adiciona mensagem do usuário localmente
      setSessions((currentSessions) =>
        currentSessions.map((session) =>
          session.id === activeSessionId
            ? { ...session, messages: [...session.messages, userMessage] }
            : session
        )
      )

      setIsLoading(true)
      setError(null)

      try {
        // Envia mensagem via RAG
        const result = await sendMessageWithRAG(activeSessionId, content, 5)

        const assistantMessage: Message = {
          id: result.message.id,
          role: result.message.role,
          content: result.message.content,
          timestamp: new Date(),
        }

        // Adiciona resposta do assistente
        setSessions((currentSessions) =>
          currentSessions.map((session) =>
            session.id === activeSessionId
              ? { ...session, messages: [...session.messages, assistantMessage] }
              : session
          )
        )

        // Log para debugging (pode ser removido em produção)
        if (result.contextUsed) {
          console.log('Documentos usados:', result.sources)
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Erro ao enviar mensagem. Tente novamente.'
        )
      } finally {
        setIsLoading(false)
      }
    },
    [isInitialized, activeSessionId, isLoading]
  )

  return {
    sessions,
    activeSessionId,
    activeSession,
    activeMessages,
    isLoading,
    isInitialized,
    error,
    handleSelectSession,
    handleNewChat,
    handleSendMessage,
  }
}
