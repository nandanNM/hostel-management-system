import {
  getPushPromptState,
  remindPushPromptLater,
  skipPushPrompt,
} from "@/lib/push-prompt"

export async function GET(req: Request) {
  try {
    // The caller passes its own push endpoint, because "is push on?" is a
    // question about this browser, not about the account.
    const endpoint = new URL(req.url).searchParams.get("endpoint")
    const state = await getPushPromptState(endpoint)
    return Response.json(state)
  } catch (error) {
    console.error(error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { action, endpoint } = await req.json()

    if (action === "remind-later") {
      await remindPushPromptLater()
    } else if (action === "skip") {
      await skipPushPrompt()
    } else {
      return Response.json({ error: "Unknown action" }, { status: 400 })
    }

    const state = await getPushPromptState(endpoint ?? null)
    return Response.json(state)
  } catch (error) {
    console.error(error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
