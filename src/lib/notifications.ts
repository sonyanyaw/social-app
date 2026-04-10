import { db } from "@/lib/db"
import { redis } from "@/lib/redis"
import type { NotificationType } from "@prisma/client"

type CreateNotifInput = {
  userId:     string   // recipient DB id
  actorId:    string   // who did the action DB id
  type:       NotificationType
  postId?:    string
  commentId?: string
}

export async function createNotification(input: CreateNotifInput) {
  // Don't notify yourself
  if (input.userId === input.actorId) return null

  // Only LIKE and FOLLOW are idempotent actions — deduplicate them.
  // COMMENT and MESSAGE are distinct actions every time — never deduplicate.
  if (input.type === "LIKE" || input.type === "FOLLOW") {
    const existing = await db.notification.findFirst({
      where: {
        userId:  input.userId,
        actorId: input.actorId,
        type:    input.type,
        postId:  input.postId ?? null,
        isRead:  false,
      },
    })
    // Already notified and unread — skip entirely (no DB write, no WS push)
    if (existing) return null
  }

  const notif = await db.notification.create({
    data: input,
    include: {
      actor: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
      post:  { select: { id: true, content: true } },
    },
  })

  // Push to recipient via Redis → WS
  await redis.publish(`notif:${input.userId}`, JSON.stringify({
    type: "notification",
    notification: {
      id:            notif.id,
      type:          notif.type,
      actorName:     notif.actor.displayName,
      actorAvatar:   notif.actor.avatarUrl,
      actorUsername: notif.actor.username,
      postPreview:   notif.post?.content?.slice(0, 60) ?? null,
      postId:        input.postId ?? null,
      createdAt:     notif.createdAt.toISOString(),
      isRead:        false,
    },
  }))

  return notif
}

export async function deleteNotification(input: Omit<CreateNotifInput, "commentId">) {
  await db.notification.deleteMany({
    where: {
      userId:  input.userId,
      actorId: input.actorId,
      type:    input.type,
      postId:  input.postId ?? null,
    },
  })
}