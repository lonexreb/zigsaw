import React from 'react'
import { Handle, Position, NodeResizer } from '@xyflow/react'
import { MessageSquare } from 'lucide-react'

interface SlackSendMessageNodeProps {
  id: string
  data: {
    label: string
    description: string
    status: 'idle' | 'running' | 'completed' | 'error'
    config?: any
  }
  selected?: boolean
}

export function SlackSendMessageNode({ id, data, selected }: SlackSendMessageNodeProps) {
  function getStatusColor() {
    switch (data.status) {
      case 'running': return 'border-cyan-400/60 bg-cyan-500/10'
      case 'completed': return 'border-green-400/60 bg-green-500/10'
      case 'error': return 'border-red-400/60 bg-red-500/10'
      default: return 'border-cyan-400/40 bg-slate-900/20'
    }
  }
  return (
    <div className={`relative w-[320px] min-h-[120px] overflow-auto scrollbar-hide backdrop-blur-xl border-2 rounded-xl p-4 shadow-lg transition-all duration-300 ${getStatusColor()} ${selected ? 'ring-2 ring-cyan-400/50' : ''}`}>
      <NodeResizer color="#06b6d4" isVisible={selected} minWidth={320} minHeight={120} />
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-cyan-500 border-2 border-cyan-600" />
      <div className="flex items-center space-x-3 mb-2">
        <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-400/40">
          <MessageSquare className="w-6 h-6 text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-cyan-300 text-base truncate">Send Slack message</div>
          <div className="text-xs text-cyan-200/70 truncate">{data.description || 'Send a message to a Slack channel or direct message.'}</div>
        </div>
      </div>
    </div>
  )
} 