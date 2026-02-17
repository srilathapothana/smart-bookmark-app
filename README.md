# Markd — Smart Bookmark App

A minimal, private bookmark manager built with Next.js 14 (App Router), Supabase (Auth + Database + Realtime), and Tailwind CSS.

**Live URL:** smart-bookmark-app-lime-tau.vercel.app

---

## Features

- **Google OAuth only** — Sign in with Google, no passwords
- **Private bookmarks** — Enforced with Supabase Row Level Security; users can only see their own links
- **Real-time sync** — Supabase Realtime keeps the list updated across all open tabs instantly
- **Optimistic UI** — Adds and deletes appear immediately before server confirmation
- **Favicon auto-fetch** — Google's favicon service shows site icons automatically
- **Deployed on Vercel** — CI/CD on every push to `main`

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase Postgres |
| Realtime | Supabase Realtime (postgres_changes) |
| Styling | Tailwind CSS |
| Deployment | Vercel |

---

## Local Development Setup

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/smart-bookmark-app
cd smart-bookmark-app
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase-schema.sql`
3. Go to **Authentication → Providers → Google** and enable Google OAuth:
   - You'll need a Google Cloud project with OAuth 2.0 credentials
   - Set the authorized redirect URI to: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. Copy your project URL and anon key from **Project Settings → API**

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment to Vercel

1. Push to a public GitHub repo
2. Import the repo in Vercel
3. Add the same environment variables in Vercel project settings
4. In Supabase Auth settings, add your Vercel URL to the allowed redirect URLs:
   - `https://your-app.vercel.app/**`
5. In Google Cloud Console, add `https://your-app.vercel.app` as an authorized origin and `https://YOUR_PROJECT.supabase.co/auth/v1/callback` as an authorized redirect URI

---

## Database Schema

```sql
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

Row Level Security ensures that `SELECT`, `INSERT`, and `DELETE` are scoped to the authenticated user's `user_id` only.

---

## Problems I Ran Into & How I Solved Them

### 1. Realtime subscription receiving duplicate events on optimistic update

**Problem:** When a user adds a bookmark, I do an optimistic insert client-side first. The Supabase Realtime `INSERT` event would then also fire, adding the same bookmark a second time.

**Solution:** In the Realtime `INSERT` handler, I check if a bookmark with that `id` already exists in state before adding it:
```ts
setBookmarks((prev) => {
  if (prev.find((b) => b.id === newBookmark.id)) return prev;
  return [newBookmark, ...prev];
});
```
The optimistic bookmark uses a `temp-{timestamp}` id, while the real one has a UUID, so once the server responds I replace the temp entry with the confirmed data.

### 2. Supabase Realtime filter for user-specific events

**Problem:** Initially, Realtime was broadcasting bookmark events for all users to all clients. Users would briefly see other users' bookmarks appear.

**Solution:** Supabase Realtime `postgres_changes` supports server-side row filters. Using `filter: \`user_id=eq.${user.id}\`` ensures the subscription only receives events for the current user's rows — no client-side filtering needed.

> **Note:** This requires RLS to be enabled on the table, which was already set up. Supabase will only push changes that pass the user's RLS policies.

### 3. Cookie handling in Next.js 14 middleware with Supabase SSR

**Problem:** The new `@supabase/ssr` package's `createServerClient` in middleware needs to both read and write cookies. In Next.js 14, `cookies()` is async and read-only in Server Components.

**Solution:** Used the `getAll/setAll` cookie API pattern from Supabase's SSR docs, which mutates the response object rather than the read-only cookie store. The middleware creates a new `NextResponse` each time cookies change to properly propagate the refreshed session token.

### 4. Google OAuth redirect URI mismatch on Vercel preview URLs

**Problem:** Vercel generates unique URLs for preview deployments (e.g., `project-git-branch-name.vercel.app`). Google OAuth rejects these since only the production URL is whitelisted.

**Solution:** For the submission, only the production Vercel URL (not preview URLs) is used for testing. Added `https://your-app.vercel.app/**` (wildcard path) to Supabase's redirect allowlist. For broader preview support in a real project, you'd add each preview URL or use a proxy.

### 5. `next/image` vs favicon `<img>` tags

**Problem:** Next.js ESLint rules flag `<img>` tags and suggest using `<Image>` from `next/image`. However, external favicon URLs (from Google's favicon service) are unpredictable in size and can't be easily optimized.

**Solution:** Used standard `<img>` tags with `// eslint-disable-next-line @next/next/no-img-element` for avatar and favicon images, and added `onError` handlers to gracefully hide broken images. This is acceptable for small decorative images.

---

## Project Structure

```
src/
├── app/
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts        # OAuth callback handler
│   ├── bookmarks/
│   │   └── page.tsx            # Protected bookmarks page (server)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                # Landing / login page
├── components/
│   ├── AddBookmarkForm.tsx     # Modal form for adding bookmarks
│   ├── BookmarkCard.tsx        # Individual bookmark row
│   ├── BookmarksClient.tsx     # Client component with realtime logic
│   └── LoginButton.tsx         # Google OAuth sign-in button
├── lib/
│   └── supabase/
│       ├── client.ts           # Browser client
│       └── server.ts           # Server client
├── middleware.ts               # Auth session refresh + route protection
└── types/
    └── index.ts                # Bookmark TypeScript types
```
