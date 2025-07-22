import React, { useState, useRef } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { Info } from 'lucide-react'

interface ChatWorkflowAssistantProps {
  onWorkflowGenerated: (workflow: any) => void
  initialOpen?: boolean
}

export function ChatWorkflowAssistant({ onWorkflowGenerated, initialOpen = false }: ChatWorkflowAssistantProps) {
  const [open, setOpen] = useState(initialOpen)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // For animated info text
  const infoLines = [
    "FlowPilot helps you create, automate, and manage workflows using natural language.",
    "• Click a suggestion or describe your automation needs.",
    "• Instantly generate, edit, and run workflows—no code required!"
  ]
  const [infoStep, setInfoStep] = useState(0)
  React.useEffect(() => {
    if (showInfo && infoStep < infoLines.length) {
      const t = setTimeout(() => setInfoStep(s => s + 1), 600)
      return () => clearTimeout(t)
    }
    if (!showInfo) setInfoStep(0)
  }, [showInfo, infoStep])

  async function sendMessage() {
    if (!input.trim()) return
    setMessages(msgs => [...msgs, { role: 'user', content: input }])
    setIsLoading(true)
    setInput('')
    const CLAUDE_API_URL = 'https://zigsaw-backend.vercel.app/api/v1/claude-chat'
    // Always send only two messages: instruction and user request
    const workflowInstruction = {
      role: 'user',
      content: `You are a workflow generator. Given a user request, output ONLY a JSON object describing a workflow for a drag-and-drop canvas. The JSON must have this format:\n\n{\n  \"nodes\": [ ... ],\n  \"edges\": [ ... ]\n}\n\nDo not include any explanation, markdown, or code block. Only output the JSON object.`
    }
    const requestBody = {
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [
        workflowInstruction,
        { role: 'user', content: input }
      ]
    }
    console.log('[ChatWorkflowAssistant] Sending message:', input)
    console.log('[ChatWorkflowAssistant] POSTing to:', CLAUDE_API_URL)
    console.log('[ChatWorkflowAssistant] Request body:', requestBody)
    try {
      const res = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      console.log('[ChatWorkflowAssistant] Response status:', res.status)
      const data = await res.json()
      console.log('[ChatWorkflowAssistant] Response data:', data)
      let workflow = null
      if (
        data &&
        Array.isArray(data.content) &&
        data.content[0]?.type === 'text' &&
        data.content[0]?.text
      ) {
        try {
          workflow = JSON.parse(data.content[0].text)
        } catch (e) {
          console.error('Failed to parse workflow JSON from Claude:', e, data.content[0].text)
        }
      }
      if (workflow && workflow.nodes && workflow.edges) {
        onWorkflowGenerated(workflow)
        // Show a success message with a summary of what was made, including node types
        const nodeTypes = Array.from(new Set(workflow.nodes.map((n: any) => n.type))).join(', ')
        setSuccessMessage(`Workflow created with ${workflow.nodes.length} node${workflow.nodes.length !== 1 ? 's' : ''} and ${workflow.edges.length} edge${workflow.edges.length !== 1 ? 's' : ''}.\nNode types: ${nodeTypes}`)
        setTimeout(() => setSuccessMessage(null), 6000)
      } else {
        setMessages(msgs => [
          ...msgs,
          { role: 'assistant', content: 'Sorry, I could not generate a valid workflow. Please try rephrasing your request.' }
        ])
      }
    } catch (e) {
      console.error('[ChatWorkflowAssistant] Error sending message:', e)
      setMessages(msgs => [...msgs, { role: 'assistant', content: 'Sorry, there was a server error. Please try again later.' }])
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Handle close with animation
  function handleClose() {
    setIsClosing(true)
    setTimeout(() => {
      setOpen(false)
      setIsClosing(false)
    }, 350) // match animation duration
  }

  // Example suggestions
  const suggestions = [
    "When I get an email, summarize it with AI and send to Slack",
    "Summarize my next 5 Google Calendar events",
    "Create a Notion page for every new Slack message",
    "Reply to all unread Gmail messages with a custom template",
    "Send a daily summary to Slack at 5pm",
    "Extract action items from meeting notes and add to Notion",
    "Translate all incoming emails to Spanish",
    "Summarize all unread emails from today",
    "Create a weekly report from my calendar events"
  ]

  return (
    <>
      {/* Floating Chat Button */}
      <button
        className="fixed bottom-6 right-6 z-50 rounded-full w-16 h-16 flex items-center justify-center focus:outline-none"
        onClick={() => setOpen(true)}
        aria-label="Open workflow assistant chat"
        style={{
          background: 'rgba(255,255,255,0.22)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.18)',
          boxShadow: '0 4px 32px 0 rgba(31,38,135,0.18)',
          transition: 'transform 0.18s cubic-bezier(0.4,0,0.2,1), box-shadow 0.18s cubic-bezier(0.4,0,0.2,1)'
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 8px 40px 0 rgba(31,38,135,0.22)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 32px 0 rgba(31,38,135,0.18)'; }}
        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.94)'; }}
        onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
      >
        <MessageCircle className="w-8 h-8" style={{ color: '#fff', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.18))' }} />
      </button>
      {/* Chat Window */}
      {open && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-96 max-w-full rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-fade-in ${isClosing ? 'chat-fade-minimize' : ''}`}
          style={{
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(24px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.2)',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
            animation: isClosing ? 'chatFadeMinimize 0.35s cubic-bezier(0.4,0,0.2,1)' : 'chatOpen 0.5s cubic-bezier(0.4,0,0.2,1)',
            fontFamily: "'Poppins', 'Montserrat', 'Inter', 'Segoe UI', Arial, sans-serif"
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/20 bg-white/30 dark:bg-white/10 backdrop-blur-md">
            <span className="font-semibold text-gray-900 dark:text-white shiny-text flex items-center gap-2" style={{fontFamily: "'Poppins', 'Montserrat', 'Inter', 'Segoe UI', Arial, sans-serif"}}>
              FlowPilot: Workflow Assistant
              <button
                type="button"
                aria-label="About FlowPilot"
                className="ml-1 p-1 rounded-full hover:bg-white/40 dark:hover:bg-white/20 transition-colors"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none' }}
                onClick={() => setShowInfo(v => !v)}
              >
                <Info className="w-4 h-4 text-gray-700 dark:text-gray-200" />
              </button>
              {showInfo && (
                 <div className="absolute mt-10 left-1/2 -translate-x-1/2 bg-gray-900/95 text-white rounded-lg shadow-lg px-4 py-3 text-xs z-50 border border-gray-700 info-pop" style={{ minWidth: 260, top: '2.5rem', animation: 'infoPop 0.32s cubic-bezier(0.4,0,0.2,1)' }}>
                   <div className="font-semibold mb-2 text-base shiny-text">About FlowPilot</div>
                   <div
                     className="flex flex-col gap-1 info-anim-height"
                     style={{
                       maxHeight: `${36 + 24 * (infoStep + 1)}px`,
                       minHeight: 72,
                       overflow: 'hidden',
                       transition: 'max-height 0.45s cubic-bezier(0.4,0,0.2,1)'
                     }}
                   >
                     {infoLines.slice(0, infoStep + 1).map((line, i) => (
                       <span key={i} className="fadein-info shiny-text" style={{ animationDelay: `${i * 0.12 + 0.1}s`, display: 'block' }}>{line}</span>
                     ))}
                   </div>
                   <button className="mt-3 text-blue-500 hover:underline" onClick={() => setShowInfo(false)}>Close</button>
                 </div>
               )}
            </span>
            <button
              onClick={handleClose}
              className="ml-2 p-2 rounded-full transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.22)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 2px 8px 0 rgba(31,38,135,0.10)',
                border: '1px solid rgba(255,255,255,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.18s cubic-bezier(0.4,0,0.2,1), box-shadow 0.18s cubic-bezier(0.4,0,0.2,1)'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; e.currentTarget.style.boxShadow = '0 4px 16px 0 rgba(31,38,135,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px 0 rgba(31,38,135,0.10)'; }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.92)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.12)'; }}
              aria-label="Close chat"
            >
              <X className="w-5 h-5" style={{ color: '#fff', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.18))' }} />
            </button>
          </div>
          {successMessage && (
            <div className="bg-green-500/80 text-white text-center py-2 px-4 text-sm animate-fade-in">
              <div className="shiny-text" style={{fontFamily: "'Poppins', 'Montserrat', 'Inter', 'Segoe UI', Arial, sans-serif", fontWeight: 600}}>{successMessage}</div>
              {Array.isArray(successMessage) && successMessage[1] && (
                <div className="mt-1 text-xs text-green-100/90">
                  {successMessage[1]}
                </div>
              )}
            </div>
          )}
          <div className="flex-1 flex flex-col gap-2 p-4 overflow-y-auto max-h-96">
            {messages.length === 0 && (
              <>
                <div className="text-gray-500 text-sm text-center mb-2">Ask me to create a workflow!</div>
                <div className="flex flex-wrap gap-2 justify-center mb-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      className="px-3 py-1 rounded-full bg-white/60 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gradient-to-r hover:from-blue-400/30 hover:to-purple-400/30 hover:text-blue-700 dark:hover:text-blue-200 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      style={{ fontFamily: "'Poppins', 'Montserrat', 'Inter', 'Segoe UI', Arial, sans-serif" }}
                      onClick={() => setInput(s)}
                    >
                      {s.length > 60 ? s.slice(0, 60) + '…' : s}
                    </button>
                  ))}
                </div>
              </>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg px-3 py-2 max-w-[80%] text-sm ${msg.role === 'user' ? 'bg-gray-900/80 text-white' : 'bg-white/70 text-gray-900 dark:bg-gray-800/80 dark:text-gray-100'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && <div className="text-xs text-gray-400">Claude is thinking…</div>}
          </div>
          <div className="p-3 border-t border-white/20 bg-white/30 dark:bg-white/10 backdrop-blur-md flex gap-2">
            <input
              ref={inputRef}
              type="text"
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white/60 dark:bg-gray-900/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your workflow..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              className="send-btn-gradient px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold shadow-lg disabled:opacity-50 transition-all duration-150 text-base"
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              style={{ fontFamily: "'Poppins', 'Montserrat', 'Inter', 'Segoe UI', Arial, sans-serif", fontWeight: 600 }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
            >
              <Send className="w-4 h-4" />
              <span className="shiny-btn-text">Create</span>
            </button>
          </div>
        </div>
      )}
      <style>{`
        @keyframes chatOpen {
          0% { opacity: 0; transform: translateY(40px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chatFadeMinimize {
          0% { opacity: 1; transform: translateY(0) translateX(0) scale(1); }
          100% { opacity: 0; transform: translateY(100px) translateX(32px) scale(0.6); }
        }
        .chat-fade-minimize {
          animation: chatFadeMinimize 0.35s cubic-bezier(0.4,0,0.2,1) forwards !important;
        }
        .animate-fade-in {
          animation: fadeIn 0.4s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .shiny-text {
          background: linear-gradient(90deg, #fff 0%, #e0e0e0 20%, #b3e5fc 40%, #fff 60%, #e0e0e0 80%, #fff 100%);
          background-size: 200% auto;
          color: #222;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shine 2.5s linear infinite;
        }
        @keyframes shine {
          0% {
            background-position: 200% center;
          }
          100% {
            background-position: 0% center;
          }
        }
        .send-btn-gradient {
          background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%);
          box-shadow: 0 2px 16px 0 rgba(59,130,246,0.18), 0 1.5px 8px 0 rgba(139,92,246,0.12);
          border: none;
          transition: background 0.18s, box-shadow 0.18s, transform 0.18s;
        }
        .send-btn-gradient:hover, .send-btn-gradient:focus {
          /* No background or shadow change, only scale via inline style */
        }
        .shiny-btn-text {
          background: linear-gradient(90deg, rgba(255,255,255,0.2) 0%, #fff 50%, rgba(255,255,255,0.2) 100%);
          background-size: 200% auto;
          color: #fff;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shine-btn 2.2s linear infinite;
          font-weight: 700;
          letter-spacing: 0.01em;
          text-shadow: 0 1px 8px rgba(0,0,0,0.18);
        }
        @keyframes shine-btn {
          0% {
            background-position: 200% center;
          }
          100% {
            background-position: 0% center;
          }
        }
        @keyframes infoPop {
          0% { opacity: 0; transform: scale(0.85) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .info-pop {
          animation: infoPop 0.32s cubic-bezier(0.4,0,0.2,1);
        }
        .fadein-info {
          opacity: 0;
          animation: fadeIn 0.5s forwards;
          color: #fff !important;
          display: block;
        }
      `}</style>
    </>
  )
} 