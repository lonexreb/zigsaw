import React, { useEffect } from 'react'
import './WaitlistPage.css'

function navigate(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function PricingPage() {
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
  return (
    <div className="waitlist-page light-mode">
      <header className="top-nav" role="navigation" aria-label="Primary">
        <div className="nav-inner">
          <div className="brand" onClick={() => navigate('/') } style={{ cursor: 'pointer' }}>
            <span className="brand-logo">⚡</span>
            <span className="brand-name">Zigsaw</span>
          </div>
          <nav className="nav-links">
            <a href="/use-cases" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/use-cases') }}>Use Cases</a>
            <a href="/pricing" className="nav-link" onClick={(e) => e.preventDefault()}>Pricing</a>
          </nav>
        </div>
      </header>

      <div className="waitlist-container">
        <div className="waitlist-header" data-reveal="fade">
          <h1 className="hero-title">Simple, transparent pricing</h1>
          <p className="hero-headline">Start free. Upgrade when you grow.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, width: '100%', maxWidth: 1000 }} data-reveal="scale">
          <PlanCard
            name="Free"
            price="$0"
            cadence="/ forever"
            cta="Get started"
            features={[
              '5 credits on sign-up',
              'Image + video ad generation',
              'Basic templates',
            ]}
            highlight={false}
          />
          <PlanCard
            name="Starter"
            price="$20"
            cadence="/ month"
            cta="Choose Starter"
            features={[
              '200 monthly credits',
              'HD exports',
              'Brand presets',
              'Priority queue',
            ]}
            highlight={false}
          />
          <PlanCard
            name="Pro"
            price="$40"
            cadence="/ month"
            cta="Choose Pro"
            features={[
              '600 monthly credits',
              'All Starter features',
              'Team collaboration (3 seats)',
              'Advanced templates',
            ]}
            highlight={true}
          />
          <PlanCard
            name="Enterprise"
            price="Custom"
            cadence=""
            cta="Contact sales"
            features={[
              'SLA + support',
              'Unlimited seats',
              'API + SSO',
              'Fine-tuned models',
            ]}
            highlight={false}
          />
        </div>

        {/* Credits explainer */}
        <section style={{ marginTop: 36, textAlign: 'left', width: '100%', maxWidth: 900 }} data-reveal>
          <h2 style={{ marginBottom: 8 }}>How credits work</h2>
          <p style={{ color: '#374151' }}>
            1 credit renders one standard image, or 4 credits render a 10–15s video. Unused
            monthly credits roll over for 1 month on paid plans.
          </p>
        </section>

        {/* Feature grid */}
        <section style={{ marginTop: 20, width: '100%', maxWidth: 1000 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12
          }}>
            {[
              { title: 'Templates', body: 'Designer-made layouts for apparel, CPG, and DTC.' },
              { title: 'Brand presets', body: 'Keep fonts, colors, and logo consistent across outputs.' },
              { title: 'HD exports', body: '4K image exports and 1080p videos on paid plans.' },
              { title: 'Team seats', body: 'Invite your team and organize projects together.' },
            ].map((f, i) => (
              <div key={i} data-reveal={i % 2 === 0 ? 'left' : 'right'} style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 16,
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
              }}>
                <h3 style={{ marginTop: 0 }}>{f.title}</h3>
                <p style={{ marginBottom: 0, color: '#374151' }}>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section style={{ marginTop: 28, width: '100%', maxWidth: 900 }}>
          <h2 data-reveal>Frequently asked questions</h2>
          <div style={{ marginTop: 8 }}>
            {[
              { q: 'Can I cancel anytime?', a: 'Yes, you can cancel anytime and you will not be charged again.' },
              { q: 'Do you offer trials?', a: 'Yes, Free plan includes 5 credits. Pro includes a 7-day refund window.' },
              { q: 'Do credits expire?', a: 'Free credits don’t roll over. Paid credits roll over one month.' },
            ].map((item, i) => (
              <details key={i} data-reveal style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginTop: 8 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{item.q}</summary>
                <p style={{ color: '#374151', marginTop: 8 }}>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="bottom-preview" style={{ marginTop: 28 }}>
          <button className="view-preview-btn" onClick={() => navigate('/')}>Back to Home</button>
          <button className="ad-generator-btn" onClick={() => navigate('/use-cases')}>Explore Use Cases</button>
        </div>
      </div>
    </div>
  )
}

function PlanCard({ name, price, cadence, cta, features, highlight }: { name: string; price: string; cadence: string; cta: string; features: string[]; highlight?: boolean }) {
  return (
    <div style={{
      background: '#ffffff',
      border: highlight ? '2px solid #1d4ed8' : '1px solid #e5e7eb',
      borderRadius: 12,
      padding: 20,
      boxShadow: highlight ? '0 10px 30px rgba(29,78,216,0.15)' : '0 8px 24px rgba(0,0,0,0.06)'
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>{name}</h3>
        {highlight && <span style={{ fontSize: 12, color: '#1d4ed8', fontWeight: 700 }}>Most Popular</span>}
      </div>
      <div style={{ marginTop: 8 }}>
        <span style={{ fontSize: 32, fontWeight: 800 }}>{price}</span>
        <span style={{ color: '#6b7280', marginLeft: 6 }}>{cadence}</span>
      </div>
      <ul style={{ marginTop: 12, paddingLeft: 18, color: '#111827' }}>
        {features.map((f, i) => (
          <li key={i} style={{ marginBottom: 6 }}>{f}</li>
        ))}
      </ul>
      <button
        className="ad-generator-btn"
        style={{ width: '100%', marginTop: 10 }}
        onClick={() => navigate('/')}
      >{cta}</button>
    </div>
  )
}

