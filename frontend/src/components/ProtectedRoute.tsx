import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isGuestMode } = useAuth()
  const navigate = useNavigate()

  // Use effect to redirect instead of blocking render
  React.useEffect(() => {
    if (!user && !isGuestMode) {
      navigate('/')
    }
  }, [user, isGuestMode, navigate])

  // Always render children if we have user or guest mode
  if (user || isGuestMode) {
    return <>{children}</>
  }

  // Show loading while redirect happens
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-blue-400 mx-auto" />
        </motion.div>
        <h2 className="text-2xl font-semibold text-white">Redirecting...</h2>
        <p className="text-gray-400">Taking you to the login page.</p>
      </motion.div>
    </div>
  )
}

export default ProtectedRoute 