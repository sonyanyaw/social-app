import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function HomePage() {
  const { userId } = await auth()
  if (userId) redirect("/feed")

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --ink: #1a1714;
          --ink-2: #4a4743;
          --ink-3: #9a9794;
          --rule: #e8e4df;
          --paper: #faf8f5;
          --paper-2: #ffffff;
          --accent: #c84b2f;
          --accent-soft: #f5ede9;
          --font-sans: 'DM Sans', sans-serif;
          --font-serif: 'DM Serif Display', serif;
        }

        body {
          font-family: var(--font-sans);
          background: var(--paper);
          color: var(--ink);
          -webkit-font-smoothing: antialiased;
          min-height: 100dvh;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }

        .fade-1 { animation: fadeUp 0.6s ease both 0.1s; }
        .fade-2 { animation: fadeUp 0.6s ease both 0.25s; }
        .fade-3 { animation: fadeUp 0.6s ease both 0.4s; }
        .fade-4 { animation: fadeUp 0.6s ease both 0.55s; }

        .hero-card { animation: float 6s ease-in-out infinite; }
        .hero-card-2 { animation: float 6s ease-in-out infinite 2s; }
        .hero-card-3 { animation: float 6s ease-in-out infinite 4s; }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 28px; border-radius: 999px;
          background: var(--ink); color: var(--paper);
          font-family: var(--font-sans); font-size: 15px; font-weight: 500;
          text-decoration: none; border: none; cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(26,23,20,0.2);
        }

        .btn-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 28px; border-radius: 999px;
          background: transparent; color: var(--ink);
          font-family: var(--font-sans); font-size: 15px; font-weight: 400;
          text-decoration: none;
          border: 1px solid var(--rule);
          transition: border-color 0.15s, background 0.15s;
        }
        .btn-secondary:hover { border-color: #c0bbb5; background: var(--paper-2); }

        .feature-card {
          background: var(--paper-2);
          border: 1px solid var(--rule);
          border-radius: 16px;
          padding: 24px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .feature-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
        }

        .mock-bubble-me {
          align-self: flex-end;
          background: var(--ink);
          color: var(--paper);
          padding: 9px 14px;
          border-radius: 18px 18px 4px 18px;
          font-size: 13px; max-width: 75%;
        }
        .mock-bubble-them {
          align-self: flex-start;
          background: var(--paper-2);
          color: var(--ink);
          border: 1px solid var(--rule);
          padding: 9px 14px;
          border-radius: 18px 18px 18px 4px;
          font-size: 13px; max-width: 75%;
        }
        .mock-post {
          background: var(--paper-2);
          border: 1px solid var(--rule);
          border-radius: 12px;
          padding: 14px;
          font-size: 13px;
          color: var(--ink);
        }
      `}</style>

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(250,248,245,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--rule)",
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          padding: "0 24px", height: 56,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: 22, letterSpacing: "-0.02em" }}>
            Pulse
          </span>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link href="/sign-in" className="btn-secondary" style={{ padding: "8px 20px", fontSize: 13 }}>
              Sign in
            </Link>
            <Link href="/sign-up" className="btn-primary" style={{ padding: "8px 20px", fontSize: 13 }}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        maxWidth: 1100, margin: "0 auto",
        padding: "80px 24px 60px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 60,
        alignItems: "center",
      }} className="hero-grid">
        {/* Left */}
        <div>
          <div className="fade-1" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "var(--accent-soft)", color: "var(--accent)",
            fontSize: 12, fontWeight: 500, padding: "5px 12px",
            borderRadius: 999, marginBottom: 24,
            border: "1px solid rgba(200,75,47,0.15)",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />
            Now in early access
          </div>

          <h1 className="fade-2" style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(40px, 6vw, 68px)",
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
            marginBottom: 24,
          }}>
            Share moments,<br />
            <em style={{ fontStyle: "italic", color: "var(--accent)" }}>connect</em> with<br />
            people.
          </h1>

          <p className="fade-3" style={{
            fontSize: 17, lineHeight: 1.7,
            color: "var(--ink-2)", marginBottom: 36,
            maxWidth: 440,
          }}>
            A thoughtful social space for sharing what matters. Real-time messaging,
            a beautiful feed, and the people you care about — all in one place.
          </p>

          <div className="fade-4" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/sign-up" className="btn-primary">
              Start for free
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
            <Link href="/sign-in" className="btn-secondary">
              Sign in
            </Link>
          </div>

        </div>

        {/* Right — floating UI mockups */}
        <div style={{ position: "relative", height: 480 }} className="hero-visual">

          {/* Feed post */}
          <div className="hero-card mock-post" style={{
            position: "absolute", top: 0, left: 0, right: 60, padding: 16,
          }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent-soft)", border: "1px solid var(--rule)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, color: "var(--accent)", flexShrink: 0 }}>AK</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>Anna K.</p>
                <p style={{ fontSize: 11, color: "var(--ink-3)", margin: 0 }}>@anna · 2m ago</p>
              </div>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>Just discovered the most beautiful café in the old town. The kind of place that makes you slow down ☕</p>
            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ fontSize: 12, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                24
              </span>
              <span style={{ fontSize: 12, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                6
              </span>
            </div>
          </div>

          {/* Chat bubble */}
          <div className="hero-card-2" style={{
            position: "absolute", top: 140, right: 0, left: 40,
            background: "var(--paper-2)", border: "1px solid var(--rule)",
            borderRadius: 16, padding: 14,
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            <div className="mock-bubble-them">Hey! Are you coming tonight?</div>
            <div className="mock-bubble-me">Yes! Just finishing up 🙌</div>
            <div className="mock-bubble-them" style={{ opacity: 0.6 }}>
              <span style={{ display: "flex", gap: 3 }}>
                {[0,1,2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--ink-3)", display: "inline-block" }} />)}
              </span>
            </div>
          </div>

          {/* Notification pill */}
          <div className="hero-card-3" style={{
            position: "absolute", bottom: 60, left: 20,
            background: "var(--paper-2)", border: "1px solid var(--rule)",
            borderRadius: 999, padding: "8px 14px",
            display: "flex", alignItems: "center", gap: 8,
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "var(--ink-2)" }}>Marco liked your post</span>
          </div>

          {/* Stat pill */}
          <div style={{
            position: "absolute", bottom: 20, right: 20,
            background: "var(--ink)", borderRadius: 999, padding: "8px 16px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 12, color: "var(--paper)", fontWeight: 500 }}>247 followers</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{
        maxWidth: 1100, margin: "0 auto",
        padding: "60px 24px 80px",
      }}>
        <div style={{
          textAlign: "center", marginBottom: 48,
        }}>
          <h2 style={{
            fontFamily: "var(--font-serif)", fontSize: "clamp(28px, 4vw, 40px)",
            letterSpacing: "-0.02em", marginBottom: 12,
          }}>
            Everything you need
          </h2>
          <p style={{ fontSize: 16, color: "var(--ink-3)", maxWidth: 400, margin: "0 auto" }}>
            Built for real conversations, not engagement metrics.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
        }}>
          {[
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              ),
              title: "Real-time messaging",
              desc: "Instant delivery with typing indicators, read receipts, and media sharing.",
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              ),
              title: "Follow people",
              desc: "Build your network. Follow interesting people and see their posts in your feed.",
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              ),
              title: "Share media",
              desc: "Post photos and videos. Upload up to 4 files per post with instant preview.",
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              ),
              title: "Notifications",
              desc: "Stay in the loop. Get notified instantly when someone messages or likes your post.",
            },
          ].map((f, i) => (
            <div key={i} className="feature-card">
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: "var(--accent-soft)", border: "1px solid rgba(200,75,47,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 14,
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 6, color: "var(--ink)" }}>
                {f.title}
              </h3>
              <p style={{ fontSize: 13, color: "var(--ink-3)", lineHeight: 1.6 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        maxWidth: 1100, margin: "0 auto",
        padding: "0 24px 100px",
      }}>
        <div style={{
          background: "var(--ink)", borderRadius: 20,
          padding: "clamp(40px, 6vw, 64px)",
          display: "flex", flexDirection: "column",
          alignItems: "center", textAlign: "center", gap: 24,
        }}>
          <h2 style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(28px, 4vw, 44px)",
            color: "var(--paper)",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}>
            Ready to join Pulse?
          </h2>
          <p style={{ fontSize: 16, color: "rgba(250,248,245,0.6)", maxWidth: 380 }}>
            Sign up in seconds. Just you and the people you care about.
          </p>
          <Link href="/sign-up" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "14px 32px", borderRadius: 999,
            background: "var(--paper)", color: "var(--ink)",
            fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 500,
            textDecoration: "none",
            transition: "transform 0.15s",
          }}>
            Create your account
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>
        </div>
      </section>

      {/* Mobile styles */}
      <style>{`
        @media (max-width: 680px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            padding: 48px 20px 40px !important;
            gap: 40px !important;
          }
          .hero-visual { height: 320px !important; }
        }
      `}</style>
    </>
  )
}