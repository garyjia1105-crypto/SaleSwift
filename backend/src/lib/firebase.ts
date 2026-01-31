import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getCredential() {
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (path) {
    return cert(path);
  }
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      const parsed = typeof json === 'string' ? JSON.parse(json) : json;
      return cert(parsed as ServiceAccount);
    } catch {
      console.error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON');
    }
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (projectId && clientEmail && privateKey) {
    return cert({ projectId, clientEmail, privateKey });
  }
  throw new Error(
    'Firebase credentials missing. Set GOOGLE_APPLICATION_CREDENTIALS, or FIREBASE_SERVICE_ACCOUNT_JSON, or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY'
  );
}

if (!getApps().length) {
  try {
    initializeApp({ credential: getCredential() });
  } catch (e) {
    console.error('Firebase init failed:', e);
  }
}

export const db = getFirestore();

export const COLLECTIONS = {
  users: 'users',
  customers: 'customers',
  interactions: 'interactions',
  schedules: 'schedules',
  coursePlans: 'coursePlans',
} as const;
