import React from 'react'
import { Handle, Position, NodeResizer } from '@xyflow/react'
import { FileText } from 'lucide-react'

interface NotionCreatePageNodeProps {
  id: string
  data: {
    label: string
    description: string
    status: 'idle' | 'running' | 'completed' | 'error'
    config?: any
  }
  selected?: boolean
}

export function NotionCreatePageNode({ id, data, selected }: NotionCreatePageNodeProps) {
  function getStatusColor() {
    switch (data.status) {
      case 'running': return 'border-slate-400/60 bg-slate-500/10'
      case 'completed': return 'border-green-400/60 bg-green-500/10'
      case 'error': return 'border-red-400/60 bg-red-500/10'
      default: return 'border-slate-400/40 bg-slate-900/20'
    }
  }
  return (
    <div className={`relative w-[320px] min-h-[120px] overflow-auto scrollbar-hide backdrop-blur-xl border-2 rounded-xl p-4 shadow-lg transition-all duration-300 ${getStatusColor()} ${selected ? 'ring-2 ring-slate-400/50' : ''}`}>
      <NodeResizer color="#64748b" isVisible={selected} minWidth={320} minHeight={120} />
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-slate-500 border-2 border-slate-600" />
      <div className="flex items-center space-x-3 mb-2">
        <div className="p-2 rounded-lg bg-slate-500/20 border border-slate-400/40">
          <FileText className="w-6 h-6 text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-300 text-base truncate">Create Notion page</div>
          <div className="text-xs text-slate-200/70 truncate">{data.description || 'Create a new page or log data in a Notion database.'}</div>
        </div>
      </div>
    </div>
  )
} 