import React from 'react'
import { motion } from 'framer-motion'
import { Mail, CheckCircle, XCircle, RefreshCw, Send, Eye, Edit3 } from 'lucide-react'
import { useGmailAuth } from '../hooks/useGmailAuth'

interface GmailStatusIndicatorProps {
  isDark: boolean
  className?: string
}

export function GmailStatusIndicator({ isDark, className }: GmailStatusIndicatorProps) {
  const { isConnected, hasTokens, email, name, scopes, loading, error, refresh, refreshTokens } = useGmailAuth()

  const getAvailableActions = () => {
    if (!scopes || scopes.length === 0) return []
    
    const actions = []
    if (scopes.includes('https://www.googleapis.com/auth/gmail.readonly')) {
      actions.push({ icon: Eye, name: 'Read Emails', description: 'Access and read your Gmail messages' })
    }
    if (scopes.includes('https://www.googleapis.com/auth/gmail.modify')) {
      actions.push({ icon: Edit3, name: 'Modify Emails', description: 'Mark as read, delete, label emails' })
    }
    if (scopes.includes('https://www.googleapis.com/auth/gmail.send')) {
      actions.push({ icon: Send, name: 'Send Emails', description: 'Send emails on your behalf' })
    }
    return actions
  }

  const availableActions = getAvailableActions()

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
        <span className="text-xs">Checking Gmail...</span>
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
        <span className="text-xs">Gmail check failed</span>
      </motion.div>
    )
  }

  if (!isConnected || !hasTokens) {
    return (
      <motion.div 
        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${className} ${
          isDark ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-800/30' : 'bg-yellow-100/50 text-yellow-600 border border-yellow-300/30'
        }`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Mail className="w-4 h-4" />
        <span className="text-xs">Gmail not connected</span>
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
        <span className="text-xs font-medium">Gmail Connected</span>
        <button 
          onClick={refresh}
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

      {/* Available Actions */}
      {availableActions.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium opacity-90">Available Actions:</div>
          {availableActions.map((action, index) => (
            <motion.div 
              key={action.name}
              className="flex items-center gap-2 text-xs opacity-80"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <action.icon className="w-3 h-3" />
              <span className="font-medium">{action.name}</span>
            </motion.div>
          ))}
        </div>
      )}

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
      </div>
    </motion.div>
  )
} 