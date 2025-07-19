import React from 'react'
import { Zap, Layers, Clock, CheckCircle, Cpu, Repeat, Share2, Bot, Play } from 'lucide-react'
import { useAuth } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"

function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M4 7h3a1 1 0 001-1V5a2 2 0 114 0v1a1 1 0 001 1h3v3a1 1 0 001 1h1a2 2 0 110 4h-1a1 1 0 00-1 1v3H7v-3a1 1 0 00-1-1H5a2 2 0 110-4h1a1 1 0 001-1V7z" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <span className="font-mono font-bold text-2xl text-gray-800">zigsaw</span>
      </div>
      <div className="hidden md:flex gap-8 text-gray-700 font-mono text-base">
        <a href="#features" className="hover:text-blue-600 transition">Features</a>
        <a href="#pricing" className="hover:text-blue-600 transition">Pricing</a>
        <a href="#community" className="hover:text-blue-600 transition">Community</a>
        <a href="#docs" className="hover:text-blue-600 transition">Docs</a>
      </div>
      <a href="#get-started" className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition">Get Started</a>
    </nav>
  )
}

function Hero() {
  const { signInWithEmail, signUpWithEmail } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('Email and password required')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      await signInWithEmail(email, password)
      navigate('/workflow')
    } catch {
      setError('Sign in failed')
    } finally {
      setIsLoading(false)
    }
  }
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('Email and password required')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      await signUpWithEmail(email, password)
      navigate('/workflow')
    } catch {
      setError('Sign up failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="relative w-full flex flex-col items-center justify-center py-24 px-4 bg-white overflow-hidden">
      {/* Blurred Node Icons Background + Animated Connections */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Loop Node */}
          <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-32 h-32 bg-blue-200 rounded-2xl flex items-center justify-center blur opacity-60">
            <Repeat className="w-16 h-16 text-blue-400 opacity-70" />
          </div>
          {/* Router Node */}
          <div className="absolute right-1/4 top-1/3 w-28 h-28 bg-green-200 rounded-full flex items-center justify-center blur opacity-50">
            <Share2 className="w-12 h-12 text-green-500 opacity-70" />
          </div>
          {/* Agent Node */}
          <div className="absolute left-1/3 bottom-1/4 w-24 h-24 bg-purple-200 rounded-xl flex items-center justify-center blur opacity-50">
            <Bot className="w-10 h-10 text-purple-500 opacity-70" />
          </div>
          {/* Trigger Node */}
          <div className="absolute right-1/3 bottom-1/3 w-20 h-20 bg-yellow-200 rounded-full flex items-center justify-center blur opacity-40">
            <Play className="w-8 h-8 text-yellow-500 opacity-70" />
          </div>
        </div>
      </div>
      {/* Hero Text and Login Form */}
      <h1 className="text-5xl md:text-6xl font-bold text-center mb-6 relative z-10">
        Build AI Agents <span className="text-blue-600">Visually</span>
      </h1>
      <div className="relative z-10 w-full flex flex-col items-center">
        <form onSubmit={handleLogin} className="w-full max-w-xs bg-white/80 border border-gray-200 rounded-2xl shadow-lg p-4 flex flex-col items-center gap-4 mb-8 backdrop-blur">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 font-mono text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoComplete="email"
            required
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 font-mono text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoComplete="current-password"
            required
            disabled={isLoading}
          />
          {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
          <div className="flex gap-4 w-full justify-center">
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition w-1/2">Sign In</button>
            <button type="button" onClick={handleSignUp} disabled={isLoading} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition w-1/2">Sign Up</button>
          </div>
        </form>
      </div>
      <p className="text-xl md:text-2xl text-gray-600 text-center mb-8 max-w-2xl relative z-10">
        Open source agentic systems development platform
      </p>
      <div className="flex gap-4 relative z-10">
        <a href="#get-started" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition">Get Started</a>
        <a href="#github" className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold shadow hover:bg-gray-300 transition">GitHub</a>
      </div>
    </section>
  )
}

function TrustedBy() {
  return (
    <section className="w-full py-8 bg-gray-50 flex flex-col items-center">
      <div className="uppercase text-xs text-gray-500 tracking-widest mb-4">Trusted by teams at</div>
      <div className="flex flex-wrap gap-8 justify-center items-center">
        {/* Placeholder logos */}
        <span className="font-bold text-gray-400 text-lg">AWS</span>
        <span className="font-bold text-gray-400 text-lg">Accenture</span>
        <span className="font-bold text-gray-400 text-lg">Deloitte</span>
        <span className="font-bold text-gray-400 text-lg">GlobeTelecom</span>
        <span className="font-bold text-gray-400 text-lg">Publicis</span>
        <span className="font-bold text-gray-400 text-lg">InsightSoftware</span>
      </div>
    </section>
  )
}

function Features() {
  const features = [
    {
      icon: <Zap className="w-8 h-8 text-blue-600" />,
      title: 'Agentflow',
      desc: 'Build multi-agent systems with workflow orchestration distributed across multiple coordinated agents.'
    },
    {
      icon: <Layers className="w-8 h-8 text-green-600" />,
      title: 'Chat Assistants',
      desc: 'Build single-agent systems and chatbots with support for tool calling and knowledge retrieval (RAG) from various data sources.'
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-yellow-500" />,
      title: 'Human in the Loop',
      desc: 'Allow humans to review tasks performed by agents within the feedback loop.'
    },
    {
      icon: <Cpu className="w-8 h-8 text-purple-600" />,
      title: 'Observability',
      desc: 'Full execution traces, support Prometheus, OpenTelemetry and other observability tools.'
    },
    {
      icon: <Clock className="w-8 h-8 text-pink-500" />,
      title: 'API, SDK, Embed',
      desc: 'Extend and integrate to your applications using APIs, SDK and Embedded Chat.'
    },
    {
      icon: <Layers className="w-8 h-8 text-blue-400" />,
      title: 'Enterprise Ready',
      desc: 'Deploy and scale your AI applications with enterprise-grade infrastructure, support for both cloud and on-premises environments.'
    },
  ]
  return (
    <section id="features" className="w-full py-20 bg-white flex flex-col items-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
        {features.map((f, i) => (
          <div key={i} className="flex flex-col items-center bg-gray-50 rounded-2xl p-8 shadow hover:shadow-lg transition">
            {f.icon}
            <h3 className="text-xl font-semibold mt-4 mb-2 text-center">{f.title}</h3>
            <p className="text-gray-600 text-center">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Testimonials() {
  return (
    <section className="w-full py-20 bg-gray-50 flex flex-col items-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Customer Success Stories</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
        <div className="bg-white rounded-2xl p-8 shadow flex flex-col items-center">
          <span className="font-bold text-blue-600 mb-2">InsightSoftware</span>
          <p className="text-gray-600 text-center mb-2">“Flowise allows us to supercharge our existing embedded analytics platform with built-in AI features that our clients absolutely love.”</p>
          <span className="text-xs text-gray-400">Terrence Sheflin, Director of Engineering</span>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow flex flex-col items-center">
          <span className="font-bold text-green-600 mb-2">UneeQ Digital Humans</span>
          <p className="text-gray-600 text-center mb-2">“Flowise has been able to dramatically decrease the resources required to deploy our digital human experiences.”</p>
          <span className="text-xs text-gray-400">Tyler Merritt, CTO, UneeQ</span>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow flex flex-col items-center">
          <span className="font-bold text-yellow-600 mb-2">Qmic</span>
          <p className="text-gray-600 text-center mb-2">“Integrating Flowise with many other components and utilizing the function-calling capability of LLMs significantly enhanced the quality and efficiency of our new copilot feature.”</p>
          <span className="text-xs text-gray-400">Dr. Fethi Filali, Director of Technology & Applied Research</span>
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  const navigate = useNavigate();

  const handleGetStarted = (plan: string) => {
    if (plan === 'free') {
      // For free plan, redirect to signup
      const signUpSection = document.getElementById('signup');
      if (signUpSection) {
        signUpSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // For paid plans, redirect to subscription page with plan parameter
      navigate(`/subscription?plan=${plan}`);
    }
  };

  return (
    <section id="pricing" className="w-full py-20 bg-white flex flex-col items-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Pricing</h2>
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl justify-center">
        {/* Free */}
        <div className="flex-1 max-w-sm">
          <div className="rounded-2xl border border-gray-200 shadow-md p-8 flex flex-col items-center bg-gray-50">
            <h3 className="text-xl font-semibold mb-2">Free</h3>
            <div className="text-4xl font-bold mb-2">$0</div>
            <div className="text-gray-500 mb-4">per month</div>
            <ul className="text-gray-700 text-sm mb-6 space-y-2">
              <li>2 Flows & Assistants</li>
              <li>100 Predictions / month</li>
              <li>5MB Storage</li>
              <li>Community Support</li>
            </ul>
            <button 
              onClick={() => handleGetStarted('free')} 
              className="w-full py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
            >
              Get Started
            </button>
          </div>
        </div>
        {/* Starter */}
        <div className="flex-1 max-w-sm">
          <div className="rounded-2xl border-2 border-blue-500 shadow-lg p-8 flex flex-col items-center bg-white relative">
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
            <h3 className="text-xl font-semibold mb-2">Starter</h3>
            <div className="text-4xl font-bold mb-2">$35</div>
            <div className="text-gray-500 mb-4">per month</div>
            <ul className="text-gray-700 text-sm mb-6 space-y-2">
              <li>Unlimited Flows & Assistants</li>
              <li>10,000 Predictions / month</li>
              <li>1GB Storage</li>
              <li>Community Support</li>
            </ul>
            <button 
              onClick={() => handleGetStarted('starter')} 
              className="w-full py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition"
            >
              Get Started
            </button>
          </div>
        </div>
        {/* Pro */}
        <div className="flex-1 max-w-sm">
          <div className="rounded-2xl border border-gray-200 shadow-md p-8 flex flex-col items-center bg-gray-50">
            <h3 className="text-xl font-semibold mb-2">Pro</h3>
            <div className="text-4xl font-bold mb-2">$65</div>
            <div className="text-gray-500 mb-4">per month</div>
            <ul className="text-gray-700 text-sm mb-6 space-y-2">
              <li>50,000 Predictions / month</li>
              <li>10GB Storage</li>
              <li>Unlimited Workspaces</li>
              <li>Priority Support</li>
            </ul>
            <button 
              onClick={() => handleGetStarted('pro')} 
              className="w-full py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
            >
              Get Started
            </button>
          </div>
        </div>
        {/* Enterprise */}
        <div className="flex-1 max-w-sm">
          <div className="rounded-2xl border border-gray-200 shadow-md p-8 flex flex-col items-center bg-gray-50">
            <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
            <div className="text-4xl font-bold mb-2">Contact Us</div>
            <div className="text-gray-500 mb-4">Custom pricing</div>
            <ul className="text-gray-700 text-sm mb-6 space-y-2">
              <li>On-Premise Deployment</li>
              <li>99.99% Uptime SLA</li>
              <li>Personalized Support</li>
              <li>SSO, SAML, RBAC</li>
            </ul>
            <button className="w-full py-2 rounded-lg bg-gray-800 text-white font-semibold hover:bg-gray-900 transition">Contact Sales</button>
          </div>
        </div>
      </div>
    </section>
  )
}

function Community() {
  return (
    <section id="community" className="w-full py-20 bg-blue-50 flex flex-col items-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Community</h2>
      <p className="text-lg text-blue-900 mb-8 text-center max-w-2xl">Open source community is the heart of Zigsaw. Join our Discord and see why developers love and build using Zigsaw.</p>
      <a href="#discord" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition">Join Discord</a>
    </section>
  )
}

function Footer() {
  return (
    <footer className="w-full bg-gray-100 border-t border-gray-200 py-8 px-4 flex flex-col md:flex-row items-center justify-between gap-4 mt-8">
      <div className="flex items-center gap-2">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M4 7h3a1 1 0 001-1V5a2 2 0 114 0v1a1 1 0 001 1h3v3a1 1 0 001 1h1a2 2 0 110 4h-1a1 1 0 00-1 1v3H7v-3a1 1 0 00-1-1H5a2 2 0 110-4h1a1 1 0 001-1V7z" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <span className="font-mono font-bold text-lg text-gray-800">zigsaw</span>
      </div>
      <nav className="flex gap-6 text-gray-600 text-sm">
        <a href="#about" className="hover:text-gray-900 transition">About</a>
        <a href="#docs" className="hover:text-gray-900 transition">Docs</a>
        <a href="#contact" className="hover:text-gray-900 transition">Contact</a>
      </nav>
      <div className="text-xs text-gray-500">&copy; {new Date().getFullYear()} Zigsaw. All rights reserved.</div>
    </footer>
  )
}

export default function Login() {
  return (
    <>
      <Navbar />
      <Hero />
      <TrustedBy />
      <Features />
      <Testimonials />
      <Pricing />
      <Community />
      <Footer />
    </>
  )
}