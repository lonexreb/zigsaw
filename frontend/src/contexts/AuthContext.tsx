import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser, signInWithPopup, GithubAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider } from 'firebase/auth';
import app from '../lib/firebase'; // Your Firebase app initialization

interface AuthContextType {
  currentUser: FirebaseUser | null;
  user: FirebaseUser | null;
  loading: boolean;
  isGuestMode: boolean;
  signOut: () => Promise<void>;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  enableGuestMode: () => void;
  disableGuestMode: () => void;
  signInWithGoogle?: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, [auth]);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const signIn = async () => {
    const provider = new GithubAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const enableGuestMode = () => {
    setIsGuestMode(true);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const disableGuestMode = () => {
    setIsGuestMode(false);
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      user: currentUser, 
      loading, 
      isGuestMode,
      signOut, 
      signIn, 
      signInWithEmail, 
      signUpWithEmail,
      enableGuestMode,
      disableGuestMode,
      signInWithGoogle
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
