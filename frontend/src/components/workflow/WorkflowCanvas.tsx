import React from 'react'
import { ReactFlow, Controls, MiniMap, Background } from '@xyflow/react'

interface WorkflowCanvasProps {
  nodes: any[]
  edges: any[]
  onNodesChange: (changes: any) => void
  onEdgesChange: (changes: any) => void
  onConnect: (params: any) => void
  onDrop: (event: React.DragEvent) => void
  onDragOver: (event: React.DragEvent) => void
  nodeTypes: any
  edgeTypes: any
  isDark: boolean
  nodesWithCallbacks: any[]
  computedEdges: any[]
}

export function WorkflowCanvas({
  nodesWithCallbacks,
  computedEdges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onDrop,
  onDragOver,
  nodeTypes,
  edgeTypes,
  isDark
}: WorkflowCanvasProps) {
  return (
    <ReactFlow
      nodes={nodesWithCallbacks}
      edges={computedEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDrop={onDrop}
      onDragOver={onDragOver}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      className="bg-transparent"
      defaultViewport={{ x: 0, y: 0, zoom: 1 }}
    >
      <Controls className={`backdrop-blur-xl border shadow-xl ${isDark ? 'bg-gray-900/40 border-gray-700/20' : 'bg-gray-100/60 border-gray-600/40'}`} />
      <MiniMap 
        className={`backdrop-blur-xl border shadow-xl ${isDark ? 'bg-gray-900/40 border-gray-700/20' : 'bg-gray-100/60 border-gray-600/40'}`}
        nodeColor={isDark ? "#ffffff" : "#1f2937"}
        maskColor={isDark ? "rgba(15, 23, 42, 0.8)" : "rgba(75, 85, 99, 0.8)"}
        style={{ opacity: isDark ? 0.3 : 0.7 }}
      />
      <Background 
        color={isDark ? "#ffffff" : "#1f2937"} 
        gap={20} 
        size={1}
        style={{ opacity: isDark ? 0.3 : 0.7 }}
      />
    </ReactFlow>
  )
} 