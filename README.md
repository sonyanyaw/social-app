# Social App

A social app with a real-time feed, messaging, and notifications. Built with Next.js 16, Clerk, Prisma, Supabase, and WebSockets.

---

## Features

- **Feed** — post text and media (up to 4 files), like and comment on posts
- **Real-time messaging** — WebSocket chat with typing indicators, read receipts, and optimistic UI
- **Notifications** — pop-up toasts and a notification bell for new messages
- **User search** — find people by name or username, start a conversation in one click
- **Auth** — sign up / sign in via Clerk (email, Google, GitHub)
- **File uploads** — direct-to-Supabase Storage via presigned URLs
- **Mobile adaptive** — responsive layout, keyboard-aware chat input, mobile nav menu

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Auth | Clerk v5 |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 7 |
| Realtime | Custom WebSocket server (ws) + Redis pub/sub |
| Cache / pub-sub | Upstash Redis (ioredis) |
| File storage | Supabase Storage |
| Email | Resend |
| Styling | CSS-in-JS (inline styles + global CSS) |
| Fonts | DM Sans + DM Serif Display |
| Deployment | Vercel (frontend) + custom Node server |

---

## Project structure

```
├── server.ts                          # Custom Node.js server (WS + Next.js)
├── prisma.config.ts                   # Prisma 7 config (connection URLs)
├── prisma/
│   └── schema.prisma                  # Database schema
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout (ClerkProvider + ToastProvider)
│   │   ├── page.tsx                   # Landing page
│   │   ├── feed/
│   │   │   └── page.tsx               # Social feed
│   │   ├── messages/
│   │   │   ├── layout.tsx             # Messages shell layout
│   │   │   ├── page.tsx               # Conversation list
│   │   │   └── [id]/page.tsx          # Individual conversation
│   │   └── api/
│   │       ├── posts/                 # CRUD, likes, comments
│   │       ├── messages/              # Conversations API
│   │       ├── users/search/          # User search
│   │       ├── notifications/         # Notification history + mark read
│   │       ├── media/presign/         # Supabase Storage presigned URLs
│   │       ├── ws/                    # WebSocket upgrade handler
│   │       └── webhooks/clerk/        # Clerk to Postgres user sync
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── UserSearch.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── ToastProvider.tsx
│   │   ├── post/
│   │   │   ├── PostCard.tsx
│   │   │   └── PostComposer.tsx
│   │   ├── ui/
│   │   │   └── MediaUpload.tsx
│   │   └── messages/
│   │       ├── MessagesShell.tsx
│   │       ├── ConversationList.tsx
│   │       ├── ChatWindow.tsx
│   │       └── MessageBubble.tsx
│   ├── hooks/
│   │   ├── useWebSocket.ts
│   │   └── useUpload.ts
│   └── lib/
│       ├── db.ts                      # Prisma client singleton
│       ├── redis.ts                   # ioredis client singleton
│       ├── storage.ts                 # Supabase Storage client
│       └── ws-server.ts               # WebSocket server + JWT auth
```

---

## Getting started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Clerk](https://clerk.com) application
- An [Upstash](https://upstash.com) Redis database

### 1. Clone and install

```bash
git clone https://github.com/sonyanyaw/social-app.git
cd pulse
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

```env
# Supabase Postgres
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
CLERK_WEBHOOK_SECRET="whsec_..."
CLERK_JWKS_URL="https://your-app.clerk.accounts.dev/.well-known/jwks.json"

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/feed
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/feed

# Upstash Redis
REDIS_URL="rediss://default:...@eu1-....upstash.io:6379"

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

### 3. Database setup

```bash
# Run migrations (creates all tables)
npm run db:migrate

# Generate Prisma client
npm run db:generate
```

### 4. Supabase Storage

In your Supabase dashboard go to **Storage → New bucket**, create a bucket named `media` and set it to **public**.

### 5. Clerk webhook

In the Clerk dashboard go to **Webhooks → Add endpoint**:

- URL: `https://your-domain.com/api/webhooks/clerk`
- Events: `user.created`, `user.updated`, `user.deleted`

For local development, use [ngrok](https://ngrok.com):

```bash
npx ngrok http 3000
# Use the ngrok URL as your webhook endpoint
```

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

```bash
npm run dev          # Start development server (custom Node + Next.js)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:migrate   # Run Prisma migrations
npm run db:generate  # Regenerate Prisma client
npm run db:studio    # Open Prisma Studio (DB browser)
npm run db:seed      # Seed development data
```

---

## Database schema

```
Users ──< Posts ──< Likes
      ──< Follows
      ──< Comments
      ──< MediaFiles
      ──< ConversationParticipants >── Conversations ──< Messages
```

Key design decisions:

- `likeCount` and `commentCount` are denormalized on `Post` to avoid expensive `COUNT(*)` queries on the feed
- `MediaFile` stores a `storageKey` (S3-compatible path) rather than a full URL, so CDN domains can change without a migration
- `Follow` uses a composite primary key `(followerId, followingId)` — no separate ID column needed
- `Message.isRead` is updated via WebSocket `read` events, not HTTP requests, to avoid round-trips

---

## Realtime architecture

```
Client A  ──WS──►  Node server  ──PUBLISH──►  Redis (chat:<convId>)
                                                    │
                                              SUBSCRIBE
                                                    │
Client B  ◄──WS──  Node server  ◄─────────────────┘

Notifications:
Node server  ──PUBLISH──►  Redis (notif:<userId>)
                                 │
                           SUBSCRIBE
                                 │
Client B  ◄──WS──  Node server  ◄┘  (ToastProvider __notifications__ channel)
```

- The custom `server.ts` handles WebSocket upgrades before Next.js sees the request
- JWT verification uses Clerk's JWKS endpoint via `jose` (RS256, not a shared secret)
- `subscriber` and `publisher` are separate Redis connections — required for pub/sub
- The `__notifications__` channel is a read-only per-user channel for cross-conversation push events
- Each user can have at most one `__notifications__` socket (deduplicated by `userId:__notifications__` key)

---

## Local development with ngrok

Since Clerk webhooks can't reach `localhost`, use ngrok:

```bash
npx ngrok http 3000 --request-header-add "ngrok-skip-browser-warning: true"
```

Add the ngrok URL to:

1. Clerk dashboard → **Webhooks** (webhook endpoint)
2. Clerk dashboard → **Domains** (allowed origins for auth)

> Free ngrok URLs change on every restart. For a stable free alternative use [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) — permanent URL, no account required.

---

## Known limitations / roadmap

- [ ] Profile page (`/profile/[username]`) — view posts, follow/unfollow
- [ ] Feed filtering — show posts only from people you follow
- [ ] Post visibility enforcement (`FOLLOWERS` / `PRIVATE` modes)
- [ ] Infinite scroll / pagination on the feed
- [ ] Post deletion
- [ ] Profile editing (bio, avatar upload)
- [ ] Dark mode
- [ ] Error boundaries per section