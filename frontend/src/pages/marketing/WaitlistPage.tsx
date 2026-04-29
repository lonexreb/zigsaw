




import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import './WaitlistPage.css'

interface WaitlistPageProps {
  onStart?: () => void
}

function WaitlistPage({ onStart }: WaitlistPageProps) {
  // Waitlist removed – CTA-based auth only
  const [isLightMode, setIsLightMode] = useState(false)
  const videoSources = [] as string[]
  const [bgVideoIndex, setBgVideoIndex] = useState(0)
  const [navScrolled, setNavScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)

  const handleGoToOnboarding = () => {
    window.history.pushState({}, '', '/onboarding')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setNavScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement
        if (entry.isIntersecting) {
          el.classList.add('is-visible')
          observer.unobserve(el)
        }
      })
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 })

    document.querySelectorAll('[data-reveal]')?.forEach((el) => observer.observe(el))

    return () => {
      window.removeEventListener('scroll', onScroll)
      observer.disconnect()
    }
  }, [])

  const handleBgAdvance = () => {}

  return (
    <div className={`waitlist-page ${isLightMode ? 'light-mode' : ''}`}>
      {/* Top Navigation */}
      <header className={`top-nav ${mounted ? 'nav-entered' : ''} ${navScrolled ? 'scrolled' : ''}`} role="navigation" aria-label="Primary">
        <div className="nav-inner">
          <div className="brand">
            <span className="brand-logo">⚡</span>
            <span className="brand-name">Zigsaw</span>
          </div>
          <nav className="nav-links">
            <a
              href="/product"
              className="nav-link"
              onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/product'); window.dispatchEvent(new PopStateEvent('popstate')); }}
            >Product</a>
            <a
              href="/learn"
              className="nav-link"
              onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/learn'); window.dispatchEvent(new PopStateEvent('popstate')); }}
            >Learn</a>
            <a
              href="/support"
              className="nav-link"
              onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/support'); window.dispatchEvent(new PopStateEvent('popstate')); }}
            >Support</a>
            <a
              href="/pricing"
              className="nav-link"
              onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/pricing'); window.dispatchEvent(new PopStateEvent('popstate')); }}
            >Pricing</a>
            <a
              href="/use-cases"
              className="nav-link"
              onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/use-cases'); window.dispatchEvent(new PopStateEvent('popstate')); }}
            >Use Cases</a>
          </nav>
          <div className="nav-mobile-pill" aria-hidden="true">
            <a
              href="/product"
              className="nav-pill-text"
              onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/product'); window.dispatchEvent(new PopStateEvent('popstate')); }}
            >Product</a>
            <span style={{ margin: '0 6px', opacity: 0.6 }}>·</span>
            <a
              href="/pricing"
              className="nav-pill-text"
              onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/pricing'); window.dispatchEvent(new PopStateEvent('popstate')); }}
            >Pricing</a>
          </div>
          <button className="nav-cta" onClick={handleGoToOnboarding}>Get Started</button>
        </div>
      </header>
      {/* Theme toggle removed */}
      
      {/* Background media removed for clean white background */}
      <div className="waitlist-container">
        <div className="waitlist-header">
          <a href="https://x.com/dedaluslabs/status/1960381707594367409" target="_blank" rel="noopener noreferrer" className="yc-badge animate-fade-in delay-100" data-reveal="left">
            <span className="win-badge">🏆 Winner</span>
            <span className="yc-logo">
              <img 
                src="/ycombinator.png" 
                alt="Y Combinator" 
                width="16" 
                height="16"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  console.log('Y Combinator logo failed to load:', target.src)
                  target.style.display = 'none'
                }}
                onLoad={() => console.log('Y Combinator logo loaded successfully')}
              />
            </span>
            <span className="win-text">Combinator 2025 Agents Hackathon</span>
            <span className="win-link">→ View Announcement</span>
          </a>
          <h1 className="hero-title animate-pop hero-animate-1" data-reveal="scale">Create ad‑ready images and videos in minutes</h1>
          <p className="hero-headline animate-fade-in hero-animate-2" data-reveal="fade">On‑brand visuals, smart suggestions, and fast exports for every platform.</p>
          <div className="hero-subtitle animate-slide-up hero-animate-3" data-reveal="up">
            {/* Removed typewriter */}
          </div>
        </div>

        {/* Auth CTA replacing waitlist */}
        <div className="auth-cta">
          <button className="cta-primary animate-pop delay-150" data-reveal="up" onClick={handleGoToOnboarding}>Start Your Journey</button>
          <button className="google-btn animate-slide-up delay-200" data-reveal="up" onClick={handleGoToOnboarding}>
            <svg className="google-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12S17.373 12 24 12c3.059 0 5.842 1.152 7.961 3.039l5.657-5.657C34.871 6.053 29.683 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.084 18.961 12 24 12c3.059 0 5.842 1.152 7.961 3.039l5.657-5.657C34.871 6.053 29.683 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.138 0 9.8-1.969 13.283-5.182l-6.142-5.188C29.982 35.091 27.134 36 24 36c-5.202 0-9.62-3.317-11.283-7.943l-6.48 5.002C9.55 39.549 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.793 2.237-2.28 4.166-4.183 5.556l-6.142 5.188C39.698 40.251 44 32.955 44 24c0-1.341-.138-2.651-.389-3.917z"/></svg>
            Continue with Google
          </button>
          <p className="auth-note">No waitlist. Sign in to redeem 5 free credits.</p>
        </div>

        {/* Quick Links */}
        <div className="bottom-preview" style={{ marginTop: 20 }}>
          <button
            className="view-preview-btn"
            onClick={() => { window.history.pushState({}, '', '/pricing'); window.dispatchEvent(new PopStateEvent('popstate')); }}
          >View Pricing</button>
          <button
            className="ad-generator-btn"
            onClick={() => { window.history.pushState({}, '', '/use-cases'); window.dispatchEvent(new PopStateEvent('popstate')); }}
          >See Use Cases</button>
        </div>

        <div className="media-showcase">
          {MEDIA_SETS.map((set, idx) => (
            <React.Fragment key={idx}>
              {set.adPosition === 'third' ? (
                <>
                  {/* Left 1: Product */}
                  <div className="media-item">
                    <div className="media-container product-image">
                      <img 
                        src={set.productSrc}
                        alt={`${set.title} Item 1`}
                        className="media-image"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          console.log('Image failed to load:', target.src)
                          target.style.display = 'none'
                          target.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                      <div className="media-placeholder product-image">
                        <span className="placeholder-text">Item 1</span>
                      </div>
                    </div>
                    <p className="media-label">{set.productLabel || 'Clothing Item 1'}</p>
                  </div>

                  {/* Left 2: Second Item */}
                  <div className="media-item">
                    <div className="media-container product-image">
                      {set.secondItemSrc ? (
                        <img 
                          src={set.secondItemSrc}
                          alt={`${set.title} Item 2`}
                          className="media-image"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            console.log('Image failed to load:', target.src)
                            target.style.display = 'none'
                            target.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : (
                        <div className="media-placeholder product-image">
                          <span className="placeholder-text">Item 2</span>
                        </div>
                      )}
                      <div className="media-placeholder product-image hidden">
                        <span className="placeholder-text">Item 2</span>
                      </div>
                    </div>
                    <p className="media-label">{set.secondItemLabel || 'Clothing Item 2'}</p>
                  </div>

                  {/* Right: Ad */}
                  <div className="media-item">
                    <div className="media-container ad-image">
                      <img 
                        src={set.adSrc}
                        alt={`${set.title} Ad`}
                        className="media-image"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          if (target.src.endsWith('.jpg')) target.src = target.src.replace('.jpg', '.jpeg')
                          else if (target.src.endsWith('.jpeg')) target.src = target.src.replace('.jpeg', '.png')
                          else {
                            target.style.display = 'none'
                            target.nextElementSibling?.classList.remove('hidden')
                          }
                        }}
                      />
                      <div className="media-placeholder ad-image hidden">
                        <span className="placeholder-text">Generated Ad</span>
                      </div>
                    </div>
                    <p className="media-label">{set.adLabel || 'AI-Generated Ad'}</p>
                  </div>
                </>
              ) : (
                <>
                  {/* Original */}
                  <div className="media-item">
                    <div className="media-container product-image">
                      <img 
                        src={set.productSrc}
                        alt={`${set.title} Product`}
                        className="media-image"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          console.log('Image failed to load:', target.src)
                          // Hide image and show placeholder
                          target.style.display = 'none'
                          target.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                      <div className="media-placeholder product-image">
                        <span className="placeholder-text">Product Image</span>
                      </div>
                    </div>
                    <p className="media-label">Original Product</p>
                  </div>

                  {/* Ad */}
                  <div className="media-item">
                    <div className="media-container ad-image">
                      <img 
                        src={set.adSrc}
                        alt={`${set.title} Ad`}
                        className="media-image"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          if (target.src.endsWith('.jpg')) target.src = target.src.replace('.jpg', '.jpeg')
                          else if (target.src.endsWith('.jpeg')) target.src = target.src.replace('.jpeg', '.png')
                          else {
                            target.style.display = 'none'
                            target.nextElementSibling?.classList.remove('hidden')
                          }
                        }}
                      />
                      <div className="media-placeholder ad-image hidden">
                        <span className="placeholder-text">Generated Ad</span>
                      </div>
                    </div>
                    <p className="media-label">AI-Generated Ad</p>
                  </div>

                  {/* Video or Marketing Image */}
                  <div className="media-item">
                    <div className="media-container marketing-video">
                      {set.videoSrc ? (
                        <video 
                          className="media-video"
                          muted
                          loop
                          autoPlay
                          playsInline
                        >
                          {set.videoSrc.endsWith('.mp4') && (
                            <source src={set.videoSrc} type="video/mp4" />
                          )}
                          Your browser does not support the video tag.
                        </video>
                      ) : set.marketingImageSrc ? (
                        <img 
                          src={set.marketingImageSrc}
                          alt={`${set.title} Marketing`}
                          className="media-image"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            console.log('Marketing image failed to load:', target.src)
                            // Hide image and show placeholder
                            target.style.display = 'none'
                            target.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : (
                        <div className="media-placeholder marketing-video">
                          <span className="placeholder-text">Marketing Video</span>
                        </div>
                      )}
                    </div>
                    <p className="media-label">{set.marketingImageSrc && !set.videoSrc ? 'Alternate Ad' : 'Marketing Video'}</p>
                  </div>
                </>
              )}
            </React.Fragment>
          ))}
        </div>
        </div>
        
        {/* Fooodter */}
        <footer className="waitlist-footer">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Zigsaw</h4>
              <p>Turn one product photo into tailored ad images and videos</p>
            </div>
            <div className="footer-section">
              <h4>Contact</h4>
              <p>zigsaw.agent@gmail.com</p>
            </div>
            <div className="footer-section">
              <h4>Follow</h4>
              <div className="social-links">
                <a href="https://x.com/zigsaw" className="social-link" target="_blank" rel="noopener noreferrer">Twitter</a>
                <a href="#" className="social-link">LinkedIn</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Zigsaw. All rights reserved.</p>
          </div>
        </footer>
         
        {/* Bottom preview removed */}
        
      </div>
    )
  }

