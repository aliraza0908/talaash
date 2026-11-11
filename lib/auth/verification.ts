import type { SupabaseClient } from "@supabase/supabase-js";

// TODO: re-enable later. OTP verification is kept here while password auth is the active flow.
export async function sendEmailOtp(client: SupabaseClient, email: string) { return client.auth.signInWithOtp({ email }); }
// TODO: re-enable later. WhatsApp OTP will use the same verification boundary when enabled.
export async function sendWhatsAppOtp(phone: string) { return { phone, enabled: false, message: "WhatsApp verification is paused." }; }
