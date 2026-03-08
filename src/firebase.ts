import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBON12ICLIhWfsvUbday9rQVBmXn9U-gnA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "flotteapp-1c672.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "flotteapp-1c672",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "flotteapp-1c672.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "763649583186",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:763649583186:web:3e27660a5d5c491556578b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
