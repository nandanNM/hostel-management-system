"use client"

import { useState } from "react"

import { auditColumns, AuditRecord } from "./columns"
import { DataTable } from "./data-table"

// Sample audit data
const sampleAudits: AuditRecord[] = [
  {
    id: "1",
    index: 1,
    auditDate: "2024-01-15",
    totalAmount: 15420.5,
    totalBorder: 1250,
    payableAmount: 14170.5,
  },
  {
    id: "2",
    index: 2,
    auditDate: "2024-01-14",
    totalAmount: 8750.25,
    totalBorder: 875,
    payableAmount: 7875.25,
  },
  {
    id: "3",
    index: 3,
    auditDate: "2024-01-13",
    totalAmount: 12300.0,
    totalBorder: 1100,
    payableAmount: 11200.0,
  },
  {
    id: "4",
    index: 4,
    auditDate: "2024-01-12",
    totalAmount: 9875.75,
    totalBorder: 950,
    payableAmount: 8925.75,
  },
  {
    id: "5",
    index: 5,
    auditDate: "2024-01-11",
    totalAmount: 22150.0,
    totalBorder: 2200,
    payableAmount: 19950.0,
  },
  {
    id: "6",
    index: 6,
    auditDate: "2024-01-10",
    totalAmount: 5420.3,
    totalBorder: 540,
    payableAmount: 4880.3,
  },
  {
    id: "7",
    index: 7,
    auditDate: "2024-01-09",
    totalAmount: 18900.45,
    totalBorder: 1890,
    payableAmount: 17010.45,
  },
  {
    id: "8",
    index: 8,
    auditDate: "2024-01-08",
    totalAmount: 11250.8,
    totalBorder: 1125,
    payableAmount: 10125.8,
  },
]

export default function AuditsPage() {
  const [data] = useState<AuditRecord[]>(sampleAudits)

  return (
    <div className="container mx-auto mt-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Audit Management</h1>
        <p className="text-muted-foreground">
          Manage audit records, review amounts, and track border status
        </p>
      </div>
      <DataTable columns={auditColumns} data={data} />
    </div>
  )
}
