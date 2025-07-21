import React from 'react'
import { Handle, Position, NodeResizer } from '@xyflow/react'
import { Calendar } from 'lucide-react'

interface GoogleCalendarCreateEventNodeProps {
  id: string
  data: {
    label: string
    description: string
    status: 'idle' | 'running' | 'completed' | 'error'
    config?: any
  }
  selected?: boolean
}

export function GoogleCalendarCreateEventNode({ id, data, selected }: GoogleCalendarCreateEventNodeProps) {
  function getStatusColor() {
    switch (data.status) {
      case 'running': return 'border-blue-400/60 bg-blue-500/10'
      case 'completed': return 'border-green-400/60 bg-green-500/10'
      case 'error': return 'border-red-400/60 bg-red-500/10'
      default: return 'border-blue-400/40 bg-slate-900/20'
    }
  }
  return (
    <div className={`relative w-[320px] min-h-[120px] overflow-auto scrollbar-hide backdrop-blur-xl border-2 rounded-xl p-4 shadow-lg transition-all duration-300 ${getStatusColor()} ${selected ? 'ring-2 ring-blue-400/50' : ''}`}>
      <NodeResizer color="#3b82f6" isVisible={selected} minWidth={320} minHeight={120} />
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-blue-500 border-2 border-blue-600" />
      <div className="flex items-center space-x-3 mb-2">
        <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-400/40">
          <Calendar className="w-6 h-6 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-blue-300 text-base truncate">Create calendar event</div>
          <div className="text-xs text-blue-200/70 truncate">{data.description || 'Create or update a Google Calendar event.'}</div>
        </div>
      </div>
    </div>
  )
} 