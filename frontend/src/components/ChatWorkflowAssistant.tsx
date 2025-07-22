import React, { useState, useRef } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'

interface ChatWorkflowAssistantProps {
  onWorkflowGenerated: (workflow: any) => void
}

export function ChatWorkflowAssistant({ onWorkflowGenerated }: ChatWorkflowAssistantProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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

  return (
    <>
      {/* Floating Chat Button */}
      <button
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg focus:outline-none"
        onClick={() => setOpen(true)}
        aria-label="Open workflow assistant chat"
        style={{ boxShadow: '0 4px 32px rgba(59,130,246,0.25)' }}
      >
        <MessageCircle className="w-8 h-8" />
      </button>
      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-blue-600/90">
            <span className="font-semibold text-white">Workflow Assistant</span>
            <button onClick={() => setOpen(false)} className="text-white hover:text-gray-200"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 flex flex-col gap-2 p-4 overflow-y-auto max-h-96">
            {messages.length === 0 && (
              <div className="text-gray-400 text-sm text-center">Ask me to create a workflow!<br/>Example: <span className="italic">"When I get an email, summarize it with AI and send to Slack"</span></div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg px-3 py-2 max-w-[80%] text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && <div className="text-xs text-gray-400">Claude is thinking…</div>}
          </div>
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your workflow..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 flex items-center gap-1 disabled:opacity-50"
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
} 