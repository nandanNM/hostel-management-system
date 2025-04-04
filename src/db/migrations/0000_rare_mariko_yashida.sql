CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."meal_time" AS ENUM('breakfast', 'lunch', 'dinner');--> statement-breakpoint
CREATE TYPE "public"."meal_type" AS ENUM('veg', 'non-veg');--> statement-breakpoint
CREATE TYPE "public"."non_veg_type" AS ENUM('chicken', 'fish', 'egg', 'none');--> statement-breakpoint
CREATE TYPE "public"."religion" AS ENUM('hindu', 'muslim', 'christian', 'sikh', 'jain', 'buddhist', 'jewish', 'other');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('guest', 'user', 'manager', 'staff', 'admin', 'superadmin');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"date" date NOT NULL,
	"total_fine" real NOT NULL,
	"rice_expenditure" real NOT NULL,
	"vegetable_expenditure" real NOT NULL,
	"fish_expenditure" real NOT NULL,
	"daily_expenditure" real NOT NULL,
	"grand_total_expenditure" real NOT NULL,
	"adjustment" real NOT NULL,
	"other_expenditure" real NOT NULL,
	"total_boarders" integer NOT NULL,
	"meal_charge" real NOT NULL,
	CONSTRAINT "audits_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "fines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"amount" real NOT NULL,
	"is_payed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guestmeals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mealType" "meal_type",
	"nonVegType" "non_veg_type" DEFAULT 'none',
	"mealTime" "meal_time",
	"number_of_meals" integer NOT NULL,
	"meal_charge" real NOT NULL,
	"mobile_number" varchar(15),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "guestmeals_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mealType" "meal_type" DEFAULT 'non-veg',
	"nonVegType" "non_veg_type" DEFAULT 'none',
	"mealTime" "meal_time" DEFAULT 'breakfast',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "meals_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"audit_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	"role" "role" DEFAULT 'user',
	"is_banned" boolean DEFAULT false NOT NULL,
	"ban_reason" text,
	"banned_by" text,
	"hostel_name" varchar(255),
	"hostel_tag" varchar(50),
	"hostel_id" varchar(50),
	"room_no" integer,
	"gender" "gender" DEFAULT 'male',
	"religion" "religion" DEFAULT 'hindu',
	"dob" date,
	"education" jsonb,
	"self_ph_no" varchar(15),
	"address" text,
	"bio" text,
	"message" text,
	"total_due_amount" real DEFAULT 0,
	"total_carry_forward_amount" real DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_id_unique" UNIQUE("id"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_self_ph_no_unique" UNIQUE("self_ph_no")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audits" ADD CONSTRAINT "audits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fines" ADD CONSTRAINT "fines_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guestmeals" ADD CONSTRAINT "guestmeals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;