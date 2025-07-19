import React, { useState, useEffect } from 'react'
import { Handle, Position, NodeResizer } from '@xyflow/react'
import { Globe, Send, Activity } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

interface ApiConnectorNodeProps {
  id: string
  data: {
    label: string
    description: string
    status: 'idle' | 'running' | 'completed' | 'error'
    inputData?: any
    outputData?: any
    onDataOutput?: (data: any) => void
    onStatusChange?: (status: 'idle' | 'running' | 'completed' | 'error') => void
    onOutputDataChange?: (outputData: any) => void
    isWorkflowExecution?: boolean
    config?: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
      url?: string
      headers?: string
      body?: string
    }
  }
  selected?: boolean
}

function ApiConnectorNode({ id, data, selected }: ApiConnectorNodeProps) {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>(data.config?.method || 'GET')
  const [url, setUrl] = useState(data.config?.url || '')
  const [headers, setHeaders] = useState(data.config?.headers || '')
  const [body, setBody] = useState(data.config?.body || '')
  const [localStatus, setLocalStatus] = useState<'idle' | 'running' | 'completed' | 'error'>(data.status || 'idle')
  const [localOutputData, setLocalOutputData] = useState<any>(data.outputData)

  useEffect(function syncStatus() {
    if (data.status && data.status !== localStatus) setLocalStatus(data.status)
  }, [data.status])

  useEffect(function syncOutput() {
    if (data.outputData && data.outputData !== localOutputData) setLocalOutputData(data.outputData)
  }, [data.outputData])

  function getStatusColor() {
    if (localStatus === 'running') return 'border-cyan-400/60 bg-cyan-500/10'
    if (localStatus === 'completed') return 'border-green-400/60 bg-green-500/10'
    if (localStatus === 'error') return 'border-red-400/60 bg-red-500/10'
    return 'border-cyan-400/40 bg-slate-900/20'
  }

  async function handleSendRequest() {
    if (!url.trim()) {
      setLocalStatus('error')
      setLocalOutputData({ error: 'URL is required.' })
      data.onStatusChange?.('error')
      data.onOutputDataChange?.({ error: 'URL is required.' })
      data.onDataOutput?.({ error: 'URL is required.' })
      return
    }
    setLocalStatus('running')
    data.onStatusChange?.('running')
    try {
      const fetchHeaders = headers ? JSON.parse(headers) : {}
      const fetchOptions: RequestInit = {
        method,
        headers: fetchHeaders,
      }
      if (method !== 'GET' && body) fetchOptions.body = body
      const res = await fetch(url, fetchOptions)
      const contentType = res.headers.get('content-type') || ''
      let responseData
      if (contentType.includes('application/json')) {
        responseData = await res.json()
      } else {
        responseData = await res.text()
      }
      setLocalStatus('completed')
      setLocalOutputData(responseData)
      data.onStatusChange?.('completed')
      data.onOutputDataChange?.(responseData)
      data.onDataOutput?.(responseData)
    } catch (e: any) {
      setLocalStatus('error')
      setLocalOutputData({ error: e.message })
      data.onStatusChange?.('error')
      data.onOutputDataChange?.({ error: e.message })
      data.onDataOutput?.({ error: e.message })
    }
  }

  return (
    <div className={`relative w-[370px] min-h-[320px] overflow-auto scrollbar-hide backdrop-blur-xl border-2 rounded-xl p-4 shadow-lg transition-all duration-300 ${getStatusColor()} ${selected ? 'ring-2 ring-cyan-400/50' : ''}`}>
      <NodeResizer color="#06b6d4" isVisible={selected} minWidth={370} minHeight={320} />
      {/* Handles */}
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-cyan-500 border-2 border-cyan-600" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-cyan-500 border-2 border-cyan-600" />
      {/* Header */}
      <div className="flex items-center space-x-3 mb-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-400/30 to-cyan-600/30 backdrop-blur-sm border border-cyan-400/40">
          <Globe className="w-5 h-5 text-cyan-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-cyan-200 text-sm truncate">{data.label || 'API Connector'}</div>
          <div className="text-xs text-cyan-200/70 truncate">{data.description || 'Connect to any HTTP API endpoint'}</div>
        </div>
      </div>
      {/* Config */}
      <div className="space-y-2 mb-2">
        <div className="flex gap-2 items-center">
          <span className="text-xs text-cyan-300">Method</span>
          <Select value={method} onValueChange={v => setMethod(v as 'GET' | 'POST' | 'PUT' | 'DELETE')}>
            <SelectTrigger className="w-[100px] bg-slate-800/40 border-cyan-400/20 text-cyan-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://api.example.com/resource"
          className="bg-slate-800/40 border-cyan-400/20 text-cyan-100 placeholder:text-cyan-400"
        />
        <Textarea
          value={headers}
          onChange={e => setHeaders(e.target.value)}
          placeholder={'{"Authorization": "Bearer ..."}'}
          className="bg-slate-800/40 border-cyan-400/20 text-cyan-100 placeholder:text-cyan-400 min-h-[40px]"
        />
        {(method === 'POST' || method === 'PUT') && (
          <Textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={'{"key": "value"}'}
            className="bg-slate-800/40 border-cyan-400/20 text-cyan-100 placeholder:text-cyan-400 min-h-[60px]"
          />
        )}
        <Button onClick={handleSendRequest} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-2">
          <Send className="w-4 h-4" /> Send Request
        </Button>
      </div>
      {/* Output */}
      {localOutputData && (
        <div className="mt-2 p-2 rounded bg-cyan-900/30 text-cyan-200 text-xs border border-cyan-400/20">
          <div className="font-bold mb-1">Response</div>
          <pre className="whitespace-pre-wrap">{typeof localOutputData === 'string' ? localOutputData : JSON.stringify(localOutputData, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export { ApiConnectorNode } 