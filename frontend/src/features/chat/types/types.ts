export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ChatModelOption {
  id: string
  label: string
  provider: string
}

export interface ChatSession {
  id: string
  title: string
  date: Date
  messages: Message[]
  _isPersisted?: boolean // Flag para indicar se a sessão já foi salva no backend
}
