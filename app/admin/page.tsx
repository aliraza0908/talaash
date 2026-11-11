import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createAdminServerClient } from "@/lib/admin-server";
import AdminDashboard from "@/components/AdminDashboard";

export default async function AdminPage() {
  const supabase = createSupabaseServerClient();
  if (!supabase) return <AccessDenied />;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return <AccessDenied />;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", auth.user.id).single();
  if (profile?.role?.toLowerCase() !== "admin") return <AccessDenied />;
  const admin = createAdminServerClient() || supabase;
  const [users, posts, gigs, messages] = await Promise.all([admin.from("profiles").select("id", { count: "exact", head: true }), admin.from("posts").select("id", { count: "exact", head: true }), admin.from("gigs").select("id", { count: "exact", head: true }), admin.from("messages").select("id", { count: "exact", head: true })]);
  return <AdminDashboard stats={{ users: users.count || 0, posts: posts.count || 0, gigs: gigs.count || 0, messages: messages.count || 0 }} />;
}

function AccessDenied() { return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6"><div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><ShieldAlert className="mx-auto h-12 w-12 text-rose-600" /><h1 className="mt-5 font-display text-3xl font-bold text-slate-900">Access denied</h1><p className="mt-2 text-sm leading-6 text-slate-500">This dashboard is only available to Talash administrators.</p><Link href="/feed" className="mt-6 inline-block rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white">Return to feed</Link></div></main>; }