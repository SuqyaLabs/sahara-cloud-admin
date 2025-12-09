# SaharaOS Cloud Admin

Cloud-based management dashboard for restaurant owners to monitor and manage their business remotely.

## Features

- **🔐 Authentication**: Secure login with Supabase Auth
- **📊 Dashboard**: Real-time sales stats, hourly charts, top products
- **📦 Orders**: Browse, filter, and export orders
- **🍕 Products**: View catalog, toggle availability
- **📈 Reports**: Date range analytics, payment breakdown, CSV export
- **🏪 Multi-tenant**: Switch between restaurants seamlessly
- **🌙 Dark Theme**: Linear-style professional design

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: Tailwind CSS 4, shadcn/ui components
- **Charts**: Recharts
- **Backend**: Supabase (Auth, Database, RLS)
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project with the RMS schema

### Environment Setup

Copy `.env.local.example` to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login, forgot-password
│   ├── (dashboard)/      # Protected pages
│   │   ├── dashboard/    # Main dashboard
│   │   ├── orders/       # Orders list
│   │   ├── products/     # Products catalog
│   │   ├── reports/      # Analytics
│   │   └── settings/     # Account settings
│   └── layout.tsx        # Root layout
├── components/
│   ├── ui/               # Reusable UI components
│   ├── layout/           # Sidebar, Header, TenantSwitcher
│   └── dashboard/        # Dashboard widgets
├── hooks/                # Custom React hooks
├── lib/
│   ├── supabase/         # Supabase client config
│   ├── utils.ts          # cn() helper
│   └── format.ts         # Currency, date formatters
└── types/
    └── database.ts       # TypeScript types
```

## Database Requirements

The app requires these Supabase views (created automatically):

- `v_daily_sales` - Daily sales aggregation
- `v_hourly_sales` - Hourly breakdown for charts
- `v_product_performance` - Top selling products
- `v_payment_breakdown` - Payment method stats

And the `tenant_owners` table for multi-tenant access control.

## Deployment

Deploy to Vercel or Netlify:

```bash
npm run build
```

## Related Documentation

- [CLOUD_ADMIN_PRD.md](./CLOUD_ADMIN_PRD.md) - Full PRD
- [SaharaOS Ecosystem](../../docs/ECOSYSTEM_PRESENTATION.md) - System overview
