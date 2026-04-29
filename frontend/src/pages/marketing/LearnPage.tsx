import React, { useEffect } from 'react'
import './WaitlistPage.css'

function navigate(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function LearnPage() {
  useEffect(() => {
    const revealEls = Array.from(document.querySelectorAll('[data-reveal]')) as HTMLElement[]
    if (revealEls.length === 0) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('is-visible') })
    }, { threshold: 0.12 })
    revealEls.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const tutorials: Tutorial[] = [
    {
      title: 'From image to ad set in 5 minutes',
      steps: [
        { label: 'Upload product', media: { type: 'image', src: '/shelf.png' } },
        { label: 'Pick a style', media: { type: 'image', src: '/poster.webp' } },
        { label: 'Export video', media: { type: 'video', src: '/matcha_ad_vid.mp4' } },
      ],
    },
    {
      title: 'Make creator-style videos',
      steps: [
        { label: 'Add hooks', media: { type: 'video', src: '/hotsauce_bestest.mp4' } },
        { label: 'Show features', media: { type: 'video', src: '/Camera.mp4' } },
        { label: 'Post-ready format', media: { type: 'video', src: '/shoe_vid.mp4' } },
      ],
    },
  ]

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
            <a href="/learn" className="nav-link" onClick={(e) => e.preventDefault()}>Learn</a>
            <a href="/support" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/support') }}>Support</a>
          </nav>
        </div>
      </header>

      <div className="waitlist-container">
        <div className="waitlist-header" data-reveal="fade">
          <h1 className="hero-title">Learn Zigsaw fast</h1>
          <p className="hero-headline">Short, visual tutorials to go from prompt to post.</p>
        </div>

        {tutorials.map((t, ti) => (
          <section key={ti} style={{ width: '100%', maxWidth: 1100, marginTop: ti === 0 ? 8 : 24 }}>
            <h2 data-reveal>{t.title}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              {t.steps.map((s, si) => (
                <div key={si} className="media-item" data-reveal={si % 2 === 0 ? 'left' : 'right'}>
                  <div className={s.media.type === 'video' ? 'media-container marketing-video' : 'media-container product-image'}>
                    {s.media.type === 'video' ? (
                      <video className="media-video" muted loop autoPlay playsInline>
                        <source src={s.media.src} type="video/mp4" />
                      </video>
                    ) : (
                      <img src={s.media.src} alt={s.label} className="media-image" />
                    )}
                  </div>
                  <p className="media-label">{s.label}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="bottom-preview" style={{ marginTop: 28 }}>
          <button className="view-preview-btn" onClick={() => navigate('/use-cases')}>Explore Use Cases</button>
          <button className="ad-generator-btn" onClick={() => navigate('/')}>Start Creating</button>
        </div>
      </div>
    </div>
  )
}

interface TutorialStep {
  label: string
  media: { type: 'image' | 'video'; src: string }
}

interface Tutorial {
  title: string
  steps: TutorialStep[]
}



