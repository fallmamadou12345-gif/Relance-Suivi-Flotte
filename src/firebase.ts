import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBON12ICLIhWfsvUbday9rQVBmXn9U-gnA",
  authDomain: "flotteapp-1c672.firebaseapp.com",
  projectId: "flotteapp-1c672",
  storageBucket: "flotteapp-1c672.firebasestorage.app",
  messagingSenderId: "763649583186",
  appId: "1:763649583186:web:3e27660a5d5c491556578b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
