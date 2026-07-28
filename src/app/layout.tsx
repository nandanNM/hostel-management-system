import type { Metadata, Viewport } from "next"

import "./globals.css"

import { Geist_Mono } from "next/font/google"
import AuthProvider from "@/context/AuthProvider"
import ReactQueryProvider from "@/context/ReactQueryProvider"
import { ThemeProvider } from "@/context/theme-provider"
import { NuqsAdapter } from "nuqs/adapters/next/app"

import { siteConfig } from "@/config/site"
import { Toaster } from "@/lib/toast"
import { cn } from "@/lib/utils"

const fontSans = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontSerif = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-serif",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  creator: "codernandan",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  icons: {
    icon: "/icon.png",
  },
  manifest: `${siteConfig.url}/site.webmanifest`,
}

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <AuthProvider>
        <body
          className={cn(
            fontSans.variable,
            fontSerif.variable,
            fontMono.variable,
            "antialiased"
          )}
        >
          <NuqsAdapter>
            <ReactQueryProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
              </ThemeProvider>
              <Toaster />
            </ReactQueryProvider>
          </NuqsAdapter>
        </body>
      </AuthProvider>
    </html>
  )
}
