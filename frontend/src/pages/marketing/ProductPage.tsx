import React, { useEffect } from 'react'
import './WaitlistPage.css'

function navigate(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function ProductPage() {
  useEffect(() => {
    const revealEls = Array.from(document.querySelectorAll('[data-reveal]')) as HTMLElement[]
    if (revealEls.length === 0) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible')
      })
    }, { threshold: 0.12 })
    revealEls.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const galleries: Gallery[] = [
    {
      title: 'Generate product images',
      description: 'Turn one product photo into studio-quality shots with captions and callouts.',
      items: [
        { type: 'image', src: '/hotsauce_ad.jpg', alt: 'Hot sauce ad' },
        { type: 'image', src: '/poster_ad_italy.jpg', alt: 'Poster ad' },
        { type: 'image', src: '/shelf_ad.jpeg', alt: 'Shelf ad' },
      ],
    },
    {
      title: 'Make short videos',
      description: 'Looping vertical clips for Reels and TikTok with kinetic text.',
      items: [
        { type: 'video', src: '/peaches_2.mp4', alt: 'Peach video' },
        { type: 'video', src: '/Camera.mp4', alt: 'Camera video' },
        { type: 'video', src: '/shoe_vid.mp4', alt: 'Shoe video' },
      ],
    },
    {
      title: 'Brand-consistent outputs',
      description: 'Presets keep fonts, colors, and logos consistent across images and videos.',
      items: [
        { type: 'image', src: '/matcha_ad.webp', alt: 'Matcha ad' },
        { type: 'image', src: '/peach_ad.jpg', alt: 'Perfume ad' },
        { type: 'image', src: '/poster_ad_japan.jpg', alt: 'Poster alt ad' },
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
            <a href="/product" className="nav-link" onClick={(e) => e.preventDefault()}>Product</a>
            <a href="/learn" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/learn') }}>Learn</a>
            <a href="/support" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/support') }}>Support</a>
          </nav>
        </div>
      </header>

      <div className="waitlist-container" style={{ maxWidth: 1100, width: '100%' }}>
        {/* Why Zigsaw section */}
        <section style={{ width: '100%', maxWidth: 1100, marginTop: 8, marginBottom: 24 }}>
          <div className="waitlist-header" data-reveal="fade">
            <h1 className="hero-title">Why Zigsaw is better for ads</h1>
            <p className="hero-headline">Preserve your brand look, find the right aesthetics, and get ad‑ready suggestions—automatically.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, alignItems: 'start' }}>
            <div data-reveal="left" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
              <img src="/poster_ad_japan.jpg" alt="Brand-safe outputs" className="media-image" style={{ borderRadius: 8 }} />
              <h3 style={{ marginTop: 12 }}>Brand-safe outputs</h3>
              <p style={{ color: '#374151', marginBottom: 0 }}>We preserve lighting, tone, and product geometry from your source image so outputs stay on-brand—unlike general models that drift.</p>
            </div>
            <div data-reveal="fade" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
              <img src="/matcha_ad.webp" alt="Aesthetic detection" className="media-image" style={{ borderRadius: 8 }} />
              <h3 style={{ marginTop: 12 }}>Aesthetic detection</h3>
              <p style={{ color: '#374151', marginBottom: 0 }}>We analyze your product photo to pick fitting backgrounds and compositions—studio, lifestyle, creator desk—without manual prompt engineering.</p>
            </div>
            <div data-reveal="right" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
              <img src="/zaraad.png" alt="Ad-first suggestions" className="media-image" style={{ borderRadius: 8 }} />
              <h3 style={{ marginTop: 12 }}>Ad‑first suggestions</h3>
              <p style={{ color: '#374151', marginBottom: 0 }}>Get targeted hooks, captions, and layout suggestions built for CTR—not generic “nice” images. Output sizes match Reels, TikTok, and Stories.</p>
            </div>
          </div>
        </section>

        {/* How we help you grow any brand */}
        <section style={{ width: '100%', maxWidth: 1100, marginTop: 28 }}>
          <div className="waitlist-header" data-reveal="fade">
            <h2 className="hero-title" style={{ fontSize: 28 }}>How we help you grow any brand</h2>
            <p className="hero-headline">Find an audience, craft a campaign, post to socials, and learn what works.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[{
              title: 'Find your audience',
              body: 'We analyze your product image and niche to suggest audiences and visual aesthetics that resonate.',
              img: '/camera_ad.jpeg'
            }, {
              title: 'Generate the campaign',
              body: 'Instant headlines, hooks, and visuals aligned to platform best-practices and your brand tone.',
              img: '/candle_ad.jpg'
            }, {
              title: 'Post to socials',
              body: 'One‑click exports sized for Reels, TikTok, Stories, and feed. Captions and hashtags included.',
              img: '/icecream_ad.jpg'
            }, {
              title: 'Learn and iterate',
              body: 'Performance summaries reveal what styles and hooks win so the next batch performs better.',
              img: '/shoe_ad.jpg'
            }].map((card, i) => (
              <div key={i} data-reveal={i % 2 === 0 ? 'left' : 'right'} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
                <img src={card.img} alt={card.title} className="media-image" style={{ borderRadius: 8 }} />
                <h3 style={{ marginTop: 12 }}>{card.title}</h3>
                <p style={{ color: '#374151', marginBottom: 0 }}>{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Side-by-side comparison */}
        <section style={{ width: '100%', maxWidth: 1100, marginTop: 8 }}>
          <h2 data-reveal>Why our pipeline beats generic LLM prompts</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, alignItems: 'start' }}>
            {/* Zigsaw column */}
            <div data-reveal="left" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>✅</span>
                <h3 style={{ margin: 0 }}>Zigsaw pipeline</h3>
              </div>
              <p style={{ color: '#374151', marginTop: 6 }}>Brand-preserving generation with ad-first framing, text-safe zones, and aesthetic guidance.</p>
              <div className="media-showcase" style={{ gridTemplateColumns: '1fr 1fr 1fr', width: '100%', margin: 0 }}>
                <div className="media-item">
                  <div className="media-container ad-image">
                    <img src="/zaraad.png" alt="Zigsaw ad" className="media-image" />
                  </div>
                  <p className="media-label">Ad-ready image</p>
                </div>
                <div className="media-item">
                  <div className="media-container product-image">
                    <img src="/poster_ad_japan.jpg" alt="Brand-safe" className="media-image" />
                  </div>
                  <p className="media-label">Brand-safe composition</p>
                </div>
                <div className="media-item">
                  <div className="media-container marketing-video">
                    <video className="media-video" muted loop autoPlay playsInline>
                      <source src="/peaches_2.mp4" type="video/mp4" />
                    </video>
                  </div>
                  <p className="media-label">Vertical short</p>
                </div>
              </div>
            </div>

            {/* Generic LLM column */}
            <div data-reveal="right" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>❌</span>
                <h3 style={{ margin: 0 }}>Generic LLM prompts</h3>
              </div>
              <p style={{ color: '#374151', marginTop: 6 }}>Inconsistent style, off-brand colors, and non-ad layouts; requires heavy prompt trial and error.</p>
              <div className="media-showcase" style={{ gridTemplateColumns: '1fr 1fr 1fr', width: '100%', margin: 0 }}>
                <div className="media-item">
                  <div className="media-container product-image">
                    <img src="/shelf.png" alt="Flat shot" className="media-image" />
                  </div>
                  <p className="media-label">Flat product</p>
                </div>
                <div className="media-item">
                  <div className="media-container product-image">
                    <img src="/camera.png" alt="Generic bg" className="media-image" />
                  </div>
                  <p className="media-label">Generic background</p>
                </div>
                <div className="media-item">
                  <div className="media-container ad-image">
                    <img src="/matcha_ad2.jpg" alt="Overprompted" className="media-image" />
                  </div>
                  <p className="media-label">Unfocused style</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="waitlist-header" data-reveal="fade" style={{ marginTop: 28 }}>
          <h1 className="hero-title" style={{ margin: '12px 0 8px' }}>Create ads from a single product image</h1>
          <p className="hero-headline" style={{ margin: 0 }}>Images and videos tailored to your brand in minutes.</p>
        </div>

        {galleries.map((g, gi) => (
          <section key={gi} style={{ width: '100%', maxWidth: 1100, marginTop: gi === 0 ? 8 : 28 }}>
            <h2 data-reveal>{g.title}</h2>
            <p style={{ color: '#374151', marginTop: 6 }} data-reveal="fade">{g.description}</p>
            <div className="media-showcase" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginLeft: 0, marginRight: 0, width: '100%' }}>
              {g.items.map((it, ii) => (
                <div className="media-item" key={ii} data-reveal={ii % 2 === 0 ? 'left' : 'right'}>
                  <div className={it.type === 'video' ? 'media-container marketing-video' : 'media-container ad-image'}>
                    {it.type === 'video' ? (
                      <video className="media-video" muted loop autoPlay playsInline>
                        <source src={it.src} type="video/mp4" />
                      </video>
                    ) : (
                      <img src={it.src} alt={it.alt} className="media-image" />
                    )}
                  </div>
                  <p className="media-label">{it.type === 'video' ? 'Demo Video' : 'Ad Example'}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="bottom-preview" style={{ marginTop: 32 }}>
          <button className="view-preview-btn" onClick={() => navigate('/')}>Start for Free</button>
          <button className="ad-generator-btn" onClick={() => navigate('/use-cases')}>See Use Cases</button>
        </div>
      </div>
    </div>
  )
}

interface GalleryItem {
  type: 'image' | 'video'
  src: string
  alt: string
}

interface Gallery {
  title: string
  description: string
  items: GalleryItem[]
}


