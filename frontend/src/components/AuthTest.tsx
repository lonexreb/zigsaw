import React, { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function AuthTest() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testSession = async () => {
    setLoading(true)
    
    try {
      const backendUrl = 'https://zigsaw-backend.vercel.app'
      
      // Test 1: Direct session check
      const sessionResponse = await fetch(`${backendUrl}/api/auth/session-check`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const sessionData = await sessionResponse.json()
      
      // Test 2: Debug session
      const debugResponse = await fetch(`${backendUrl}/api/auth/debug-session`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const debugData = await debugResponse.json()
      
      // Test 3: Check what cookies we have
      const cookies = document.cookie
      
      setResult({
        session: {
          status: sessionResponse.status,
          data: sessionData
        },
        debug: {
          status: debugResponse.status,
          data: debugData
        },
        cookies: cookies,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const signIn = () => {
    const callbackUrl = encodeURIComponent(window.location.origin)
    window.location.href = `https://zigsaw-backend.vercel.app/api/auth/signin/google?callbackUrl=${callbackUrl}&prompt=consent`
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Authentication Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testSession} disabled={loading}>
            {loading ? 'Testing...' : 'Test Session'}
          </Button>
          <Button onClick={signIn} variant="outline">
            Sign In with Google
          </Button>
        </div>

        {result && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Session Check Result</h3>
              <pre className="bg-gray-50 p-4 rounded-md text-sm overflow-auto">
                {JSON.stringify(result.session, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Debug Info</h3>
              <pre className="bg-gray-50 p-4 rounded-md text-sm overflow-auto">
                {JSON.stringify(result.debug, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Browser Cookies</h3>
              <pre className="bg-gray-50 p-4 rounded-md text-sm overflow-auto">
                {result.cookies || 'No cookies found'}
              </pre>
            </div>
            
            <div className="text-sm text-gray-500">
              Tested at: {result.timestamp}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 