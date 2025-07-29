import { useState, useEffect } from 'react'

interface GmailAuthStatus {
  isConnected: boolean
  hasTokens: boolean
  email?: string
  name?: string
  scopes?: string[]
  loading: boolean
  error?: string
}

interface GmailTokens {
  access_token?: string
  refresh_token?: string
  email?: string
  name?: string
  picture?: string
}

export function useGmailAuth() {
  const [status, setStatus] = useState<GmailAuthStatus>({
    isConnected: false,
    hasTokens: false,
    loading: true
  })

  const checkGmailAuth = async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: undefined }))
      
      // Determine backend URL based on environment
      const isLocalhost = window.location.hostname === 'localhost'
      const backendUrl = isLocalhost 
        ? 'http://localhost:3000' 
        : 'https://zigsaw-backend.vercel.app'

      // Check if we have Gmail tokens
      const response = await fetch(`${backendUrl}/api/gmail/tokens`, {
        credentials: 'include', // Include cookies for session
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const tokens: GmailTokens = data.tokens || {}
        
        setStatus({
          isConnected: true,
          hasTokens: !!tokens.access_token,
          email: tokens.email,
          name: tokens.name,
          scopes: data.scopes || [],
          loading: false
        })
      } else if (response.status === 401) {
        // Not authenticated
        setStatus({
          isConnected: false,
          hasTokens: false,
          loading: false
        })
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('Gmail auth check failed:', error)
      setStatus({
        isConnected: false,
        hasTokens: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const refreshTokens = async () => {
    try {
      const isLocalhost = window.location.hostname === 'localhost'
      const backendUrl = isLocalhost 
        ? 'http://localhost:3000' 
        : 'https://zigsaw-backend.vercel.app'

      const response = await fetch(`${backendUrl}/api/auth/refresh-token`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Refresh the auth status after successful token refresh
        await checkGmailAuth()
        return true
      }
      return false
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }

  // Check auth status on mount and when window gains focus
  useEffect(() => {
    checkGmailAuth()

    const handleFocus = () => checkGmailAuth()
    window.addEventListener('focus', handleFocus)
    
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  return {
    ...status,
    refresh: checkGmailAuth,
    refreshTokens
  }
} 