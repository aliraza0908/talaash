import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"), title: { default: "Talash | Find your next opportunity", template: "%s | Talash" }, description: "A place for Pakistani students and fresh graduates to learn, earn, and get discovered.", openGraph: { title: "Talash | Learn. Earn. Get discovered.", description: "Pakistan's student-powered professional network.", type: "website" }, twitter: { card: "summary_large_image", title: "Talash", description: "Pakistan's student-powered professional network." } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }