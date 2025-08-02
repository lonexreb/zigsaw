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

  const checkGmailAuth = async (retryCount = 0) => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: undefined }))
      
      const backendUrl = 'https://zigsaw-backend.vercel.app'

      // First, try to get a session token if we don't have one
      let sessionToken = localStorage.getItem('sessionToken')
      
      if (!sessionToken) {
        // Try to get a session token from the backend
        const tokenResponse = await fetch(`${backendUrl}/api/auth/get-session-token`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json()
          if (tokenData.authenticated && tokenData.sessionToken) {
            sessionToken = tokenData.sessionToken
            localStorage.setItem('sessionToken', sessionToken)
          }
        }
      }

      // Check authentication status using the session token or cookies
      const authResponse = await fetch(`${backendUrl}/api/auth/check-auth`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` })
        }
      })

      const authData = await authResponse.json()
      
      if (!authData.authenticated) {
        // Clear any stored session token if not authenticated
        localStorage.removeItem('sessionToken')
        
        // User is not authenticated - this is normal, not an error
        setStatus({
          isConnected: false,
          hasTokens: false,
          loading: false
        })
        return
      }

      if (!authData.hasGmailAccess) {
        setStatus({
          isConnected: false,
          hasTokens: false,
          loading: false,
          error: 'No Gmail access found'
        })
        return
      }

      // User is authenticated and has Gmail access
      // Now check if we have Gmail tokens
      const response = await fetch(`${backendUrl}/api/gmail/tokens`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` })
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
        // Clear invalid session token
        localStorage.removeItem('sessionToken')
        
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
    // Check if user just returned from authentication with token
    const urlParams = new URLSearchParams(window.location.search)
    const authSuccess = urlParams.get('auth')
    const tokenFromUrl = urlParams.get('token')
    
    if (authSuccess === 'success' && tokenFromUrl) {
      // Store the token and check auth
      localStorage.setItem('sessionToken', tokenFromUrl)
      console.log('Session token received from URL and stored')
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname)
      checkGmailAuth()
    } else if (authSuccess === 'success') {
      // Try to create a session token (fallback)
      createSessionToken()
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (authSuccess === 'error') {
      // Authentication failed
      console.error('Authentication failed')
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname)
      checkGmailAuth()
    } else {
      checkGmailAuth()
    }

    const handleFocus = () => checkGmailAuth()
    window.addEventListener('focus', handleFocus)
    
    // Check if user just returned from Gmail or GCal sign-in
    const hasGmailCallback = window.sessionStorage.getItem('gmailSignInCallback')
    const hasGcalCallback = window.sessionStorage.getItem('gcalSignInCallback')
    
    if (hasGmailCallback || hasGcalCallback) {
      if (hasGmailCallback) window.sessionStorage.removeItem('gmailSignInCallback')
      if (hasGcalCallback) window.sessionStorage.removeItem('gcalSignInCallback')
      // Wait for the auth parameter to be processed above
      setTimeout(() => {
        if (!localStorage.getItem('sessionToken')) {
          createSessionToken()
        }
      }, 1000)
    }
    
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const createSessionToken = async () => {
    try {
      const backendUrl = 'https://zigsaw-backend.vercel.app'
      
      // Create a session token using the fresh OAuth session
      const response = await fetch(`${backendUrl}/api/auth/create-session-token`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.sessionToken) {
          localStorage.setItem('sessionToken', data.sessionToken)
          console.log('Session token created and stored')
          // Now check authentication status
          checkGmailAuth()
        }
      } else {
        console.error('Failed to create session token:', response.status)
        // Fallback to normal auth check
        setTimeout(() => checkGmailAuth(), 2000)
      }
    } catch (error) {
      console.error('Error creating session token:', error)
      // Fallback to normal auth check
      setTimeout(() => checkGmailAuth(), 2000)
    }
  }

  return {
    ...status,
    refresh: checkGmailAuth,
    refreshTokens
  }
} 