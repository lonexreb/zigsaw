import type { App } from 'firebase-admin/app';
import { getApps, initializeApp, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { Env } from './env';

let app: App | null = null;

export function getFirebaseAdmin() {
  if (app) return app;

  if (!Env.firebaseProjectId || !Env.firebaseClientEmail || !Env.firebasePrivateKey) {
    throw new Error('Firebase Admin env not fully configured (FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY)');
  }

  app = getApps().length
    ? getApp()
    : initializeApp({
        credential: cert({
          projectId: Env.firebaseProjectId,
          clientEmail: Env.firebaseClientEmail,
          privateKey: Env.firebasePrivateKey,
        }),
      });

  return app;
}

export const adminDb = () => getFirestore(getFirebaseAdmin());
export const adminAuth = () => getAuth(getFirebaseAdmin());


