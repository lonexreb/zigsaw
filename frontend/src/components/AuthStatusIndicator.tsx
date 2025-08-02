import React from 'react'
import { motion } from 'framer-motion'
import { Mail, Calendar, CheckCircle, XCircle, RefreshCw, User, LogOut } from 'lucide-react'
import { useGmailAuth } from '../hooks/useGmailAuth'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu'
import { GmailSignInButton, GoogleCalendarSignInButton } from './ui/SlackSignInButton'

interface AuthStatusIndicatorProps {
  isDark: boolean
  className?: string
}

export function AuthStatusIndicator({ isDark, className }: AuthStatusIndicatorProps) {
  const { isConnected, hasTokens, email, name, scopes, loading, error, refresh, refreshTokens } = useGmailAuth()

  const hasGmailAccess = scopes?.some(scope => scope.includes('gmail'))
  const hasCalendarAccess = scopes?.some(scope => scope.includes('calendar'))

  if (loading) {
    return (
      <motion.div 
        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${className} ${
          isDark ? 'bg-gray-800/50 text-gray-300' : 'bg-gray-100/50 text-gray-600'
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-xs">Checking auth...</span>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div 
        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${className} ${
          isDark ? 'bg-red-900/20 text-red-400 border border-red-800/30' : 'bg-red-100/50 text-red-600 border border-red-300/30'
        }`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <XCircle className="w-4 h-4" />
        <span className="text-xs">Auth check failed</span>
      </motion.div>
    )
  }

  if (!isConnected || !hasTokens) {
    return (
      <motion.div 
        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${className} ${
          isDark ? 'bg-gray-800/50 text-gray-300 border border-gray-700/30' : 'bg-gray-100/50 text-gray-600 border border-gray-300/30'
        }`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <User className="w-4 h-4" />
        <span className="text-xs">Not signed in</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-2 px-2 py-1 rounded text-xs bg-blue-500 text-white hover:bg-blue-600 transition-colors">
              Sign In
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <GmailSignInButton 
                className="w-full px-2 py-1 text-xs h-8" 
                onSuccess={refresh}
              />
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <GoogleCalendarSignInButton 
                className="w-full px-2 py-1 text-xs h-8" 
                onSuccess={refresh}
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className={`flex flex-col gap-2 px-3 py-2 rounded-lg ${className} ${
        isDark ? 'bg-green-900/20 text-green-400 border border-green-800/30' : 'bg-green-100/50 text-green-600 border border-green-300/30'
      }`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {/* Status Header */}
      <div className="flex items-center gap-2">
        <CheckCircle className="w-4 h-4" />
        <span className="text-xs font-medium">Connected</span>
        <button 
          onClick={() => {
            localStorage.removeItem('sessionToken')
            refresh()
          }}
          className="ml-auto p-1 rounded hover:bg-green-800/20 transition-colors"
          title="Refresh status"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {/* User Info */}
      {(email || name) && (
        <div className="text-xs opacity-80">
          {name && <div className="font-medium">{name}</div>}
          {email && <div className="opacity-70">{email}</div>}
        </div>
      )}

      {/* Service Status */}
      <div className="space-y-1">
        <div className="text-xs font-medium opacity-90">Services:</div>
        <div className="flex items-center gap-2 text-xs opacity-80">
          <Mail className="w-3 h-3" />
          <span className="font-medium">Gmail</span>
          {hasGmailAccess ? (
            <CheckCircle className="w-3 h-3 text-green-400" />
          ) : (
            <XCircle className="w-3 h-3 text-red-400" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs opacity-80">
          <Calendar className="w-3 h-3" />
          <span className="font-medium">Calendar</span>
          {hasCalendarAccess ? (
            <CheckCircle className="w-3 h-3 text-green-400" />
          ) : (
            <XCircle className="w-3 h-3 text-red-400" />
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-1 mt-1">
        <button 
          onClick={refreshTokens}
          className={`px-2 py-1 rounded text-xs transition-colors ${
            isDark 
              ? 'bg-green-800/30 hover:bg-green-700/40 text-green-300' 
              : 'bg-green-200/50 hover:bg-green-300/50 text-green-700'
          }`}
          title="Refresh tokens"
        >
          Refresh
        </button>
        <button 
          onClick={() => {
            localStorage.removeItem('sessionToken')
            window.location.href = 'https://zigsaw-backend.vercel.app/api/auth/signout?callbackUrl=https://zigsaw.dev/workflow'
          }}
          className={`px-2 py-1 rounded text-xs transition-colors ${
            isDark 
              ? 'bg-red-800/30 hover:bg-red-700/40 text-red-300' 
              : 'bg-red-200/50 hover:bg-red-300/50 text-red-700'
          }`}
          title="Sign out"
        >
          <LogOut className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  )
} 