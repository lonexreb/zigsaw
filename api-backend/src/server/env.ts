/* Server-only env loader with minimal strict validation */

type NonEmpty = string & { __brand: 'NonEmpty' };
const req = (v: string | undefined, name?: string): NonEmpty => {
  if (!v || v.trim() === '') throw new Error(`Missing required env: ${name}`);
  return v.trim() as NonEmpty;
};
const opt = (v: string | undefined) => (v && v.trim() !== '' ? v.trim() : undefined);

const isProd = process.env.NODE_ENV === 'production';

export const Env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd,

  // URLs / Auth
  nextauthUrl: req(process.env.NEXTAUTH_URL, 'NEXTAUTH_URL'),
  frontendUrl: req(process.env.FRONTEND_URL, 'FRONTEND_URL'),
  nextauthSecret: req(process.env.NEXTAUTH_SECRET, 'NEXTAUTH_SECRET'),

  // OAuth (Google)
  googleClientId: req(process.env.GOOGLE_CLIENT_ID, 'GOOGLE_CLIENT_ID'),
  googleClientSecret: req(process.env.GOOGLE_CLIENT_SECRET, 'GOOGLE_CLIENT_SECRET'),

  // AI providers
  openaiApiKey: opt(process.env.OPENAI_API_KEY),
  anthropicApiKey: opt(process.env.ANTHROPIC_API_KEY),
  geminiApiKey: opt(process.env.GEMINI_API_KEY) || opt(process.env.GOOGLE_AI_API_KEY),
  groqApiKey: opt(process.env.GROQ_API_KEY),
  groqModel: process.env.GROQ_MODEL || 'llama3-70b-1024',

  // Meta / Instagram (optional)
  metaAppId: opt(process.env.META_APP_ID),
  metaAppSecret: opt(process.env.META_APP_SECRET),
  metaAccessToken: opt(process.env.META_ACCESS_TOKEN),
  igBusinessAccountId: opt(process.env.IG_BUSINESS_ACCOUNT_ID),
  igUserId: opt(process.env.IG_USER_ID),



  // Firebase Admin
  firebaseProjectId: opt(process.env.FIREBASE_PROJECT_ID),
  firebaseClientEmail: opt(process.env.FIREBASE_CLIENT_EMAIL),
  firebasePrivateKey: opt(process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, '\n'),
} as const;

// Optional: assert a few critical runtime keys in production
if (isProd) {
  const must = [
    ['NEXTAUTH_SECRET', Env.nextauthSecret],
    ['NEXTAUTH_URL', Env.nextauthUrl],
    ['FRONTEND_URL', Env.frontendUrl],
  ] as const;
  for (const [name, value] of must) {
    if (!value) throw new Error(`Missing required env in production: ${name}`);
  }
}

export type EnvType = typeof Env;


