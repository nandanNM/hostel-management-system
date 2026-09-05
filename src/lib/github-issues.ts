import "server-only"

import { parseRepo } from "@/lib/issue-report-rules"

/**
 * Where reports are filed, and the token that lets us file them.
 *
 * Read lazily and never exposed to the client — a `NEXT_PUBLIC_` token here
 * would let anyone open issues on the repo as the token's owner. Absent
 * configuration is not an error: the app runs fine without it and reports are
 * simply kept in the database (see `reportIssue`).
 */
function githubConfig() {
  const token = process.env.GITHUB_ISSUE_TOKEN
  const repo = parseRepo(process.env.GITHUB_ISSUE_REPO)

  if (!token || !repo) return null
  return { token, ...repo }
}

export type CreatedIssue = { number: number; url: string }

/**
 * File an issue, or return null if it could not be filed.
 *
 * Never throws. A report that reaches the database has been accepted from the
 * boarder's point of view; GitHub being down, rate-limiting us, or holding an
 * expired token must not turn that into an error they see.
 */
export async function createGitHubIssue({
  title,
  body,
  labels,
}: {
  title: string
  body: string
  labels?: string[]
}): Promise<CreatedIssue | null> {
  const config = githubConfig()
  if (!config) {
    console.warn(
      "[github] GITHUB_ISSUE_TOKEN / GITHUB_ISSUE_REPO not set — report saved locally only"
    )
    return null
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/issues`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, body, labels }),
        // A boarder is waiting on this; do not hang the dialog if GitHub is slow.
        signal: AbortSignal.timeout(10_000),
      }
    )

    if (!response.ok) {
      // The response body can echo the request, so log the status only.
      console.error(
        `[github] Failed to create issue: ${response.status} ${response.statusText}`
      )
      return null
    }

    const issue = (await response.json()) as {
      number: number
      html_url: string
    }
    return { number: issue.number, url: issue.html_url }
  } catch (error) {
    console.error("[github] Unexpected error creating issue:", error)
    return null
  }
}

/** Whether the GitHub hop is configured, for surfacing state in the UI. */
export function isGitHubIssuesConfigured(): boolean {
  return githubConfig() !== null
}
