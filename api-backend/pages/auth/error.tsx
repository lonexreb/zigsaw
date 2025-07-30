import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function AuthError() {
  const router = useRouter()
  const { error } = router.query

  useEffect(() => {
    // Redirect back to the frontend after a short delay
    const timer = setTimeout(() => {
      window.location.href = process.env.FRONTEND_URL || 'http://localhost:8080'
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {error === 'google' && 'There was an error signing in with Google.'}
            {error === 'slack' && 'There was an error signing in with Slack.'}
            {!error && 'An authentication error occurred.'}
          </p>
          <p className="mt-2 text-center text-sm text-gray-500">
            Redirecting you back to the application...
          </p>
        </div>
      </div>
    </div>
  )
} 