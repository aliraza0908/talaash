"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, FileImage, Heart, ImagePlus, LoaderCircle, MessageCircle, MoreHorizontal, Plus, Send, Sparkles, Trash2, Upload, Video, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import NotificationBell from "@/components/NotificationBell";

type PostType = "post" | "project" | "gig" | "request";
type MediaItem = { url: string; type: "image" | "video"; name: string };
type Author = { id: string; name: string; role: string; avatar_url: string | null; verified: boolean };
type Post = { id: string; author_id: string; post_type: PostType; title: string | null; body: string; price: number | null; media: MediaItem[]; created_at: string; profiles: Author | Author[] | null; likes: { user_id: string }[]; comments: CommentItem[] };
type CommentItem = { id: string; body: string; created_at: string; profiles: Author | Author[] | null };
const filters: { label: string; value: "all" | PostType }[] = [{ label: "All", value: "all" }, { label: "Projects", value: "project" }, { label: "Gigs", value: "gig" }, { label: "Requests", value: "request" }];
const typeLabels: Record<PostType, string> = { post: "Post", project: "Project", gig: "Gig", request: "Client request" };
const typeStyles: Record<PostType, string> = { post: "border-slate-200", project: "border-emerald-300 bg-emerald-50/30", gig: "border-amber-300 bg-amber-50/30", request: "border-blue-300 bg-blue-50/30" };

