"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()
  
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="w-8 h-8 hidden sm:flex items-center justify-center rounded-md text-muted-foreground">
        <Sun className="h-4 w-4 opacity-50" />
        <span className="sr-only">Toggle theme</span>
      </button>
    )
  }

  const currentTheme = theme === "system" ? resolvedTheme : theme

  return (
    <button
      onClick={() => setTheme(currentTheme === "light" ? "dark" : "light")}
      className="w-8 h-8 hidden sm:flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
