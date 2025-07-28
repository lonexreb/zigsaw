# Zigsaw Backend

## Environment Setup

### Required Environment Variables

#### For Local Development (localhost:3000)

Create a `.env.local` file in the root directory:

```bash
# NextAuth Configuration for Local Development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Frontend URL for redirects
FRONTEND_URL=http://localhost:8080

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

#### For Production (Vercel)

Set these environment variables in your Vercel dashboard:

```bash
# NextAuth Configuration for Production
NEXTAUTH_URL=https://zigsaw-backend.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-here

# Frontend URL for redirects
FRONTEND_URL=https://your-frontend-domain.com

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
5. Set Application type to "Web application"
6. Add authorized redirect URIs:
   - `https://zigsaw-backend.vercel.app/api/auth/callback/google` (production)
   - `http://localhost:3000/api/auth/callback/google` (local development)
7. Copy Client ID and Client Secret to your environment files

### NextAuth Secret

Generate a random secret for NextAuth:
```bash
openssl rand -base64 32
```

## Installation

```bash
npm install
npm run dev
```

## Google Sign-In Endpoints

### Production
- `https://zigsaw-backend.vercel.app/api/auth/signin/google`

### Local Development  
- `http://localhost:3000/api/auth/signin/google`

These endpoints handle the OAuth flow and redirect users back to your frontend after authentication:
- Production: redirects to your production frontend
- Local: redirects to `http://localhost:8080`
