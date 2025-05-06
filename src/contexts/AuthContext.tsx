import React, { createContext, useState, useEffect, useContext, ReactNode, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { toast as sonnerToast } from "sonner";

type UserType = 'doctor' | 'patient' | 'admin';

interface UserMetadata {
  user_type?: UserType;
  organization_id?: string;
  first_name?: string;
  last_name?: string;
}

type AuthContextType = {
  session: Session | null;
  user: User | null;
  userType: UserType | null;
  userMetadata: UserMetadata | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string, userType: UserType) => Promise<{ error: any | null; data: any }>;
  signUp: (email: string, password: string, userType: UserType, metadata?: object) => Promise<{ error: any | null; data: any }>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Add flag to track manual sign-ins vs automatic token refreshes
  const isBackgroundRefresh = useRef(false);
  // Add flag to track initial auth setup
  const isInitialAuth = useRef(true);
  // Track last session data to prevent unnecessary updates
  const lastSessionRef = useRef<string | null>(null);
  
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [userMetadata, setUserMetadata] = useState<UserMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        
        // Create a session identifier to check if anything significant changed
        const sessionId = session?.access_token || null;
        const isSessionChanged = lastSessionRef.current !== sessionId;
        lastSessionRef.current = sessionId;
        
        // Only update state if this is initial auth or session actually changed
        if (isInitialAuth.current || (sessionId && isSessionChanged)) {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Safely extract user_type from metadata
          const metadata = session?.user?.user_metadata;
          setUserMetadata(metadata as UserMetadata || null);
          setUserType((metadata?.user_type as UserType) || null);
        }
        
        // Only show notifications for genuine sign-ins/sign-outs
        if (event === 'SIGNED_IN' && !isBackgroundRefresh.current && !isInitialAuth.current) {
          sonnerToast.success('Signed in successfully');
        } else if (event === 'SIGNED_OUT' && !isBackgroundRefresh.current) {
          sonnerToast.info('Signed out successfully');
        }
        
        // After first auth check, set initial flag to false
        isInitialAuth.current = false;
        
        // Reset the background refresh flag
        isBackgroundRefresh.current = false;
      }
    );
    
    // Then check for existing session
    const initializeAuth = async () => {
      try {
        // Mark as initial auth and background refresh
        isBackgroundRefresh.current = true;
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error.message);
        } else if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          
          // Save session ID to prevent duplicate updates
          lastSessionRef.current = data.session.access_token;
          
          // Safely extract user_type from metadata
          const metadata = data.session.user.user_metadata;
          setUserMetadata(metadata as UserMetadata || null);
          setUserType((metadata?.user_type as UserType) || null);
        }
      } catch (error) {
        console.error('Unexpected error during auth initialization:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
    
    // Set up visibility change listener to handle background refreshes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        isBackgroundRefresh.current = true;
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Rest of your functions remain the same
  const signIn = async (email: string, password: string, userType: UserType) => {
    try {
      // First check if email format is valid
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { 
          error: new Error("Please enter a valid email address"), 
          data: null 
        };
      }

      console.log(`Attempting to sign in as ${userType} with email: ${email}`);
      
      // Reset flag for manual sign-in
      isBackgroundRefresh.current = false;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error("Login error:", error.message);
        return { error, data: null };
      }

      // Verify user type matches (if user_type exists in metadata)
      const metadata = data?.user?.user_metadata;
      if (metadata && metadata.user_type && metadata.user_type !== userType) {
        await supabase.auth.signOut();
        return { 
          error: new Error(`This account is registered as a ${metadata.user_type}, not a ${userType}. Please use the correct login page.`), 
          data: null 
        };
      }

      return { error: null, data };
    } catch (error: any) {
      console.error("Unexpected error during sign in:", error);
      return { error, data: null };
    }
  };

  const signUp = async (email: string, password: string, userType: UserType, metadata = {}) => {
    try {
      // First check if email format is valid
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { 
          error: new Error("Please enter a valid email address"), 
          data: null 
        };
      }

      // For doctors, we need to validate the organization
      if (userType === 'doctor' && (!metadata || !('organization_id' in metadata))) {
        return {
          error: new Error("Doctor accounts require an organization. Please select your organization."),
          data: null
        };
      }
      
      // Reset flag for manual sign-up
      isBackgroundRefresh.current = false;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...metadata,
            user_type: userType
          },
        }
      });

      if (error) {
        console.error("Sign up error:", error.message);
        return { error, data: null };
      }

      return { error: null, data };
    } catch (error: any) {
      console.error("Unexpected error during sign up:", error);
      return { error, data: null };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // State will be updated by the auth state change listener
    } catch (error: any) {
      toast({
        title: "Sign Out Failed",
        description: error.message || "An error occurred during sign out.",
        variant: "destructive",
      });
    }
  };

  const refreshSession = async () => {
    try {
      // Mark this as a background refresh
      isBackgroundRefresh.current = true;
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      // Only update if session has changed
      const sessionId = data.session?.access_token || null;
      const isSessionChanged = lastSessionRef.current !== sessionId;
      
      if (isSessionChanged && sessionId) {
        lastSessionRef.current = sessionId;
        setSession(data.session);
        setUser(data.session?.user ?? null);

        if (data.session?.user) {
          const metadata = data.session.user.user_metadata;
          setUserMetadata(metadata as UserMetadata || null);
          setUserType((metadata?.user_type as UserType) || null);
        }
      }
    } catch (error: any) {
      console.error('Failed to refresh session:', error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      userType,
      userMetadata,
      loading, 
      signOut, 
      signIn, 
      signUp, 
      refreshSession 
    }}>
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