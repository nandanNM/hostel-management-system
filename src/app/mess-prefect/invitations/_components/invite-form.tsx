"use client"

import { useState, useTransition } from "react"
import { Copy, PaperPlaneTilt } from "@phosphor-icons/react"

import { toast } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import LoadingButton from "@/components/LoadingButton"

import { sendTemporaryBoarderInvite } from "../_lib/actions"

export function InviteForm() {
  const [email, setEmail] = useState("")
  const [stayUntil, setStayUntil] = useState("")
  const [link, setLink] = useState<string | null>(null)
  const [isSending, startSending] = useTransition()

  const submit = () =>
    startSending(async () => {
      const result = await sendTemporaryBoarderInvite({ email, stayUntil })

      if (result.status === "success") {
        toast.success(result.message)
        setLink(result.link ?? null)
        setEmail("")
        setStayUntil("")
      } else {
        toast.error(result.message)
      }
    })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite a temporary boarder</CardTitle>
        <CardDescription>
          The link only works for the address you enter, and expires in 7 days.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              inputMode="email"
              placeholder="guest@gmail.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-stay-until">Stay until (optional)</Label>
            <Input
              id="invite-stay-until"
              type="date"
              value={stayUntil}
              onChange={(event) => setStayUntil(event.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Shown in the invitation email so the guest knows the arrangement.
            </p>
          </div>
        </div>

        <LoadingButton
          loading={isSending}
          disabled={email.trim().length === 0}
          onClick={submit}
        >
          <PaperPlaneTilt className="mr-2 h-4 w-4" />
          Send invitation
        </LoadingButton>

        {link && (
          <div className="bg-muted space-y-2 rounded-md border p-3">
            <p className="text-xs font-medium">Invitation link</p>
            <p className="text-muted-foreground text-xs break-all">{link}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(link)
                toast.success("Link copied.")
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy link
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
