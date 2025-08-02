import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.compose',
            'https://www.googleapis.com/auth/gmail.labels',
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
          ].join(' '),
          prompt: 'consent',
          access_type: 'offline'
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token from a provider
      session.accessToken = token.accessToken as string
      session.refreshToken = token.refreshToken as string
      
      // Add Gmail and Calendar scopes to session for frontend use
      session.gmailScopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.compose',
        'https://www.googleapis.com/auth/gmail.labels'
      ]
      
      session.calendarScopes = [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ]
      
      return session
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to frontend after authentication
      console.log('NextAuth redirect called with:', { url, baseUrl })
      
      // If it's a frontend URL, allow it
      if (url.startsWith('https://zigsaw.dev')) {
        console.log('Redirecting to frontend:', url)
        return url
      }
      
      // If it's a relative URL, make it absolute to frontend
      if (url.startsWith('/')) {
        const frontendUrl = 'https://zigsaw.dev' + url
        console.log('Converting relative URL to frontend:', frontendUrl)
        return frontendUrl
      }
      
      // Default to frontend workflow page with auth success indicator
      console.log('Default redirect to frontend workflow with auth success')
      return 'https://zigsaw.dev/workflow?auth=success'
    },
  },
  pages: {
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}) 