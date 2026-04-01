import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ConversationList } from "@/components/messages/ConversationList"
import { ChatWindow } from "@/components/messages/ChatWindow"

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const dbUser = await db.user.findUnique({ where: { clerkId } })
  if (!dbUser) redirect("/sign-in")

  const conversation = await db.conversation.findUnique({
    where: { id },
    include: {
      participants: { include: { user: true } },
      messages: {
        orderBy: { sentAt: "asc" },
        include: { sender: true },
        take: 60,
      },
    },
  })

  if (!conversation) notFound()

  const isParticipant = conversation.participants.some((p) => p.userId === dbUser.id)
  if (!isParticipant) notFound()

  const allConversations = await db.conversation.findMany({
    where: { participants: { some: { userId: dbUser.id } } },
    include: {
      participants: { include: { user: true } },
      messages: { orderBy: { sentAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  })

  const otherParticipant = conversation.participants
    .find((p) => p.userId !== dbUser.id)?.user ?? null

  return (
    <>
      {/* Sidebar — hidden on mobile */}
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
          initialConversations={allConversations}
          currentUserId={dbUser.id}
          activeId={id}
        />
      </aside>

      {/* Chat — full screen on mobile */}
      <main className="messages-main">
        <ChatWindow
          conversationId={id}
          initialMessages={conversation.messages}
          currentUser={dbUser}
          otherUser={otherParticipant}
        />
      </main>
    </>
  )
}