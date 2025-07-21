import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Zap, Layers, Clock, CheckCircle, Cpu, Bot, User, ArrowRight, GitMerge, Database, Shield } from 'lucide-react'
import { useAuth } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import * as THREE from 'three'

function AnimatedGlobe() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    mountRef.current.appendChild(renderer.domElement)

    const geometry = new THREE.SphereGeometry(5, 32, 32)
    const texture = new THREE.TextureLoader().load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/earthmap1k.jpg')
    const material = new THREE.MeshBasicMaterial({ map: texture, color: 0xaaaaaa })
    const sphere = new THREE.Mesh(geometry, material)
    scene.add(sphere)

    camera.position.z = 10

    const animate = function () {
      requestAnimationFrame(animate)
      sphere.rotation.y += 0.001
      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      if (mountRef.current) {
        camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      mountRef.current?.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className="absolute top-0 left-0 w-full h-full z-0 opacity-30" />
}

function Navbar() {
  return (
    <motion.nav 
      className="w-full flex items-center justify-between px-8 py-4 bg-black/50 backdrop-blur border-b border-gray-800 sticky top-0 z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-2">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M4 7h3a1 1 0 001-1V5a2 2 0 114 0v1a1 1 0 001 1h3v3a1 1 0 001 1h1a2 2 0 110 4h-1a1 1 0 00-1 1v3H7v-3a1 1 0 00-1-1H5a2 2 0 110-4h1a1 1 0 001-1V7z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <span className="font-mono font-bold text-2xl text-white">zigsaw</span>
      </div>
      <div className="hidden md:flex gap-8 text-gray-300 font-mono text-base">
        <a href="#features" className="hover:text-blue-400 transition">Features</a>
        <a href="#pricing" className="hover:text-blue-400 transition">Pricing</a>
        <a href="#community" className="hover:text-blue-400 transition">Community</a>
        <a href="#docs" className="hover:text-blue-400 transition">Docs</a>
      </div>
      <motion.a 
        href="#get-started" 
        className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        Get Started
      </motion.a>
    </motion.nav>
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
    <section className="relative w-full flex flex-col items-center justify-center py-24 px-4 overflow-hidden min-h-[90vh]">
      <AnimatedGlobe />
      <div className="absolute inset-0 bg-black/70 z-10" />
      
      {/* Hero Content */}
      <div className="relative z-20 flex flex-col items-center text-center w-full max-w-4xl">
        <motion.h1
          className="text-5xl md:text-7xl font-bold mb-6 text-white"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, type: 'spring', stiffness: 100 }}
        >
          The Developer Platform for <span className="text-blue-400">Reliable AI Agents</span>
        </motion.h1>
        <motion.p
          className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
        >
          Trace, debug, and deploy reliable AI agents. Zigsaw integrates with any agent framework and over 400+ LLMs.
        </motion.p>
        
        {/* Login Form */}
        <motion.div
          className="w-full max-w-md bg-gray-900/50 border border-gray-700 rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4 backdrop-blur-sm"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <form onSubmit={handleLogin} className="w-full flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-6 h-6 text-blue-400" />
              <span className="font-bold text-xl text-white">Get Started</span>
            </div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoComplete="email"
              required
              disabled={isLoading}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoComplete="current-password"
              required
              disabled={isLoading}
            />
            {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
            <div className="flex gap-4 w-full justify-center">
              <motion.button 
                type="submit" 
                disabled={isLoading} 
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition w-full"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </motion.button>
              <motion.button 
                type="button" 
                onClick={handleSignUp} 
                disabled={isLoading} 
                className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition w-full"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isLoading ? 'Signing Up...' : 'Sign Up'}
              </motion.button>
            </div>
          </form>
        </motion.div>

        <div className="flex gap-8 mt-12 text-gray-300">
          <motion.div whileHover={{ scale: 1.1, y: -5 }} className="flex flex-col items-center">
            <GitMerge className="w-8 h-8 text-green-400 mb-1" />
            <span className="text-xs">Integrations</span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1, y: -5 }} className="flex flex-col items-center">
            <Database className="w-8 h-8 text-purple-400 mb-1" />
            <span className="text-xs">Fine-tuning</span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1, y: -5 }} className="flex flex-col items-center">
            <Shield className="w-8 h-8 text-yellow-400 mb-1" />
            <span className="text-xs">Security</span>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function TrustedBy() {
  return (
    <section className="w-full py-12 bg-black flex flex-col items-center">
      <div className="uppercase text-xs text-gray-500 tracking-widest mb-4">Trusted by teams at</div>
      <div className="flex flex-wrap gap-8 justify-center items-center">
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
      icon: <Zap className="w-8 h-8 text-blue-400" />,
      title: 'Agentflow',
      desc: 'Build multi-agent systems with workflow orchestration distributed across multiple coordinated agents.'
    },
    {
      icon: <Layers className="w-8 h-8 text-green-400" />,
      title: 'Chat Assistants',
      desc: 'Build single-agent systems and chatbots with support for tool calling and knowledge retrieval (RAG) from various data sources.'
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-yellow-400" />,
      title: 'Human in the Loop',
      desc: 'Allow humans to review tasks performed by agents within the feedback loop.'
    },
    {
      icon: <Cpu className="w-8 h-8 text-purple-400" />,
      title: 'Observability',
      desc: 'Full execution traces, support Prometheus, OpenTelemetry and other observability tools.'
    },
    {
      icon: <Clock className="w-8 h-8 text-pink-400" />,
      title: 'API, SDK, Embed',
      desc: 'Extend and integrate to your applications using APIs, SDK and Embedded Chat.'
    },
    {
      icon: <Layers className="w-8 h-8 text-blue-300" />,
      title: 'Enterprise Ready',
      desc: 'Deploy and scale your AI applications with enterprise-grade infrastructure, support for both cloud and on-premises environments.'
    },
  ]
  return (
    <section id="features" className="w-full py-20 bg-gray-900 text-white flex flex-col items-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
        {features.map((f, i) => (
          <motion.div 
            key={i} 
            className="flex flex-col items-center bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-blue-500/20 transition"
            whileHover={{ y: -10, boxShadow: '0px 15px 30px rgba(0, 0, 0, 0.2)' }}
          >
            <div className="p-3 bg-gray-700 rounded-full mb-4">{f.icon}</div>
            <h3 className="text-xl font-semibold mt-4 mb-2 text-center">{f.title}</h3>
            <p className="text-gray-400 text-center">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="w-full bg-black border-t border-gray-800 py-8 px-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M4 7h3a1 1 0 001-1V5a2 2 0 114 0v1a1 1 0 001 1h3v3a1 1 0 001 1h1a2 2 0 110 4h-1a1 1 0 00-1 1v3H7v-3a1 1 0 00-1-1H5a2 2 0 110-4h1a1 1 0 001-1V7z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <span className="font-mono font-bold text-lg text-white">zigsaw</span>
      </div>
      <nav className="flex gap-6 text-gray-400 text-sm">
        <a href="#about" className="hover:text-white transition">About</a>
        <a href="#docs" className="hover:text-white transition">Docs</a>
        <a href="#contact" className="hover:text-white transition">Contact</a>
      </nav>
      <div className="text-xs text-gray-500">&copy; {new Date().getFullYear()} Zigsaw. All rights reserved.</div>
    </footer>
  )
}

export default function Login() {
  return (
    <div className="bg-black">
      <Navbar />
      <Hero />
      <TrustedBy />
      <Features />
      <Footer />
    </div>
  )
}