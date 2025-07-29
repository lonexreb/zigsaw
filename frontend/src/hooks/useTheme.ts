import { useContext } from 'react'
import { ThemeContext, ThemeContextType } from '../contexts/ThemeContext'

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
} 