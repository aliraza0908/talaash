import { Resend } from "resend";

type EmailInput = { to: string; subject: string; html: string };
type EmailResult = { sent: boolean; skipped?: boolean; error?: string };

// This helper reads all email settings from the server environment only.
export async function sendEmail({ to, subject, html }: EmailInput): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.warn("Resend is not configured. Email was skipped safely.");
    return { sent: false, skipped: true };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) return { sent: false, error: error.message };
  return { sent: true };
}