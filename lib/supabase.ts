import { createBrowserClient } from "@supabase/ssr";
// The browser client stays optional so the demo works before a project is connected.
export function createSupabaseBrowserClient() { const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; if (!url || !key) return null; return createBrowserClient(url, key); }