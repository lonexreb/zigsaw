import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Logo from '../Logo'
import { Sun, Moon, Settings, Rocket, LogOut, Crown, Play, Square, Save, Zap, ZapOff, User } from 'lucide-react'
import TabBar from '../TabBar'
import TierIndicator from '../TierIndicator'
import { useTheme } from '../theme/ThemeProvider'
import { Settings as SettingsIcon } from 'lucide-react'
import WorkflowTemplatesPanel from '../WorkflowTemplatesPanel'
import { Layers } from 'lucide-react'
import { SlackSignInButton, GmailSignInButton, GoogleCalendarSignInButton, NotionSignInButton } from '../ui/SlackSignInButton'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu'

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
  
  // Brightness state and effect
  const [brightness, setBrightness] = useState(1)
  useEffect(() => {
    document.body.style.filter = `brightness(${brightness})`;
    return () => { document.body.style.filter = '' }
  }, [brightness])
  
  // Color (hue) state and effect
  const [hue, setHue] = useState(0)
  useEffect(() => {
    document.body.style.filter = `brightness(${brightness}) hue-rotate(${hue}deg)`;
    return () => { document.body.style.filter = '' }
  }, [brightness, hue])

  const [showSettings, setShowSettings] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  
  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`absolute top-0 left-0 right-0 z-10 backdrop-blur-xl ${isDark ? 'bg-gray-900/30 border-gray-700/20' : 'bg-gray-200/50 border-gray-600/30'} border-b shadow-lg`}
    >
      <div className="flex items-center justify-between p-3 sm:p-4">
        {/* Left: Zigsaw Title */}
        <div className="flex items-center min-w-0 flex-1">
          <span className="font-mono font-bold text-2xl flex items-center gap-2 zigsaw-logo-shiny">
            {/* Optional: <Logo className="w-7 h-7 mr-2" /> */}
            zigsaw
          </span>
        </div>
        {/* Center: Main Action Buttons (truly centered) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2 z-10">
          {/* Buy Premium Button */}
          <motion.button
            onClick={() => navigate('/subscription')}
            whileHover={{ scale: 1.07, boxShadow: isDark ? "0 0 24px 0 #facc15cc" : "0 0 24px 0 #fbbf24cc" }}
            whileTap={{ scale: 0.96 }}
            className={`px-2 py-1 rounded-lg transition-all duration-300 backdrop-blur-sm border shadow-lg flex items-center gap-2 font-semibold text-xs shiny-premium-btn ${
              isDark 
                ? 'bg-gradient-to-r from-yellow-600/80 to-orange-600/80 hover:from-yellow-500/90 hover:to-orange-500/90 text-white border-yellow-500/30' 
                : 'bg-gradient-to-r from-yellow-500/80 to-orange-500/80 hover:from-yellow-400/90 hover:to-orange-400/90 text-white border-yellow-400/50'
            }`}
            title="Upgrade your plan"
          >
            <Crown className="w-4 h-4" />
            <span className="shiny-premium-text">Upgrade</span>
          </motion.button>
          {/* Manual Save Button - Debug Only */}
          <motion.button
            onClick={handleManualSave}
            whileHover={{ scale: 1.05, boxShadow: isDark ? "0 0 20px rgba(59, 130, 246, 0.4)" : "0 0 20px rgba(59, 130, 246, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            className={`px-2 py-1 rounded-lg transition-all duration-300 backdrop-blur-sm border shadow-lg flex items-center gap-2 font-semibold text-xs bg-white text-black border-black hover:bg-black hover:text-white ${isDark ? '' : ''}`}
            title="Save Workflow"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </motion.button>
          {/* Run Workflow Button */}
          <motion.button 
            onClick={handleRunWorkflow}
            whileHover={{ scale: 1.08, boxShadow: isWorkflowExecuting 
              ? (isDark ? "0 0 32px 0 #ef4444cc" : "0 0 32px 0 #dc2626cc")
              : (isDark ? "0 0 32px 0 #22c55ecc" : "0 0 32px 0 #16a34acc")
            }}
            whileTap={{ scale: 0.96 }}
            disabled={nodes.length === 0 || detectedWorkflows.length === 0}
            className={`run-btn-shiny flex items-center justify-center transition-all duration-300 border-2 shadow-xl font-bold text-lg focus:outline-none ${
              nodes.length === 0 || detectedWorkflows.length === 0
                ? 'bg-gray-300/50 border-gray-400/50 text-gray-400 cursor-not-allowed' 
                : isWorkflowExecuting
                ? 'bg-gradient-to-r from-red-500/90 to-red-600/90 text-white border-red-400/60' 
                : 'bg-gradient-to-r from-green-500/90 to-green-600/90 text-white border-green-400/60'
            }`}
            style={{ width: 40, height: 40, borderRadius: '50%', position: 'relative', overflow: 'hidden' }}
            title={isWorkflowExecuting ? 'Stop Workflow' : 'Run Workflow'}
          >
            <span className="absolute inset-0 run-btn-shine" aria-hidden="true" />
            <motion.div
              animate={isWorkflowExecuting ? { rotate: [0, 360] } : {}}
              transition={isWorkflowExecuting ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
              className="z-10"
            >
              {isWorkflowExecuting ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </motion.div>
          </motion.button>
          {/* Test POST Button */}
          <motion.button
            onClick={onTestPost}
            whileHover={{ scale: 1.05, boxShadow: isDark ? "0 0 20px rgba(59, 130, 246, 0.4)" : "0 0 20px rgba(59, 130, 246, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            className={`px-2 py-1 rounded-lg font-medium text-xs transition-all duration-300 flex items-center space-x-1 backdrop-blur-sm border shadow-lg ${
              isDark
                ? 'bg-gradient-to-r from-blue-500/80 to-blue-600/80 hover:from-blue-400/90 hover:to-blue-500/90 text-white border-blue-400/30'
                : 'bg-gradient-to-r from-blue-600/80 to-blue-700/80 hover:from-blue-500/90 hover:to-blue-600/90 text-white border-blue-500/50'
            }`}
            title="Test Run"
          >
            <Play className="w-4 h-4" />
            <span className="hidden sm:inline">Test Run</span>
          </motion.button>
        </div>
        {/* Right: Theme, Settings, Account, Sign Out */}
        <div className="flex items-center gap-2">
          {/* Slack Sign In Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 rounded-lg transition-all duration-300 backdrop-blur-sm border shadow-lg flex items-center justify-center gap-2 ${
                  isDark 
                    ? 'bg-gray-800/80 hover:bg-gray-700/90 text-white border-gray-600/30' 
                    : 'bg-gray-100/80 hover:bg-gray-200/90 text-black border-gray-400/50'
                }`}
                title="Sign In"
              >
                <User className="w-4 h-4" />
                <span className="font-semibold text-xs">Sign In</span>
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <SlackSignInButton className="w-full px-2 py-1 text-xs h-8" />
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <GmailSignInButton className="w-full px-2 py-1 text-xs h-8" />
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <GoogleCalendarSignInButton className="w-full px-2 py-1 text-xs h-8" />
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <NotionSignInButton className="w-full px-2 py-1 text-xs h-8" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          {/* Settings Button */}
          <motion.button
            onClick={() => setShowSettings(v => !v)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            aria-label="Settings"
          >
            <SettingsIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </motion.button>
          {/* Settings Popover */}
          {showSettings && (
            <div className="absolute right-0 top-16 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-6 py-4 flex flex-col gap-4 min-w-[260px]" style={{ minWidth: 260 }}>
              <div className="flex items-center">
                <label htmlFor="brightness-slider" className="mr-2 text-xs font-medium text-gray-700 dark:text-gray-300">Brightness</label>
                <input
                  id="brightness-slider"
                  type="range"
                  min={0.5}
                  max={1.5}
                  step={0.01}
                  value={brightness}
                  onChange={e => setBrightness(Number(e.target.value))}
                  className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  style={{ accentColor: '#6366f1' }}
                />
                <span className="ml-2 text-xs text-gray-700 dark:text-gray-300">{Math.round(brightness * 100)}%</span>
              </div>
              <div className="flex items-center">
                <label htmlFor="color-slider" className="mr-2 text-xs font-medium text-gray-700 dark:text-gray-300">Color</label>
                <input
                  id="color-slider"
                  type="range"
                  min={-60}
                  max={60}
                  step={1}
                  value={hue}
                  onChange={e => setHue(Number(e.target.value))}
                  className="w-24 h-2 rounded-lg appearance-none cursor-pointer color-slider-track"
                  style={{ background: 'linear-gradient(90deg, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)', accentColor: '#a21caf' }}
                />
                <span className="ml-2 text-xs text-gray-700 dark:text-gray-300">{hue}&deg;</span>
              </div>
              <button className="mt-2 text-xs text-blue-500 hover:underline self-end" onClick={() => setShowSettings(false)}>Close</button>
            </div>
          )}
          {/* Account Button */}
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: isDark ? "0 0 20px rgba(59, 130, 246, 0.2)" : "0 0 20px rgba(59, 130, 246, 0.2)" }}
            whileTap={{ scale: 0.95 }}
            className={`p-2 rounded-lg transition-all duration-300 backdrop-blur-sm border shadow-lg flex items-center justify-center ${
              isDark 
                ? 'bg-gray-800/80 hover:bg-gray-700/90 text-white border-gray-600/30' 
                : 'bg-gray-100/80 hover:bg-gray-200/90 text-black border-gray-400/50'
            }`}
            title="Account"
          >
            <User className="w-4 h-4" />
          </motion.button>
          <motion.button 
            onClick={signOut}
            whileHover={{ scale: 1.05, boxShadow: isDark ? "0 0 20px rgba(255, 255, 255, 0.4)" : "0 0 20px rgba(0, 0, 0, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            className={`px-3 py-2 rounded-lg transition-all duration-300 backdrop-blur-sm border shadow-lg flex flex-row items-center justify-center gap-2 min-w-[70px] ${
              isDark 
                ? 'bg-gray-800/80 hover:bg-gray-700/90 text-white border-gray-600/30' 
                : 'bg-gray-100/80 hover:bg-gray-200/90 text-black border-gray-400/50'
            }`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="ml-2 font-normal text-xs whitespace-nowrap">Sign Out</span>
          </motion.button>
        </div>
      </div>
      <style>{`
         .run-btn-shiny {
           box-shadow: 0 4px 32px 0 rgba(34,197,94,0.18), 0 2px 12px 0 rgba(16,185,129,0.12);
           position: relative;
           overflow: hidden;
         }
         .run-btn-shine {
           pointer-events: none;
           position: absolute;
           inset: 0;
           background: linear-gradient(120deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.32) 40%, rgba(255,255,255,0.12) 100%);
           background-size: 200% 200%;
           animation: runBtnShine 2.2s linear infinite;
           border-radius: 50%;
           opacity: 0.85;
         }
         @keyframes runBtnShine {
           0% { background-position: 200% 0; }
           100% { background-position: 0 200%; }
         }
         .shiny-premium-btn {
           position: relative;
           overflow: hidden;
         }
         .shiny-premium-text {
           background: linear-gradient(90deg, #fff 0%, #facc15 30%, #fbbf24 60%, #fff 100%);
           background-size: 200% auto;
           color: #fff;
           background-clip: text;
           -webkit-background-clip: text;
           -webkit-text-fill-color: transparent;
           animation: shine-premium 2.2s linear infinite;
           font-weight: 700;
           letter-spacing: 0.01em;
           text-shadow: 0 1px 8px rgba(0,0,0,0.18);
         }
         @keyframes shine-premium {
           0% { background-position: 200% center; }
           100% { background-position: 0% center; }
         }
         .zigsaw-logo-shiny {
           background: linear-gradient(90deg, #ffffff 0%, #87ceeb 25%, #4682b4 50%, #1e90ff 75%, #ffffff 100%);
           background-size: 200% auto;
           background-clip: text;
           -webkit-background-clip: text;
           -webkit-text-fill-color: transparent;
           animation: zigsaw-shine 3s linear infinite;
           filter: drop-shadow(0 0 8px rgba(135, 206, 235, 0.5)) drop-shadow(0 0 16px rgba(70, 130, 180, 0.3)) drop-shadow(0 0 24px rgba(30, 144, 255, 0.2));
           text-shadow: 0 0 20px rgba(135, 206, 235, 0.7), 0 0 40px rgba(70, 130, 180, 0.5), 0 0 60px rgba(30, 144, 255, 0.3);
         }
         @keyframes zigsaw-shine {
           0% { background-position: 200% center; }
           100% { background-position: 0% center; }
         }
      `}</style>
    </motion.div>
  )
} 