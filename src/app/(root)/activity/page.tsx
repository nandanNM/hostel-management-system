import { Metadata } from "next"

import { InteractiveLogsTable } from "@/components/ui/interactive-logs-table-shadcnui"
import { PageContainer } from "@/components/page-container"

export const metadata: Metadata = {
  title: "Activity",
}

export default function ActivityPage() {
  return (
    <PageContainer>
      <InteractiveLogsTable endpoint="/api/user/activity-logs" />
    </PageContainer>
  )
}
