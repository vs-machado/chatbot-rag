import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const fallbackTheme: Theme = defaultTheme

    try {
      const storedTheme = localStorage.getItem(storageKey)
      if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
        return storedTheme
      }
    } catch {
      return fallbackTheme
    }

    return fallbackTheme
  })

  useEffect(() => {
    const root = window.document.documentElement
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const applyTheme = (resolvedTheme: "light" | "dark") => {
      root.classList.remove("light", "dark")
      root.classList.add(resolvedTheme)
      root.style.colorScheme = resolvedTheme
    }

    if (theme === "system") {
      const handleSystemThemeChange = () => {
        const systemTheme = mediaQuery.matches ? "dark" : "light"
        applyTheme(systemTheme)
      }

      handleSystemThemeChange()
      mediaQuery.addEventListener("change", handleSystemThemeChange)

      return () => {
        mediaQuery.removeEventListener("change", handleSystemThemeChange)
      }
    }

    applyTheme(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
