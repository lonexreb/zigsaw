import React, { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, CheckCircle, Cpu, Bot, User, GitMerge, HelpCircle, HelpCircle as QuestionIcon, Twitter, Apple, Send } from 'lucide-react'
import { useAuth } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import * as THREE from 'three'

import { AnimatePresence, motion as m } from 'framer-motion'

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
      className="w-full flex items-center justify-between px-8 py-4 bg-black/50 backdrop-blur border-b border-gray-800 sticky top-0 z-50 shadow-sm"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-2">
        <span
          className="font-sans font-extrabold text-3xl tracking-tight bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-700 bg-[length:200%_100%] bg-clip-text text-transparent animate-ziglow"
          style={{ WebkitTextStroke: '1px #1e293b' }}
        >
          zigsaw
        </span>
      </div>
      <div className="hidden md:flex gap-8 font-sans font-semibold tracking-tight text-gray-300 text-base">
        <a href="#features" className="hover:text-blue-400 transition relative group">
          Features
          <span className="absolute left-0 -bottom-1 h-0.5 w-full bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" style={{transitionProperty: 'transform, background'}} />
        </a>
        <a href="#pricing" className="hover:text-blue-400 transition relative group">
          Pricing
          <span className="absolute left-0 -bottom-1 h-0.5 w-full bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" style={{transitionProperty: 'transform, background'}} />
        </a>
        <a href="#solutions" className="hover:text-blue-400 transition relative group">
          Solutions
          <span className="absolute left-0 -bottom-1 h-0.5 w-full bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" style={{transitionProperty: 'transform, background'}} />
        </a>
        <a href="#about" className="hover:text-blue-400 transition relative group">
          About
          <span className="absolute left-0 -bottom-1 h-0.5 w-full bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" style={{transitionProperty: 'transform, background'}} />
        </a>
        <a href="#templates" className="hover:text-blue-400 transition relative group">
          Templates
          <span className="absolute left-0 -bottom-1 h-0.5 w-full bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" style={{transitionProperty: 'transform, background'}} />
        </a>
        <a href="#community" className="hover:text-blue-400 transition relative group">
          Community
          <span className="absolute left-0 -bottom-1 h-0.5 w-full bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" style={{transitionProperty: 'transform, background'}} />
        </a>
        <a href="#docs" className="hover:text-blue-400 transition relative group">
          Docs
          <span className="absolute left-0 -bottom-1 h-0.5 w-full bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" style={{transitionProperty: 'transform, background'}} />
        </a>
        <a href="#blog" className="hover:text-blue-400 transition relative group">
          Blog
          <span className="absolute left-0 -bottom-1 h-0.5 w-full bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" style={{transitionProperty: 'transform, background'}} />
        </a>
      </div>
      <style>{`
        @keyframes ziglow {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        .animate-ziglow {
          animation: ziglow 2.5s linear infinite alternate;
        }
      `}</style>
    </motion.nav>
  )
}

