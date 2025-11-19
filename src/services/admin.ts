import { supabase } from "@/lib/supabase";

export type ProfileRow = {
  id: string;
  email: string;
  role: "user" | "admin";
  is_premium: boolean;
  display_name: string | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  visit_count: number;
};

export type SiteSetting = {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
};

export const listProfiles = async (): Promise<ProfileRow[]> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,role,is_premium,display_name,created_at,updated_at,last_login,visit_count")
    .order("created_at", { ascending: false });
  if (error) {
    throw error;
  }
  return (data ?? []) as ProfileRow[];
};

export const updateProfile = async (
  id: string,
  updates: Partial<Pick<ProfileRow, "role" | "is_premium" | "display_name">>
): Promise<ProfileRow> => {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select("id,email,role,is_premium,display_name,created_at,updated_at,last_login,visit_count")
    .single();
  if (error) {
    throw error;
  }
  return data as ProfileRow;
};

export const deleteUser = async (id: string): Promise<void> => {
  const { error } = await supabase.rpc("delete_user_profile", { user_id: id });
  if (error) {
    throw error;
  }
};

export const getSiteSettings = async (): Promise<SiteSetting[]> => {
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .order("key");
  if (error) {
    throw error;
  }
  return (data ?? []) as SiteSetting[];
};

export const updateSiteSetting = async (
  key: string,
  value: string
): Promise<SiteSetting> => {
  const { data, error } = await supabase
    .from("site_settings")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("key", key)
    .select("*")
    .single();
  if (error) {
    throw error;
  }
  return data as SiteSetting;
};

export const trackUserLogin = async (): Promise<void> => {
  const { error } = await supabase.rpc("track_user_login");
  if (error) {
    console.error("Failed to track login:", error);
  }
};






