import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Variables Supabase manquantes. Utilisation de valeurs par défaut pour le développement.');
  console.warn('Pour utiliser Supabase, créez un fichier .env avec vos clés :');
  console.warn('EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.warn('EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here');
}

// Utiliser des valeurs par défaut pour le développement si les variables ne sont pas définies
const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(url, key);

// Fonction pour vérifier si Supabase est configuré
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};


