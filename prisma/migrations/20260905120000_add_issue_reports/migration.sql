-- Bug reports filed from inside the app. The row is written before GitHub is
-- contacted and kept regardless of the outcome, so an expired token or a
-- GitHub outage cannot silently swallow a boarder's report.
CREATE TABLE "issue_reports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "page_url" TEXT,
    "user_agent" TEXT,
    "github_issue_number" INTEGER,
    "github_issue_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issue_reports_pkey" PRIMARY KEY ("id")
);

-- Reports are read newest-first for one user, so index the pair.
CREATE INDEX "issue_reports_user_id_created_at_idx" ON "issue_reports"("user_id", "created_at");

ALTER TABLE "issue_reports" ADD CONSTRAINT "issue_reports_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
