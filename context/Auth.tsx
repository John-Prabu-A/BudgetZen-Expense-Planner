import { Session, User } from '@supabase/supabase-js';
import SecureStorageManager from '../lib/storage/secureStorageManager';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
  loading: boolean;
  isPasswordLocked: boolean;
  unlockPassword: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordLocked, setIsPasswordLocked] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      setSession(session);
      setUser(session?.user ?? null);
      
      // Lock password when session is established (if password is enabled)
      if (session && event === 'SIGNED_IN') {
        checkPasswordStatus();
      }
      
      setLoading(false);

      // Reset lock if user signs out
      // NOTE: Do NOT clear onboarding step - it should persist across sessions
      if (event === 'SIGNED_OUT') {
        setIsPasswordLocked(false);
      }
    });

    // Fetch initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      
      // Check password status on initial load
      if (session) {
        await checkPasswordStatus();
      }
      
      setLoading(false);
    });

    // Listen for app state changes (background/foreground)
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      authListener?.subscription.unsubscribe();
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = async (nextAppState: string) => {
    // When app comes to foreground, re-check password status
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App came to foreground - re-checking password status');
      // Check if user still has a session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await checkPasswordStatus();
      }
    }

    appState.current = nextAppState as any;
  };

  const checkPasswordStatus = async () => {
    try {
      // Check if either password hash or passcode hash exists
      const passwordHash = await SecureStorageManager.getItem('pref_password_hash');
      const passcodeHash = await SecureStorageManager.getItem('pref_passcode_hash');
      
      console.log('[AUTH] Checking password status:', { 
        hasPasswordHash: !!passwordHash, 
        hasPasscodeHash: !!passcodeHash 
      });
      
      // Lock if either password or passcode is set
      if (passwordHash || passcodeHash) {
        console.log('[AUTH] Setting isPasswordLocked to true');
        setIsPasswordLocked(true);
      } else {
        console.log('[AUTH] No password/passcode found, setting isPasswordLocked to false');
        setIsPasswordLocked(false);
      }
    } catch (error) {
      console.error('Error checking password status:', error);
    }
  };

  const signOut = async () => {
    try {
      // NOTE: Do NOT clear onboarding state on logout
      // Once a user completes onboarding, they should not see it again
      // even if they log out and log back in (possibly with a different account)
      // Sign out from Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during sign out:', error);
      throw error;
    }
  };

  const unlockPassword = () => {
    setIsPasswordLocked(false);
  };

  return (
    <AuthContext.Provider value={{ session, user, signOut, loading, isPasswordLocked, unlockPassword }}>
      {children}
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
