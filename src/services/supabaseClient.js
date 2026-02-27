import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl.includes("your-project")) {
  throw new Error("KRYTYCZNY BŁĄD: Aplikacja używa błędnego adresu URL Supabase! Sprawdź plik .env");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const SupabaseService = {
  async signUp(email, password, username) {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
      if (error) throw error;
      return { success: true, data };
    } catch (error) { return { success: false, error: error.message }; }
  },
  
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { success: true, data };
    } catch (error) { return { success: false, error: error.message }; }
  },
  
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) { return { success: false, error: error.message }; }
  },
  
  getCurrentUser() { return supabase.auth.getUser(); },
  onAuthStateChange(callback) { return supabase.auth.onAuthStateChange(callback); },
  
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) throw error; return { success: true, data };
    } catch (error) { return { success: false, error: error.message }; }
  },
  
  async getUserWallet(userId) {
    try {
      const { data, error } = await supabase.from('wallets').select('*').eq('user_id', userId).single();
      if (error) throw error; return { success: true, data };
    } catch (error) { return { success: false, error: error.message }; }
  },
  
  async getUserUpgrades(userId) {
    try {
      const { data, error } = await supabase.from('upgrades').select('*').eq('user_id', userId).single();
      if (error) throw error; return { success: true, data };
    } catch (error) { return { success: false, error: error.message }; }
  }
};
