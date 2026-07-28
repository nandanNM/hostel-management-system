export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "D.L Bhawan (PG1)",
  description: "Mess management for D.L Bhawan (PG1).",
  url:
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://mess.pghall1.in",
}