/* Subcomponents */
function TypewriterSubtitle({ messages, typingSpeedMs = 50, deleteSpeedMs = 35, pauseMs = 1200 }: TypewriterSubtitleProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [messageIndex, setMessageIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!messages || messages.length === 0) return

    const fullText = messages[messageIndex % messages.length]

    const step = () => {
      if (!isDeleting) {
        const next = fullText.slice(0, displayedText.length + 1)
        setDisplayedText(next)
        if (next === fullText) setTimeout(() => setIsDeleting(true), pauseMs)
      } else {
        const next = fullText.slice(0, displayedText.length - 1)
        setDisplayedText(next)
        if (next.length === 0) {
          setIsDeleting(false)
          setMessageIndex((prev) => (prev + 1) % messages.length)
        }
      }
    }

    const timeoutId = setTimeout(step, isDeleting ? deleteSpeedMs : typingSpeedMs)
    return () => clearTimeout(timeoutId)
  }, [displayedText, isDeleting, messageIndex, messages, typingSpeedMs, deleteSpeedMs, pauseMs])

  return (
    <p className="waitlist-subtitle typewriter">
      {displayedText}
      <span className="caret" />
    </p>
  )
}

/* Static Content */
const TYPED_PROMPTS: string[] = [
  'Make this hot sauce more exciting with macro pours and heat meter',
  'Show this matcha in a Japanese setting with soft morning light',
  'Highlight this camera with creator desk shots and spec callouts',
  'Showcase this ice cream by flavor, playful captions, family-friendly vibe',
  'Show this peach perfume with bold scent energy and luxury shadows',
  'Target Gen Z: fast cuts, bold text, punchy hooks for this product',
  'Show this shelf with items on it and a hand grabbing one',
  'Preview this travel poster framed on a wall in a cozy room',
  'Rotate these sneakers with cool lighting and kinetic typography'
]

