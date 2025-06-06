
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Auth, User, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, type UserCredential } from 'firebase/auth';
import { auth as firebaseAuth } from '@/lib/firebase'; // Renomeado para evitar conflito
import LoadingSpinner from '@/components/loading-spinner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    }, (err) => {
      console.error("Auth state change error:", err);
      setError(err.message);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string): Promise<UserCredential> => {
    setError(null);
    return createUserWithEmailAndPassword(firebaseAuth, email, password);
  };

  const signIn = async (email: string, password: string): Promise<UserCredential> => {
    setError(null);
    return signInWithEmailAndPassword(firebaseAuth, email, password);
  };

  const signOutUser = async (): Promise<void> => {
    setError(null);
    return signOut(firebaseAuth);
  };
  
  // Explicitly type the value for the provider
  const value: AuthContextType = {
    user,
    loading,
    error,
    signUp, 
    signIn,
    signOutUser,
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-4 text-xl text-muted-foreground">Initializing App...</p>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

