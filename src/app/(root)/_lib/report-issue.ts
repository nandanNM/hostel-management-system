"use server"

import { ApiResponse } from "@/types"

import { createGitHubIssue } from "@/lib/github-issues"
import { buildIssueBody, normaliseTitle } from "@/lib/issue-report-rules"
import prisma from "@/lib/prisma"
import {
  checkRateLimit,
  describeRetryAfter,
  issueReportLimiter,
} from "@/lib/ratelimit"
import { requireUser } from "@/lib/require-user"
import { issueReportSchema, type IssueReport } from "@/lib/validations"

export type ReportIssueResult = ApiResponse & { issueUrl?: string }

/**
 * File a bug report from inside the app.
 *
 * The database row is written *first* and kept whatever GitHub does. A report
 * a boarder has taken the trouble to write must not evaporate because a token
 * expired or GitHub was down — so the GitHub issue number is recorded as a
 * follow-up rather than being a precondition for success.
 */
export async function reportIssue(
  input: IssueReport
): Promise<ReportIssueResult> {
  const session = await requireUser()
  const userId = session.user.id
  if (!userId) return { status: "error", message: "Unauthorized" }

  const parsed = issueReportSchema.safeParse(input)
  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? "Check the details you typed.",
    }
  }
  const { title, description, pageUrl, userAgent } = parsed.data

  // Keyed per user, not per IP: reports land in a shared tracker, and one
  // boarder should not be able to fill it from a phone and a laptop at once.
  const limit = await checkRateLimit(
    issueReportLimiter,
    `issue-report:${userId}`
  )
  if (!limit.allowed) {
    return {
      status: "error",
      message: `You have reported a few problems already. Try again in ${describeRetryAfter(limit.retryAfterSeconds)}.`,
    }
  }

  try {
    const report = await prisma.issueReport.create({
      data: { userId, title, description, pageUrl, userAgent },
      select: { id: true },
    })

    const issue = await createGitHubIssue({
      title: normaliseTitle(title),
      body: buildIssueBody(description, {
        reporterName: session.user.name ?? null,
        reporterRole: session.user.role,
        reporterId: userId,
        pageUrl,
        userAgent,
        appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? null,
        reportId: report.id,
      }),
      labels: ["reported-from-app"],
    })

    if (issue) {
      await prisma.issueReport
        .update({
          where: { id: report.id },
          data: { githubIssueNumber: issue.number, githubIssueUrl: issue.url },
        })
        // Losing the link is a bookkeeping problem, not the reporter's.
        .catch((err) =>
          console.error("Failed to record GitHub issue link:", err)
        )
    }

    return {
      status: "success",
      message: issue
        ? `Thanks — reported as issue #${issue.number}.`
        : "Thanks — your report has been recorded.",
      issueUrl: issue?.url,
    }
  } catch (error) {
    console.error("reportIssue error:", error)
    return {
      status: "error",
      message: "Could not send your report. Please try again.",
    }
  }
}
