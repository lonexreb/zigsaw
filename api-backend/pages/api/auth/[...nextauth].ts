import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send',
          access_type: 'offline',
          prompt: 'consent',
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
        token.scope = account.scope
        console.log('Gmail OAuth tokens received:', {
          access_token: account.access_token ? '✅ Present' : '❌ Missing',
          refresh_token: account.refresh_token ? '✅ Present' : '❌ Missing',
          scope: account.scope
        })
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token from a provider
      session.accessToken = token.accessToken as string
      session.refreshToken = token.refreshToken as string
      return session
    },
    async redirect({ url, baseUrl }) {
      console.log('NextAuth redirect - url:', url, 'baseUrl:', baseUrl)
      
      // Determine frontend URL based on environment
      const isLocalhost = baseUrl.includes('localhost')
      const frontendUrl = isLocalhost 
        ? 'http://localhost:8080'
        : process.env.FRONTEND_URL || 'https://your-frontend-domain.com'
      
      // Always redirect to frontend after successful authentication
      console.log('Redirecting to frontend:', frontendUrl)
      return frontendUrl
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
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
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}) 