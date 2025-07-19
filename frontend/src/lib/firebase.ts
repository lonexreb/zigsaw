import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCVLdEneW134UbPiXpUXZ2Ism9soG2_yg4",
  authDomain: "agent-7752d.firebaseapp.com",
  projectId: "agent-7752d",
  storageBucket: "agent-7752d.firebasestorage.app",
  messagingSenderId: "380702532119",
  appId: "1:380702532119:web:2dcd8c8414a91f74667252",
  measurementId: "G-C622SLKTNH"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Set language preference
if (typeof window !== 'undefined') {
  auth.useDeviceLanguage();
}

export default app;