function Hero() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, currentUser } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [showSignIn, setShowSignIn] = React.useState(false)
  // Typewriter animation state
  const workflows = getHeroWorkflows()
  const [current, setCurrent] = useState(0)
  const [typed, setTyped] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  // Workflow creation input (like ChatWorkflowAssistant, but in Hero)
  const [workflowInput, setWorkflowInput] = React.useState('')
  const [workflowLoading, setWorkflowLoading] = React.useState(false)
  const [workflowResponse, setWorkflowResponse] = React.useState<string | null>(null)
  const [workflow, setWorkflow] = useState<MiniWorkflow | null>(null)

  React.useEffect(() => {
    if (currentUser) navigate('/workflow')
  }, [currentUser, navigate])

  useEffect(() => {
    const full = workflows[current]
    let timeout: NodeJS.Timeout
    if (!isDeleting && typed.length < full.length) {
      timeout = setTimeout(() => setTyped(full.slice(0, typed.length + 1)), 60)
    } else if (isDeleting && typed.length > 0) {
      timeout = setTimeout(() => setTyped(full.slice(0, typed.length - 1)), 30)
    } else if (!isDeleting && typed.length === full.length) {
      timeout = setTimeout(() => setIsDeleting(true), 1200)
    } else if (isDeleting && typed.length === 0) {
      setIsDeleting(false)
      setCurrent((current + 1) % workflows.length)
    }
    return () => clearTimeout(timeout)
  }, [typed, isDeleting, current, workflows])

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('Email and password required')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      await signInWithEmail(email, password)
      // navigation handled by useEffect
    } catch (err: any) {
      if (err?.code === 'auth/user-not-found') {
        try {
          await signUpWithEmail(email, password)
          // navigation handled by useEffect
        } catch (signupErr: any) {
          setError(signupErr?.message || 'Sign up failed')
        }
      } else {
        setError(err?.message || 'Sign in failed')
      }
    } finally {
      setIsLoading(false)
    }
  }


  async function handleWorkflowCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!workflowInput.trim()) return
    setWorkflowLoading(true)
    setWorkflowResponse(null)
    setWorkflow(null) // Clear previous workflow
    try {
      // Use Groq (Grok) for workflow generation
      // Backend must have GROQ_API_KEY set in its environment
      const GROQ_API_URL = 'https://zigsaw-backend.vercel.app/api/v1/chat'
      const systemPrompt = `You are a workflow generator for a no-code visual automation platform. Always output a simple workflow as a JSON object with exactly 3 or 4 nodes, each with a unique, relevant label. The JSON must have this format:\n\n{\n  "nodes": [ ... ],\n  "edges": [ ... ]\n}\n\n- Only use these node types: trigger, universal_agent, router.\n- Node IDs must be in the format: 'trigger-#', 'universal_agent-#', 'router-#' (where # is a unique number 1-10).\n- Each node must have a unique, descriptive label relevant to the workflow.\n- Connect the nodes in a logical sequence using edges.\n- The trigger node should start the workflow.\n- Do not use any other node types or IDs.\n- Do not include any explanation, markdown, or code block. Only output the JSON object.`
      const requestBody = {
        provider: 'groq',
        model: 'llama3-70b-8192',
        maxTokens: 1024,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: workflowInput }
        ]
        // If backend requires, add: apiKey: '<YOUR_GROQ_API_KEY>'
      }
      const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      const data = await res.json()
      let workflow = null
      if (data && typeof data.content === 'string') {
        try {
          workflow = JSON.parse(data.content)
        } catch (e) {
          setWorkflowResponse('Could not parse workflow JSON.')
        }
      }
      if (workflow && workflow.nodes && workflow.edges) {
        setWorkflowResponse(`Workflow created with ${workflow.nodes.length} node${workflow.nodes.length !== 1 ? 's' : ''} and ${workflow.edges.length} edge${workflow.edges.length !== 1 ? 's' : ''}.`)
        setWorkflow(workflow)
      } else {
        setWorkflow(null)
        setWorkflowResponse('Sorry, could not generate a valid workflow. Try rephrasing your request.')
      }
    } catch (e) {
      setWorkflowResponse('Server error. Please try again later.')
    } finally {
      setWorkflowLoading(false)
    }
  }

  return (
    <section className="relative w-full flex flex-col items-center justify-center py-16 md:py-20 px-4 overflow-hidden min-h-[60vh] md:min-h-[70vh]">
      <AnimatedGlobe />
      <div className="absolute inset-0 bg-black/70 z-10" />
      {/* Hero Content */}
      <div className="relative z-20 flex flex-col items-center text-center w-full max-w-4xl">
        <motion.h1
          className="text-5xl md:text-7xl font-bold mb-4 md:mb-6 text-white"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, type: 'spring', stiffness: 100 }}
        >
          Automate your <span className="text-blue-400">social media marketing</span>
        </motion.h1>
        {/* Animated typewriter subheadline */}
        <div className="h-10 md:h-14 flex items-center justify-center mb-6 md:mb-8 min-h-[2.5rem] md:min-h-[3rem]">
          <span className="text-xl md:text-2xl text-blue-300 font-mono whitespace-nowrap">
            {typed}
            <span className="blinking-cursor">|</span>
          </span>
        </div>
        <style>{`
          .blinking-cursor {
            display: inline-block;
            width: 1ch;
            animation: blink 1s steps(2, start) infinite;
          }
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
        `}</style>
        <motion.p
          className="text-base md:text-lg text-gray-400 mb-6 md:mb-8 max-w-xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1 }}
        >
          Create viral content, schedule posts, and engage with your audience across all platforms—automatically. Scale your social media presence without the manual work.
        </motion.p>
        {/* Get Started Button or Login Form */}
        {!showSignIn && (
          <motion.button
            className="px-8 py-4 font-bold text-lg rounded-lg mb-4 flex items-center gap-3 relative overflow-visible shadow-2xl bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400 text-white group animate-strong-glow"
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowSignIn(true)}
            aria-label="Get Started"
            type="button"
          >
            {/* Strong animated glow */}
            <span className="absolute -inset-3 rounded-2xl z-0 pointer-events-none animate-strong-glow" aria-hidden="true" />
            <span className="relative z-10">Get Started</span>
            <span className="w-6 h-6 flex items-center justify-center text-white text-2xl drop-shadow-lg relative z-10">⏎</span>
            {/* Stronger shine animation overlay */}
            <span className="absolute left-0 top-0 w-full h-full z-0 pointer-events-none">
              <span className="block w-2/3 h-full bg-gradient-to-r from-transparent via-white/80 to-transparent blur-xl opacity-80 animate-strong-shine" />
            </span>
          </motion.button>
        )}
        {/* Workflow creation input box */}
        {!showSignIn && (
          <>
            <form onSubmit={handleWorkflowCreate} className="w-full max-w-md flex flex-col items-center gap-2 mt-8 mb-2">
              <div className="relative w-full">
                <input
                  type="text"
                  value={workflowInput}
                  onChange={e => setWorkflowInput(e.target.value)}
                  placeholder="Describe a social media automation..."
                  className="w-full px-4 py-3 pr-14 rounded-lg border border-blue-400 bg-gray-800 text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-blue-400 shadow"
                  disabled={workflowLoading}
                />
                <button
                  type="submit"
                  className="absolute top-1/2 right-2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 shadow border border-blue-300 transition-all backdrop-blur"
                  disabled={workflowLoading || !workflowInput.trim()}
                  style={{ minWidth: 40 }}
                  aria-label="Send"
                >
                  <Send className="w-5 h-5 text-blue-400 drop-shadow" />
                </button>
              </div>
              {workflowResponse && (
                <div className="w-full mt-2 text-sm text-blue-200 text-center bg-blue-900/40 rounded-lg px-3 py-2 shadow">
                  {workflowResponse}
                </div>
              )}
            </form>
            {/* Show workflow placeholder message below input box if no workflow yet */}
            {workflowResponse == null || !workflowResponse.includes('Workflow created') ? (
              <div className="w-full flex flex-col items-center justify-center py-4">
                <div className="text-gray-400 text-sm italic">Your social media automation will appear here after you describe it.</div>
              </div>
            ) : null}
            {/* After the summary, show the mini workflow canvas if available */}
            {workflow && (
              <MiniWorkflowCanvas workflow={workflow} />
            )}
          </>
        )}
        <motion.div
          className="w-full max-w-md"
          initial={false}
          animate={showSignIn ? { opacity: 1, y: 0, pointerEvents: 'auto', height: 'auto' } : { opacity: 0, y: 20, pointerEvents: 'none', height: 0 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 80 }}
          style={{ overflow: 'hidden' }}
        >
          {showSignIn && (
            <div className="bg-gray-900/50 border border-gray-700 rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4 backdrop-blur-sm">
          <form onSubmit={handleContinue} className="w-full flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-6 h-6 text-blue-400" />
                  <span className="font-bold text-xl text-white">Sign in to your account</span>
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
            <div className="flex w-full justify-center">
              <motion.button 
                type="submit" 
                disabled={isLoading} 
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition w-full"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isLoading ? 'Continuing...' : 'Continue'}
              </motion.button>
            </div>
                {/* Google OAuth button (robust, popup+redirect fallback) */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    if (isLoading) return;
                    // Try popup first, fallback to redirect if blocked or fails
                    let popupTried = false;
                    try {
                      popupTried = true;
                      const result = signInWithGoogle?.();
                      if (result && typeof result.then === 'function') {
                        result.catch((e: any) => {
                          if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request') {
                            // Fallback to redirect
                            import('firebase/auth').then(({ getAuth, GoogleAuthProvider, signInWithRedirect }) => {
                              signInWithRedirect(getAuth(), new GoogleAuthProvider())
                            })
                          } else if (e?.code === 'auth/unauthorized-domain') {
                            setError('Unauthorized domain. Please add your domain to Firebase Auth > Authorized domains.')
                          } else {
                            setError('Google sign in failed')
                          }
                        });
                      }
                    } catch (e: any) {
                      if (!popupTried || e?.code === 'auth/popup-blocked' || e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request') {
                        import('firebase/auth').then(({ getAuth, GoogleAuthProvider, signInWithRedirect }) => {
                          signInWithRedirect(getAuth(), new GoogleAuthProvider())
                        })
                      } else if (e?.code === 'auth/unauthorized-domain') {
                        setError('Unauthorized domain. Please add your domain to Firebase Auth > Authorized domains.')
                      } else {
                        setError('Google sign in failed')
                      }
                    }
                  }}
                  className="w-full flex items-center justify-center gap-3 py-3 mt-2 bg-white text-blue-700 font-semibold rounded-lg shadow hover:bg-gray-100 transition border border-gray-300"
                  style={{ fontFamily: 'inherit', fontSize: '1rem' }}
                >
                  <img src="https://logo.clearbit.com/google.com" alt="Google logo" className="w-5 h-5" />
                  Sign in with Google
                </button>
                {/* Twitter OAuth button */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    if (isLoading) return;
                    import('firebase/auth').then(({ getAuth, signInWithPopup, signInWithRedirect, TwitterAuthProvider }) => {
                      const provider = new TwitterAuthProvider();
                      signInWithPopup(getAuth(), provider)
                        .catch((e: any) => {
                          if (e?.code === 'auth/popup-blocked') {
                            signInWithRedirect(getAuth(), provider)
                          } else if (e?.code === 'auth/unauthorized-domain') {
                            setError('Unauthorized domain. Please add your domain to Firebase Auth > Authorized domains.')
                          } else if (e?.code === 'auth/popup-closed-by-user') {
                            setError('Popup closed before completing sign in.')
                          } else {
                            setError('Twitter sign in failed')
                          }
                        })
                        .finally(() => setIsLoading(false))
                    })
                  }}
                  className="w-full flex items-center justify-center gap-3 py-3 mt-2 bg-white text-blue-500 font-semibold rounded-lg shadow hover:bg-gray-100 transition border border-gray-300"
                  style={{ fontFamily: 'inherit', fontSize: '1rem' }}
                >
                  <Twitter className="w-5 h-5 text-blue-500" />
                  Sign in with Twitter
                </button>
                {/* Apple OAuth button */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    if (isLoading) return;
                    import('firebase/auth').then(({ getAuth, signInWithPopup, signInWithRedirect, OAuthProvider }) => {
                      const provider = new OAuthProvider('apple.com');
                      signInWithPopup(getAuth(), provider)
                        .catch((e: any) => {
                          if (e?.code === 'auth/popup-blocked') {
                            signInWithRedirect(getAuth(), provider)
                          } else if (e?.code === 'auth/unauthorized-domain') {
                            setError('Unauthorized domain. Please add your domain to Firebase Auth > Authorized domains.')
                          } else if (e?.code === 'auth/popup-closed-by-user') {
                            setError('Popup closed before completing sign in.')
                          } else {
                            setError('Apple sign in failed')
                          }
                        })
                        .finally(() => setIsLoading(false))
                    })
                  }}
                  className="w-full flex items-center justify-center gap-3 py-3 mt-2 bg-white text-gray-900 font-semibold rounded-lg shadow hover:bg-gray-100 transition border border-gray-300"
                  style={{ fontFamily: 'inherit', fontSize: '1rem' }}
                >
                  <Apple className="w-5 h-5 text-gray-900" />
                  Sign in with Apple
                </button>
          </form>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}

