import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ConversationList } from "@/components/messages/ConversationList"

export default async function MessagesPage() {
  const { userId: clerkId } = await auth()

  const dbUser = clerkId
    ? await db.user.findUnique({ where: { clerkId } })
    : null

  const conversations = dbUser
    ? await db.conversation.findMany({
        where: { participants: { some: { userId: dbUser.id } } },
        include: {
          participants: { include: { user: true } },
          messages: { orderBy: { sentAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      })
    : []

  return (
    <>
      {/* Sidebar */}
      <aside className="messages-sidebar">
        <div style={{
          padding: "20px 16px 12px",
          borderBottom: "1px solid var(--rule)",
          position: "sticky", top: 0,
          background: "var(--paper)", zIndex: 1,
        }}>
          <h2 style={{
            fontFamily: "var(--font-serif)",
            fontSize: 20, fontWeight: 400, color: "var(--ink)",
          }}>
            Messages
          </h2>
        </div>
        <ConversationList
          initialConversations={conversations}
          currentUserId={dbUser?.id ?? ""}
          activeId={null}
        />
      </aside>

      {/* Empty right panel — hidden on mobile via CSS */}
      <main className="messages-main" style={{
        alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 8, color: "var(--ink-3)",
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <p style={{ fontSize: 14 }}>Select a conversation</p>
      </main>
    </>
  )
}