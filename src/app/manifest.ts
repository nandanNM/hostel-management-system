import type { MetadataRoute } from "next"

import { siteConfig } from "@/config/site"

/**
 * Served at `/manifest.webmanifest` and linked automatically by Next.
 *
 * `id` keys an installed copy: changing it makes every existing install look
 * like a different app, so it stays as it is.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/?utm_source=pwa",
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/?utm_source=pwa",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#C45A1A",
    icons: [
      // Sizes must match the file on disk, or the icon fails the install
      // criteria. Not `maskable`: the crest is circular with ring text to the
      // edge, so Android's mask would crop the lettering.
      {
        src: "/app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/app-icon-512.png",
        sizes: "393x393",
        type: "image/png",
        purpose: "any",
      },
    ],
  }
}
