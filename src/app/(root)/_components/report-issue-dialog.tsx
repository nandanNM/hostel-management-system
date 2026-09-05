"use client"

import { useState, useTransition } from "react"
import { usePathname } from "next/navigation"
import { Bug } from "@phosphor-icons/react"

import { toast } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { reportIssue } from "../_lib/report-issue"

const MAX_DESCRIPTION = 4000

/**
 * Controlled on purpose: the trigger lives in the user menu, and a Radix
 * dropdown unmounts its own content on select — a dialog rendered inside it
 * would close the instant it opened.
 */
export default function ReportIssueDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isSending, startSending] = useTransition()
  const pathname = usePathname()

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    startSending(async () => {
      const result = await reportIssue({
        title,
        description,
        // Collected here rather than asked for: the reporter should not have
        // to know which page they were on for the report to be useful.
        pageUrl: pathname,
        userAgent:
          typeof navigator !== "undefined"
            ? navigator.userAgent.slice(0, 500)
            : undefined,
      })

      if (result.status === "success") {
        toast.success(result.message)
        setTitle("")
        setDescription("")
        onOpenChange(false)
        return
      }
      toast.error(result.message)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="text-primary h-5 w-5" />
              Report a problem
            </DialogTitle>
            <DialogDescription>
              Something broken or confusing? Tell us and it goes straight to the
              people who maintain the app.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="issue-title">What went wrong?</Label>
              <Input
                id="issue-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Meal count shows everyone as vegetarian"
                maxLength={120}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="issue-description">
                What were you doing, and what did you expect?
              </Label>
              <Textarea
                id="issue-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="I opened the meal count for Friday dinner and it said 27 vegetarian, but I eat chicken…"
                rows={6}
                maxLength={MAX_DESCRIPTION}
                required
              />
              <p className="text-muted-foreground text-xs">
                The page you are on and your browser are attached automatically.{" "}
                {description.length}/{MAX_DESCRIPTION}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full" disabled={isSending}>
              {isSending ? "Sending…" : "Send report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
