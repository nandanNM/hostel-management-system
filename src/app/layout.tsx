import type { Metadata } from "next"

import "./globals.css"

import { Outfit } from "next/font/google"
import AuthProvider from "@/context/AuthProvider"
import { ThemeProvider } from "@/context/theme-provider"

import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/sonner"

const outfit = Outfit({
  variable: "--font-outfit-sans",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
})

export const metadata: Metadata = {
  title: {
    template: "%s | PG1",
    default: "PG1",
  },
  description: "The hostal managment systam",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <AuthProvider>
        <body className={cn(outfit.variable, "antialiased")}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>

          <Toaster />
        </body>
      </AuthProvider>
    </html>
  )
}
