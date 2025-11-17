import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
  },
});

export type Profile = {
  id: string;
  email: string;
  role: 'guest' | 'premium' | 'admin';
  is_premium?: boolean;
  display_name?: string;
  created_at: string;
  updated_at: string;
};

export type FavoriteList = {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type Favorite = {
  user_id: string;
  symbol: string;
  list_id?: string;
  created_at: string;
};

export type SavedScreener = {
  id: string;
  user_id: string;
  name: string;
  filters: Record<string, any>;
  weights: {
    yield: number;
    stdDev: number;
    totalReturn: number;
  };
  created_at: string;
};

