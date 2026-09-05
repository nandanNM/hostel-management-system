"use client"

import { useEffect, useState, type ReactNode } from "react"
import {
  ArrowDown,
  Check,
  ListNumbers,
  Question,
  Warning,
} from "@phosphor-icons/react"
import { motion, useReducedMotion } from "motion/react"

import { MealType, NonVegType } from "@/lib/generated/prisma"
import {
  assignBucket,
  BUCKET_LABELS,
  describeOffers,
  type MealBucket,
} from "@/lib/meal-priority"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

// The worked example the animation walks through: one dinner slot whose
// dishes were ticked Chicken, Fish and Egg. Mutton is deliberately left out
// so the walkthrough can show what an unticked tier looks like — that is the
// question this help exists to answer ("why does Roti say Chicken → Egg?").
const DEMO_OFFERS: NonVegType[] = [
  NonVegType.CHICKEN,
  NonVegType.FISH,
  NonVegType.EGG,
]

// Every rung the boarder can land on, top to bottom. Veg is last and is not
// an offer — it is the floor everyone falls through to.
const RUNGS: MealBucket[] = ["MUTTON", "CHICKEN", "FISH", "EGG", "VEG"]

type Scenario = {
  who: string
  dislikes: NonVegType[]
  /** Plain-language version of `dislikes`, for the caption. */
  note: string
}

const SCENARIOS: Scenario[] = [
  { who: "Amit", dislikes: [], note: "eats anything" },
  { who: "Riya", dislikes: [NonVegType.CHICKEN], note: "no chicken" },
  {
    who: "Sohom",
    dislikes: [NonVegType.CHICKEN, NonVegType.FISH, NonVegType.EGG],
    note: "no chicken, no fish, no egg",
  },
]

type Beat = Scenario & { outcome: MealBucket; landing: number }

/**
 * Where each boarder ends up — decided by `assignBucket`, the same function
 * the meal count and the breakdown drill-down call. The picture cannot drift
 * away from the rule it is illustrating.
 *
 * Typed as a non-empty tuple so the cycling index below always has something
 * to fall back to.
 */
const BEATS = SCENARIOS.map((scenario) => {
  const outcome = assignBucket(
    {
      type: MealType.NON_VEG,
      nonVegType: NonVegType.NONE,
      dislikedNonVegTypes: scenario.dislikes,
    },
    DEMO_OFFERS
  )
  return { ...scenario, outcome, landing: RUNGS.indexOf(outcome) }
}) as [Beat, ...Beat[]]

// One fixed-size stage, like the notification walkthrough: every row sits at a
// computed offset so the travelling token always lands on the rung it is
// supposedly choosing, rather than wherever flex happened to put it.
const STAGE_W = 288
const HEADER_H = 38
const ROW_H = 27
const RAIL_X = 14

const rowTop = (index: number) => HEADER_H + index * ROW_H
const rowMid = (index: number) => rowTop(index) + ROW_H / 2

const STEP_MS = 800
const HOLD_MS = 2100

type RungState = "pending" | "not-offered" | "refused" | "taken"

