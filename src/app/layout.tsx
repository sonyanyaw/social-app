import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { DM_Sans, DM_Serif_Display } from "next/font/google"
import { ToastProvider } from "@/components/ToastProvider"
import { ThemeProvider } from "@/components/ThemeProvider"
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

// Runs before React hydrates — reads localStorage and sets data-theme on <html>
// immediately so there's never a flash of the wrong theme
const themeScript = `
(function() {
  try {
    var saved = localStorage.getItem('pulse-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved === 'dark' || saved === 'light' ? saved
              : prefersDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
  } catch(e) {}
})();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${dmSans.variable} ${dmSerif.variable}`} suppressHydrationWarning>
        <head>
          {/* Blocking script — must run before body renders to prevent theme flash */}
          <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        </head>
        <body suppressHydrationWarning>
          <ThemeProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}