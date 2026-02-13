import type { Message } from '../types/types'

// Tipos para a API de chat
export interface ChatRequest {
  message: string
  session_id: string
  history: Array<{
    role: Message['role']
    content: string
  }>
}

export interface ChatResponse {
  response: string
  message_id: string
  session_id: string
}

// Placeholder para API de chat - simula delay e resposta
export const sendMessage = async (
  message: string,
  sessionId: string,
  history: Array<{ role: Message['role']; content: string }>
): Promise<ChatResponse> => {
  const requestBody: ChatRequest = {
    message,
    session_id: sessionId,
    history,
  }

  // TODO: Substitua pela chamada real à API
  // const response = await api.post<ChatResponse>('/api/v1/chat', requestBody)
  // return response.data

  // Simulação de chamada API
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Usa requestBody para evitar warning de unused
  console.log('Request body:', requestBody)

  return {
    response: `Esta é uma resposta placeholder para: "${message}"`,
    message_id: `msg_${Date.now()}`,
    session_id: sessionId,
  }
}
