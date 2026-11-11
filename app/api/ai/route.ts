import { NextRequest, NextResponse } from "next/server";
import { generateAiContent } from "@/lib/ai";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const requests = new Map<string, number[]>();
const HOUR = 60 * 60 * 1000;

// Authenticate every AI request and apply a small per-user in-memory limit.
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    if (!supabase) return NextResponse.json({ error: "AI is unavailable in demo mode." }, { status: 503 });
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const { data: auth } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Please log in to use AI features." }, { status: 401 });
    const now = Date.now();
    const recent = (requests.get(auth.user.id) || []).filter((time) => now - time < HOUR);
    if (recent.length >= 10) return NextResponse.json({ error: "You have reached the hourly AI limit. Please try again later." }, { status: 429 });
    requests.set(auth.user.id, [...recent, now]);
    const body = await request.json();
    if (!["analyzer", "bio", "gig"].includes(body.feature)) return NextResponse.json({ error: "Unknown AI feature." }, { status: 400 });
    const result = await generateAiContent(body);
    return NextResponse.json({ result });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "AI request failed." }, { status: 503 }); }
}
