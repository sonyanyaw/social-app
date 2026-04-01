import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Header } from "@/components/Header"
import { MessagesShell } from "@/components/messages/MessagesShell"

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  return (
    <>
      <Header />
      <MessagesShell>
        {children}
      </MessagesShell>
    </>
  )
}