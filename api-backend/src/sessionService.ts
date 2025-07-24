import { randomBytes } from 'crypto'

interface SessionData {
  provider: string
  access_token: string
  refresh_token?: string
  id_token?: string
  userInfo?: any
  createdAt: Date
}

const sessionStore = new Map<string, SessionData>()

export function createSession(data: Omit<SessionData, 'createdAt'>): string {
  const sessionId = randomBytes(32).toString('hex')
  sessionStore.set(sessionId, { ...data, createdAt: new Date() })
  return sessionId
}

export function getSession(sessionId: string): SessionData | undefined {
  return sessionStore.get(sessionId)
}

export function deleteSession(sessionId: string): void {
  sessionStore.delete(sessionId)
} 