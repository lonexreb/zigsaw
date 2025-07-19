import React, { createContext, useContext, useState, useEffect } from 'react'

interface ThemeContextType {
  isDark: boolean
  toggleTheme: () => void
  backgroundEffectsEnabled: boolean
  setBackgroundEffectsEnabled: (enabled: boolean) => void
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    border: string
    text: string
    textSecondary: string
    success: string
    error: string
    warning: string
  }
}

function getStoredTheme(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('isDark')
    if (stored !== null) {
      return JSON.parse(stored)
    }
  }
  return true // dark by default
}

function getStoredBackgroundEffectsEnabled(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('backgroundEffectsEnabled')
    if (stored !== null) {
      return JSON.parse(stored)
    }
  }
  return true // background effects enabled by default
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(() => getStoredTheme())
  const [backgroundEffectsEnabled, setBackgroundEffectsEnabledState] = useState(() => getStoredBackgroundEffectsEnabled())
  
  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem('isDark', JSON.stringify(newTheme))
    }
  }
  
  const setBackgroundEffectsEnabled = (enabled: boolean) => {
    setBackgroundEffectsEnabledState(enabled)
    if (typeof window !== 'undefined') {
      localStorage.setItem('backgroundEffectsEnabled', JSON.stringify(enabled))
    }
  }

  // Apply theme to document
  useEffect(() => {
    if (typeof window === 'undefined') return

    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(isDark ? 'dark' : 'light')
  }, [isDark])
  
  const colors = isDark
    ? {
        primary: 'black',
        secondary: 'gray-800',
        accent: 'white',
        background: 'gray-900',
        surface: 'gray-800',
        border: 'gray-700',
        text: 'white',
        textSecondary: 'gray-300',
        success: 'green-500',
        error: 'red-500',
        warning: 'yellow-500',
      }
    : {
        primary: 'gray-700',
        secondary: 'gray-600',
        accent: 'gray-900',
        background: 'gray-100',
        surface: 'white',
        border: 'gray-400',
        text: 'gray-900',
        textSecondary: 'gray-600',
        success: 'green-700',
        error: 'red-700',
        warning: 'yellow-700',
      }
  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, backgroundEffectsEnabled, setBackgroundEffectsEnabled, colors }}>
      {children}
    </ThemeContext.Provider>
  )
} 