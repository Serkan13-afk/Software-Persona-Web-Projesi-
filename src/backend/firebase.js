import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Guard: prevent crash if env vars are missing (e.g. Netlify without env vars set)
const isMissingConfig = !firebaseConfig.apiKey || !firebaseConfig.projectId;

let app;
let auth;

if (isMissingConfig) {
  console.warn('[Firebase] Environment variables not found. Auth features disabled.');
  auth = null;
} else {
  app  = initializeApp(firebaseConfig);
  auth = getAuth(app);
}

export { auth };
