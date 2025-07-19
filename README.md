# Hostel Management System

A digital platform for hostel meal management, billing, and user administration.

## Features

- **Meal Management**: Daily meal planning, attendance tracking, guest meals
- **Financial System**: Automated billing, payment tracking, expense audits
- **User Management**: Role-based access (Students, Managers, Auditors)
- **Communication**: Notifications, announcements, messaging

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend**: Node.js, Prisma ORM
- **Database**: PostgreSQL
- **Auth**: NextAuth.js

## Quick Start

```bash
git clone https://github.com/nandanNM/hostel-management-system
cd hostel-management-system
npm install
cp .env.example .env.local
npx prisma generate
npx prisma db push
npm run dev
```

## Documentation

- **[Database Schema](https://app.eraser.io/workspace/UYt1ajLijIDzJuIRwWMY?origin=share)** - Interactive ER diagram
- **[PRD](https://app.eraser.io/workspace/UYt1ajLijIDzJuIRwWMY?origin=share)** - Product requirements

## Database Design

Core entities: Users, Meals, Bills, Payments, Audits, Notifications

- User-centric design with role-based access
- Complete audit trails for financial transactions
- Optimized relationships for performance

## License

MIT
