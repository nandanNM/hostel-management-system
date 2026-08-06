import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"

import { haptic } from "@/lib/haptic"
import { toast } from "@/lib/toast"

import {
  addUserAdvance,
  addUserDue,
  recordPayment,
  transferUserToAlumni,
  type AddAdvanceInput,
  type AddDueInput,
  type RecordPaymentInput,
  type TransferToAlumniInput,
} from "./user-detail"

export function useRecordPayment() {
  const router = useRouter()
  return useMutation({
    mutationFn: (input: RecordPaymentInput) => recordPayment(input),
    onSuccess: (res) => {
      if (res.status === "success") {
        haptic()
        toast.success(res.message)
        router.refresh()
      } else {
        toast.error(res.message)
      }
    },
    onError: () => toast.error("Failed to record the payment."),
  })
}

export function useAddUserAdvance() {
  const router = useRouter()
  return useMutation({
    mutationFn: (input: AddAdvanceInput) => addUserAdvance(input),
    onSuccess: (res) => {
      if (res.status === "success") {
        haptic()
        toast.success(res.message)
        router.refresh()
      } else {
        toast.error(res.message)
      }
    },
    onError: () => toast.error("Failed to record the advance."),
  })
}

export function useAddUserDue() {
  const router = useRouter()
  return useMutation({
    mutationFn: (input: AddDueInput) => addUserDue(input),
    onSuccess: (res) => {
      if (res.status === "success") {
        toast.success(res.message)
        router.refresh()
      } else {
        toast.error(res.message)
      }
    },
    onError: () => toast.error("Failed to add the due."),
  })
}

export function useTransferUserToAlumni() {
  const router = useRouter()
  return useMutation({
    mutationFn: (input: TransferToAlumniInput) => transferUserToAlumni(input),
    onSuccess: (res) => {
      if (res.status === "success") {
        haptic()
        toast.success(res.message)
        router.push("/mess-prefect/users")
        router.refresh()
      } else {
        toast.error(res.message)
      }
    },
    onError: () => toast.error("Failed to transfer the user to alumni."),
  })
}
