import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function AuthSuccess() {
  const router = useRouter()

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    const handleAuthSuccess = async () => {
      try {
        console.log('Auth success page loaded, creating session token...')
        
        // Try to create a session token using the backend endpoint
        // At this point we're on the same domain as the NextAuth backend
        const response = await fetch('/api/auth/create-session-token', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        console.log('Create session token response:', response.status)

        if (response.ok) {
          const data = await response.json()
          console.log('Session token created successfully:', !!data.sessionToken)
          
          // Check if this is a popup window
          if (window.opener) {
            // This is a popup - communicate with parent window
            window.opener.postMessage({
              type: 'AUTH_SUCCESS',
              token: data.sessionToken,
              user: data.user
            }, 'https://zigsaw.dev')
            window.close()
          } else {
            // This is a full redirect - go to frontend with token
            window.location.href = `https://zigsaw.dev/workflow?token=${data.sessionToken}&auth=success`
          }
        } else {
          console.error('Failed to create session token:', response.status)
          const errorData = await response.text()
          console.error('Error details:', errorData)
          
          if (window.opener) {
            // Popup - send error to parent
            window.opener.postMessage({
              type: 'AUTH_ERROR',
              error: 'Failed to create session token'
            }, 'https://zigsaw.dev')
            window.close()
          } else {
            // Redirect - go to frontend with error
            window.location.href = 'https://zigsaw.dev/workflow?auth=error'
          }
        }
      } catch (error) {
        console.error('Auth success error:', error)
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        if (window.opener) {
          // Popup - send error to parent
          window.opener.postMessage({
            type: 'AUTH_ERROR',
            error: errorMessage
          }, 'https://zigsaw.dev')
          window.close()
        } else {
          // Redirect - go to frontend with error
          window.location.href = 'https://zigsaw.dev/workflow?auth=error'
        }
      }
    }

    handleAuthSuccess()
  }, [])

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Authentication Successful</h1>
      <p>{typeof window !== 'undefined' && window.opener ? 'Completing authentication...' : 'Redirecting you back to Zigsaw...'}</p>
      <div>🔄 Processing...</div>
    </div>
  )
}