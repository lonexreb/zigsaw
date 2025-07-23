import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Search, ChevronDown, Mail, Calendar, CheckSquare, Reply, Bell, FileText, Twitter, RefreshCcw, Book, Pencil } from 'lucide-react'

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  icon?: React.ReactNode // Added icon property
}

const templates: WorkflowTemplate[] = [
  { id: 'email-summary', name: 'Email Summary', description: 'Summarize new emails and send to Slack.', icon: <Mail className="w-5 h-5 text-blue-400" /> },
  { id: 'calendar-digest', name: 'Calendar Digest', description: 'Send a daily summary of your calendar events.', icon: <Calendar className="w-5 h-5 text-green-400" /> },
  { id: 'notion-task', name: 'Notion Task Creator', description: 'Create Notion tasks from Slack messages.', icon: <CheckSquare className="w-5 h-5 text-emerald-400" /> },
  { id: 'auto-reply', name: 'Auto Reply', description: 'Automatically reply to emails with a custom template.', icon: <Reply className="w-5 h-5 text-indigo-400" /> },
  { id: 'gmail-integration', name: 'Gmail Integration', description: 'Connect and automate Gmail workflows, like reading and sending emails.', icon: <Mail className="w-5 h-5 text-red-400" /> },
  { id: 'calendar-reminder', name: 'Calendar Event Reminder', description: 'Send reminders for upcoming Google Calendar events.', icon: <Calendar className="w-5 h-5 text-blue-400" /> },
  { id: 'slack-channel-sync', name: 'Slack Channel Sync', description: 'Sync messages and notifications between Slack channels.', icon: <Bell className="w-5 h-5 text-pink-400" /> },
  { id: 'notion-db-updater', name: 'Notion Database Updater', description: 'Automatically update Notion databases from other sources.', icon: <Book className="w-5 h-5 text-emerald-400" /> },
]

interface WorkflowTemplatesPanelProps {
  isOpen: boolean
  onToggle: () => void
  isDark?: boolean
  onTemplateSelect?: (template: WorkflowTemplate) => void
}

const WorkflowTemplatesPanel: React.FC<WorkflowTemplatesPanelProps> = ({ isOpen, onToggle, isDark = true, onTemplateSelect }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renames, setRenames] = useState<{ [id: string]: string }>({})
  const filteredTemplates = templates.filter(t =>
    (renames[t.id] || t.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  )
  return (
    <motion.div
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: isOpen ? 0 : -304, opacity: isOpen ? 1 : 0.3 }}
      transition={{ duration: 0.4, type: 'spring', damping: 25, stiffness: 120 }}
      className={`fixed left-0 top-0 h-full w-80 backdrop-blur-2xl border-r shadow-2xl z-40 flex flex-col ${
        isDark ? 'bg-gray-900/60 border-gray-200/20 text-white' : 'bg-white/60 border-gray-200/30 text-gray-900'
      }`}
    >
      {/* Header */}
      <motion.div
        className={`p-5 border-b relative z-10 shrink-0 ${isDark ? 'border-gray-200/20' : 'border-gray-200/30'}`}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {/* No icon, just text */}
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Workflow Templates</h2>
          </div>
          <motion.button
            onClick={onToggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-2 rounded-lg border transition-all duration-200 ${
              isDark ? 'bg-gray-800/60 hover:bg-gray-700/80 border-gray-200/20 text-gray-300 hover:text-white' : 'bg-gray-100/80 hover:bg-gray-200 border-gray-200/30 text-gray-600 hover:text-gray-900'
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
                ? 'bg-gray-800/40 border-gray-200/20 text-white placeholder-gray-400 focus:ring-gray-400/30 focus:ring-offset-gray-900 focus:border-gray-400/40'
                : 'bg-white/40 border-gray-200/30 text-black placeholder-gray-500 focus:ring-gray-400/30 focus:ring-offset-white focus:border-gray-400/40'
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
              className={`rounded-xl border p-4 shadow-sm transition-all duration-200 cursor-pointer hover:shadow-xl hover:scale-[1.03] ${
                isDark ? 'bg-gray-900/40 border-gray-200/20 hover:bg-gray-900/60' : 'bg-white/40 border-gray-200/30 hover:bg-white/60'
              }`}
              onClick={() => onTemplateSelect && onTemplateSelect({ ...t, name: renames[t.id] || t.name })}
            >
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800/60 flex items-center justify-center">
                  {t.icon}
                </div>
                {renamingId === t.id ? (
                  <input
                    autoFocus
                    value={renames[t.id] ?? t.name}
                    onChange={e => setRenames(r => ({ ...r, [t.id]: e.target.value }))}
                    onBlur={() => setRenamingId(null)}
                    onKeyDown={e => { if (e.key === 'Enter') setRenamingId(null) }}
                    className="text-base font-semibold bg-transparent border-b border-gray-300 dark:border-gray-700 focus:outline-none focus:border-blue-400 px-1 py-0.5 w-32 text-gray-900 dark:text-white"
                  />
                ) : (
                  <div className="font-semibold text-base text-gray-900 dark:text-white flex items-center gap-1">
                    {renames[t.id] || t.name}
                    <button
                      type="button"
                      className="ml-1 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                      onClick={e => { e.stopPropagation(); setRenamingId(t.id) }}
                      tabIndex={-1}
                      aria-label="Rename template"
                    >
                      <Pencil className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-300 ml-1 pl-1">{t.description}</div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}

export default WorkflowTemplatesPanel 