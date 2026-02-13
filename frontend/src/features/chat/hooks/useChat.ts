import { useCallback, useMemo, useState } from 'react'
import type { ChatSession, Message } from '../types/types'
import { sendMessage } from '../services/chatService'
import {
  INITIAL_CHAT_SESSIONS,
  NEW_CHAT_TITLE,
  NEW_CHAT_WELCOME_MESSAGE,
} from '../constants'

const createId = () => {
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
  error: string | null
  handleSelectSession: (sessionId: string) => void
  handleNewChat: () => void
  handleSendMessage: (content: string) => Promise<void>
}

export const useChat = (): UseChatReturn => {
  const [sessions, setSessions] = useState<ChatSession[]>(INITIAL_CHAT_SESSIONS)
  const [activeSessionId, setActiveSessionId] = useState<string>(
    INITIAL_CHAT_SESSIONS[0]?.id ?? ''
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [sessions, activeSessionId]
  )

  const activeMessages = activeSession?.messages ?? []

  const handleSelectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId)
    setError(null)
  }, [])

  const handleNewChat = useCallback(() => {
    const now = new Date()
    const newSessionId = createId()

    const newSession: ChatSession = {
      id: newSessionId,
      title: NEW_CHAT_TITLE,
      date: now,
      messages: [
        {
          id: createId(),
          role: NEW_CHAT_WELCOME_MESSAGE.role,
          content: NEW_CHAT_WELCOME_MESSAGE.content,
          timestamp: now,
        },
      ],
    }

    setSessions((currentSessions) => [newSession, ...currentSessions])
    setActiveSessionId(newSessionId)
    setError(null)
  }, [])

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!activeSessionId || isLoading) return

      const now = new Date()
      const userMessage: Message = {
        id: createId(),
        role: 'user',
        content,
        timestamp: now,
      }

      // Adiciona mensagem do usuário
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
        // Pega o estado atualizado para enviar o histórico
        const currentSession = sessions.find(s => s.id === activeSessionId)
        const history = (currentSession?.messages ?? []).map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

        const response = await sendMessage(content, activeSessionId, history)

        const assistantMessage: Message = {
          id: createId(),
          role: 'assistant',
          content: response.response,
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
    [activeSessionId, sessions, isLoading]
  )

  return {
    sessions,
    activeSessionId,
    activeSession,
    activeMessages,
    isLoading,
    error,
    handleSelectSession,
    handleNewChat,
    handleSendMessage,
  }
}
