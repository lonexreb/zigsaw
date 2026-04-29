import React, { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import './WaitlistPage.css'

function navigate(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function OnboardingPage() {
  const [typing, setTyping] = useState('')
  const [authMsg, setAuthMsg] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  useEffect(() => {
    if (!supabase) return
    const url = window.location.href
    const hasCode = url.includes('code=')
    const post = new URL(url).searchParams.get('post')
    const goEditor = () => navigate('/editor')
    const checkSessionAndProceed = async () => {
      const { data } = await supabase!.auth.getSession()
      if (data.session) {
        setAuthMsg('Signed in. Redirecting…')
        goEditor()
      }
    }
    if (hasCode) {
      setIsBusy(true)
      setAuthMsg('Signing you in…')
      supabase!.auth.exchangeCodeForSession(url).then(({ data, error }) => {
        if (error) setAuthMsg(`Sign-in failed: ${error.message}`)
        else if (data?.session) {
          setAuthMsg('Signed in successfully. Redirecting…')
          const clean = window.location.origin + window.location.pathname + (post ? '' : '')
          window.history.replaceState({}, document.title, clean)
          goEditor()
        } else setAuthMsg('No session returned. Please try again.')
      }).finally(() => setIsBusy(false))
      return
    }
    checkSessionAndProceed()
  }, [])
  useEffect(() => {
    const text = 'Bring your product to life—fast'
    let i = 0
    const id = setInterval(() => {
      setTyping(text.slice(0, i + 1))
      i += 1
      if (i >= text.length) clearInterval(id)
    }, 40)
    return () => clearInterval(id)
  }, [])

  // Simplest: ensure all [data-reveal] elements are visible immediately
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>('[data-reveal]')
    elements.forEach(el => el.classList.add('is-visible'))
  }, [])

  return (
    <div className="waitlist-page light-mode">
      <header className="top-nav" role="navigation" aria-label="Primary">
        <div className="nav-inner">
          <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <span className="brand-logo">⚡</span>
            <span className="brand-name">Zigsaw</span>
          </div>
          <nav className="nav-links">
            <a href="/product" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/product') }}>Product</a>
            <a href="/learn" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/learn') }}>Learn</a>
            <a href="/support" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/support') }}>Support</a>
          </nav>
        </div>
      </header>

      <div className="waitlist-container" style={{ maxWidth: 1100, width: '100%' }}>
        {/* Background video aesthetic */}
        <div className="ads-background" aria-hidden="true">
          <video className="ads-background-video" muted loop autoPlay playsInline preload="auto">
            <source src="/peaches_2.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Hero */}
        <div className="waitlist-header" data-reveal="fade" style={{ marginTop: 12 }}>
          <h1 className="hero-title" style={{ margin: '12px 0 8px' }}>{typing}</h1>
          <p className="hero-headline" style={{ margin: 0 }}>Every new user gets <strong>5 free image credits</strong> on signup.</p>
        </div>

        {/* Glass card */}
        <section style={{ width: '100%', maxWidth: 980 }} data-reveal>
          <div style={{
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            background: 'rgba(255,255,255,0.14)',
            border: '1px solid rgba(255,255,255,0.22)',
            borderRadius: 16,
            padding: 24,
          }}>
            <h2 style={{ marginTop: 0 }}>Start creating in minutes</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {[
                { t: 'Upload', b: 'Drop your product image' },
                { t: 'Describe', b: 'Audience + style prompt' },
                { t: 'Generate', b: 'Ad images and short videos' },
                { t: 'Export', b: 'Ready for Reels and TikTok' },
              ].map((s, i) => (
                <div key={i} data-reveal={i % 2 === 0 ? 'left' : 'right'} style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
                  <h3 style={{ margin: '0 0 6px' }}>{s.t}</h3>
                  <p style={{ margin: 0, color: '#374151' }}>{s.b}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'center' }}>
              <button
                className="ad-generator-btn"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  boxShadow: '0 8px 30px rgba(59,130,246,0.35)',
                  transition: 'transform .15s ease, box-shadow .2s ease'
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)' }}
                onClick={() => navigate('/editor')}
              >Open Editor</button>
              <button
                className="view-preview-btn"
                style={{
                  border: '1px solid #ffffff66',
                  background: 'rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(6px)',
                }}
                onClick={() => navigate('/product')}
              >Learn more</button>
            </div>
          </div>
        </section>

        {/* Symmetric showcase */}
        <section style={{ width: '100%', maxWidth: 980, marginTop: 24 }}>
          <div className="media-showcase" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="media-item" data-reveal="left">
              <div className="media-container ad-image">
                <img src="/zaraad.png" alt="Ad example" className="media-image" />
              </div>
              <p className="media-label">Ad image</p>
            </div>
            <div className="media-item" data-reveal="fade">
              <div className="media-container product-image">
                <img src="/poster_ad_japan.jpg" alt="Brand-safe" className="media-image" />
              </div>
              <p className="media-label">Brand-safe</p>
            </div>
            <div className="media-item" data-reveal="right">
              <div className="media-container marketing-video">
                <video className="media-video" muted loop autoPlay playsInline>
                  <source src="/Camera.mp4" type="video/mp4" />
                </video>
              </div>
              <p className="media-label">Short video</p>
            </div>
          </div>
        </section>

        {/* Minimal footer CTA */}
        <div className="bottom-preview" style={{ marginTop: 28 }}>
          <button
            className="ad-generator-btn"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              boxShadow: '0 8px 30px rgba(59,130,246,0.35)',
              transition: 'transform .15s ease, box-shadow .2s ease'
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)' }}
            onClick={() => navigate('/editor')}
          >Start Creating</button>
          <button
            className="view-preview-btn"
            style={{
              border: '1px solid #ffffff66',
              background: 'rgba(255,255,255,0.10)',
              backdropFilter: 'blur(6px)'
            }}
            onClick={() => navigate('/product')}
          >Explore Product</button>
        </div>
      </div>
    </div>
  )
}


