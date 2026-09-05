/**
 * Turning a boarder's bug report into an issue body.
 *
 * Everything here is pure so it can be tested without a GitHub token. The
 * network call lives in `github-issues.ts`.
 */

/** Zero-width space. Invisible when rendered, but breaks the token. */
const ZWSP = "​"

/**
 * Stop a report from notifying people or linking issues on its own.
 *
 * A boarder typing "@nandanNM" would ping a real maintainer, and "#42" would
 * cross-link a real issue — from text the app posts on their behalf, which is
 * not a lever a boarder should have. Inserting a zero-width space after the
 * sigil leaves the text looking identical while GitHub no longer recognises
 * it as a mention or a reference.
 *
 * Escaping with backticks was the alternative, but it breaks as soon as the
 * report already contains backticks; this cannot be escaped out of.
 */
export function neutraliseGitHubTokens(text: string): string {
  return (
    text
      // Only at a word boundary, which is the only place GitHub reads a
      // mention. Without the lookbehind this mangles every email address a
      // reporter includes, and "email me at nandan@example.com" is exactly the
      // sort of thing a bug report contains.
      .replace(/(?<![\w@])@(?=[A-Za-z0-9-])/g, `@${ZWSP}`)
      .replace(/#(?=\d)/g, `#${ZWSP}`)
      .replace(/\bGH-(?=\d)/gi, `GH-${ZWSP}`)
  )
}

/** Collapse whitespace and cap length, for a title that has to sit on one line. */
export function normaliseTitle(title: string, maxLength = 120): string {
  const flat = neutraliseGitHubTokens(title).replace(/\s+/g, " ").trim()
  return flat.length > maxLength ? `${flat.slice(0, maxLength - 1)}…` : flat
}

export type IssueContext = {
  reporterName: string | null
  reporterRole: string
  reporterId: string
  pageUrl?: string | null
  userAgent?: string | null
  appVersion?: string | null
  reportId: string
}

function row(label: string, value: string | null | undefined): string {
  return value ? `| ${label} | ${value} |\n` : ""
}

/**
 * The issue body: the report as written, then the context that makes it
 * triageable without having to go back and ask.
 */
export function buildIssueBody(
  description: string,
  context: IssueContext
): string {
  const safeDescription = neutraliseGitHubTokens(description).trim()

  const details =
    row(
      "Reported by",
      `${context.reporterName ?? "Unknown"} (${context.reporterRole})`
    ) +
    row("Page", context.pageUrl) +
    row("Browser", context.userAgent) +
    row("App version", context.appVersion) +
    row("Report ID", `\`${context.reportId}\``) +
    row("User ID", `\`${context.reporterId}\``)

  return [
    safeDescription,
    "",
    "---",
    "",
    "| | |",
    "| --- | --- |",
    details.trimEnd(),
    "",
    "<sub>Filed from the app's Report a problem dialog.</sub>",
  ].join("\n")
}

/**
 * Split "owner/repo" into its parts, or null when it is not that shape.
 *
 * The target repo is configuration, and a typo should disable the GitHub hop
 * rather than send a request to a URL built from a malformed value.
 */
export function parseRepo(
  value: string | undefined | null
): { owner: string; repo: string } | null {
  if (!value) return null

  const match = value.trim().match(/^([A-Za-z0-9._-]+)\/([A-Za-z0-9._-]+)$/)
  if (!match) return null

  return { owner: match[1]!, repo: match[2]! }
}
