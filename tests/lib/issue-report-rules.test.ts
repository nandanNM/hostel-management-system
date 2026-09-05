import { describe, expect, it } from "vitest"

import {
  buildIssueBody,
  neutraliseGitHubTokens,
  normaliseTitle,
  parseRepo,
  type IssueContext,
} from "@/lib/issue-report-rules"

const ZWSP = "​"

const context: IssueContext = {
  reporterName: "Suvadip Mahato",
  reporterRole: "STUDENT",
  reporterId: "usr_123",
  pageUrl: "/guest-meal",
  userAgent: "Mozilla/5.0",
  appVersion: "1.1.0",
  reportId: "rep_abc",
}

describe("neutraliseGitHubTokens", () => {
  it("stops a report from pinging real people", () => {
    // A boarder should not be able to notify maintainers through text the app
    // posts on their behalf.
    expect(neutraliseGitHubTokens("cc @nandanNM")).toBe(`cc @${ZWSP}nandanNM`)
  })

  it("stops a report from cross-linking real issues", () => {
    expect(neutraliseGitHubTokens("same as #42")).toBe(`same as #${ZWSP}42`)
    expect(neutraliseGitHubTokens("see GH-7")).toBe(`see GH-${ZWSP}7`)
  })

  it("leaves ordinary text untouched", () => {
    // An email is not a mention, and a colour is not an issue reference.
    for (const text of [
      "the count was wrong on Friday",
      "email me at nandan@example.com",
      "the header is #ff0000 which is unreadable",
      "cost is 60 per head",
    ]) {
      expect(neutraliseGitHubTokens(text)).toBe(text)
    }
  })

  it("leaves an email address intact", () => {
    // GitHub only reads a mention at a word boundary, so mangling every "@"
    // would corrupt the contact details a reporter volunteers.
    expect(neutraliseGitHubTokens("reach me at nandan@example.com")).toBe(
      "reach me at nandan@example.com"
    )
  })

  it("still catches a mention right after punctuation", () => {
    expect(neutraliseGitHubTokens("(@nandanNM)")).toBe(`(@${ZWSP}nandanNM)`)
  })

  it("cannot be escaped out of with backticks", () => {
    // Why zero-width spaces rather than wrapping in code spans: a report that
    // already contains backticks would break that approach.
    const sneaky = "`@nandanNM` and ``@someone``"
    const result = neutraliseGitHubTokens(sneaky)
    expect(result).not.toMatch(/@[A-Za-z0-9-]/)
  })

  it("handles a mention at the very start", () => {
    expect(neutraliseGitHubTokens("@admin help")).toBe(`@${ZWSP}admin help`)
  })
})

describe("normaliseTitle", () => {
  it("flattens a multi-line title onto one line", () => {
    expect(normaliseTitle("meal count\n\n  is   wrong")).toBe(
      "meal count is wrong"
    )
  })

  it("truncates rather than letting a title run away", () => {
    const long = "x".repeat(200)
    const result = normaliseTitle(long)
    expect(result).toHaveLength(120)
    expect(result.endsWith("…")).toBe(true)
  })

  it("leaves a title that already fits alone", () => {
    expect(normaliseTitle("Friday dinner counts everyone as veg")).toBe(
      "Friday dinner counts everyone as veg"
    )
  })

  it("neutralises mentions in the title too", () => {
    expect(normaliseTitle("@nandanNM the app broke")).toContain(ZWSP)
  })
})

describe("buildIssueBody", () => {
  it("leads with the report, then the context", () => {
    const body = buildIssueBody("The count was wrong.", context)
    expect(body.startsWith("The count was wrong.")).toBe(true)
    expect(body).toContain("Suvadip Mahato (STUDENT)")
    expect(body).toContain("/guest-meal")
    expect(body).toContain("`rep_abc`")
  })

  it("neutralises the description it embeds", () => {
    const body = buildIssueBody("ping @nandanNM about #42", context)
    expect(body).not.toMatch(/@[A-Za-z0-9-]/)
    expect(body).not.toMatch(/#\d/)
  })

  it("omits context rows it does not have", () => {
    const body = buildIssueBody("Broken.", {
      ...context,
      pageUrl: null,
      userAgent: null,
      appVersion: null,
    })
    expect(body).not.toContain("| Page |")
    expect(body).not.toContain("| Browser |")
    expect(body).toContain("| Reported by |")
  })

  it("names an unknown reporter rather than leaving a gap", () => {
    const body = buildIssueBody("Broken.", { ...context, reporterName: null })
    expect(body).toContain("Unknown (STUDENT)")
  })
})

describe("parseRepo", () => {
  it("splits owner and repo", () => {
    expect(parseRepo("University-Of-Kalyani/management-system-dev")).toEqual({
      owner: "University-Of-Kalyani",
      repo: "management-system-dev",
    })
  })

  it("refuses anything that is not owner/repo", () => {
    // A typo must disable the GitHub hop, not build a request URL from junk.
    for (const bad of [
      "",
      "just-a-name",
      "too/many/parts",
      "https://github.com/owner/repo",
      "owner/repo; rm -rf",
      undefined,
      null,
    ]) {
      expect(parseRepo(bad)).toBeNull()
    }
  })

  it("tolerates surrounding whitespace from an env file", () => {
    expect(parseRepo("  owner/repo  ")).toEqual({
      owner: "owner",
      repo: "repo",
    })
  })
})
