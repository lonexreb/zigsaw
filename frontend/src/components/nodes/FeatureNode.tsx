import { ReactNode } from 'react'

interface FeatureNodeProps {
  id: string
  data: {
    title: string
    value?: string
    description?: string
    icon?: ReactNode
    variant?: string
  }
  selected: boolean
}

export function FeatureNode({ id, data, selected }: FeatureNodeProps) {
  const isGlass = data.variant === 'glass'
  return (
    <div style={{
      minWidth: 220,
      maxWidth: 320,
      background: isGlass ? 'rgba(255,255,255,0.22)' : '#fff',
      border: selected ? '2px solid #222' : '1px solid rgba(180,180,180,0.18)',
      borderRadius: 16,
      boxShadow: '0 2px 24px 0 rgba(0,0,0,0.10)',
      padding: 24,
      color: '#222',
      fontFamily: 'monospace',
      zIndex: 10,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10,
      backdropFilter: isGlass ? 'blur(18px)' : undefined,
      WebkitBackdropFilter: isGlass ? 'blur(18px)' : undefined,
    }}>
      {data.icon && <div style={{ fontSize: 32, marginBottom: 6 }}>{data.icon}</div>}
      <div style={{ fontWeight: 'bold', fontSize: 22, color: '#222', marginBottom: 2 }}>{data.title}</div>
      {data.value && <div style={{ fontSize: 28, fontWeight: 700, color: '#111', marginBottom: 2 }}>{data.value}</div>}
      {data.description && <div style={{ fontSize: 15, color: '#444', textAlign: 'center', opacity: 0.8 }}>{data.description}</div>}
    </div>
  )
}
