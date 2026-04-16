// Supabase connection

const SUPABASE_URL = "https://fknmufaymoefcvljnitu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_rETTErV0GMfPB-xM73nDWw_777TD36v";

// create global client
window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
)