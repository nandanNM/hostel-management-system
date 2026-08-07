# 🏢 HMS-PG1 - Hostel Management System

[![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A modern, production-ready **Hostel Management System** designed for efficiency, transparency, and ease of use. It handles everything from detailed onboarding and meal preferences to comprehensive financial tracking and real-time notifications.

---

## 🚀 Key Features

### 🥗 Meal & Guest Management

- **Personalized Preferences**: Choose between Veg/Non-Veg with detailed exclusions and disliked items.
- **Attendance Tracking**: Real-time logging of meal attendances for better mess planning.
- **Guest Meals**: Easily manage and bill guest meal requests.
- **Meal Reminders**: Integrated notification system for upcoming meals.

### 💰 Financial & Billing

- **Dynamic Dashboard**: View outstanding dues, total paid amounts, and transaction history at a glance.
- **Automated Billing**: System-generated bills based on meal consumption and room stay.
- **Payment History**: Clear audit trail of all payments and pending balances.

### 👥 User & Administrative Control

- **Role-Based Access**: Specialized interfaces for **Students**, **Managers**, and **Admins**.
- **Onboarding Flow**: Smooth, multi-step onboarding process to capture student identity and preferences.
- **Profile Management**: Update personal info, address, and contact details securely.

### 🔔 Push Notifications

- **Web Push**: Installable PWA with real browser/device push notifications (VAPID-signed, `web-push`).
- **Smart Alerts**: Notifies boarders when today's meal count is generated, a guest meal request is approved, a monthly bill is issued, or a payment/due is recorded — all sent right after the triggering action, without blocking the response (via `after()`).
- **First-Visit Prompt**: A one-time dialog asks new users to enable notifications, with a 3-day snooze if skipped and a permanent stop if dismissed outright.
- **Settings Toggle**: A dedicated card on the Settings page to turn notifications on/off per device, with a plain-language explanation of what they're for.
- **Guided Recovery**: If a browser has notifications blocked, an animated, platform-aware walkthrough (browser dropdown / Android app-info / iOS & desktop steps) shows the user exactly how to re-enable them.

### 🎓 Alumni & Celebrations

- **Alumni Directory**: Mess prefects can transfer boarders to a read-only alumni record, preserving their financial history.
- **Graduation Moment**: Transferred alumni land on a dedicated congratulations page (instead of a generic "access restricted" screen) with confetti and haptic feedback.
- **Delightful Feedback**: Successful actions across the app (payments, role changes, enabling notifications, etc.) are celebrated with confetti + haptics, not just a toast.

### 📱 Modern User Experience

- **Responsive Design**: Full mobile support with a sleek, interactive sidebar and navigation.
- **Grouped Admin Sidebar**: Manager/Mess Prefect navigation is grouped by function (Overview, Meals, Finance, Administration, Activity, Preferences) instead of by when a feature was added.
- **Theme Support**: Seamless switching between Light and Dark modes.
- **Real-time Updates**: Data stays fresh with TanStack Query integration.
- **Custom Loading & Error States**: Polished feedback during data fetching and navigation.
- **Dashboard Widgets**: Live weather data and inspirational quotes (Hindi + English) on the home screen.

---

## 🛠️ Tech Stack

- **Core**: [Next.js 16+](https://nextjs.org/) (App Router, Server Actions)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), Radix UI, Shadcn UI
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/), [Jotai](https://jotai.org/)
- **Data Fetching**: [TanStack Query v5](https://tanstack.com/query/latest)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Authentication**: [NextAuth.js v5](https://authjs.dev/)
- **Push Notifications**: [web-push](https://github.com/web-push-libs/web-push) (VAPID) + a custom Service Worker
- **Animation/Feedback**: [Motion](https://motion.dev/), [canvas-confetti](https://github.com/catdad/canvas-confetti), Vibration API haptics
- **Icons**: Lucide React, Remixicon, Phosphor Icons

---

## 🏁 Quick Start

1. **Clone the repository:**

   ```bash
   git clone https://github.com/nandanNM/hostel-management-system.git
   cd hostel-management-system
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file based on `.env.example`:

   ```bash
   cp .env.example .env
   ```

   _Fill in your `DATABASE_URL` and `AUTH_SECRET`. For push notifications, also set
   `NEXT_PUBLIC_WEB_PUSH_KEY`, `WEB_PUSH_PRIVATE_KEY`, and `WEB_PUSH_SUBJECT` — generate a
   VAPID key pair with `npx web-push generate-vapid-keys`._

4. **Initialize Database:**

   ```bash
   npx prisma generate
   ```

5. **Run Development Server:**

   ```bash
   pnpm run dev
   ```

6. **View API Documentation:**
   See [docs/API.md](docs/API.md) for complete API reference and widget documentation.

---

## 🛡️ SEO & Security

- **Robots.ts**: Custom configured to protect sensitive dashboard and admin routes while allowing essential SEO indexing for public pages.
- **Metadata API**: Dynamic metadata for all routes to ensure proper link previews and indexing.
- **Auth Guards**: Middleware and server-side checks for all role-restricted routes.

---

## 👨‍💻 Authors & Maintenance

Built with 💖 by **[codernandan](https://codernandan.in)**.  
Maintained by **Suvadip Mahato** 🛠️.

---

## 📄 License

This project is licensed under the MIT License.
