import axios from 'axios'
import { API_URL } from '../config'

// Cria instância do axios com configuração base
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para tratamento global de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tratamento padrão de erros
    if (error.response) {
      // Erro da resposta do servidor
      console.error('API Error:', error.response.data)
    } else if (error.request) {
      // Erro de requisição (não recebeu resposta)
      console.error('Network Error:', error.request)
    }
    return Promise.reject(error)
  }
)