/* Media Sets */
const MEDIA_SETS: MediaSet[] = [
  { title: 'Hot Sauce', productSrc: '/hotsauce.png', adSrc: '/hotsauce_ad.jpg', videoSrc: '/hotsauce_bestest.mp4' },
  { title: 'Matcha', productSrc: '/matcha_ad.webp', adSrc: '/matcha_ad2.jpg', videoSrc: '/matcha_ad_vid.mp4' },
  { title: 'Camera', productSrc: '/camera.png', adSrc: '/camera_ad.jpg', videoSrc: '/Camera.mp4' },
  {
    title: 'Zara Outfit',
    productSrc: '/zaraskirt.jpg',
    secondItemSrc: '/zaratop.jpg',
    adSrc: '/zaraad.png',
    adPosition: 'third',
    productLabel: 'Clothing Item 1',
    secondItemLabel: 'Clothing Item 2',
    adLabel: 'AI-Generated Ad',
  },
  { title: 'Peach Perfume', productSrc: '/peach.jpg', adSrc: '/peach_ad.jpg', videoSrc: '/peaches_2.mp4' },
  { title: 'Shelf', productSrc: '/shelf.png', adSrc: '/shelf_ad.jpeg', videoSrc: '/shelf_ad_vid.mp4' },
  { title: 'Poster', productSrc: '/poster.webp', adSrc: '/poster_ad_italy.jpg', marketingImageSrc: '/poster_ad_japan.jpg' },
  { title: 'Shoe', productSrc: '/shoe_1.jpg', adSrc: '/shoe_ad.jpg', videoSrc: '/shoe_vid.mp4' },
]

/* Types */
interface TypewriterSubtitleProps {
  messages: string[]
  typingSpeedMs?: number
  deleteSpeedMs?: number
  pauseMs?: number
  }

interface MediaSet {
  title: string
  productSrc: string
  adSrc: string
  videoSrc?: string
  marketingImageSrc?: string
  // Custom layout fields
  adPosition?: 'third'
  secondItemSrc?: string
  productLabel?: string
  secondItemLabel?: string
  adLabel?: string
}

export default WaitlistPage
