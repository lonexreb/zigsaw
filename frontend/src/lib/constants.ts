import { Brain, Cpu, Sparkles, Zap } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

export const nodeTypeDisplayNames = {
  groqllama: 'Groq Llama',
  claude4: 'Claude 4',
  gemini: 'Gemini',
  chatbot: 'ChatBot (GPT-4)',
  logicalconnector: 'Logical Connector'
} as const

export const nodeTypeIconComponents: Record<string, LucideIcon> = {
  groqllama: Zap,
  claude4: Brain,
  gemini: Sparkles,
  chatbot: Cpu,
  logicalconnector: Brain
} as const

export const nodeTypeIconColors = {
  groqllama: 'text-purple-400',
  claude4: 'text-indigo-400',
  gemini: 'text-blue-400',
  chatbot: 'text-green-400',
  logicalconnector: 'text-orange-400'
} as const

export const modelOptions = {
  groqllama: [
    { value: 'llama2-70b-4096', label: 'Llama 2 70B' },
    { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B' },
    { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' }
  ],
  claude4: [
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' }
  ],
  gemini: [
    { value: 'gemini-pro', label: 'Gemini Pro' },
    { value: 'gemini-pro-vision', label: 'Gemini Pro Vision' }
  ],
  chatbot: [
    { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
  ]
} as const 