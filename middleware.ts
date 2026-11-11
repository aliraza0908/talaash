import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Protect admin routes at the edge before the page is rendered.
export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin")) return NextResponse.next();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.redirect(new URL("/auth", request.url));
  let response = NextResponse.next({ request });
  type CookieToSet = { name: string; value: string; options?: Parameters<typeof response.cookies.set>[2] };
  const client = createServerClient(url, key, { cookies: { getAll: () => request.cookies.getAll(), setAll: (cookies: CookieToSet[]) => cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) } });
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return NextResponse.redirect(new URL("/auth", request.url));
  // The admin page performs the final role check on the server.
  return response;
}
export const config = { matcher: ["/admin/:path*"] };
