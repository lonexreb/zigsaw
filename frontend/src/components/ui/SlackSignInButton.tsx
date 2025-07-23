import * as React from 'react'
import { Button } from './button'

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

export { SlackSignInButton } 