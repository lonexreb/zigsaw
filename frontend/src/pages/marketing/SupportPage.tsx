import React, { useEffect } from 'react'
import './WaitlistPage.css'

function navigate(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function SupportPage() {
  useEffect(() => {
    const revealEls = Array.from(document.querySelectorAll('[data-reveal]')) as HTMLElement[]
    if (revealEls.length === 0) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('is-visible') })
    }, { threshold: 0.12 })
    revealEls.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className="waitlist-page">
      <header className="top-nav" role="navigation" aria-label="Primary">
        <div className="nav-inner">
          <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <span className="brand-logo">⚡</span>
            <span className="brand-name">Zigsaw</span>
          </div>
          <nav className="nav-links">
            <a href="/product" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/product') }}>Product</a>
            <a href="/learn" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/learn') }}>Learn</a>
            <a href="/support" className="nav-link" onClick={(e) => e.preventDefault()}>Support</a>
          </nav>
        </div>
      </header>

      <div className="waitlist-container">
        <div className="waitlist-header" data-reveal="fade">
          <h1 className="hero-title">We’re here to help</h1>
          <p className="hero-headline">Get answers, guides, and contact options.</p>
        </div>

        <section style={{ width: '100%', maxWidth: 1000 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            <div data-reveal="left" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>Quick start</h3>
              <p style={{ color: '#374151' }}>Watch a short walkthrough to create your first ad.</p>
              <video className="media-video" muted loop autoPlay playsInline style={{ borderRadius: 8 }}>
                <source src="/matcha_ad_vid.mp4" type="video/mp4" />
              </video>
            </div>

            <div data-reveal="right" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>Troubleshooting</h3>
              <ul style={{ color: '#374151', paddingLeft: 18 }}>
                <li>Images not loading? Ensure files are JPG/PNG/WebP and under 10MB.</li>
                <li>Video too long? Use 5–10s for best results.</li>
                <li>Login loop? Clear cookies and try again or contact support.</li>
              </ul>
            </div>

            <div data-reveal="fade" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>Contact</h3>
              <p style={{ color: '#374151' }}>Email us at <a href="mailto:zigsaw.agent@gmail.com">zigsaw.agent@gmail.com</a></p>
              <img src="/poster_ad_italy.jpg" alt="Support" className="media-image" style={{ borderRadius: 8 }} />
            </div>
          </div>
        </section>

        <div className="bottom-preview" style={{ marginTop: 28 }}>
          <button className="view-preview-btn" onClick={() => navigate('/product')}>Explore Product</button>
          <button className="ad-generator-btn" onClick={() => navigate('/')}>Start for Free</button>
        </div>
      </div>
    </div>
  )
}