export default function RealFeed() {
  const client = createSupabaseBrowserClient();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<"all" | PostType>("all");
  const [profile, setProfile] = useState<Author | null>(null);
  const [sessionUser, setSessionUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [composerOpen, setComposerOpen] = useState(false);
  const [error, setError] = useState("");
  const sentinel = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!client) { setLoading(false); return; }
    const supabase = client;
    let cancelled = false;
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (cancelled) return;
      setSessionUser(auth.user?.id || null);
      if (auth.user) {
        const { data } = await supabase.from("profiles").select("id,name,role,avatar_url,verified").eq("id", auth.user.id).maybeSingle();
        if (cancelled) return;
        if (data) setProfile(data as Author);
      }
      await loadPosts(0, true);
      if (cancelled) return;
      try {
        const channel = supabase.channel(`public-feed-${Date.now()}-${Math.random().toString(36).slice(2)}`);
        channel
          .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => void loadPosts(0, true))
          .on("postgres_changes", { event: "*", schema: "public", table: "likes" }, () => void loadPosts(0, true))
          .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () => void loadPosts(0, true));
        channelRef.current = channel;
        channel.subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") console.error("Feed realtime setup failed", { status });
        });
      } catch (realtimeError) {
        console.error("Feed realtime setup failed", realtimeError);
      }
    }
    void load();
    return () => {
      cancelled = true;
      const channel = channelRef.current;
      channelRef.current = null;
      if (channel) void supabase.removeChannel(channel);
    };
  // The feed subscription intentionally refreshes the first page when a post changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPosts(nextPage: number, replace = false) {
    if (!client) return;
    if (nextPage > 0) setLoadingMore(true); else setLoading(true);
    const from = nextPage * 10;
    const { data, error: queryError } = await client.from("posts").select("id,author_id,post_type,title,body,price,media,created_at,profiles(id,name,role,avatar_url,verified),likes(user_id),comments(id,body,created_at,profiles(id,name,role,avatar_url,verified))").order("created_at", { ascending: false }).range(from, from + 9);
    if (queryError) {
      console.error("Feed query failed", { message: queryError.message, code: queryError.code, details: queryError.details, hint: queryError.hint });
      setError(`We could not load the feed (${queryError.code || "unknown error"}). Check the Supabase SQL setup and try again.`);
    }
    const next = (data || []) as unknown as Post[];
    setPosts((current) => replace ? next : [...current, ...next]);
    setPage(nextPage); setHasMore(next.length === 10); setLoading(false); setLoadingMore(false);
  }

  useEffect(() => {
    if (!sentinel.current || !hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver((entries) => { if (entries[0]?.isIntersecting) void loadPosts(page + 1); }, { rootMargin: "500px" });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, hasMore, loading, loadingMore]);

  const visiblePosts = filter === "all" ? posts : posts.filter((post) => post.post_type === filter);
  function updatePost(next: Post) { setPosts((current) => current.map((post) => post.id === next.id ? next : post)); }
  function removePost(id: string) { setPosts((current) => current.filter((post) => post.id !== id)); }

  return <main className="min-h-screen bg-slate-100 pb-24 text-slate-900 lg:pb-8"><header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6"><a href="/" className="font-display text-2xl font-bold tracking-tight">talash<span className="text-emerald-600">.</span></a><div className="hidden items-center gap-3 text-sm font-semibold text-slate-500 sm:flex"><a href="/network" className="rounded-lg px-3 py-2 hover:bg-slate-100">Network</a><a href="/messages" className="rounded-lg px-3 py-2 hover:bg-slate-100">Messages</a><NotificationBell /><a href="/auth" className="rounded-lg bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-800">{sessionUser ? "Account" : "Sign in"}</a></div><div className="flex items-center gap-2 sm:hidden"><NotificationBell /><a href="/auth" aria-label="Open account" className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">{profile?.name?.slice(0, 1) || "?"}</a></div></div></header><div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_minmax(0,680px)_260px] lg:py-8">
    <aside className="hidden lg:block"><div className="sticky top-24 space-y-4"><ProfileCard profile={profile} sessionUser={sessionUser} /><div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm"><p className="font-bold">Your shortcuts</p><a href="#projects" className="mt-3 block text-slate-500 hover:text-emerald-700">Saved projects</a><a href="#gigs" className="mt-2 block text-slate-500 hover:text-emerald-700">My gigs</a></div></div></aside>
    <section className="min-w-0"><div className="mb-5 flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-700">Community feed</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight">What is happening?</h1></div><button onClick={() => setComposerOpen(true)} className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-800"><Plus className="h-4 w-4" /> <span className="hidden sm:inline">Create post</span></button></div><div className="mb-5 flex gap-2 overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">{filters.map((item) => <button key={item.value} onClick={() => setFilter(item.value)} className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition ${filter === item.value ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}>{item.label}</button>)}</div>{!client && <DemoNotice />} {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}{loading ? <FeedSkeleton /> : visiblePosts.length === 0 ? <EmptyState sessionUser={sessionUser} onCreate={() => setComposerOpen(true)} /> : <div className="space-y-5"><AnimatePresence initial={false}>{visiblePosts.map((post) => <PostCard key={post.id} post={post} userId={sessionUser} isAdmin={profile?.role === "Admin"} onChange={updatePost} onDelete={removePost} />)}</AnimatePresence><div ref={sentinel} className="flex justify-center py-5">{loadingMore && <LoaderCircle className="h-5 w-5 animate-spin text-emerald-700" />}{!hasMore && <p className="text-xs font-semibold text-slate-400">You have reached the beginning.</p>}</div></div>}</section>
    <aside className="hidden xl:block"><div className="sticky top-24 space-y-4"><div className="rounded-2xl bg-slate-900 p-5 text-white shadow-sm"><Sparkles className="h-5 w-5 text-emerald-300" /><h2 className="mt-8 font-display text-xl font-bold">Make your work visible.</h2><p className="mt-2 text-sm leading-6 text-slate-300">Share a project, offer a service, or ask the community for help.</p><button onClick={() => setComposerOpen(true)} className="mt-5 text-sm font-bold text-emerald-300">Start writing <ChevronDown className="ml-1 inline h-4 w-4 -rotate-90" /></button></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-display text-lg font-bold">Community guidelines</h2><p className="mt-2 text-sm leading-6 text-slate-500">Keep posts useful, kind, and clear. Show the work behind the ask.</p></div></div></aside>
  </div><nav className="fixed bottom-0 left-0 right-0 z-30 flex justify-around border-t border-slate-200 bg-white p-3 shadow-[0_-8px_24px_rgba(15,23,42,.08)] lg:hidden"><a href="/feed" className="text-xs font-bold text-emerald-700">Feed</a><a href="/dashboard" className="text-xs font-bold text-slate-500">Workspace</a><button onClick={() => setComposerOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-white"><Plus className="h-5 w-5" /></button><a href="/auth" className="text-xs font-bold text-slate-500">Account</a></nav>{composerOpen && <PostComposer user={profile} onClose={() => setComposerOpen(false)} onCreated={(post) => { setPosts((current) => [post, ...current]); setComposerOpen(false); }} />}</main>;
}

