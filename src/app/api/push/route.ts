import {
  getPushPromptState,
  remindPushPromptLater,
  setPushEnabled,
  skipPushPrompt,
} from "@/lib/push-prompt"

export async function GET() {
  try {
    const state = await getPushPromptState()
    return Response.json(state)
  } catch (error) {
    console.error(error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { action, enabled } = await req.json()

    if (action === "remind-later") {
      await remindPushPromptLater()
    } else if (action === "skip") {
      await skipPushPrompt()
    } else if (action === "set-enabled") {
      await setPushEnabled(Boolean(enabled))
    } else {
      return Response.json({ error: "Unknown action" }, { status: 400 })
    }

    const state = await getPushPromptState()
    return Response.json(state)
  } catch (error) {
    console.error(error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
