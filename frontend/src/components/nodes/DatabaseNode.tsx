import React, { useState, useCallback, useEffect } from 'react'
import { Handle, Position, NodeResizer } from '@xyflow/react'
import { Database, Activity, Play, Save, Upload } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

interface DatabaseNodeProps {
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
      type?: 'supabase' | 'postgresql'
      tableName?: string
      query?: string
      upsertData?: string
      supabaseUrl?: string
      supabaseKey?: string
      postgresUrl?: string
    }
  }
  selected?: boolean
}

function DatabaseNode({ id, data, selected }: DatabaseNodeProps) {
  const [type, setType] = useState<'supabase' | 'postgresql'>(data.config?.type || 'supabase')
  const [mode, setMode] = useState<'query' | 'upsert'>('query')
  const [tableName, setTableName] = useState(data.config?.tableName || '')
  const [query, setQuery] = useState(data.config?.query || '')
  const [upsertData, setUpsertData] = useState(data.config?.upsertData || '')
  const [supabaseUrl, setSupabaseUrl] = useState(data.config?.supabaseUrl || '')
  const [supabaseKey, setSupabaseKey] = useState(data.config?.supabaseKey || '')
  const [postgresUrl, setPostgresUrl] = useState(data.config?.postgresUrl || '')
  const [localStatus, setLocalStatus] = useState<'idle' | 'running' | 'completed' | 'error'>(data.status || 'idle')
  const [localOutputData, setLocalOutputData] = useState<any>(data.outputData)

  useEffect(function syncStatus() {
    if (data.status && data.status !== localStatus) setLocalStatus(data.status)
  }, [data.status])

  useEffect(function syncOutput() {
    if (data.outputData && data.outputData !== localOutputData) setLocalOutputData(data.outputData)
  }, [data.outputData])

  function getStatusColor() {
    if (localStatus === 'running') return 'border-blue-400/60 bg-blue-500/10'
    if (localStatus === 'completed') return 'border-green-400/60 bg-green-500/10'
    if (localStatus === 'error') return 'border-red-400/60 bg-red-500/10'
    return 'border-slate-400/40 bg-slate-900/20'
  }

  function handleRunQuery() {
    if (!query.trim()) {
      setLocalStatus('error')
      data.onStatusChange?.('error')
      return
    }
    setLocalStatus('running')
    data.onStatusChange?.('running')
    setTimeout(function () {
      const output = { result: `Results for: ${query} on table ${tableName || 'N/A'} [${type}]` }
      setLocalStatus('completed')
      setLocalOutputData(output)
      data.onStatusChange?.('completed')
      data.onOutputDataChange?.(output)
      data.onDataOutput?.(output)
    }, 800)
  }

  function handleRunUpsert() {
    let parsed
    try {
      parsed = upsertData ? JSON.parse(upsertData) : null
    } catch (e) {
      setLocalStatus('error')
      setLocalOutputData({ error: 'Invalid JSON for upsert data.' })
      data.onStatusChange?.('error')
      data.onOutputDataChange?.({ error: 'Invalid JSON for upsert data.' })
      data.onDataOutput?.({ error: 'Invalid JSON for upsert data.' })
      return
    }
    if (!parsed || !tableName) {
      setLocalStatus('error')
      setLocalOutputData({ error: 'Table name and valid JSON data required.' })
      data.onStatusChange?.('error')
      data.onOutputDataChange?.({ error: 'Table name and valid JSON data required.' })
      data.onDataOutput?.({ error: 'Table name and valid JSON data required.' })
      return
    }
    setLocalStatus('running')
    data.onStatusChange?.('running')
    setTimeout(function () {
      const output = { upserted: parsed, table: tableName, type }
      setLocalStatus('completed')
      setLocalOutputData(output)
      data.onStatusChange?.('completed')
      data.onOutputDataChange?.(output)
      data.onDataOutput?.(output)
    }, 800)
  }

  function handleTypeChange(value: 'supabase' | 'postgresql') {
    setType(value)
  }

  function handleModeChange(value: 'query' | 'upsert') {
    setMode(value)
  }

  return (
    <div className={`relative w-[360px] min-h-[300px] overflow-auto scrollbar-hide backdrop-blur-xl border-2 rounded-xl p-4 shadow-lg transition-all duration-300 ${getStatusColor()} ${selected ? 'ring-2 ring-blue-400/50' : ''}`}>
      <NodeResizer color="#3b82f6" isVisible={selected} minWidth={360} minHeight={300} />
      {/* Handles */}
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-blue-500 border-2 border-blue-600" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-blue-500 border-2 border-blue-600" />
      {/* Header */}
      <div className="flex items-center space-x-3 mb-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-400/30 to-blue-600/30 backdrop-blur-sm border border-blue-400/40">
          <Database className="w-5 h-5 text-blue-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-blue-200 text-sm truncate">{data.label || 'Database Node'}</div>
          <div className="text-xs text-blue-200/70 truncate">{data.description || 'Query and manage tabular data'}</div>
        </div>
      </div>
      {/* Config */}
      <div className="space-y-2 mb-2">
        <div className="flex gap-2 items-center">
          <span className="text-xs text-blue-300">Type</span>
          <Select value={type} onValueChange={v => handleTypeChange(v as 'supabase' | 'postgresql')}>
            <SelectTrigger className="w-[120px] bg-slate-800/40 border-blue-400/20 text-blue-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="supabase">Supabase</SelectItem>
              <SelectItem value="postgresql">PostgreSQL</SelectItem>
            </SelectContent>
          </Select>
          <span className="ml-4 text-xs text-blue-300">Mode</span>
          <Select value={mode} onValueChange={v => handleModeChange(v as 'query' | 'upsert')}>
            <SelectTrigger className="w-[100px] bg-slate-800/40 border-blue-400/20 text-blue-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="query">Query</SelectItem>
              <SelectItem value="upsert">Upsert</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {type === 'supabase' && (
          <>
            <Input
              value={supabaseUrl}
              onChange={e => setSupabaseUrl(e.target.value)}
              placeholder="Supabase URL"
              className="bg-slate-800/40 border-blue-400/20 text-blue-100 placeholder:text-blue-400"
            />
            <Input
              value={supabaseKey}
              onChange={e => setSupabaseKey(e.target.value)}
              placeholder="Supabase API Key"
              className="bg-slate-800/40 border-blue-400/20 text-blue-100 placeholder:text-blue-400"
            />
          </>
        )}
        {type === 'postgresql' && (
          <Input
            value={postgresUrl}
            onChange={e => setPostgresUrl(e.target.value)}
            placeholder="PostgreSQL Connection URL"
            className="bg-slate-800/40 border-blue-400/20 text-blue-100 placeholder:text-blue-400"
          />
        )}
        <Input
          value={tableName}
          onChange={e => setTableName(e.target.value)}
          placeholder="Table name"
          className="bg-slate-800/40 border-blue-400/20 text-blue-100 placeholder:text-blue-400"
        />
        {mode === 'query' && (
          <>
            <Textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="SELECT * FROM ..."
              className="bg-slate-800/40 border-blue-400/20 text-blue-100 placeholder:text-blue-400 min-h-[60px]"
            />
            <Button onClick={handleRunQuery} className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
              <Play className="w-4 h-4" /> Run Query
            </Button>
          </>
        )}
        {mode === 'upsert' && (
          <>
            <Textarea
              value={upsertData}
              onChange={e => setUpsertData(e.target.value)}
              placeholder={'{\n  "id": 1,\n  "name": "John Doe"\n}'}
              className="bg-slate-800/40 border-blue-400/20 text-blue-100 placeholder:text-blue-400 min-h-[80px]"
            />
            <Button onClick={handleRunUpsert} className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
              <Upload className="w-4 h-4" /> Run Upsert
            </Button>
          </>
        )}
      </div>
      {/* Output */}
      {localOutputData && (
        <div className="mt-2 p-2 rounded bg-blue-900/30 text-blue-200 text-xs border border-blue-400/20">
          <div className="font-bold mb-1">Output</div>
          <pre className="whitespace-pre-wrap">{JSON.stringify(localOutputData, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export { DatabaseNode } 