function OfferChainAnimation() {
  const reduceMotion = useReducedMotion()
  const [scenarioIndex, setScenarioIndex] = useState(0)
  const [step, setStep] = useState(0)

  const beat = BEATS[scenarioIndex % BEATS.length] ?? BEATS[0]
  const { outcome, landing } = beat

  useEffect(() => {
    // Reduced motion still cycles the three boarders — it just stops walking
    // the token down rung by rung and shows each answer outright.
    if (reduceMotion) {
      const t = setTimeout(() => {
        setScenarioIndex((i) => (i + 1) % BEATS.length)
      }, HOLD_MS + STEP_MS)
      return () => clearTimeout(t)
    }
    if (step < landing) {
      const t = setTimeout(() => setStep((s) => s + 1), STEP_MS)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      setScenarioIndex((i) => (i + 1) % BEATS.length)
      setStep(0)
    }, HOLD_MS)
    return () => clearTimeout(t)
  }, [scenarioIndex, step, landing, reduceMotion])

  const cursor = reduceMotion ? landing : step
  const settled = cursor >= landing

  function stateOf(index: number, rung: MealBucket): RungState {
    if (index === landing && settled) return "taken"
    if (index > cursor) return "pending"
    if (rung === "VEG") return "pending"
    if (!DEMO_OFFERS.includes(rung)) return "not-offered"
    if (beat.dislikes.includes(rung)) return "refused"
    return "pending"
  }

  return (
    <div className="space-y-2">
      <div
        className="relative mx-auto w-full"
        style={{ maxWidth: STAGE_W, height: rowTop(RUNGS.length) }}
      >
        {/* What the day is set up to serve — rendered by describeOffers, so
            this reads exactly like the chip on the dish card behind us. */}
        <Card
          className="absolute inset-x-0 top-0 flex-row items-center justify-between gap-2 px-2.5 py-0"
          style={{ height: HEADER_H - 8 }}
        >
          <span className="text-muted-foreground text-[10px] font-medium">
            Tuesday dinner
          </span>
          <Badge
            variant="secondary"
            className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-orange-700 uppercase dark:text-orange-400"
          >
            {describeOffers(DEMO_OFFERS)}
          </Badge>
        </Card>

        {/* the rail the token slides down */}
        <span
          className="bg-border absolute w-px"
          style={{
            left: RAIL_X,
            top: rowMid(0),
            height: rowMid(RUNGS.length - 1) - rowMid(0),
          }}
        />

        {RUNGS.map((rung, index) => {
          const state = stateOf(index, rung)
          const isVeg = rung === "VEG"
          return (
            <div
              key={rung}
              className="absolute inset-x-0 flex items-center gap-2 pr-1 pl-8"
              style={{ top: rowTop(index), height: ROW_H }}
            >
              <motion.span
                className={cn(
                  "text-[11px] font-semibold transition-colors",
                  state === "taken"
                    ? "text-foreground"
                    : state === "refused"
                      ? "text-destructive/80 line-through"
                      : state === "not-offered"
                        ? "text-muted-foreground/50 line-through"
                        : "text-muted-foreground/70"
                )}
                animate={{ scale: state === "taken" ? 1.04 : 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
              >
                {BUCKET_LABELS[rung]}
              </motion.span>
              <span
                className={cn(
                  "text-[9px] leading-none",
                  state === "taken"
                    ? "font-bold text-green-700 dark:text-green-400"
                    : "text-muted-foreground/60"
                )}
              >
                {state === "taken"
                  ? `${beat.who} is counted here`
                  : state === "not-offered"
                    ? "not cooked today"
                    : state === "refused"
                      ? `${beat.who} won't eat it`
                      : isVeg
                        ? "always available"
                        : ""}
              </span>
            </div>
          )
        })}

        {/* the boarder, walking down the offer until something sticks */}
        <motion.span
          className="absolute z-10 flex size-5 items-center justify-center rounded-full border-2 text-[9px] font-bold"
          style={{ left: RAIL_X - 10 }}
          animate={{
            top: rowMid(cursor) - 10,
            borderColor: settled
              ? "var(--color-green-600)"
              : "var(--muted-foreground)",
            backgroundColor: settled
              ? "color-mix(in oklab, var(--color-green-600) 14%, transparent)"
              : "var(--background)",
          }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 260, damping: 24 }
          }
        >
          <motion.span
            key={`${scenarioIndex}-${settled}`}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="flex items-center justify-center"
          >
            {settled ? (
              <Check
                size={11}
                weight="bold"
                className="text-green-700 dark:text-green-400"
              />
            ) : (
              <ArrowDown
                size={11}
                weight="bold"
                className="text-muted-foreground"
              />
            )}
          </motion.span>
        </motion.span>
      </div>

      {/* Two lines reserved: "eats anything" is one line and "no chicken, no
          fish, no egg" is two, and the caption must not shove the step list
          up and down every few seconds. */}
      <p className="text-muted-foreground min-h-[2.1rem] text-center text-[11px] leading-snug">
        <span className="text-foreground font-semibold">{beat.who}</span> (
        {beat.note}){" "}
        {settled ? (
          <>
            is counted in{" "}
            <span className="text-foreground font-semibold">
              {BUCKET_LABELS[outcome]}
            </span>
            .
          </>
        ) : (
          // Held back until the token lands, so the caption is the answer to
          // the walk rather than a spoiler printed above it.
          <>is working down the list…</>
        )}
      </p>
    </div>
  )
}

