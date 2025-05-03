
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
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
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Safely extract user_type from metadata
        const metadata = session?.user?.user_metadata;
        setUserMetadata(metadata as UserMetadata || null);
        setUserType((metadata?.user_type as UserType) || null);
        
        // If user has logged in, let them know
        if (event === 'SIGNED_IN') {
          sonnerToast.success('Signed in successfully');
        } else if (event === 'SIGNED_OUT') {
          sonnerToast.info('Signed out successfully');
        }
      }
    );
    
    // Then check for existing session
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error.message);
        } else if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          
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
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      setSession(data.session);
      setUser(data.session?.user ?? null);

      if (data.session?.user) {
        const metadata = data.session.user.user_metadata;
        setUserMetadata(metadata as UserMetadata || null);
        setUserType((metadata?.user_type as UserType) || null);
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
