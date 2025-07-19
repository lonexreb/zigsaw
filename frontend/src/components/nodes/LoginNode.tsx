import { useState } from 'react'

interface LoginNodeProps {
  id: string
  data: {
    onLogin?: (email: string, password: string) => Promise<void>
    onSignUp?: (email: string, password: string) => Promise<void>
    onContinue?: () => void
    variant?: string
  }
  selected: boolean
}

export function LoginNode({ id, data, selected }: LoginNodeProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const isGlass = data.variant === 'glass'

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      if (isSignUp && data.onSignUp) await data.onSignUp(email, password)
      else if (!isSignUp && data.onLogin) await data.onLogin(email, password)
    } catch (err: any) {
      setError(err?.message || 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div style={{
        minWidth: 340,
        maxWidth: 380,
        background: isGlass ? 'rgba(255,255,255,0.22)' : '#fff',
        border: selected ? '2px solid #222' : '1px solid rgba(180,180,180,0.18)',
        borderRadius: 16,
        boxShadow: '0 2px 24px 0 rgba(0,0,0,0.10)',
        padding: 28,
        color: '#222',
        fontFamily: 'monospace',
        zIndex: 10,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 12,
        backdropFilter: isGlass ? 'blur(18px)' : undefined,
        WebkitBackdropFilter: isGlass ? 'blur(18px)' : undefined,
      }}>
        <div style={{ fontWeight: 'bold', fontSize: 22, marginBottom: 8, letterSpacing: 1, color: '#222' }}>Sign in to Zigsaw</div>
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            style={{
              padding: '10px 14px',
              borderRadius: 6,
              border: '1px solid #bbb',
              background: isGlass ? 'rgba(255,255,255,0.5)' : '#f8f8f8',
              color: '#222',
              fontFamily: 'monospace',
              fontSize: 15,
            }}
            disabled={isLoading}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            style={{
              padding: '10px 14px',
              borderRadius: 6,
              border: '1px solid #bbb',
              background: isGlass ? 'rgba(255,255,255,0.5)' : '#f8f8f8',
              color: '#222',
              fontFamily: 'monospace',
              fontSize: 15,
            }}
            disabled={isLoading}
          />
          {error && <div style={{ color: '#c00', fontSize: 13, background: '#fff0f0', borderRadius: 4, padding: 8 }}>{error}</div>}
          <button
            type="submit"
            style={{
              padding: '10px 0',
              borderRadius: 6,
              border: 'none',
              background: isGlass ? 'rgba(0,0,0,0.08)' : '#eee',
              color: '#222',
              fontWeight: 'bold',
              fontSize: 16,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              marginTop: 8,
              boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)',
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : isSignUp ? 'Register' : 'Login'}
          </button>
        </form>
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          style={{
            background: 'none',
            border: 'none',
            color: '#444',
            fontSize: 13,
            marginTop: 2,
            cursor: 'pointer',
          }}
          disabled={isLoading}
        >
          {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
        </button>
        <button
          onClick={data.onContinue}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            fontSize: 13,
            marginTop: 2,
            cursor: 'pointer',
          }}
          disabled={isLoading}
        >
          Continue without login
        </button>
      </div>
      <style>{``}</style>
    </>
  )
} 