// Utilitário para detectar preferência de formato de hora do navegador
export const detectHourFormat = (): '12' | '24' => {
  const timeString = new Intl.DateTimeFormat(navigator.language, {
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(2000, 0, 1, 15, 0))
  
  // Se contém AM/PM, é formato 12h
  return timeString.match(/[AP]\.?M\.?/i) ? '12' : '24'
}

// Cria formatador de data/hora baseado na preferência do navegador
export const createTimeFormatter = (): Intl.DateTimeFormat => {
  const hourFormat = detectHourFormat()
  
  return new Intl.DateTimeFormat(navigator.language, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: hourFormat === '12'
  })
}

// Formatador global (lazy-loaded)
let timeFormatter: Intl.DateTimeFormat | null = null

export const formatTime = (date: Date): string => {
  if (!timeFormatter) {
    timeFormatter = createTimeFormatter()
  }
  return timeFormatter.format(date)
}

// Reset do formatador (útil se o usuário mudar preferências)
export const resetTimeFormatter = () => {
  timeFormatter = null
}
