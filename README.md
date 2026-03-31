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

### 📱 Modern User Experience
- **Responsive Design**: Full mobile support with a sleek, interactive sidebar and navigation.
- **Theme Support**: Seamless switching between Light and Dark modes.
- **Real-time Updates**: Data stays fresh with TanStack Query integration.
- **Custom Loading & Error States**: Polished feedback during data fetching and navigation.

---

## 🛠️ Tech Stack

- **Core**: [Next.js 16+](https://nextjs.org/) (App Router, Server Actions)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), Radix UI, Shadcn UI
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/), [Jotai](https://jotai.org/)
- **Data Fetching**: [TanStack Query v5](https://tanstack.com/query/latest)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Authentication**: [NextAuth.js v5](https://authjs.dev/)
- **Icons**: Lucide React, Remixicon

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
   *Fill in your DATABASE_URL and AUTH_SECRET.*

4. **Initialize Database:**
   ```bash
   npx prisma generate
   ```

5. **Run Development Server:**
   ```bash
   pnpm run dev
   ```

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
