import * as React from 'react'
import { Button } from './button'
import gmailLogo from '../../assets/gmaillogo.png'
import gcalLogo from '../../assets/gcallogo.png'

function SlackLogo({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 122.8 122.8" width={20} height={20} aria-hidden="true">
      <g>
        <path fill="#E01E5A" d="M30.3 77.1c0 6.1-5 11.1-11.1 11.1S8.1 83.2 8.1 77.1s5-11.1 11.1-11.1h11.1v11.1zm5.6 0c0-6.1 5-11.1 11.1-11.1s11.1 5 11.1 11.1v27.8c0 6.1-5 11.1-11.1 11.1s-11.1-5-11.1-11.1V77.1z"/>
        <path fill="#36C5F0" d="M45.9 30.3c-6.1 0-11.1-5-11.1-11.1S39.8 8.1 45.9 8.1s11.1 5 11.1 11.1v11.1H45.9zm0 5.6c6.1 0 11.1 5 11.1 11.1s-5 11.1-11.1 11.1H18.1c-6.1 0-11.1-5-11.1-11.1s5-11.1 11.1-11.1h27.8z"/>
        <path fill="#2EB67D" d="M92.5 45.9c0-6.1 5-11.1 11.1-11.1s11.1 5 11.1 11.1-5 11.1-11.1 11.1H92.5V45.9zm-5.6 0c0 6.1-5 11.1-11.1 11.1s-11.1-5-11.1-11.1V18.1c0-6.1 5-11.1 11.1-11.1s11.1 5 11.1 11.1v27.8z"/>
        <path fill="#ECB22E" d="M77.1 92.5c6.1 0 11.1 5 11.1 11.1s-5 11.1-11.1 11.1-11.1-5-11.1-11.1V92.5h11.1zm0-5.6c-6.1 0-11.1-5-11.1-11.1s5-11.1 11.1-11.1h27.8c6.1 0 11.1 5 11.1 11.1s-5 11.1-11.1 11.1H77.1z"/>
      </g>
    </svg>
  )
}

interface SlackSignInButtonProps {
  className?: string
}

function SlackSignInButton({ className }: SlackSignInButtonProps) {
  function handleSignIn() {
    window.location.href = 'https://zigsaw-backend.vercel.app/api/auth/slack'
  }

  return (
    <Button
      className={`bg-[#4A154B] text-white hover:bg-[#3E1250] flex items-center gap-2 ${className ?? ''}`}
      onClick={handleSignIn}
      type="button"
    >
      <SlackLogo className="w-5 h-5" />
      Sign in with Slack
    </Button>
  )
}

function NotionLogo({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" width={20} height={20} aria-hidden="true">
      <rect x="4" y="4" width="32" height="32" rx="6" fill="#fff" stroke="#000" strokeWidth="2" />
      <text x="50%" y="60%" textAnchor="middle" fontWeight="bold" fontSize="18" fill="#000" fontFamily="sans-serif" dy=".3em">N</text>
    </svg>
  )
}

function NotionSignInButton({ className }: { className?: string }) {
  function handleSignIn() {
    // Notion OAuth 2.0 flow
    const clientId = encodeURIComponent('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')
    const redirectUri = encodeURIComponent(window.location.origin + '/api/oauth/notion/callback')
    const responseType = 'code'
    const state = encodeURIComponent(Math.random().toString(36).substring(2))
    const notionAuthUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&owner=user&state=${state}`
    window.location.href = notionAuthUrl
  }

  return (
    <Button
      className={`bg-black text-white hover:bg-gray-900 flex items-center gap-2 ${className ?? ''}`}
      onClick={handleSignIn}
      type="button"
    >
      <NotionLogo className="w-5 h-5" />
      Sign in with Notion
    </Button>
  )
}

function GmailSignInButton({ className }: { className?: string }) {
  function handleSignIn() {
    // Automatically detect environment and use appropriate backend URL
    const isLocalhost = window.location.hostname === 'localhost'
    const backendUrl = isLocalhost 
      ? 'http://localhost:3000' 
      : 'https://zigsaw-backend.vercel.app'
    
    window.location.href = `${backendUrl}/api/auth/signin/google`
  }

  return (
    <Button
      className={`bg-[#EA4335] text-white hover:bg-[#C5221F] flex items-center gap-2 ${className ?? ''}`}
      onClick={handleSignIn}
      type="button"
    >
      <img src={gmailLogo} alt="Gmail logo" className="w-5 h-5" />
      Gmail
    </Button>
  )
}

function GoogleCalendarSignInButton({ className }: { className?: string }) {
  function handleSignIn() {
    window.location.href = 'https://zigsaw-backend.vercel.app/api/auth/signin/gcl'
  }

  return (
    <Button
      className={`bg-[#4285F4] text-white hover:bg-[#3367D6] flex items-center gap-2 ${className ?? ''}`}
      onClick={handleSignIn}
      type="button"
    >
      <img src={gcalLogo} alt="Google Calendar logo" className="w-5 h-5" />
      GCal
    </Button>
  )
}

export { SlackSignInButton, GmailSignInButton, GoogleCalendarSignInButton, NotionSignInButton } 