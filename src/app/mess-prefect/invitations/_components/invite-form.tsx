"use client"

import { useState, useTransition } from "react"
import {
  Calendar as CalendarIcon,
  Copy,
  PaperPlaneTilt,
} from "@phosphor-icons/react"
import { addDays, format, startOfDay } from "date-fns"

import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import LoadingButton from "@/components/LoadingButton"

import { sendTemporaryBoarderInvite } from "../_lib/actions"

export function InviteForm() {
  const [email, setEmail] = useState("")
  const [stayUntil, setStayUntil] = useState<Date | undefined>()
  const [link, setLink] = useState<string | null>(null)
  const [isSending, startSending] = useTransition()

  const submit = () =>
    startSending(async () => {
      const result = await sendTemporaryBoarderInvite({
        email,
        // The action takes yyyy-MM-dd; the picker works in Date.
        stayUntil: stayUntil ? format(stayUntil, "yyyy-MM-dd") : undefined,
      })

      if (result.status === "success") {
        toast.success(result.message)
        setLink(result.link ?? null)
        setEmail("")
        setStayUntil(undefined)
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="invite-stay-until"
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !stayUntil && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                  {stayUntil ? format(stayUntil, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={stayUntil}
                  onSelect={setStayUntil}
                  disabled={(date) =>
                    startOfDay(date) < startOfDay(new Date()) ||
                    startOfDay(date) > startOfDay(addDays(new Date(), 365))
                  }
                  captionLayout="dropdown"
                />
              </PopoverContent>
            </Popover>
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
