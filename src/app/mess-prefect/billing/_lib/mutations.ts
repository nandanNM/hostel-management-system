import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"

import { toast } from "@/lib/toast"

import {
  finalizeAndDistributeBills,
  saveAuditDraft,
  setBillingExclusions,
  type SaveAuditDraftInput,
  type SetBillingExclusionsInput,
} from "./actions"

export function useSaveAuditDraft() {
  const router = useRouter()
  return useMutation({
    mutationFn: (input: SaveAuditDraftInput) => saveAuditDraft(input),
    onSuccess: (res) => {
      if (res.status === "success") {
        toast.success(res.message)
        router.refresh()
      } else {
        toast.error(res.message)
      }
    },
    onError: () => toast.error("Failed to save the billing draft."),
  })
}

export function useFinalizeBills() {
  const router = useRouter()
  return useMutation({
    mutationFn: (auditId: string) => finalizeAndDistributeBills(auditId),
    onSuccess: (res) => {
      if (res.status === "success") {
        toast.success(res.message)
        router.refresh()
      } else {
        toast.error(res.message)
      }
    },
    onError: () => toast.error("Failed to distribute the bills."),
  })
}

export function useSetBillingExclusions() {
  const router = useRouter()
  return useMutation({
    mutationFn: (input: SetBillingExclusionsInput) =>
      setBillingExclusions(input),
    onSuccess: (res) => {
      if (res.status === "success") {
        toast.success(res.message)
        router.refresh()
      } else {
        toast.error(res.message)
      }
    },
    onError: () => toast.error("Failed to update the billing exclusions."),
  })
}