function ProfileCard({ profile, sessionUser }: { profile: Author | null; sessionUser: string | null }) { return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="h-20 bg-emerald-800" /><div className="px-4 pb-5"><div className="-mt-8 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-emerald-100 text-xl font-bold text-emerald-800">{profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : profile?.name?.slice(0, 1) || "?"}</div><h2 className="mt-3 font-display text-lg font-bold">{profile?.name || (sessionUser ? "Your profile" : "Welcome to Talash")}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{profile ? `${profile.role} community member` : "Sign in to share your work and connect."}</p>{!sessionUser && <a href="/auth" className="mt-4 block rounded-lg bg-emerald-700 px-3 py-2 text-center text-xs font-bold text-white">Sign in to interact</a>}</div></div>; }
function DemoNotice() { return <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Supabase is not configured, so the shared feed is waiting for connection. Demo mode keeps the page usable without creating fake posts.</div>; }
function EmptyState({ sessionUser, onCreate }: { sessionUser: string | null; onCreate: () => void }) { return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm"><FileImage className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-4 font-display text-xl font-bold">Nothing here yet</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Be the first person to share a project, offer a service, or ask the community a question.</p>{sessionUser ? <button onClick={onCreate} className="mt-5 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white">Create the first post</button> : <a href="/auth" className="mt-5 inline-block rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white">Sign in to post</a>}</div>; }
function FeedSkeleton() { return <div className="space-y-5">{[1, 2, 3].map((item) => <div key={item} className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex gap-3"><div className="h-10 w-10 rounded-full bg-slate-200" /><div className="space-y-2"><div className="h-3 w-32 rounded bg-slate-200" /><div className="h-2 w-20 rounded bg-slate-100" /></div></div><div className="mt-6 h-4 w-3/4 rounded bg-slate-200" /><div className="mt-3 h-3 w-full rounded bg-slate-100" /><div className="mt-8 h-24 rounded-xl bg-slate-100" /></div>)}</div>; }

function PostCard({ post, userId, isAdmin, onChange, onDelete }: { post: Post; userId: string | null; isAdmin: boolean; onChange: (post: Post) => void; onDelete: (id: string) => void }) {
  const client = createSupabaseBrowserClient();
  const author = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [busy, setBusy] = useState(false);
  const liked = Boolean(userId && post.likes?.some((like) => like.user_id === userId));
  async function toggleLike() { if (!client || !userId) return; setBusy(true); if (liked) await client.from("likes").delete().eq("post_id", post.id).eq("user_id", userId); else await client.from("likes").insert({ post_id: post.id, user_id: userId }); const { data } = await client.from("posts").select("id,author_id,post_type,title,body,price,media,created_at,profiles(id,name,role,avatar_url,verified),likes(user_id),comments(id,body,created_at,profiles(id,name,role,avatar_url,verified))").eq("id", post.id).single(); if (data) onChange(data as unknown as Post); setBusy(false); }
  async function addComment(event: FormEvent) { event.preventDefault(); if (!client || !userId || !comment.trim()) return; await client.from("comments").insert({ post_id: post.id, author_id: userId, body: comment.trim() }); setComment(""); const { data } = await client.from("posts").select("id,author_id,post_type,title,body,price,media,created_at,profiles(id,name,role,avatar_url,verified),likes(user_id),comments(id,body,created_at,profiles(id,name,role,avatar_url,verified))").eq("id", post.id).single(); if (data) onChange(data as unknown as Post); setShowComments(true); }
  async function deletePost() { if (!client || !userId || !window.confirm("Delete this post?")) return; const { error } = await client.from("posts").delete().eq("id", post.id); if (!error) onDelete(post.id); }
  return <motion.article layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${typeStyles[post.post_type]}`}><div className="p-5"><div className="flex items-start gap-3"><Avatar author={author} /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="truncate text-sm font-bold">{author?.name || "Talash member"}</h2>{author?.verified && <span title="Blue tick"><Check className="h-4 w-4 rounded-full bg-blue-600 p-0.5 text-white" /></span>}<span className="rounded bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase text-slate-500">{author?.role || "Member"}</span></div><p className="mt-1 text-xs text-slate-400">{timeAgo(post.created_at)}</p></div>{userId && (userId === post.author_id || isAdmin) && <button aria-label="Delete post" onClick={() => void deletePost()} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>}<MoreHorizontal className="h-5 w-5 text-slate-300" /></div>{post.title && <h3 className="mt-5 font-display text-2xl font-bold">{post.title}</h3>}<p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{post.body}</p>{post.post_type !== "post" && <div className="mt-4 flex items-center justify-between rounded-xl bg-white/80 p-3 text-sm"><span className="font-bold text-slate-600">{typeLabels[post.post_type]}</span>{post.price !== null && <strong className="text-lg text-emerald-800">${post.price}</strong>}</div>}</div>{post.media?.length > 0 && <div className={`grid gap-1 ${post.media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>{post.media.map((media) => media.type === "video" ? <video key={media.url} src={media.url} controls className="max-h-96 w-full bg-slate-900 object-contain" /> : <img key={media.url} src={media.url} alt={media.name || "Post media"} className="max-h-96 w-full object-cover" />)}</div>}<div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs font-semibold text-slate-400"><span>{post.likes?.length || 0} likes · {post.comments?.length || 0} comments</span></div><div className="flex border-t border-slate-100 px-3 py-2"><button onClick={() => userId ? void toggleLike() : undefined} className={`flex-1 rounded-lg py-2 text-sm font-bold transition hover:bg-slate-100 ${liked ? "text-rose-600" : "text-slate-500"}`}>{busy ? <LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" /> : <Heart className={`mr-2 inline h-4 w-4 ${liked ? "fill-current" : ""}`} />}Like</button><button onClick={() => setShowComments(!showComments)} className="flex-1 rounded-lg py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100"><MessageCircle className="mr-2 inline h-4 w-4" />Comment</button></div>{showComments && <div className="border-t border-slate-100 p-5">{post.comments?.map((item) => <div key={item.id} className="mb-3 rounded-xl bg-slate-50 p-3 text-sm"><strong>{(Array.isArray(item.profiles) ? item.profiles[0] : item.profiles)?.name || "Member"}</strong><p className="mt-1 text-slate-600">{item.body}</p></div>)}{userId ? <form onSubmit={addComment} className="flex gap-2"><input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Write a comment..." className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600" /><button className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-700 text-white"><Send className="h-4 w-4" /></button></form> : <a href="/auth" className="block rounded-lg bg-slate-100 p-3 text-center text-sm font-bold text-emerald-800">Sign in to interact</a>}</div>}</motion.article>;
}
function Avatar({ author }: { author: Author | null | undefined }) { return <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-100 text-sm font-bold text-emerald-800">{author?.avatar_url ? <img src={author.avatar_url} alt="" className="h-full w-full object-cover" /> : author?.name?.slice(0, 1) || "?"}</div>; }
function timeAgo(value: string) { const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000)); if (seconds < 60) return "just now"; if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`; if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`; return `${Math.floor(seconds / 86400)}d ago`; }

function PostComposer({ user, onClose, onCreated }: { user: Author | null; onClose: () => void; onCreated: (post: Post) => void }) {
  const client = createSupabaseBrowserClient();
  const [postType, setPostType] = useState<PostType>("post"); const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [price, setPrice] = useState(""); const [files, setFiles] = useState<File[]>([]); const [progress, setProgress] = useState(0); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  function chooseFiles(event: ChangeEvent<HTMLInputElement>) { const selected = Array.from(event.target.files || []); if (selected.some((file) => file.size > 50 * 1024 * 1024)) { setError("Each photo or video must be 50 MB or smaller."); return; } setFiles(selected); }
  async function submit(event: FormEvent) { event.preventDefault(); setError(""); if (!client) { setError("Supabase is not configured. Connect it to publish shared posts."); return; } if (!body.trim() || (postType !== "post" && !title.trim())) { setError("Add the content and a title for this post type."); return; } setSaving(true); setProgress(5); const { data: auth } = await client.auth.getUser(); if (!auth.user) { setError("Sign in to publish a post."); setSaving(false); return; } const media: MediaItem[] = []; for (const [index, file] of files.entries()) { const path = `${auth.user.id}/${Date.now()}-${index}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`; const upload = await client.storage.from("post-media").upload(path, file, { upsert: false, contentType: file.type }); if (upload.error) { setError(upload.error.message); setSaving(false); return; } const url = client.storage.from("post-media").getPublicUrl(path).data.publicUrl; media.push({ url, name: file.name, type: file.type.startsWith("video/") ? "video" : "image" }); setProgress(Math.round((index + 1) / files.length * 75)); } const inserted = await client.from("posts").insert({ author_id: auth.user.id, post_type: postType, title: title.trim() || null, body: body.trim(), price: price ? Number(price) : null, media }).select("id,author_id,post_type,title,body,price,media,created_at,profiles(id,name,role,avatar_url,verified),likes(user_id),comments(id,body,created_at,profiles(id,name,role,avatar_url,verified))").single(); if (inserted.error) setError(inserted.error.message); else { setProgress(100); onCreated(inserted.data as unknown as Post); } setSaving(false); }
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 sm:items-center sm:p-4"><motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} className="max-h-[92vh] w-full max-w-xl overflow-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-700">Create</p><h2 className="font-display text-2xl font-bold">Share with the community</h2></div><button type="button" onClick={onClose} aria-label="Close"><X className="h-5 w-5 text-slate-400" /></button></div><div className="mt-5 flex gap-2 overflow-auto">{(["post", "project", "gig", "request"] as PostType[]).map((type) => <button type="button" key={type} onClick={() => setPostType(type)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${postType === type ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-500"}`}>{typeLabels[type]}</button>)}</div>{postType !== "post" && <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={`${typeLabels[postType]} title`} className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600" />}{postType === "gig" && <input type="number" min="0" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Starting price (USD)" className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600" />}<textarea required value={body} onChange={(event) => setBody(event.target.value)} placeholder={postType === "request" ? "What help do you need?" : "What are you building, learning, or offering?"} className="mt-4 min-h-36 w-full resize-none rounded-xl border border-slate-200 p-4 text-sm leading-6 outline-none focus:border-emerald-600" /><label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50 p-4 text-sm font-bold text-emerald-800"><Upload className="h-4 w-4" /> Add photos or videos<input type="file" multiple accept="image/*,video/*" onChange={chooseFiles} className="hidden" /></label>{files.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{files.map((file) => <span key={file.name} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{file.type.startsWith("video/") ? <Video className="mr-1 inline h-3 w-3" /> : <ImagePlus className="mr-1 inline h-3 w-3" />}{file.name}</span>)}</div>}{saving && <div className="mt-4"><div className="mb-1 flex justify-between text-xs font-bold text-slate-500"><span>Uploading</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><motion.div animate={{ width: `${progress}%` }} className="h-full bg-emerald-600" /></div></div>}{error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}<button disabled={saving} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Publish</button></motion.form></div>;
}