function TrustedBy() {
  const companies = getTrustedCompanies()
  // Split companies for two rows, alternate for variety
  const half = Math.ceil(companies.length / 2)
  const row1 = companies.slice(0, half)
  const row2 = companies.slice(half)

  return (
    <section className="w-full py-6 md:py-8 bg-black flex flex-col items-center">
      <div className="uppercase text-xs text-gray-500 tracking-widest mb-2 md:mb-4">Trusted by teams at</div>
      <div className="relative w-screen left-1/2 right-1/2 -translate-x-1/2 flex flex-col gap-6 overflow-x-hidden">
        {/* Row 1: left to right */}
        <div className="relative w-full overflow-x-hidden">
          <div className="flex gap-12 animate-marquee-fast whitespace-nowrap items-center">
            {row1.map(company => (
              <CompanyLogoItem key={company.domain} company={company} />
            ))}
            {row1.map(company => (
              <CompanyLogoItem key={company.domain + '-dup'} company={company} />
            ))}
          </div>
        </div>
        {/* Row 2: right to left */}
        <div className="relative w-full overflow-x-hidden">
          <div className="flex gap-12 animate-marquee-fast-reverse whitespace-nowrap items-center">
            {row2.map(company => (
              <CompanyLogoItem key={company.domain} company={company} />
            ))}
            {row2.map(company => (
              <CompanyLogoItem key={company.domain + '-dup'} company={company} />
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes marquee-fast {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-fast-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee-fast {
          animation: marquee-fast 16s linear infinite;
        }
        .animate-marquee-fast-reverse {
          animation: marquee-fast-reverse 16s linear infinite;
        }
      `}</style>
    </section>
  )
}

// Subcomponent for logo + name
function CompanyLogoItem({ company }: { company: TrustedCompany }) {
  return (
    <div className="flex flex-col items-center min-w-[120px] mx-4">
      <img
        src={getCompanyLogoUrl(company.domain)}
        alt={company.name + ' logo'}
        className="h-10 w-auto object-contain mb-2 bg-white rounded shadow"
        loading="lazy"
        draggable={false}
        onError={e => (e.currentTarget.style.display = 'none')}
      />
      <span className="font-bold text-gray-400 text-xs text-center truncate w-24">{company.name}</span>
    </div>
  )
}

// Helper: List of companies (social media marketing focused)
function getTrustedCompanies(): TrustedCompany[] {
  return [
    { name: 'Hootsuite', domain: 'hootsuite.com' },
    { name: 'Buffer', domain: 'buffer.com' },
    { name: 'Sprout Social', domain: 'sproutsocial.com' },
    { name: 'Later', domain: 'later.com' },
    { name: 'Canva', domain: 'canva.com' },
    { name: 'HubSpot', domain: 'hubspot.com' },
    { name: 'Mailchimp', domain: 'mailchimp.com' },
    { name: 'CoSchedule', domain: 'coschedule.com' },
    { name: 'SocialBee', domain: 'socialbee.io' },
    { name: 'Loomly', domain: 'loomly.com' },
    { name: 'MeetEdgar', domain: 'meetedgar.com' },
    { name: 'Sendible', domain: 'sendible.com' },
    { name: 'Agorapulse', domain: 'agorapulse.com' },
    { name: 'SocialPilot', domain: 'socialpilot.co' },
    { name: 'Planoly', domain: 'planoly.com' },
    { name: 'Creator.co', domain: 'creator.co' },
    { name: 'Socialbakers', domain: 'socialbakers.com' },
    { name: 'Brandwatch', domain: 'brandwatch.com' },
    { name: 'Sprinklr', domain: 'sprinklr.com' },
    { name: 'Falcon.io', domain: 'falcon.io' },
    { name: 'ContentStudio', domain: 'contentstudio.io' },
    { name: 'SocialFlow', domain: 'socialflow.com' },
    { name: 'Oktopost', domain: 'oktopost.com' },
    { name: 'eClincher', domain: 'eclincher.com' },
    { name: 'Crowdfire', domain: 'crowdfire.com' },
    { name: 'SocialChamp', domain: 'socialchamp.io' },
    { name: 'Publer', domain: 'publer.io' },
    { name: 'Postcron', domain: 'postcron.com' },
    { name: 'SocialOomph', domain: 'socialoomph.com' },
    { name: 'RecurPost', domain: 'recurpost.com' },
    { name: 'SmarterQueue', domain: 'smarterqueue.com' },
    { name: 'Sked Social', domain: 'skedsocial.com' },
    { name: 'MavSocial', domain: 'mavsocial.com' },
    { name: 'SocialReport', domain: 'socialreport.com' },
    { name: 'ViralWoot', domain: 'viralwoot.com' },
    { name: 'SocialBu', domain: 'socialbu.com' },
    { name: 'Zoho Social', domain: 'zoho.com' },
    { name: 'Kontentino', domain: 'kontentino.com' },
    { name: 'Simplified', domain: 'simplified.com' },
    { name: 'Iconosquare', domain: 'iconosquare.com' },
    { name: 'Vista Social', domain: 'vista.com' },
  ]
}

// Helper: Get logo URL from Brand.dev (free tier, no API key needed for basic logo)
function getCompanyLogoUrl(domain: string): string {
  return `https://logo.clearbit.com/${domain}`
  // For Brand.dev alternative:
  // return `https://logo.brand.dev/${domain}`
}

// Types
interface TrustedCompany {
  name: string
  domain: string
}

function Features() {
  // For logo nodes
  const nodeCompanies = [
    { name: 'Instagram', domain: 'instagram.com', label: 'Create post' },
    { name: 'TikTok', domain: 'tiktok.com', label: 'Schedule video' },
    { name: 'Twitter', domain: 'twitter.com', label: 'Auto-reply' }
  ]
  // Animation state for glowing
  const [glowIdx, setGlowIdx] = React.useState(0)
  const [allGreen, setAllGreen] = React.useState(false)
  React.useEffect(() => {
    let timeout: NodeJS.Timeout
    if (!allGreen) {
      timeout = setTimeout(() => {
        if (glowIdx < nodeCompanies.length - 1) {
          setGlowIdx(i => i + 1)
        } else {
          setAllGreen(true)
        }
      }, 900)
    } else {
      timeout = setTimeout(() => {
        setGlowIdx(0)
        setAllGreen(false)
      }, 1200)
    }
    return () => clearTimeout(timeout)
  }, [glowIdx, allGreen, nodeCompanies.length])
  // For FlowPilot chat button
  // Remove local showFlowPilot state
  return (
    <section id="features" className="w-full py-20 bg-gray-900 text-white flex flex-col items-center">
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-4">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-blue-400">
            <rect x="10" y="3" width="4" height="14" rx="2" fill="currentColor" />
            <rect x="5" y="8" width="3" height="9" rx="1.5" fill="currentColor" opacity="0.6" />
            <rect x="16" y="8" width="3" height="9" rx="1.5" fill="currentColor" opacity="0.6" />
            <rect x="8" y="20" width="8" height="2" rx="1" fill="currentColor" opacity="0.3" />
          </svg>
          <h2 className="text-3xl md:text-4xl font-extrabold text-center tracking-tight">Scale your social media at the speed of sound</h2>
        </div>
        <span className="mt-3 inline-block bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full tracking-wide shadow">AI-powered social media automation</span>
      </div>
      <div className="flex flex-col md:flex-row gap-12 max-w-5xl w-full items-center justify-center">
        {/* Visual Workflow Builder Feature (logos as nodes) */}
        <motion.div
          className="flex-1 bg-gradient-to-br from-blue-900/60 to-gray-800 rounded-2xl p-8 shadow-xl flex flex-col items-center justify-center min-h-[340px]"
          initial={{ x: -120, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, type: 'spring', stiffness: 80 }}
        >
          <div className="w-full flex flex-col items-center mb-6">
            <span className="text-blue-300 font-bold text-lg mb-2 tracking-wide">Visual Content Pipeline</span>
            <span className="text-gray-300 text-center text-base mb-4 max-w-xs">Connect Instagram, TikTok, Twitter, and LinkedIn. Create content once, publish everywhere automatically.</span>
          </div>
          {/* Logo node chain with animated glow and labels and visible arrows */}
          <div className="flex items-center gap-6 min-h-[100px]">
            {nodeCompanies.reduce<React.ReactNode[]>((acc, company, i) => {
              let glowClass = ''
              let boxShadow: string | undefined
              if (allGreen || i < glowIdx) {
                glowClass = 'glow-green'
                boxShadow = '0 0 0 4px #22c55e, 0 0 24px 12px #22c55e'
              } else if (i === glowIdx && !allGreen) {
                glowClass = 'animate-glow-yellow'
                boxShadow = '0 0 0 4px #fde047, 0 0 16px 8px #fde047'
              }
              acc.push(
                <div key={company.domain} className="flex flex-col items-center z-10">
                  <span className={`relative flex items-center justify-center h-14 w-14 rounded-full shadow border-2 border-blue-300 bg-white ${glowClass}`}
                    style={boxShadow ? { boxShadow } : undefined}>
                    <img
                      src={`https://logo.clearbit.com/${company.domain}`}
                      alt={company.name + ' logo'}
                      className="h-10 w-10 object-contain"
                      loading="lazy"
                      draggable={false}
                      style={{ background: '#fff', borderRadius: '9999px' }}
                    />
                  </span>
                  <span className="text-xs text-blue-200 mt-2 font-semibold whitespace-nowrap">{company.label}</span>
                </div>
              )
              if (i < nodeCompanies.length - 1) {
                acc.push(
                  <span key={company.domain + '-arrow'} className="text-blue-400 text-3xl mx-2">→</span>
                )
              }
              return acc
            }, [])}
            <style>{`
              @keyframes glow-yellow {
                0% { box-shadow: 0 0 0 4px #fde047, 0 0 16px 8px #fde047; }
                100% { box-shadow: 0 0 0 4px #fde047, 0 0 16px 8px #fde047; }
              }
              .glow-green {
                box-shadow: 0 0 0 4px #22c55e, 0 0 24px 12px #22c55e !important;
              }
              .animate-glow-yellow {
                animation: glow-yellow 0.9s linear infinite;
              }
            `}</style>
          </div>
        </motion.div>
        {/* FlowPilot Feature with chat button */}
        <motion.div
          className="flex-1 bg-gradient-to-br from-cyan-900/60 to-gray-800 rounded-2xl p-8 shadow-xl flex flex-col items-center justify-center min-h-[340px]"
          initial={{ x: 120, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, type: 'spring', stiffness: 80, delay: 0.2 }}
        >
          <div className="w-full flex flex-col items-center mb-6">
            <span className="text-cyan-300 font-bold text-lg mb-2 tracking-wide">SocialPilot: Your Content Assistant</span>
            <span className="text-gray-300 text-center text-base mb-4 max-w-xs">Just chat with SocialPilot and it instantly creates viral content, schedules posts, and manages engagement across all platforms.</span>
          </div>
          <button
            className="mt-4 px-6 py-3 bg-gray-800/60 backdrop-blur font-bold rounded-full shadow-lg hover:scale-105 transition-all text-lg flex items-center gap-2 border border-gray-500/30"
            onClick={() => {
              const chatBtn = document.querySelector('[aria-label="Open workflow assistant chat"]') as HTMLElement
              if (chatBtn) {
                chatBtn.click()
              }
            }}
            aria-label="Open FlowPilot Chat"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 21l1.8-4A7.97 7.97 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <span className="rainbow-animate-text">Chat with SocialPilot</span>
          </button>
         <style>{`
           @keyframes rainbow {
             0% { background-position: 0% 50%; }
             100% { background-position: 100% 50%; }
           }
           .rainbow-animate-text {
             background: linear-gradient(90deg, #ff0080, #7928ca, #007cf0, #00dfd8, #ff0080);
             background-size: 300% 100%;
             -webkit-background-clip: text;
             -webkit-text-fill-color: transparent;
             background-clip: text;
             text-fill-color: transparent;
             animation: rainbow 2.5s linear infinite alternate;
             font-weight: bold;
           }
         `}</style>
        </motion.div>
      </div>
    </section>
  )
}

function Pricing() {
  const tiers = getPricingTiers()
  // Sale timer for Pro plan
  const [saleEndsAt] = React.useState(() => Date.now() + 24 * 60 * 60 * 1000)
  const [saleTimeLeft, setSaleTimeLeft] = React.useState(saleEndsAt - Date.now())
  React.useEffect(() => {
    const interval = setInterval(() => {
      setSaleTimeLeft(saleEndsAt - Date.now())
    }, 33)
    return () => clearInterval(interval)
  }, [saleEndsAt])
  function formatTime(ms: number) {
    if (ms <= 0) return '00:00:00.000000'
    const totalSeconds = Math.floor(ms / 1000)
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
    const seconds = String(totalSeconds % 60).padStart(2, '0')
    const msStr = String(ms % 1000).padStart(3, '0')
    // Add microseconds (simulate with random for demo)
    const micro = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
    return `${hours}:${minutes}:${seconds}.${msStr}${micro}`
  }
  return (
    <section id="pricing" className="w-full py-20 bg-gradient-to-b from-gray-50 to-white text-gray-900 flex flex-col items-center">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full font-sans">
        {tiers.map((tier, idx) => {
          const isMiddle = idx === 1
          const isLeft = idx === 0
          const isRight = idx === 2
          return (
            <div
              key={tier.name}
              className={`flex flex-col items-center justify-between rounded-2xl p-10 min-h-[480px] h-full shadow-2xl border-2 relative transition bg-white ${
                tier.featured
                  ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300 animate-pricing-shine scale-110 z-20 ring-4 ring-blue-400/30'
                  : 'border-gray-300'
              } ${isLeft ? 'md:-rotate-8' : ''} ${isRight ? 'md:rotate-8' : ''}`}
              style={{ boxSizing: 'border-box' }}
            >
              {/* Sale badge for Pro */}
              {tier.featured && (
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-700 text-white text-xs font-bold px-5 py-1 rounded-full shadow-lg animate-pricing-shine-text border-2 border-blue-300">Sale</span>
              )}
              <h3 className={`text-2xl font-extrabold mb-2 text-center tracking-tight ${isMiddle ? 'text-3xl' : ''}`}>{tier.name}</h3>
              <div className={`flex flex-col items-center mb-4 ${isMiddle ? 'text-6xl' : 'text-5xl'} font-extrabold text-blue-400 tracking-tight`}>
                {tier.featured && tier.oldPrice && (
                  <span className="text-lg text-gray-400 font-semibold line-through mb-1">{tier.oldPrice}</span>
                )}
                <span>{tier.price}</span>
                {tier.name !== 'Business' && <span className="text-lg text-gray-400 font-semibold mb-1">/mo</span>}
                {/* Sale timer for Pro */}
                {tier.featured && (
                  <span
                    className="mt-2 text-base font-mono tracking-widest text-red-500 bg-black/90 px-4 py-2 rounded shadow border border-red-700 flex justify-center items-center w-full"
                    style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.15em' }}
                  >
                    {formatTime(saleTimeLeft)}
                  </span>
                )}
              </div>
              <ul className="text-gray-300 text-base mb-8 space-y-2 w-full md:text-left text-center md:pl-6 flex flex-col items-start md:items-start">
                {tier.features.map((f, i) => {
                  if (!isMiddle) {
                    return (
                      <li key={i} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400 min-w-4" />{f}</li>
                    )
                  }
                  // Only bold keywords in middle card
                  const keywords = [
                    'Unlimited workflows',
                    'Premium AI models',
                    'Custom integrations',
                    'Priority support',
                    'Dedicated onboarding',
                    'Team collaboration',
                    'Advanced automations',
                    'Unlimited integrations',
                    'SLA',
                    'manager',
                    'onboarding',
                  ]
                  let bolded: React.ReactNode = f
                  for (const word of keywords) {
                    if (f.toLowerCase().startsWith(word.toLowerCase())) {
                      bolded = <><span className="font-bold text-gray-900">{word}</span>{f.slice(word.length)}</>
                      break
                    }
                  }
                  return (
                    <li key={i} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400 min-w-4" />{bolded}</li>
                  )
                })}
              </ul>
              {tier.name === 'Free' ? (
                <button className="px-6 py-3 rounded-lg font-semibold shadow bg-blue-600 text-white hover:bg-blue-700 transition w-full">Start Free</button>
              ) : (
                <button className={`px-6 py-3 rounded-lg font-semibold shadow ${tier.featured ? 'bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-700 text-white hover:brightness-110' : 'bg-gray-700 text-white hover:bg-gray-600'} transition w-full`} disabled>{tier.cta}</button>
              )}
              {tier.featured && (
                <span className="absolute inset-0 rounded-2xl pointer-events-none animate-pricing-shine-border subtle-glow" aria-hidden="true" />
              )}
            </div>
          )
        })}
      </div>
      <style>{`
        @keyframes pricing-shine-border {
          0% { box-shadow: 0 0 0 0 #38bdf850, 0 0 16px 4px #0ea5e950; }
          50% { box-shadow: 0 0 16px 4px #38bdf850, 0 0 32px 8px #0ea5e950; }
          100% { box-shadow: 0 0 0 0 #38bdf850, 0 0 16px 4px #0ea5e950; }
        }
        .animate-pricing-shine-border.subtle-glow {
          animation: pricing-shine-border 2.5s ease-in-out infinite;
        }
        @keyframes pricing-shine {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        .animate-pricing-shine {
          background-size: 200% 100%;
          animation: pricing-shine 3s linear infinite alternate;
        }
        @keyframes pricing-shine-text {
          0%, 100% { filter: brightness(1.1); }
          50% { filter: brightness(1.2); }
        }
        .animate-pricing-shine-text {
          animation: pricing-shine-text 2.5s ease-in-out infinite;
        }
      `}</style>
    </section>
  )
}

// Helper: Pricing tiers (upgraded)
function getPricingTiers(): PricingTier[] {
  return [
    {
      name: 'Free',
      price: '$0',
      features: [
        '3 social platforms',
        'Basic post scheduling',
        'Community support',
        'Basic AI content generation',
        '30 posts/month',
      ],
      cta: 'Start Free',
      featured: false,
    },
    {
      name: 'Pro',
      price: '$19',
      oldPrice: '$25',
      features: [
        'Unlimited platforms',
        'Premium AI models',
        'Priority support',
        'Advanced automations',
        'Team collaboration',
        '1,000 posts/month',
        'Analytics & reporting',
      ],
      cta: 'Sale',
      featured: true,
    },
    {
      name: 'Business',
      price: '$49',
      features: [
        'All Pro features',
        'Custom integrations',
        'Dedicated onboarding',
        'SLA & compliance',
        'Unlimited posts',
        'Dedicated account manager',
        'White-label solution',
      ],
      cta: 'Contact Sales',
      featured: false,
    },
  ]
}
// Types
interface PricingTier {
  name: string
  price: string
  features: string[]
  cta: string
  featured?: boolean
  oldPrice?: string
}



function Footer() {
  return (
    <footer className="w-full bg-gray-900 border-t border-gray-700 py-8 px-4 flex flex-col md:flex-row items-center justify-between gap-4">
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
        <a href="/privacy-policy" className="hover:text-white transition">Privacy Policy</a>
        <a href="/terms-and-conditions" className="hover:text-white transition">Terms & Conditions</a>
      </nav>
      <div className="text-xs text-gray-500">&copy; {new Date().getFullYear()} Zigsaw. All rights reserved.</div>
    </footer>
  )
}

// Helper: Hero workflow examples (social media marketing focused)
function getHeroWorkflows(): string[] {
  return [
    'Auto-post viral TikTok content to Instagram',
    'Generate trending captions with AI',
    'Schedule posts at peak engagement times',
    'Auto-reply to comments across all platforms',
    'Create Instagram Stories from blog posts',
    'Repurpose YouTube videos for TikTok',
    'Generate hashtags that boost reach',
    'Monitor brand mentions and respond instantly',
    'Create content calendars automatically',
    'Turn user reviews into social proof posts',
    'Scale your social presence without the work',
  ]
}

// --- FAQ Section ---
function FAQ() {
  const faqs = getFaqs()
  const [open, setOpen] = React.useState<number | null>(null)
  return (
    <section className="w-full py-20 bg-gradient-to-b from-white via-gray-50 to-gray-100 text-gray-900 flex flex-col items-center">
      <div className="flex items-center gap-4 mb-10">
        <QuestionIcon className="w-10 h-10 text-gray-900" />
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 text-center tracking-tight">FAQ</h2>
      </div>
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {faqs.map((faq, i) => (
          <div key={i} className="border border-gray-200 rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-lg overflow-hidden">
            <button
              className="w-full flex justify-between items-center px-8 py-6 text-left font-semibold text-lg focus:outline-none group"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
              aria-controls={`faq-panel-${i}`}
            >
              <span className="flex items-center gap-3"><HelpCircle className="w-6 h-6 text-gray-400" />{faq.q}</span>
              <span className={`ml-4 transition-transform text-gray-400 group-hover:text-gray-200 ${open === i ? 'rotate-90' : ''}`}>▶</span>
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <m.div
                  id={`faq-panel-${i}`}
                  className="px-8 pb-6 text-gray-200 text-base"
                  aria-hidden={open !== i}
                  key="faq-content"
                  initial={{ maxHeight: 0, opacity: 0 }}
                  animate={{ maxHeight: 200, opacity: 1, transition: { opacity: { delay: 0.08, duration: 0.32 }, maxHeight: { duration: 0.38 } } }}
                  exit={{ maxHeight: 0, opacity: 0, transition: { opacity: { duration: 0.18 }, maxHeight: { duration: 0.28 } } }}
                  style={{ overflow: 'hidden' }}
                >
                  <div>{faq.a}</div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  )
}

// Helper: FAQ content (social media marketing focused)
function getFaqs(): FAQItem[] {
  return [
    {
      q: 'What is Zigsaw for social media?',
      a: 'Zigsaw is a no-code platform for automating your entire social media marketing workflow. Create viral content, schedule posts, and engage with audiences across all platforms—automatically.'
    },
    {
      q: 'How does SocialPilot work?',
      a: 'Just chat with SocialPilot and describe your content goals. It instantly creates engaging posts, schedules them at optimal times, and manages your entire social media presence.'
    },
    {
      q: 'Which social platforms are supported?',
      a: 'We support Instagram, TikTok, Twitter, LinkedIn, Facebook, YouTube, Pinterest, and more. Post to all your platforms simultaneously with one click.'
    },
    {
      q: 'Can I create content for my brand?',
      a: 'Absolutely! Our AI learns your brand voice and creates on-brand content that matches your style, tone, and messaging across all platforms.'
    },
    {
      q: 'How do I get started?',
      a: 'Sign up for free and connect your social accounts. Start with 3 platforms and 30 posts per month. Upgrade anytime for unlimited access and premium features.'
    },
  ]
}
interface FAQItem {
  q: string
  a: string
}

export default function Login() {
  return (
    <div className="bg-black">
      <Navbar />
      <Hero />
      <TrustedBy />
      <Features />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  )
}

// MiniWorkflowCanvas component
function MiniWorkflowCanvas({ workflow }: { workflow: MiniWorkflow | null }) {
  const nodeCount = workflow?.nodes?.length ?? 0
  const [completed, setCompleted] = React.useState<boolean[]>([])
  const [currentIdx, setCurrentIdx] = React.useState(0)
  const [progress, setProgress] = React.useState(0)
  const [isPaused, setIsPaused] = React.useState(false)
  const [selectedNode, setSelectedNode] = React.useState<null | { id: string, type: string, label?: string }>(null)
  const [hoveredNode, setHoveredNode] = React.useState<string | null>(null)
  const nodeRefs = React.useRef<(HTMLButtonElement | null)[]>([])
  const [nodePositions, setNodePositions] = React.useState<{ x: number, width: number }[]>([])
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  // Reset state if workflow changes
  React.useEffect(() => {
    if (!workflow || !nodeCount) return
    setCompleted(Array(nodeCount).fill(false))
    setCurrentIdx(0)
    setProgress(0)
    setIsPaused(false)
    setSelectedNode(null)
    setHoveredNode(null)
    setNodePositions([])
  }, [workflow, nodeCount])

  // After render, measure node positions RELATIVE TO CONTAINER
  React.useEffect(() => {
    if (!workflow || !workflow.nodes?.length) return
    if (!containerRef.current) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const positions = nodeRefs.current.slice(0, workflow.nodes.length).map(node => {
      if (!node) return { x: 0, width: 0 }
      const rect = node.getBoundingClientRect()
      return { x: rect.left - containerRect.left, width: rect.width }
    })
    // No need to normalize to minX, already relative to container
    setNodePositions(positions)
  }, [workflow, workflow?.nodes?.length])

  // Animate progress for the current node
  React.useEffect(() => {
    if (!workflow || !nodeCount || isPaused) return
    if (completed.every(Boolean)) return
    if (completed[currentIdx]) return
    let raf: number
    let start: number | null = null
    const duration = 700 // ms for each arc
    function animate(ts: number) {
      if (start === null) start = ts
      const elapsed = ts - start
      const pct = Math.min(elapsed / duration, 1)
      setProgress(pct)
      if (pct < 1) {
        raf = requestAnimationFrame(animate)
      } else {
        // Mark node as completed
        setCompleted(prev => {
          const next = [...prev]
          next[currentIdx] = true
          return next
        })
        setTimeout(() => {
          if (currentIdx < nodeCount - 1) {
            setCurrentIdx(i => i + 1)
            setProgress(0)
          } else {
            // All done, pause, then reset
            setIsPaused(true)
            setTimeout(() => {
              setCompleted(Array(nodeCount).fill(false))
              setCurrentIdx(0)
              setProgress(0)
              setIsPaused(false)
            }, 1200)
          }
        }, 200)
      }
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [currentIdx, workflow, nodeCount, completed, isPaused])

  if (!workflow || !workflow.nodes?.length) return null

  // Icon map for node types
  const nodeIcons: Record<string, JSX.Element> = {
    trigger: <Zap className="w-8 h-8 text-blue-400" />, // Lucide Zap
    universal_agent: <Bot className="w-8 h-8 text-cyan-400" />, // Lucide Bot
    router: <GitMerge className="w-8 h-8 text-yellow-400" />, // Lucide GitMerge
  }

  function formatNodeType(type: string) {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  // Preset info sentences for each node type
  function getNodeInfo(type: string, label?: string) {
    switch (type) {
      case 'trigger':
        return label ? `This is the trigger node: "${label}". It starts the workflow when a specific event occurs.` : 'This is the trigger node. It starts the workflow.'
      case 'universal_agent':
        return label ? `This is a universal agent node: "${label}". It performs an AI-powered action or automation.` : 'This is a universal agent node. It performs an AI-powered action.'
      case 'router':
        return label ? `This is a router node: "${label}". It routes the workflow based on conditions or logic.` : 'This is a router node. It routes the workflow.'
      default:
        return label ? `Node: "${label}".` : 'Node.'
    }
  }

  // SVG arc constants
  const R = 34
  const C = 2 * Math.PI * R

  return (
    <div className="w-full flex flex-col items-center justify-center py-8">
      <div ref={containerRef} className="relative w-full flex items-center justify-center">
        {/* Animated dotted lines between nodes (variable length) */}
        {workflow.nodes.length > 1 && nodePositions.length === workflow.nodes.length && (() => {
          // Each node: nodePositions[i].x (left), nodePositions[i].width
          // Draw line from right edge of node i's circle to left edge of node i+1's circle
          const y = 40 // even more slightly above center of node
          const svgWidth = nodePositions[nodePositions.length - 1].x + nodePositions[nodePositions.length - 1].width
          const circleRadius = 40 // px, since h-20 w-20
          return (
            <svg
              className="absolute z-0"
              style={{
                left: 0,
                top: 0,
                pointerEvents: 'none',
                width: svgWidth,
                height: 104,
                display: 'block',
              }}
              width={svgWidth}
              height={104}
            >
              {workflow.nodes.slice(0, -1).map((_, i) => {
                const from = nodePositions[i]
                const to = nodePositions[i + 1]
                const fromX = from.x + from.width - circleRadius // right edge of circle
                const toX = to.x + circleRadius // left edge of next circle
                return (
                  <line
                    key={i}
                    x1={fromX}
                    y1={y}
                    x2={toX}
                    y2={y}
                    stroke="#fff"
                    strokeWidth="4"
                    strokeDasharray="10 10"
                    className="dotted-connection"
                    style={{ filter: 'drop-shadow(0 0 4px #fff8)' }}
                  />
                )
              })}
            </svg>
          )
        })()}
        <div className="flex items-center gap-8 overflow-x-auto px-4 z-10">
          {workflow.nodes.map((node, i) => {
            let svgRings: React.ReactNode = null
            if (completed[i]) {
              // Full green ring
              svgRings = (
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 80 80" fill="none">
                  <circle
                    cx="40" cy="40" r={R}
                    stroke="#22c55e"
                    strokeWidth="8"
                    opacity="0.8"
                    strokeDasharray={C}
                    strokeDashoffset={0}
                    style={{ filter: 'drop-shadow(0 0 16px #22c55e)' }}
                  />
                </svg>
              )
            } else if (i === currentIdx) {
              // Growing yellow arc
              svgRings = (
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 80 80" fill="none">
                  <circle
                    cx="40" cy="40" r={R}
                    stroke="#fde047"
                    strokeWidth="8"
                    opacity="0.95"
                    strokeDasharray={C}
                    strokeDashoffset={C * (1 - progress)}
                    style={{ filter: 'drop-shadow(0 0 16px #fde047)' }}
                  />
                </svg>
              )
            }
            // Subtle hover animation: only icon grows
            const isHovered = hoveredNode === node.id
            // Connection dots logic
            const showLeftDot = i > 0 && (node.type === 'universal_agent' || node.type === 'router')
            const showRightDot = (node.type === 'trigger' && i === 0) || (node.type === 'universal_agent' || node.type === 'router')
            return (
              <React.Fragment key={node.id}>
                <button
                  ref={el => nodeRefs.current[i] = el}
                  type="button"
                  tabIndex={0}
                  aria-label={`Show info for node ${node.label || node.type}`}
                  onClick={() => setSelectedNode(node)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className="flex flex-col items-center z-10 relative transition-all duration-200 focus:outline-none group"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', outline: 'none' }}
                >
                  <span className="relative flex items-center justify-center h-20 w-20 rounded-full shadow border-4 border-blue-400 bg-white transition-all duration-200">
                    {/* SVG Glow/Arc */}
                    {svgRings}
                    {/* Connection dots */}
                    {showLeftDot && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-blue-400 rounded-full border-2 border-white shadow" style={{ zIndex: 20 }} />
                    )}
                    {showRightDot && (
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-blue-400 rounded-full border-2 border-white shadow" style={{ zIndex: 20 }} />
                    )}
                    <span
                      className={`relative z-10 transition-transform duration-200 ${isHovered ? 'scale-105' : ''}`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.18s cubic-bezier(0.4,0,0.2,1)' }}
                    >
                      {nodeIcons[node.type] || <Cpu className="w-8 h-8 text-gray-400" />}
                    </span>
                  </span>
                  <span className="text-base font-bold text-white mt-2 whitespace-nowrap">{node.label || formatNodeType(node.type)}</span>
                  <span className="text-xs text-gray-400 mt-1">{formatNodeType(node.type)}</span>
                </button>
              </React.Fragment>
            )
          })}
        </div>
        <style>{`
          .dotted-connection {
            animation: dashmove 1.2s linear infinite;
          }
          @keyframes dashmove {
            to {
              stroke-dashoffset: -20;
            }
          }
          .animated-arrow {
            stroke-dasharray: 48;
            stroke-dashoffset: 0;
            animation: arrow-dash 1.2s linear infinite;
          }
          @keyframes arrow-dash {
            0% { stroke-dashoffset: 48; }
            50% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: 48; }
          }
        `}</style>
        {/* Modal for node info */}
        {selectedNode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setSelectedNode(null)}>
            <div
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-xs w-full flex flex-col items-center relative animate-fade-in"
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={`Node info: ${selectedNode.label || selectedNode.type}`}
            >
              <span className="mb-4">{nodeIcons[selectedNode.type] || <Cpu className="w-8 h-8 text-gray-400" />}</span>
              <div className="text-lg font-bold text-gray-900 mb-2">{selectedNode.label || formatNodeType(selectedNode.type)}</div>
              <div className="text-gray-700 text-base text-center mb-4">{getNodeInfo(selectedNode.type, selectedNode.label)}</div>
              <button
                type="button"
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                onClick={() => setSelectedNode(null)}
                autoFocus
              >
                Close
              </button>
            </div>
            <style>{`
              .animate-fade-in {
                animation: fadeIn 0.18s cubic-bezier(0.4,0,0.2,1);
              }
              @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.96); }
                to { opacity: 1; transform: scale(1); }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  )
}
// Types
interface MiniWorkflow {
  nodes: { id: string, type: string, label?: string }[]
  edges: { id: string, source: string, target: string }[]
}