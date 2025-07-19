import React from 'react'
import { motion } from 'framer-motion'
import Logo from '../Logo'
import { Sun, Moon, Settings, Rocket, LogOut, Crown, Play, Square, Save, Zap, ZapOff } from 'lucide-react'
import TabBar from '../TabBar'
import TierIndicator from '../TierIndicator'
import { useTheme } from '../theme/ThemeProvider'

interface WorkflowHeaderProps {
  isDark: boolean
  toggleTheme: () => void
  detectedWorkflows: any[]
  activeTab: string
  handleTabChange: (tabId: string) => void
  tabs: any[]
  navigate: (path: string) => void
  handleManualSave: () => void
  isWorkflowExecuting: boolean
  nodes: any[]
  handleRunWorkflow: () => void
  handleOpenDeployment: () => void
  signOut: () => void
  onTestPost: () => void
}

export function WorkflowHeader({
  isDark,
  toggleTheme,
  detectedWorkflows,
  activeTab,
  handleTabChange,
  tabs,
  navigate,
  handleManualSave,
  isWorkflowExecuting,
  nodes,
  handleRunWorkflow,
  handleOpenDeployment,
  signOut,
  onTestPost
}: WorkflowHeaderProps) {
  const { backgroundEffectsEnabled, setBackgroundEffectsEnabled } = useTheme()
  
  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`absolute top-0 left-0 right-0 z-10 backdrop-blur-xl ${isDark ? 'bg-gray-900/30 border-gray-700/20' : 'bg-gray-200/50 border-gray-600/30'} border-b shadow-lg`}
    >
      <div className="flex items-center justify-between p-3 sm:p-4">
        <motion.div 
          className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1"
          whileHover={{ scale: 1.01 }}
        >
          <div className="flex items-center space-x-2">
            <div className="min-w-0">
              <Logo size="md" isDark={isDark} />
              <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} flex items-center space-x-1 truncate`}>
                <span className="hidden sm:inline">Zigsaw</span>
                {detectedWorkflows.length > 0 && (
                  <span className={`px-1.5 py-0.5 ${isDark ? 'bg-white/20 text-white border-white/30' : 'bg-black/20 text-black border-black/30'} rounded text-xs border flex-shrink-0`}>
                    {detectedWorkflows.length}w
                  </span>
                )}
              </div>
            </div>
            {/* Theme Toggle Button */}
            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-lg transition-all duration-300 backdrop-blur-sm border shadow-lg ${
                isDark 
                  ? 'bg-gray-800/80 hover:bg-gray-700/90 text-white border-gray-600/30' 
                  : 'bg-gray-100/80 hover:bg-gray-200/90 text-black border-gray-400/50'
              }`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.button>
            {/* Background Effects Toggle Button */}
            <motion.button
              onClick={() => setBackgroundEffectsEnabled(!backgroundEffectsEnabled)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-lg transition-all duration-300 backdrop-blur-sm border shadow-lg ${
                backgroundEffectsEnabled
                  ? (isDark 
                      ? 'bg-blue-600/80 hover:bg-blue-500/90 text-white border-blue-500/30' 
                      : 'bg-blue-500/80 hover:bg-blue-400/90 text-white border-blue-400/50')
                  : (isDark 
                      ? 'bg-gray-600/80 hover:bg-gray-500/90 text-gray-300 border-gray-500/30' 
                      : 'bg-gray-400/80 hover:bg-gray-300/90 text-gray-600 border-gray-300/50')
              }`}
              title={backgroundEffectsEnabled ? 'Disable Background Effects (Better Performance)' : 'Enable Background Effects'}
            >
              {backgroundEffectsEnabled ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
            </motion.button>
          </div>
        </motion.div>
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          {/* Tab Bar */}
          <TabBar 
            activeTab={activeTab}
            onTabChange={handleTabChange}
            tabs={tabs}
            isDark={isDark}
          />
          {/* Tier Indicator */}
          <TierIndicator isDark={isDark} />
          {/* Buy Premium Button */}
          <motion.button
            onClick={() => navigate('/subscription')}
            whileHover={{ scale: 1.05, boxShadow: isDark ? "0 0 20px rgba(255, 215, 0, 0.4)" : "0 0 20px rgba(255, 140, 0, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            className={`px-3 py-2 rounded-lg transition-all duration-300 backdrop-blur-sm border shadow-lg ${
              isDark 
                ? 'bg-gradient-to-r from-yellow-600/80 to-orange-600/80 hover:from-yellow-500/90 hover:to-orange-500/90 text-white border-yellow-500/30' 
                : 'bg-gradient-to-r from-yellow-500/80 to-orange-500/80 hover:from-yellow-400/90 hover:to-orange-400/90 text-white border-yellow-400/50'
            }`}
            title="Upgrade to Premium"
          >
            <Crown className="w-4 h-4" />
          </motion.button>
          {/* Manual Save Button - Debug Only */}
          <motion.button
            onClick={handleManualSave}
            whileHover={{ scale: 1.05, boxShadow: isDark ? "0 0 20px rgba(59, 130, 246, 0.4)" : "0 0 20px rgba(59, 130, 246, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            className={`p-2 rounded-lg transition-all duration-300 backdrop-blur-sm border shadow-lg ${
              isDark 
                ? 'bg-blue-600/80 hover:bg-blue-500/90 text-white border-blue-500/30' 
                : 'bg-blue-500/80 hover:bg-blue-400/90 text-white border-blue-400/50'
            }`}
            title="Save Workflow"
          >
            <Save className="w-4 h-4" />
          </motion.button>
          <motion.button 
            onClick={handleRunWorkflow}
            whileHover={{ scale: 1.05, boxShadow: isWorkflowExecuting 
              ? (isDark ? "0 0 20px rgba(239, 68, 68, 0.4)" : "0 0 20px rgba(220, 38, 38, 0.4)")
              : (isDark ? "0 0 20px rgba(34, 197, 94, 0.4)" : "0 0 20px rgba(22, 163, 74, 0.4)")
            }}
            whileTap={{ scale: 0.95 }}
            disabled={nodes.length === 0 || detectedWorkflows.length === 0}
            className={`px-2 py-2 rounded-lg font-medium text-xs transition-all duration-300 flex items-center space-x-1 backdrop-blur-sm border shadow-lg ${
              nodes.length === 0 || detectedWorkflows.length === 0
                ? (isDark ? 'bg-gray-600/50 border-gray-500/30 text-gray-400 cursor-not-allowed' : 'bg-gray-300/50 border-gray-400/50 text-gray-600 cursor-not-allowed')
                : isWorkflowExecuting
                ? (isDark ? 'bg-gradient-to-r from-red-500/80 to-red-600/80 hover:from-red-400/90 hover:to-red-500/90 text-white border-red-400/30' : 'bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-500/90 hover:to-red-600/90 text-white border-red-500/50')
                : (isDark ? 'bg-gradient-to-r from-green-500/80 to-green-600/80 hover:from-green-400/90 hover:to-green-500/90 text-white border-green-400/30' : 'bg-gradient-to-r from-green-600/80 to-green-700/80 hover:from-green-500/90 hover:to-green-600/90 text-white border-green-500/50')
            }`}
            title={isWorkflowExecuting ? 'Stop Workflow' : 'Run Workflow'}
          >
            <motion.div
              animate={isWorkflowExecuting ? { rotate: [0, 360] } : {}}
              transition={isWorkflowExecuting ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
            >
              {isWorkflowExecuting ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </motion.div>
            <span className="hidden sm:inline">
              {isWorkflowExecuting 
                ? 'Stop' 
                : nodes.length === 0
                  ? 'Add'
                  : detectedWorkflows.length === 0
                    ? 'Connect'
                    : 'Run'
              }
            </span>
          </motion.button>
          {/* Test POST Button */}
          <motion.button
            onClick={onTestPost}
            whileHover={{ scale: 1.05, boxShadow: isDark ? "0 0 20px rgba(59, 130, 246, 0.4)" : "0 0 20px rgba(59, 130, 246, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            className={`px-2 py-2 rounded-lg font-medium text-xs transition-all duration-300 flex items-center space-x-1 backdrop-blur-sm border shadow-lg ${
              isDark
                ? 'bg-gradient-to-r from-blue-500/80 to-blue-600/80 hover:from-blue-400/90 hover:to-blue-500/90 text-white border-blue-400/30'
                : 'bg-gradient-to-r from-blue-600/80 to-blue-700/80 hover:from-blue-500/90 hover:to-blue-600/90 text-white border-blue-500/50'
            }`}
            title="Test POST to /api/workflow_execute"
          >
            <Play className="w-4 h-4" />
            <span className="hidden sm:inline">Test POST</span>
          </motion.button>
          <motion.button 
            onClick={handleOpenDeployment}
            whileHover={{ scale: 1.05, boxShadow: isDark ? "0 0 20px rgba(255, 255, 255, 0.4)" : "0 0 20px rgba(0, 0, 0, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            className={`p-2 rounded-lg transition-all duration-300 backdrop-blur-sm border shadow-lg ${
              isDark 
                ? 'bg-gradient-to-r from-gray-700/80 to-gray-800/80 hover:from-gray-600/90 hover:to-gray-700/90 text-white border-gray-600/30' 
                : 'bg-gradient-to-r from-gray-100/80 to-gray-200/80 hover:from-gray-200/90 hover:to-gray-300/90 text-black border-gray-400/50'
            }`}
            title="Deploy"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Rocket className="w-4 h-4" />
            </motion.div>
          </motion.button>
          <motion.button 
            onClick={signOut}
            whileHover={{ scale: 1.05, boxShadow: isDark ? "0 0 20px rgba(255, 255, 255, 0.4)" : "0 0 20px rgba(0, 0, 0, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            className={`p-2 rounded-lg transition-all duration-300 backdrop-blur-sm border shadow-lg ${
              isDark 
                ? 'bg-gray-800/80 hover:bg-gray-700/90 text-white border-gray-600/30' 
                : 'bg-gray-100/80 hover:bg-gray-200/90 text-black border-gray-400/50'
            }`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
} 