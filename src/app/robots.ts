import type { MetadataRoute } from "next"

import { siteConfig } from "@/config/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/onboarding",
          "/admin",
          "/manager",
          "/not-admin",
          "/not-manager",
          "/not-user",
          "/not-found",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  }
}
