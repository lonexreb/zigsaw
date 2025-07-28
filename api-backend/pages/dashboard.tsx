import { useSession, signOut } from 'next-auth/react'
import { useEffect } from 'react'

export default function Dashboard() {
  const { data: session, status } = useSession()

  useEffect(() => {
    // If no session, redirect to sign in
    if (status !== 'loading' && !session) {
      window.location.href = '/api/auth/signin'
    }
  }, [session, status])

  if (status === 'loading') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui'
      }}>
        <div>Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui'
      }}>
        <div>
          <h2>Not authenticated</h2>
          <a href="/api/auth/signin">Sign in</a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'system-ui',
      padding: '20px'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h1>🎉 Authentication Successful!</h1>
        <div style={{ 
          background: '#f5f5f5', 
          padding: '20px', 
          borderRadius: '8px', 
          margin: '20px 0',
          textAlign: 'left'
        }}>
          <h3>Session Info:</h3>
          <p><strong>Name:</strong> {session.user?.name}</p>
          <p><strong>Email:</strong> {session.user?.email}</p>
          <p><strong>Image:</strong> {session.user?.image && <img src={session.user.image} alt="Profile" style={{ width: '30px', height: '30px', borderRadius: '50%' }} />}</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button 
            onClick={() => signOut()}
            style={{ 
              padding: '10px 20px', 
              background: '#dc2626', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
          
          <button 
            onClick={() => {
              const isLocalhost = window.location.hostname === 'localhost'
              const frontendUrl = isLocalhost ? 'http://localhost:8080' : 'https://your-frontend-domain.com'
              window.location.href = frontendUrl
            }}
            style={{ 
              padding: '10px 20px', 
              background: '#2563eb', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Go to Frontend
          </button>
        </div>
        
        <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
          <p>✅ Google OAuth is working correctly!</p>
          <p>You can now integrate this authentication into your frontend application.</p>
        </div>
      </div>
    </div>
  )
} 