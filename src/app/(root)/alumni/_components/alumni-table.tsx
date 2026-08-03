"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  GraduationCap,
  MagnifyingGlass,
  PencilSimple as Pencil,
  Plus,
  Trash as Trash2,
} from "@phosphor-icons/react"
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"

import { toast } from "@/lib/toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader } from "@/components/ui/loader"
import { DataTable } from "@/components/data-table/data-table"

import { createAlumni, deleteAlumni, updateAlumni } from "../_lib/actions"

export interface AlumniRow {
  id: string
  name: string
  department: string
  mobileNumber: string
  email: string
  year: string
}

export function AlumniTable({
  alumni,
  canManage,
}: {
  alumni: AlumniRow[]
  canManage: boolean
}) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<AlumniRow | null>(null)
  const [deleting, setDeleting] = useState<AlumniRow | null>(null)
  const [globalFilter, setGlobalFilter] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleDelete(row: AlumniRow) {
    startTransition(async () => {
      const res = await deleteAlumni(row.id)
      if (res.status === "success") {
        toast.success(res.message)
        setDeleting(null)
        router.refresh()
      } else {
        toast.error(res.message)
      }
    })
  }

  const columns = useMemo<ColumnDef<AlumniRow>[]>(() => {
    const cols: ColumnDef<AlumniRow>[] = [
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-full">
              <GraduationCap className="size-4" weight="fill" />
            </span>
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        id: "department",
        header: "Department",
        cell: ({ row }) => row.original.department,
      },
      {
        id: "year",
        header: "Year",
        cell: ({ row }) => row.original.year,
      },
      {
        id: "mobileNumber",
        header: "Mobile",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.mobileNumber}</span>
        ),
      },
      {
        id: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.email}
          </span>
        ),
      },
    ]
    if (canManage) {
      cols.push({
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setEditing(row.original)}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit alumni</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600"
              onClick={() => setDeleting(row.original)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Remove alumni</span>
            </Button>
          </div>
        ),
      })
    }
    return cols
  }, [canManage])

  const table = useReactTable({
    data: alumni,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, value) => {
      const q = String(value).toLowerCase()
      const a = row.original as AlumniRow
      return [a.name, a.department, a.year, a.mobileNumber, a.email].some((v) =>
        v.toLowerCase().includes(q)
      )
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="text-primary size-5" weight="fill" />
            Alumni Directory
          </CardTitle>
          <CardDescription>
            Name, department, contact details and passing year of former
            boarders.
          </CardDescription>
        </div>
        {canManage && (
          <Button className="shrink-0" onClick={() => setAdding(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add alumni
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <DataTable table={table} totalRows={alumni.length}>
          <div className="relative w-full max-w-sm">
            <MagnifyingGlass className="text-muted-foreground absolute top-1/2 left-2 size-4 -translate-y-1/2" />
            <Input
              type="search"
              autoComplete="off"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search alumni by name, department, email…"
              className="pl-8"
            />
          </div>
        </DataTable>
      </CardContent>

      {canManage && adding && (
        <AlumniFormDialog
          open
          onOpenChange={(open) => !open && setAdding(false)}
          onSaved={() => {
            setAdding(false)
            router.refresh()
          }}
        />
      )}

      {canManage && (
        <AlumniFormDialog
          key={editing?.id}
          alumni={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          onSaved={() => {
            setEditing(null)
            router.refresh()
          }}
        />
      )}

      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove alumni?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleting?.name} from the alumni
              directory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault()
                if (deleting) handleDelete(deleting)
              }}
            >
              {isPending && (
                <Loader variant="spinner" size={16} className="mr-2" />
              )}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

function AlumniFormDialog({
  alumni,
  open,
  onOpenChange,
  onSaved,
}: {
  alumni?: AlumniRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!alumni

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit alumni" : "Add alumni"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Update the details for ${alumni?.name}.`
              : "Add a former boarder to the alumni directory."}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const form = new FormData(e.currentTarget)
            const values = {
              name: String(form.get("name") ?? ""),
              department: String(form.get("department") ?? ""),
              year: String(form.get("year") ?? ""),
              mobileNumber: String(form.get("mobileNumber") ?? ""),
              email: String(form.get("email") ?? ""),
            }
            startTransition(async () => {
              const res =
                isEdit && alumni
                  ? await updateAlumni({ id: alumni.id, ...values })
                  : await createAlumni(values)
              if (res.status === "success") {
                toast.success(res.message)
                onSaved()
              } else {
                toast.error(res.message)
              }
            })
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={alumni?.name ?? ""}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                name="department"
                defaultValue={alumni?.department ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                name="year"
                defaultValue={alumni?.year ?? ""}
                placeholder="e.g. 2024"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobileNumber">Mobile number</Label>
            <Input
              id="mobileNumber"
              name="mobileNumber"
              defaultValue={alumni?.mobileNumber ?? ""}
              placeholder="e.g. 9876543210"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={alumni?.email ?? ""}
              placeholder="e.g. name@example.com"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && (
                <Loader variant="spinner" size={16} className="mr-2" />
              )}
              {isEdit ? "Save changes" : "Add alumni"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
