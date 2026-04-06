import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Header } from "@/components/Header"
import { ProfileEditForm } from "@/components/profile/ProfileEditForm"

export default async function ProfileEditPage() {
  const { userId: clerkId } = await auth.protect()

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) redirect("/feed")

  return (
    <>
      <Header />
      <div className="page-scroll">
        <main style={{ maxWidth: 560, margin: "0 auto", padding: "40px 20px 80px" }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{
              fontFamily: "var(--font-serif)", fontSize: 28,
              fontWeight: 400, color: "var(--ink)", margin: "0 0 4px",
            }}>
              Edit profile
            </h1>
            <p style={{ fontSize: 14, color: "var(--ink-3)", margin: 0 }}>
              Update your display name, bio, and profile picture.
            </p>
          </div>
          <ProfileEditForm user={{
            id:          user.id,
            username:    user.username,
            displayName: user.displayName,
            bio:         user.bio ?? "",
            avatarUrl:   user.avatarUrl ?? null,
          }} />
        </main>
      </div>
    </>
  )
}