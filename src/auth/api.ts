import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

export const signUpEmail = async (email: string, password: string, displayName?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      ...(displayName ? { data: { display_name: displayName } } : {}),
      emailRedirectTo: appUrl,
    },
  });
  if (error) {
    throw error;
  }
  return data;
};

export const signInEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    throw error;
  }
  return data;
};

export const signInGoogle = async () => {
  // Always redirect to home page to avoid routing issues
  // The app will handle navigation after OAuth callback
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: appUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  if (error) {
    throw error;
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
};

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session;
};

export const onAuthChange = (callback: (session: Session | null) => void) => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => {
    subscription.unsubscribe();
  };
};

