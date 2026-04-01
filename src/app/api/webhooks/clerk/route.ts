import { Webhook } from "svix"
import { headers } from "next/headers"
import { WebhookEvent } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    return new NextResponse("Missing CLERK_WEBHOOK_SECRET", { status: 500 })
  }

  const headerPayload = await headers()
  const svix_id        = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Missing svix headers", { status: 400 })
  }

  const payload = await req.json()
  const body    = JSON.stringify(payload)

  let event: WebhookEvent
  try {
    const wh = new Webhook(WEBHOOK_SECRET)
    event = wh.verify(body, {
      "svix-id":        svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch {
    return new NextResponse("Invalid webhook signature", { status: 400 })
  }

  switch (event.type) {

    case "user.created": {
      const { id, email_addresses, username, first_name, last_name, image_url } = event.data

      const email       = email_addresses[0]?.email_address
      const displayName = [first_name, last_name].filter(Boolean).join(" ") || username || "User"
      const slug        = username ?? `user_${id.slice(-8)}`

      await db.user.create({
        data: {
          clerkId:     id,
          email:       email ?? `${id}@unknown.local`,
          username:    slug,
          displayName,
          avatarUrl:   image_url ?? null,
        },
      })
      break
    }

    case "user.updated": {
      const { id, email_addresses, username, first_name, last_name, image_url } = event.data

      const email       = email_addresses[0]?.email_address
      const displayName = [first_name, last_name].filter(Boolean).join(" ") || username || "User"
      const slug        = username ?? `user_${id.slice(-8)}`

      await db.user.upsert({
        where:  { clerkId: id },
        update: { email: email ?? undefined, username: slug, displayName, avatarUrl: image_url ?? null },
        create: {
          clerkId:     id,
          email:       email ?? `${id}@unknown.local`,
          username:    slug,
          displayName,
          avatarUrl:   image_url ?? null,
        },
      })
      break
    }

    case "user.deleted": {
      const { id } = event.data
      if (id) {
        await db.user.delete({ where: { clerkId: id } }).catch(() => {
          // user may not exist - ignore
        })
      }
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}