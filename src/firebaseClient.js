import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const isPlaceholderValue = (value) =>
  !value || value.startsWith('your_') || value.includes('your-project');

export const isFirebaseConfigured = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId,
].every((value) => !isPlaceholderValue(value));

const app = initializeApp({
  apiKey: firebaseConfig.apiKey || 'missing-api-key',
  authDomain: firebaseConfig.authDomain || 'missing-auth-domain.firebaseapp.com',
  projectId: firebaseConfig.projectId || 'missing-project-id',
  storageBucket: firebaseConfig.storageBucket || 'missing-project-id.appspot.com',
  messagingSenderId: firebaseConfig.messagingSenderId || '000000000000',
  appId: firebaseConfig.appId || '1:000000000000:web:missing',
  measurementId: firebaseConfig.measurementId,
});

export const auth = getAuth(app);
export const db = getFirestore(app);
