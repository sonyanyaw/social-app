import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { DM_Sans, DM_Serif_Display } from "next/font/google"
import { ToastProvider } from "@/components/ToastProvider"
import "./globals.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500"],
})

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: "400",
})

export const metadata: Metadata = {
  title: "Pulse",
  description: "Share what matters",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${dmSans.variable} ${dmSerif.variable}`}>
        <body>
          <ToastProvider>
            {children}
          </ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}