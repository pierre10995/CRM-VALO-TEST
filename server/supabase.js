import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";

/**
 * Client Supabase Admin (service_role) pour la gestion des utilisateurs côté serveur.
 * Utilise la clé service_role qui a accès complet à auth.users.
 */
const supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * Client Supabase public (anon key) pour les opérations de login.
 */
const supabaseClient = createClient(config.supabase.url, config.supabase.anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export { supabaseAdmin, supabaseClient };
