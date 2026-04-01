"use client"

export async function uploadFile(file: File) {
  const res = await fetch("/api/media/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
    }),
  })

  const { uploadUrl, token, publicUrl, key } = await res.json()

  const upload = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
      "Authorization": `Bearer ${token}`,
    },
    body: file,
  })

  if (!upload.ok) throw new Error("Upload failed")

  return { publicUrl, key }
}