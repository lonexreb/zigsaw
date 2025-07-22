import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Search, ChevronDown } from 'lucide-react'

interface WorkflowTemplate {
  id: string
  name: string
  description: string
}

const templates: WorkflowTemplate[] = [
  { id: 'email-summary', name: 'Email Summary', description: 'Summarize new emails and send to Slack.' },
  { id: 'calendar-digest', name: 'Calendar Digest', description: 'Send a daily summary of your calendar events.' },
  { id: 'notion-task', name: 'Notion Task Creator', description: 'Create Notion tasks from Slack messages.' },
  { id: 'auto-reply', name: 'Auto Reply', description: 'Automatically reply to emails with a custom template.' },
]

interface WorkflowTemplatesPanelProps {
  isOpen: boolean
  onToggle: () => void
  isDark?: boolean
  onTemplateSelect?: (template: WorkflowTemplate) => void
}

const WorkflowTemplatesPanel: React.FC<WorkflowTemplatesPanelProps> = ({ isOpen, onToggle, isDark = true, onTemplateSelect }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  )
  return (
    <motion.div
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: isOpen ? 0 : -304, opacity: isOpen ? 1 : 0.3 }}
      transition={{ duration: 0.4, type: 'spring', damping: 25, stiffness: 120 }}
      className={`fixed left-0 top-0 h-full w-80 backdrop-blur-xl border-r shadow-2xl z-40 flex flex-col ${
        isDark ? 'bg-gray-900/80 border-gray-700/50 text-gray-200' : 'bg-white/80 border-gray-300/50 text-gray-800'
      }`}
    >
      {/* Header */}
      <motion.div
        className={`p-5 border-b relative z-10 shrink-0 ${isDark ? 'border-gray-700/50' : 'border-gray-300/50'}`}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <motion.div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30" whileHover={{ rotate: 5 }}>
              <Layers className="w-5 h-5 text-purple-400" />
            </motion.div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Workflow Templates
            </h2>
          </div>
          <motion.button
            onClick={onToggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-2 rounded-lg border transition-all duration-200 ${
              isDark ? 'bg-gray-800/60 hover:bg-gray-700/80 border-gray-600/50 text-gray-300 hover:text-white' : 'bg-gray-100/80 hover:bg-gray-200 border-gray-300/60 text-gray-600 hover:text-gray-800'
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.button>
        </div>
        {/* Search Input */}
        <motion.div className="relative" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`w-full border rounded-lg py-3 pl-10 pr-4 text-sm transition-all duration-200 focus:ring-2 focus:ring-offset-2 ${
              isDark
                ? 'bg-gray-800/60 border-gray-700/60 text-white placeholder-gray-400 focus:ring-purple-500/50 focus:ring-offset-gray-900 focus:border-purple-500/60'
                : 'bg-gray-100/60 border-gray-300/60 text-black placeholder-gray-500 focus:ring-purple-500/50 focus:ring-offset-white focus:border-purple-500/60'
            }`}
          />
        </motion.div>
      </motion.div>
      {/* Template List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredTemplates.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No templates found.</div>
        ) : (
          filteredTemplates.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className={`rounded-xl border p-4 shadow-sm transition-all duration-200 cursor-pointer hover:shadow-lg ${
                isDark ? 'bg-gray-800/40 border-purple-500/30 hover:bg-purple-900/30' : 'bg-white/60 border-purple-300/40 hover:bg-purple-100/60'
              }`}
              onClick={() => onTemplateSelect && onTemplateSelect(t)}
            >
              <div className="font-semibold text-base text-purple-400 mb-1">{t.name}</div>
              <div className="text-xs text-gray-400">{t.description}</div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}

export default WorkflowTemplatesPanel 