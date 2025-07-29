import { createContext } from 'react'

export interface ThemeContextType {
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

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined) 