import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "letsconnectchatapplication.firebaseapp.com",
  projectId: "letsconnectchatapplication",
  storageBucket: "letsconnectchatapplication.firebasestorage.app",
  messagingSenderId: "62294170703",
  appId: "1:62294170703:web:35f731926131e538965e3a",
  measurementId: "G-3B4369ZFVM"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth()
export const db = getFirestore()
export const storage = getStorage()