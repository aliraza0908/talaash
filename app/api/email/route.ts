import { NextRequest, NextResponse } from "next/server";
import { adminAlertEmail, contactEmail, welcomeEmail } from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type EmailType = "welcome" | "contact" | "admin-alert";
const contactAttempts = new Map<string, number>();
const CONTACT_WINDOW = 60_000;

// This route is the only browser-facing entry point to the Resend server key.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { type?: EmailType; to?: string; data?: Record<string, unknown> };
    const type = body.type;
    if (!type || !["welcome", "contact", "admin-alert"].includes(type)) return NextResponse.json({ success: false, error: "Unknown email type." }, { status: 400 });

    const data = body.data || {};
    const supabase = createSupabaseServerClient();
    let authenticatedEmail = "";
    if (type !== "contact") {
      if (!supabase) return NextResponse.json({ success: false, error: "Supabase is not configured." }, { status: 503 });
      const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
      const { data: auth } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();
      if (!auth.user) return NextResponse.json({ success: false, error: "You must be logged in to send this email." }, { status: 401 });
      authenticatedEmail = auth.user.email || "";
    } else {
      const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      const lastAttempt = contactAttempts.get(address) || 0;
      if (Date.now() - lastAttempt < CONTACT_WINDOW) return NextResponse.json({ success: false, error: "Please wait before sending another message." }, { status: 429 });
      contactAttempts.set(address, Date.now());
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const recipient = type === "welcome" ? authenticatedEmail : adminEmail;
    if (!recipient) return NextResponse.json({ success: false, error: "The email recipient is not configured." }, { status: 503 });
    const content = type === "welcome" ? welcomeEmail(data) : type === "contact" ? contactEmail(data) : adminAlertEmail(data);
    const subject = type === "welcome" ? "Welcome to Talash" : type === "contact" ? "New message from the Talash website" : "New student signup on Talash";
    const result = await sendEmail({ to: recipient, subject, html: content });
    if (result.error) return NextResponse.json({ success: false, error: result.error }, { status: 502 });
    return NextResponse.json({ success: true, skipped: result.skipped === true });
  } catch (error) {
    console.error("Email route failed", error);
    return NextResponse.json({ success: false, error: "The email request could not be completed." }, { status: 500 });
  }
}