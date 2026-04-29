// Stub for Supabase client. The marketing pages ported from Zigsaw-lab
// originally used Supabase for waitlist + onboarding. The unified product
// uses Firebase as the source of truth, so we export `null` here. Pages
// already guard with `if (!supabase) return` and degrade gracefully — they
// still render, they simply skip the Supabase-bound side effects.
//
// TODO: replace with Firebase Auth + Firestore equivalents when wiring up
// the trial system (issue #10) and waitlist capture.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = null;
