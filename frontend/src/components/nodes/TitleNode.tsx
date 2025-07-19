interface TitleNodeProps {
  id: string
  data: {
    title?: string
    subtitle?: string
    variant?: string
    onLogin?: (email: string, password: string) => void
    onSignUp?: (email: string, password: string) => void
    onContinue?: () => void
  }
  selected: boolean
}

import { useState } from 'react'

export function TitleNode({ id, data, selected }: TitleNodeProps) {
  const isGlass = data.variant === 'glass'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    if (!data.onLogin) return
    if (!email || !password) {
      setError('Email and password required')
      return
    }
    setIsLoading(true)
    setError(null)
    Promise.resolve(data.onLogin(email, password))
      .catch(() => setError('Sign in failed'))
      .finally(() => setIsLoading(false))
  }
  function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (!data.onSignUp) return
    if (!email || !password) {
      setError('Email and password required')
      return
    }
    setIsLoading(true)
    setError(null)
    Promise.resolve(data.onSignUp(email, password))
      .catch(() => setError('Sign up failed'))
      .finally(() => setIsLoading(false))
  }
  function handleContinue(e: React.FormEvent) {
    e.preventDefault()
    if (data.onContinue) data.onContinue()
  }

  return (
    <div style={{
      minWidth: 420,
      maxWidth: 600,
      background: isGlass ? 'rgba(255,255,255,0.22)' : '#fff',
      border: selected ? '2px solid #222' : '1px solid rgba(180,180,180,0.18)',
      borderRadius: 20,
      boxShadow: '0 2px 24px 0 rgba(0,0,0,0.10)',
      padding: 36,
      color: '#222',
      fontFamily: 'monospace',
      zIndex: 1000,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16,
      backdropFilter: isGlass ? 'blur(18px)' : undefined,
      WebkitBackdropFilter: isGlass ? 'blur(18px)' : undefined,
      overflow: 'visible',
    }}>
      <div style={{
        fontWeight: 'bold',
        fontSize: 48,
        letterSpacing: 2,
        color: '#222',
        marginBottom: 8,
        textShadow: '0 0 12px rgba(0,0,0,0.04)',
        zIndex: 1,
      }}>
        {data.title || 'Zigsaw'}
      </div>
      <div style={{
        fontSize: 22,
        color: '#444',
        textAlign: 'center',
        marginBottom: 4,
        textShadow: '0 0 8px rgba(0,0,0,0.03)',
        zIndex: 1,
      }}>
        {data.subtitle || 'Automation for All'}
      </div>
      <div style={{
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        opacity: 0.7,
        marginTop: 8,
        zIndex: 1,
      }}>
        {'Supercharge your workflows with AI. Drag, drop, and connect nodes to build automations—no code required.'}
      </div>
      {/* Sign In/Up Form */}
      {(data.onLogin || data.onSignUp || data.onContinue) && (
        <form style={{ width: '100%', marginTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%',
              maxWidth: 320,
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #bbb',
              fontSize: 16,
              marginBottom: 8,
              fontFamily: 'monospace',
            }}
            autoComplete="email"
            required
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{
              width: '100%',
              maxWidth: 320,
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #bbb',
              fontSize: 16,
              marginBottom: 8,
              fontFamily: 'monospace',
            }}
            autoComplete="current-password"
            required
            disabled={isLoading}
          />
          {error && <div style={{ color: '#e00', fontSize: 14, marginBottom: 4 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            {data.onLogin && (
              <button type="submit" onClick={handleSignIn} disabled={isLoading} style={{
                background: '#222', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 600, fontSize: 16, cursor: 'pointer', opacity: isLoading ? 0.7 : 1
              }}>Sign In</button>
            )}
            {data.onSignUp && (
              <button type="button" onClick={handleSignUp} disabled={isLoading} style={{
                background: '#fff', color: '#222', border: '1px solid #222', borderRadius: 8, padding: '10px 22px', fontWeight: 600, fontSize: 16, cursor: 'pointer', opacity: isLoading ? 0.7 : 1
              }}>Sign Up</button>
            )}
            {data.onContinue && (
              <button type="button" onClick={handleContinue} disabled={isLoading} style={{
                background: '#eee', color: '#222', border: '1px solid #bbb', borderRadius: 8, padding: '10px 22px', fontWeight: 600, fontSize: 16, cursor: 'pointer', opacity: isLoading ? 0.7 : 1
              }}>Continue</button>
            )}
          </div>
        </form>
      )}
    </div>
  )
}