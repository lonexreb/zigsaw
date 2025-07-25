import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import NotionProvider from 'next-auth/providers/notion'
import OAuthProvider from 'next-auth/providers/oauth'
import SlackProvider from 'next-auth/providers/slack'

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GMAIL_CLIENT_ID!,
      clientSecret: process.env.GMAIL_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
    NotionProvider({
      clientId: process.env.NOTION_CLIENT_ID!,
      clientSecret: process.env.NOTION_CLIENT_SECRET!,
    }),
    OAuthProvider({
      id: 'gcl',
      name: 'GCL',
      type: 'oauth',
      clientId: process.env.GCL_CLIENT_ID!,
      clientSecret: process.env.GCL_CLIENT_SECRET!,
      authorization: {
        url: process.env.GCL_AUTH_URL || 'https://gcl.example.com/oauth/authorize',
        params: { scope: process.env.GCL_SCOPES || 'openid email profile' },
      },
      token: process.env.GCL_TOKEN_URL || 'https://gcl.example.com/oauth/token',
      userinfo: process.env.GCL_USERINFO_URL || 'https://gcl.example.com/api/userinfo',
      profile(profile) {
        // Map the user profile fields as needed
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
        }
      },
    }),
    SlackProvider({
      clientId: process.env.SLACK_CLIENT_ID!,
      clientSecret: process.env.SLACK_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      return session
    },
  },
  // Add more config as needed (e.g., database, custom pages, etc.)
}) 