-- CreateTable
CREATE TABLE "alumni" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "mobile_number" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alumni_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "alumni_name_idx" ON "alumni"("name");