type Step = { icon: ReactNode; title: string; text: ReactNode }

const STEPS: Step[] = [
  {
    icon: "1",
    title: "Add the dish",
    text: (
      <>
        Give it a name and the flat <strong>guest price</strong> for that day. A
        guest pays that price whatever they end up picking.
      </>
    ),
  },
  {
    icon: "2",
    title: "Tick what the kitchen will serve",
    text: (
      <>
        The tick boxes are <strong>not</strong> what the dish is made of — they
        are what a boarder can be given on a day this dish is on. Tick nothing
        and it is a <strong>veg-only</strong> day.
      </>
    ),
  },
  {
    icon: "3",
    title: "Put it on a day",
    text: (
      <>
        In <strong>Weekly Schedule</strong>, pick the dishes for each lunch and
        dinner. The slot offers everything its dishes offer, combined.
      </>
    ),
  },
  {
    icon: "4",
    title: "Each boarder falls down the list",
    text: (
      <>
        A boarder gets the first thing on offer they have not ruled out in their
        meal preferences. Ruled out everything? They get <strong>veg</strong>.
      </>
    ),
  },
  {
    icon: "5",
    title: "Guests can only book what is on offer",
    text: (
      <>
        Booking mutton on a chicken night is not possible — the kitchen has not
        bought it. Veg is always bookable.
      </>
    ),
  },
]

export default function MealOfferHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="How dishes and meal preferences work"
          className="text-muted-foreground hover:text-foreground size-7 shrink-0 rounded-full"
        >
          <Question size={16} weight="bold" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] gap-0 overflow-y-auto sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>How a dish decides what people eat</DialogTitle>
          <DialogDescription>
            A dish carries a list of what the kitchen will serve on its day.
            Everyone falls down that list until they hit something they eat.
          </DialogDescription>
        </DialogHeader>

        <Card className="bg-muted/40 mt-4 overflow-hidden py-0 shadow-none">
          <CardContent className="p-3">
            <OfferChainAnimation />
          </CardContent>
        </Card>

        <Card className="mt-4 gap-0 py-0">
          {STEPS.map((step, index) => (
            <div key={step.title}>
              {index > 0 && <Separator />}
              <CardContent className="flex items-start gap-3 px-3 py-2.5">
                <Badge className="bg-primary/10 text-primary mt-px size-6 shrink-0 rounded-full">
                  {step.icon}
                </Badge>
                <span className="text-xs leading-snug">
                  <span className="font-semibold">{step.title}.</span>{" "}
                  <span className="text-muted-foreground">{step.text}</span>
                </span>
              </CardContent>
            </div>
          ))}
        </Card>

        <Alert
          layout="complex"
          className="mt-4"
          icon={<ListNumbers size={14} />}
        >
          <AlertDescription className="text-[11px] leading-snug">
            The order things are tried in — {describeOffers(DEMO_OFFERS)} — is
            the priority list in{" "}
            <strong className="text-foreground">Settings → Mess Config</strong>,
            and only the mess prefect can change it.
          </AlertDescription>
        </Alert>

        <Alert
          layout="complex"
          variant="warning"
          className="mt-2"
          icon={<Warning size={14} />}
        >
          <AlertDescription className="text-[11px] leading-snug">
            A slot with <strong>no menu set</strong> is treated as offering
            everything, not as a veg day, so the count never under-orders. Fill
            the slot in to make it exact.
          </AlertDescription>
        </Alert>
      </DialogContent>
    </Dialog>
  )
}
