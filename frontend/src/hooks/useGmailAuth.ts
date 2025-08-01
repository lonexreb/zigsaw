import { useState, useEffect } from 'react'

interface GmailAuthStatus {
  isConnected: boolean
  hasTokens: boolean
  email?: string
  name?: string
  scopes?: string[]
  loading: boolean
  error?: string
  debug?: any
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

  const [sessionToken, setSessionToken] = useState<string | null>(null)

  const getSessionToken = async (): Promise<string | null> => {
    try {
      const backendUrl = 'https://zigsaw-backend.vercel.app'
      
      // Get a session token from the backend
      const response = await fetch(`${backendUrl}/api/auth/get-session-token`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.authenticated && data.sessionToken) {
          return data.sessionToken
        }
      }
      return null
    } catch (error) {
      console.error('Failed to get session token:', error)
      return null
    }
  }

  const checkGmailAuth = async (retryCount = 0) => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: undefined }))
      
      const backendUrl = 'https://zigsaw-backend.vercel.app'

      // Get or refresh session token
      let token = sessionToken
      if (!token) {
        token = await getSessionToken()
        if (token) {
          setSessionToken(token)
        }
      }

      if (!token) {
        // No valid session - retry a few times with delay for fresh sign-ins
        if (retryCount < 3) {
          console.log(`No session token, retrying in ${(retryCount + 1) * 2} seconds... (attempt ${retryCount + 1}/3)`)
          setTimeout(() => {
            checkGmailAuth(retryCount + 1)
          }, (retryCount + 1) * 2000) // 2s, 4s, 6s delays
          return
        }
        
        setStatus({
          isConnected: false,
          hasTokens: false,
          loading: false,
          error: 'Authentication failed'
        })
        return
      }

      // Use the session token for API requests
      const sessionResponse = await fetch(`${backendUrl}/api/auth/session-check`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!sessionResponse.ok || sessionResponse.status === 401) {
        // Token might be expired, try to get a new one
        const newToken = await getSessionToken()
        if (newToken && retryCount < 3) {
          setSessionToken(newToken)
          console.log(`Token expired, got new token, retrying... (attempt ${retryCount + 1}/3)`)
          setTimeout(() => {
            checkGmailAuth(retryCount + 1)
          }, 1000)
          return
        }
        
        const errorData = await sessionResponse.json().catch(() => ({}))
        console.log('Session check failed:', {
          status: sessionResponse.status,
          statusText: sessionResponse.statusText,
          errorData
        })
        
        setStatus({
          isConnected: false,
          hasTokens: false,
          loading: false,
          error: 'Authentication failed',
          debug: errorData
        })
        return
      }

      const sessionData = await sessionResponse.json()
      
      if (!sessionData.authenticated || !sessionData.hasGmailAccess) {
        setStatus({
          isConnected: false,
          hasTokens: false,
          loading: false,
          error: 'No Gmail access found'
        })
        return
      }

      // Now check if we have Gmail tokens
      const response = await fetch(`${backendUrl}/api/gmail/tokens`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
          loading: false,
          error: 'Gmail authentication failed'
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
    
    // Check if user just returned from Gmail or GCal sign-in
    const hasGmailCallback = window.sessionStorage.getItem('gmailSignInCallback')
    const hasGcalCallback = window.sessionStorage.getItem('gcalSignInCallback')
    
    if (hasGmailCallback || hasGcalCallback) {
      if (hasGmailCallback) window.sessionStorage.removeItem('gmailSignInCallback')
      if (hasGcalCallback) window.sessionStorage.removeItem('gcalSignInCallback')
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