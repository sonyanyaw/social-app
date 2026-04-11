import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"

export default async function ProfileRedirect() {
  const { userId: clerkId } = await auth.protect()

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { username: true },
  })

  if (!user) redirect("/feed")
  redirect(`/profile/${user.username}`)
}