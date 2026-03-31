-- CreateEnum
CREATE TYPE "public"."EntryType" AS ENUM ('AUDIT', 'DAILY');

-- CreateEnum
CREATE TYPE "public"."GenderType" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."UserRoleType" AS ENUM ('STUDENT', 'STAFF', 'MANAGER', 'AUDITOR', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "public"."UserStatusType" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'FORMA');

-- CreateEnum
CREATE TYPE "public"."FineStatusType" AS ENUM ('CANCELLED', 'PENDING', 'PAID', 'WAIVED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "public"."PaymentStatusType" AS ENUM ('REFUNDED', 'CANCELLED', 'PENDING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."MealType" AS ENUM ('VEG', 'NON_VEG');

-- CreateEnum
CREATE TYPE "public"."NonVegType" AS ENUM ('MUTTON', 'CHICKEN', 'FISH', 'EGG', 'NONE');

-- CreateEnum
CREATE TYPE "public"."MealTimeType" AS ENUM ('LUNCH', 'DINNER');

-- CreateEnum
CREATE TYPE "public"."MealStatusType" AS ENUM ('MAINTENANCE', 'ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."GuestMealStatusType" AS ENUM ('SERVED', 'CANCELLED', 'APPROVED', 'PENDING', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('PAYMENT', 'MEAL', 'FINE', 'ANNOUNCEMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."BillEntryType" AS ENUM ('SECURITY_DEPOSIT', 'REFUND', 'MEAL_CHARGE', 'FINE_CHARGE', 'GUEST_MEAL_CHARGE', 'PAYMENT', 'ADJUSTMENT_CREDIT', 'ADJUSTMENT_DEBIT');

-- CreateEnum
CREATE TYPE "public"."MealEventType" AS ENUM ('REQUEST', 'STAFF_NOTE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "hashed_password" TEXT,
    "room_id" TEXT,
    "gender" "public"."GenderType",
    "religion" TEXT,
    "dob" TIMESTAMP(3),
    "education" JSONB,
    "self_ph_no" TEXT,
    "guardian_ph_no" TEXT,
    "address" TEXT,
    "bio" TEXT,
    "role" "public"."UserRoleType" NOT NULL DEFAULT 'STUDENT',
    "status" "public"."UserStatusType" NOT NULL DEFAULT 'INACTIVE',
    "join_date" TIMESTAMP(3),
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "meal_preference" JSONB NOT NULL DEFAULT '{}',
    "new_charge_list" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "help_section" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "public"."meals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "public"."MealType" NOT NULL,
    "nonVegType" "public"."NonVegType" NOT NULL DEFAULT 'NONE',
    "status" "public"."MealStatusType" NOT NULL DEFAULT 'INACTIVE',
    "disliked_non_veg_types" "public"."NonVegType"[] DEFAULT ARRAY[]::"public"."NonVegType"[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audits" (
    "id" TEXT NOT NULL,
    "auditor_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "rice_expenses" DOUBLE PRECISION NOT NULL,
    "vegetable_expenses" DOUBLE PRECISION NOT NULL,
    "fish_expenses" DOUBLE PRECISION NOT NULL,
    "daily_expenses" DOUBLE PRECISION NOT NULL,
    "grand_total_expenses" DOUBLE PRECISION NOT NULL,
    "adjustment" DOUBLE PRECISION NOT NULL,
    "other_expenses" DOUBLE PRECISION NOT NULL,
    "total_boarders" INTEGER NOT NULL,
    "meal_charge" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_payments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "audit_id" TEXT NOT NULL,
    "paid_amount" DOUBLE PRECISION NOT NULL,
    "starus" "public"."PaymentStatusType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_method" TEXT,
    "transaction_id" TEXT,
    "processed_by" TEXT,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "user_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_bills" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "audit_id" TEXT,
    "fine_id" TEXT,
    "guest_meal_id" TEXT,
    "payment_id" TEXT,
    "type" "public"."BillEntryType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "issue_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3),
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "balance_remaining" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."guest_meals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number_of_meals" INTEGER NOT NULL,
    "meal_charge" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "public"."MealType" NOT NULL,
    "nonVegType" "public"."NonVegType" NOT NULL,
    "mealTime" "public"."MealTimeType" NOT NULL,
    "mobile_number" TEXT NOT NULL,
    "status" "public"."GuestMealStatusType" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),

    CONSTRAINT "guest_meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_fines" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "public"."FineStatusType" NOT NULL DEFAULT 'PENDING',
    "issued_by" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "paid_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "waived_by" TEXT,
    "waived_at" TIMESTAMP(3),

    CONSTRAINT "user_fines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."daily_meal_activities" (
    "id" TEXT NOT NULL,
    "mealTime" "public"."MealTimeType" NOT NULL,
    "total_meals" INTEGER NOT NULL,
    "total_guest_meals" INTEGER NOT NULL,
    "total_veg" INTEGER NOT NULL,
    "total_nonveg_chicken" INTEGER NOT NULL,
    "total_nonveg_fish" INTEGER NOT NULL,
    "total_nonveg_egg" INTEGER NOT NULL,
    "meal_date" TIMESTAMP(3) NOT NULL,
    "actual_non_veg_served" "public"."NonVegType",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_meal_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."meal_attendances" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "meal_time" "public"."MealTimeType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "meal_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "issuerId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activity_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "old_data" JSONB,
    "new_data" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_media" (
    "id" TEXT NOT NULL,
    "auditId" TEXT,
    "entry" "public"."EntryType" NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."menu_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "costPerUnit" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."meal_schedule_entries" (
    "id" TEXT NOT NULL,
    "dayOfWeek" "public"."DayOfWeek" NOT NULL,
    "mealTime" "public"."MealTimeType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_schedule_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."menu_item_on_meal_schedule_entries" (
    "id" TEXT NOT NULL,
    "mealScheduleEntryId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_item_on_meal_schedule_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_meal_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mealTime" "public"."MealTimeType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "public"."MealEventType",
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_meal_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_name_idx" ON "public"."users"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "public"."sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "meals_user_id_key" ON "public"."meals"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_payments_transaction_id_key" ON "public"."user_payments"("transaction_id");

-- CreateIndex
CREATE INDEX "daily_meal_activities_mealTime_created_at_idx" ON "public"."daily_meal_activities"("mealTime", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "daily_meal_activities_mealTime_created_at_key" ON "public"."daily_meal_activities"("mealTime", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "meal_attendances_user_id_date_meal_time_key" ON "public"."meal_attendances"("user_id", "date", "meal_time");

-- CreateIndex
CREATE INDEX "activity_logs_user_id_idx" ON "public"."activity_logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_items_name_key" ON "public"."menu_items"("name");

-- CreateIndex
CREATE UNIQUE INDEX "meal_schedule_entries_dayOfWeek_mealTime_key" ON "public"."meal_schedule_entries"("dayOfWeek", "mealTime");

-- CreateIndex
CREATE UNIQUE INDEX "menu_item_on_meal_schedule_entries_mealScheduleEntryId_menu_key" ON "public"."menu_item_on_meal_schedule_entries"("mealScheduleEntryId", "menuItemId");

-- CreateIndex
CREATE INDEX "user_meal_events_user_id_date_mealTime_idx" ON "public"."user_meal_events"("user_id", "date", "mealTime");

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meals" ADD CONSTRAINT "meals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audits" ADD CONSTRAINT "audits_auditor_id_fkey" FOREIGN KEY ("auditor_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audits" ADD CONSTRAINT "audits_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_payments" ADD CONSTRAINT "user_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_payments" ADD CONSTRAINT "user_payments_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_payments" ADD CONSTRAINT "user_payments_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_bills" ADD CONSTRAINT "user_bills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_bills" ADD CONSTRAINT "user_bills_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_bills" ADD CONSTRAINT "user_bills_fine_id_fkey" FOREIGN KEY ("fine_id") REFERENCES "public"."user_fines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_bills" ADD CONSTRAINT "user_bills_guest_meal_id_fkey" FOREIGN KEY ("guest_meal_id") REFERENCES "public"."guest_meals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_bills" ADD CONSTRAINT "user_bills_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."user_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."guest_meals" ADD CONSTRAINT "guest_meals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."guest_meals" ADD CONSTRAINT "guest_meals_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_fines" ADD CONSTRAINT "user_fines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_fines" ADD CONSTRAINT "user_fines_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_fines" ADD CONSTRAINT "user_fines_waived_by_fkey" FOREIGN KEY ("waived_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meal_attendances" ADD CONSTRAINT "meal_attendances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meal_attendances" ADD CONSTRAINT "meal_attendances_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_media" ADD CONSTRAINT "audit_media_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "public"."audits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_item_on_meal_schedule_entries" ADD CONSTRAINT "menu_item_on_meal_schedule_entries_mealScheduleEntryId_fkey" FOREIGN KEY ("mealScheduleEntryId") REFERENCES "public"."meal_schedule_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_item_on_meal_schedule_entries" ADD CONSTRAINT "menu_item_on_meal_schedule_entries_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "public"."menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_meal_events" ADD CONSTRAINT "user_meal_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
