import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { z } from "zod"

const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio:         z.string().max(200).optional(),
  avatarUrl:   z.string().url().optional().nullable(),
})

export async function PATCH(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 })

  const body   = await req.json()
  const parsed = UpdateProfileSchema.safeParse(body)
  if (!parsed.success) return new NextResponse(parsed.error.message, { status: 400 })

  const dbUser = await db.user.findUnique({ where: { clerkId } })
  if (!dbUser) return new NextResponse("User not found", { status: 404 })

  const updated = await db.user.update({
    where: { id: dbUser.id },
    data: {
      ...(parsed.data.displayName !== undefined && { displayName: parsed.data.displayName }),
      ...(parsed.data.bio         !== undefined && { bio:         parsed.data.bio         }),
      ...(parsed.data.avatarUrl   !== undefined && { avatarUrl:   parsed.data.avatarUrl   }),
    },
  })

  return NextResponse.json(updated)
}