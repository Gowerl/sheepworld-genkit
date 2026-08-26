import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase configuration using environment variables or fallbacks for sheep-vertex-ai
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "placeholder",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "sheep-vertex-ai.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sheep-vertex-ai",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "sheep-vertex-ai.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "placeholder",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "placeholder"
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Functions (using europe-west4 region)
const functions = getFunctions(app, 'europe-west4');

// Connect to the local emulator in development mode
if (process.env.NODE_ENV === 'development') {
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}

export { app, functions };
