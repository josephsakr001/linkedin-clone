// Supabase connection
const supabaseClient = window.supabaseClient;

// create global client
window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);