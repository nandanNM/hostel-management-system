import { siteConfig } from "@/config/site";
import type { MetadataRoute } from "next";


export default function manifest(): MetadataRoute.Manifest {
  return {
    short_name: siteConfig.name,
    name: siteConfig.name,
    description: siteConfig.description,
    icons: [
      {
        src: "/icon.png",
        type: "image/png",
        sizes: "any",
        purpose: "any",
      },
      {
        src: "/pg1.png",
        type: "image/png",
        sizes: "any",
        purpose: "any",
      },
      {
        src: "/favicon.ico",
        type: "image/x-icon",
        sizes: "any",
        purpose: "any",
      },
    ],
    id: "/?utm_source=pwa",
    start_url: "/?utm_source=pwa",
    display: "standalone",
    scope: "/",
    background_color: "#ffffff",
    theme_color: "#C45A1A",
  };
}
