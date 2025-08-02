import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function AuthSuccess() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        // Try to create a session token using the backend endpoint
        // At this point we're on the same domain as the NextAuth backend
        const response = await fetch('/api/auth/create-session-token', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Session token created successfully')
          // Redirect to frontend with the token
          window.location.href = `https://zigsaw.dev/workflow?token=${data.sessionToken}&auth=success`
        } else {
          console.error('Failed to create session token:', response.status)
          // Redirect without token - let frontend handle fallback
          window.location.href = 'https://zigsaw.dev/workflow?auth=success'
        }
      } catch (error) {
        console.error('Auth success error:', error)
        window.location.href = 'https://zigsaw.dev/workflow?auth=error'
      }
    }

    handleAuthSuccess()
  }, [])

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Authentication Successful</h1>
      <p>Redirecting you back to Zigsaw...</p>
      <div>🔄 Processing...</div>
    </div>
  )
}