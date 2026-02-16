import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ChatSession, Message } from '../types/types'
import {
  createChatSession,
  deleteChatSession,
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
  handleDeleteSession: (sessionId: string) => Promise<void>
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
          // Marca todas as sessões carregadas como persistidas
          const persistedSessions = backendSessions.map(s => ({ ...s, _isPersisted: true }))
          setSessions(persistedSessions)
          setActiveSessionId(backendSessions[0].id)

          // Carrega mensagens da primeira sessão automaticamente
          try {
            const sessionWithMessages = await getChatSession(backendSessions[0].id)
            setSessions((currentSessions) =>
              currentSessions.map((s) =>
                s.id === backendSessions[0].id ? { ...sessionWithMessages, _isPersisted: true } : s
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
        // Marca como persistida ao carregar do backend
        const persistedSession = { ...sessionWithMessages, _isPersisted: true }
        setSessions((currentSessions) =>
          currentSessions.map((s) =>
            s.id === sessionId ? persistedSession : s
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
    // Cria sessão localmente (sem salvar no backend ainda)
    const now = new Date()
    const newSession: ChatSession = {
      id: createLocalId(),
      title: NEW_CHAT_TITLE,
      date: now,
      messages: [
        {
          id: createLocalId(),
          role: NEW_CHAT_WELCOME_MESSAGE.role,
          content: NEW_CHAT_WELCOME_MESSAGE.content,
          timestamp: now,
        },
      ],
      _isPersisted: false, // Marca como não persistida
    }

    setSessions((currentSessions) => [newSession, ...currentSessions])
    setActiveSessionId(newSession.id)
    setError(null)
  }, [])

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!isInitialized || !activeSessionId || isLoading) return

      const session = sessions.find((s) => s.id === activeSessionId)
      if (!session) return

      const now = new Date()
      const userMessage: Message = {
        id: createLocalId(),
        role: 'user',
        content,
        timestamp: now,
      }

      // Adiciona mensagem do usuário localmente
      setSessions((currentSessions) =>
        currentSessions.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, userMessage] }
            : s
        )
      )

      setIsLoading(true)
      setError(null)

      try {
        let backendSessionId = activeSessionId

        // Se a sessão ainda não foi persistida, cria no backend primeiro
        if (!session._isPersisted) {
          const backendSession = await createChatSession(session.title)
          backendSessionId = backendSession.id

          // Atualiza o ID da sessão local para o ID do backend
          setSessions((currentSessions) =>
            currentSessions.map((s) =>
              s.id === activeSessionId
                ? { ...s, id: backendSession.id, _isPersisted: true }
                : s
            )
          )
          setActiveSessionId(backendSession.id)
        }

        // Envia mensagem via RAG
        const result = await sendMessageWithRAG(backendSessionId, content, 5)

        const assistantMessage: Message = {
          id: result.message.id,
          role: result.message.role,
          content: result.message.content,
          timestamp: new Date(),
        }

        // Adiciona resposta do assistente
        setSessions((currentSessions) =>
          currentSessions.map((s) =>
            s.id === backendSessionId
              ? { ...s, messages: [...s.messages, assistantMessage] }
              : s
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
    [isInitialized, activeSessionId, isLoading, sessions]
  )

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId)

    try {
      // Só chama a API se a sessão estiver persistida no backend
      if (session?._isPersisted !== false) {
        await deleteChatSession(sessionId)
      }

      // Remove a sessão do estado local
      setSessions((currentSessions) => {
        const updatedSessions = currentSessions.filter((s) => s.id !== sessionId)

        // Se a sessão deletada era a ativa, seleciona outra ou limpa
        if (activeSessionId === sessionId) {
          if (updatedSessions.length > 0) {
            setActiveSessionId(updatedSessions[0].id)
          } else {
            setActiveSessionId('')
          }
        }

        return updatedSessions
      })
    } catch (err) {
      console.error('Erro ao deletar sessão:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao deletar sessão. Tente novamente.'
      )
    }
  }, [activeSessionId, sessions])

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
    handleDeleteSession,
  }
}
