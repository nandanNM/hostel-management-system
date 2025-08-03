export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "PG1",
  description: "The hostal managment systam for PG1",
  url:
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://dev.dlbhawan.in",
}
