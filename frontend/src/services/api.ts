import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Instância global do axios
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

export default api
