"use client"

import { useState, useTransition } from "react"
import { Megaphone } from "@phosphor-icons/react"

import { toast } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader } from "@/components/ui/loader"
import { Textarea } from "@/components/ui/textarea"

import { sendBroadcastNotification } from "../_lib/actions"

export function BroadcastNotificationForm() {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const canSubmit = title.trim().length > 0 && body.trim().length > 0

  function handleSend() {
    startTransition(async () => {
      const res = await sendBroadcastNotification({ title, body })
      setConfirmOpen(false)
      if (res.status === "success") {
        toast.success(res.message)
        setTitle("")
        setBody("")
      } else {
        toast.error(res.message)
      }
    })
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Send a Notification</CardTitle>
        <CardDescription>
          Push a custom announcement to every active boarder&apos;s device
          instantly. Use this for hostel-wide news, not routine updates — this
          reaches everyone at once.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="broadcast-title">Title</Label>
          <Input
            id="broadcast-title"
            placeholder="e.g. Mess closed tomorrow"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="broadcast-body">Message</Label>
          <Textarea
            id="broadcast-body"
            placeholder="e.g. The mess will remain closed tomorrow for maintenance. Please plan accordingly."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={300}
            className="min-h-[100px] resize-none"
          />
        </div>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canSubmit} className="w-full sm:w-auto">
              <Megaphone className="mr-2 h-4 w-4" />
              Send to Everyone
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send this to every boarder?</DialogTitle>
              <DialogDescription>
                This will push &quot;{title}&quot; to every active
                boarder&apos;s device right now. This can&apos;t be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-sidebar rounded-lg border p-3">
              <p className="text-sm font-medium">{title}</p>
              <p className="text-muted-foreground mt-1 text-sm">{body}</p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader variant="spinner" size={16} className="mr-2" />
                    Sending...
                  </>
                ) : (
                  "Yes, send it"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
