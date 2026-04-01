import { auth } from "@clerk/nextjs/server"
import { supabase } from "@/lib/storage"
import { NextResponse } from "next/server"
import { randomUUID } from "crypto"

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  const { filename, contentType } = await req.json()

  const ext = filename.split(".").pop()
  const key = `uploads/${userId}/${randomUUID()}.${ext}`

  const { data, error } = await supabase.storage
    .from("media")
    .createSignedUploadUrl(key)

  if (error) return new NextResponse(error.message, { status: 500 })

  const publicUrl = supabase.storage
    .from("media")
    .getPublicUrl(key).data.publicUrl

  return NextResponse.json({
    uploadUrl: data.signedUrl,
    token: data.token,
    publicUrl,
    key,
  })
}