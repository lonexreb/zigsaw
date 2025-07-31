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

  const checkGmailAuth = async (retryCount = 0) => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: undefined }))
      
      // Always use production backend URL for now
      const backendUrl = 'https://zigsaw-backend.vercel.app'

      // First check if we have a valid session
      const sessionResponse = await fetch(`${backendUrl}/api/auth/session-check`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!sessionResponse.ok || sessionResponse.status === 401) {
        // No valid session - retry a few times with delay for fresh sign-ins
        if (retryCount < 3) {
          console.log(`Session check failed (401), retrying in ${(retryCount + 1) * 2} seconds... (attempt ${retryCount + 1}/3)`)
          setTimeout(() => {
            checkGmailAuth(retryCount + 1)
          }, (retryCount + 1) * 2000) // 2s, 4s, 6s delays
          return
        }
        
        setStatus({
          isConnected: false,
          hasTokens: false,
          loading: false
        })
        return
      }

      const sessionData = await sessionResponse.json()
      
      if (!sessionData.authenticated || !sessionData.hasGmailAccess) {
        setStatus({
          isConnected: false,
          hasTokens: false,
          loading: false
        })
        return
      }

      // Now check if we have Gmail tokens
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
        // Not authenticated - retry a few times with delay for fresh sign-ins
        if (retryCount < 3) {
          console.log(`Gmail auth check failed (401), retrying in ${(retryCount + 1) * 2} seconds... (attempt ${retryCount + 1}/3)`)
          setTimeout(() => {
            checkGmailAuth(retryCount + 1)
          }, (retryCount + 1) * 2000) // 2s, 4s, 6s delays
          return
        }
        
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
    
    // Check if user just returned from Gmail sign-in
    const hasGmailCallback = window.sessionStorage.getItem('gmailSignInCallback')
    if (hasGmailCallback) {
      window.sessionStorage.removeItem('gmailSignInCallback')
      // Wait a bit for the session to be established, then check auth
      setTimeout(() => {
        checkGmailAuth()
      }, 2000)
    }
    
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  return {
    ...status,
    refresh: checkGmailAuth,
    refreshTokens
  }
} 