"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: "light" | "dark"
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
})

export function useTheme() { return useContext(ThemeContext) }

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialise from localStorage synchronously to match what the blocking
  // script already applied — avoids a second theme flip on hydration
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system"
    return (localStorage.getItem("pulse-theme") as Theme) ?? "system"
  })
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light"
    const attr = document.documentElement.getAttribute("data-theme")
    return attr === "dark" ? "dark" : "light"
  })

  // Apply theme to <html> and track resolved value
  useEffect(() => {
    const root = document.documentElement
    const mq = window.matchMedia("(prefers-color-scheme: dark)")

    function apply(t: Theme) {
      const resolved = t === "system" ? (mq.matches ? "dark" : "light") : t
      root.setAttribute("data-theme", resolved)
      setResolvedTheme(resolved)
    }

    apply(theme)

    // Re-apply when OS preference changes (only matters when theme === "system")
    const listener = () => { if (theme === "system") apply("system") }
    mq.addEventListener("change", listener)
    return () => mq.removeEventListener("change", listener)
  }, [theme])

  function setTheme(t: Theme) {
    setThemeState(t)
    localStorage.setItem("pulse-theme", t)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}