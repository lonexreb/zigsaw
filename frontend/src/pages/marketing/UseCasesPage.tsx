import React, { useEffect } from 'react'
import './WaitlistPage.css'

function navigate(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function UseCasesPage() {
  useEffect(() => {
    const revealEls = Array.from(document.querySelectorAll('[data-reveal]')) as HTMLElement[]
    if (revealEls.length === 0) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
        }
      })
    }, { threshold: 0.12 })
    revealEls.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  const cases: UseCase[] = [
    {
      title: 'E‑commerce apparel: seasonal drops',
      description: 'Generate on-brand product photos and vertical videos with trending hooks for TikTok and Reels.',
      video: '/shoe_vid.mp4',
    },
    {
      title: 'Food & beverage: flavor promos',
      description: 'Turn one product shot into variations that match each flavor vibe. Add kinetic typography and ingredient callouts.',
      video: '/peaches_2.mp4',
    },
    {
      title: 'Consumer electronics: creator desk sets',
      description: 'Showcase specs with clean creator-desk shots and animated overlays for performance-minded buyers.',
      video: '/Camera.mp4',
    },
    {
      title: 'Beauty & fragrance: luxury sets',
      description: 'Elegant lighting with brand-consistent tones and text accents that don’t overpower the product.',
      video: '/peaches_2.mp4',
    },
    {
      title: 'CPG shelf: in-aisle context',
      description: 'Generate shelf shots with subtle price/feature callouts to test in retail ads quickly.',
      video: '/shelf_ad_vid.mp4',
    },
    {
      title: 'Travel & posters: mood pieces',
      description: 'Create themed poster-style visuals for campaigns with minimal prompt work—just drop your asset.',
      video: '/Camera.mp4',
    },
  ]

  return (
    <div className="waitlist-page">
      <header className="top-nav" role="navigation" aria-label="Primary">
        <div className="nav-inner">
          <div className="brand" onClick={() => navigate('/') } style={{ cursor: 'pointer' }}>
            <span className="brand-logo">⚡</span>
            <span className="brand-name">Zigsaw</span>
          </div>
          <nav className="nav-links">
            <a href="/pricing" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/pricing') }}>Pricing</a>
            <a href="/use-cases" className="nav-link" onClick={(e) => e.preventDefault()}>Use Cases</a>
          </nav>
        </div>
      </header>

      <div className="waitlist-container">
        <div className="waitlist-header" data-reveal="fade">
          <h1 className="hero-title">What can you build with Zigsaw?</h1>
          <p className="hero-headline">A few real-world use cases to spark ideas.</p>
        </div>

        <div className="media-showcase" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          {cases.map((uc, idx) => (
            <div className="media-item" key={idx} data-reveal={idx % 2 === 0 ? 'left' : 'right'}>
              <div className="media-container marketing-video">
                {uc.video ? (
                  <video className="media-video" muted loop autoPlay playsInline>
                    <source src={uc.video} type="video/mp4" />
                  </video>
                ) : (
                  <div className="media-placeholder marketing-video">
                    <span className="placeholder-text">Demo</span>
                  </div>
                )}
              </div>
              <h3 style={{ marginTop: 12 }}>{uc.title}</h3>
              <p style={{ color: '#374151' }}>{uc.description}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <section style={{ marginTop: 36, width: '100%', maxWidth: 1000 }}>
          <h2 data-reveal>How Zigsaw fits your workflow</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 8 }}>
            {[
              { step: '1. Upload', body: 'Drop a single product image or short clip.' },
              { step: '2. Describe', body: 'Pick a template and add a prompt like “cozy studio, soft light”.' },
              { step: '3. Generate', body: 'We render images or videos with brand-safe defaults.' },
              { step: '4. Export', body: 'Download in platform-optimized sizes with your brand preset.' },
            ].map((s, i) => (
              <div key={i} data-reveal={i % 2 === 0 ? 'left' : 'right'} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
                <h3 style={{ marginTop: 0 }}>{s.step}</h3>
                <p style={{ marginBottom: 0, color: '#374151' }}>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section style={{ marginTop: 28, width: '100%', maxWidth: 900 }}>
          <h2 data-reveal>What teams are saying</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginTop: 8 }}>
            {[
              { name: 'DTC Apparel', quote: 'Cut ad production time by 80% with Zigsaw templates.' },
              { name: 'CPG Brand', quote: 'We test 10 creative angles per product in a single afternoon.' },
              { name: 'Camera Store', quote: 'Spec callouts and creator desk shots boosted CTR by 26%.' },
            ].map((t, i) => (
              <blockquote key={i} data-reveal="fade" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
                <p style={{ margin: 0, color: '#111827' }}>“{t.quote}”</p>
                <footer style={{ color: '#6b7280', marginTop: 8 }}>— {t.name}</footer>
              </blockquote>
            ))}
          </div>
        </section>

        <div className="bottom-preview" style={{ marginTop: 28 }}>
          <button className="view-preview-btn" onClick={() => navigate('/pricing')}>View Pricing</button>
          <button className="ad-generator-btn" onClick={() => navigate('/')}>Start for Free</button>
        </div>
      </div>
    </div>
  )
}

interface UseCase {
  title: string
  description: string
  video?: string
}

