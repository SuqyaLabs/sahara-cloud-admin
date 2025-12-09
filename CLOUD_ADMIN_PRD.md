# Product Requirements Document (PRD)
## SaharaOS Cloud Admin Dashboard (`apps/sahara_admin_web`)

**Version:** 1.0.0  
**Last Updated:** December 8, 2025  
**Status:** Planning

---

## 1. Executive Summary

**Product:** SaharaOS Cloud Admin  
**Primary Users:** Restaurant Owner, Multi-Location Manager  
**Goal:** Provide a cloud-based management dashboard for restaurant owners to monitor and manage their business remotely. Unlike the local Admin app (PocketBase), this connects to the **Supabase cloud** and supports **multi-tenant, multi-restaurant** operations.

### Key Differentiators from Local Admin

| Aspect | Local Admin (`sahara_admin`) | Cloud Admin (`sahara_admin_web`) |
|--------|------------------------------|----------------------------------|
| **Connection** | Local PocketBase (127.0.0.1) | Supabase Cloud |
| **Access** | On-premise only | Anywhere with internet |
| **Multi-Restaurant** | No (single database) | Yes (tenant switching) |
| **Real-time** | Direct DB | Supabase Realtime |
| **Authentication** | PocketBase admin | Supabase Auth (email/password) |

---

## 2. Target Users & Personas

### 2.1 Primary: Restaurant Owner
- **Name:** Ahmed (45, owns 2 restaurants)
- **Pain Points:**
  - Can't check sales when not at restaurant
  - Needs to call staff for daily numbers
  - Wants to compare performance across locations
- **Goals:**
  - View real-time sales dashboard from home
  - Get alerts for unusual activity
  - Track staff performance

### 2.2 Secondary: Multi-Location Manager
- **Name:** Sara (32, manages 5 franchise locations)
- **Pain Points:**
  - Travels between locations frequently
  - Needs consolidated reporting
  - Can't track inventory across sites
- **Goals:**
  - Single dashboard for all locations
  - Compare performance metrics
  - Export reports for stakeholders

---

## 3. User Stories

### 3.1 Authentication & Access

| ID | Story | Priority |
|----|-------|----------|
| **US-A1** | As an owner, I want to log in with my email and password so I can access my dashboard securely. | P0 |
| **US-A2** | As an owner with multiple restaurants, I want to switch between them without logging out. | P0 |
| **US-A3** | As an owner, I want to stay logged in for 30 days so I don't have to login repeatedly. | P1 |
| **US-A4** | As an owner, I want to reset my password via email if I forget it. | P1 |
| **US-A5** | As an owner, I want to invite a manager to view (but not edit) my dashboard. | P2 |

### 3.2 Dashboard & Analytics

| ID | Story | Priority |
|----|-------|----------|
| **US-D1** | As an owner, I want to see today's total revenue at a glance so I know how the day is going. | P0 |
| **US-D2** | As an owner, I want to compare today's sales vs yesterday and last week. | P0 |
| **US-D3** | As an owner, I want to see the top 5 selling products today. | P0 |
| **US-D4** | As an owner, I want to see the number of orders (completed, pending, cancelled). | P0 |
| **US-D5** | As an owner, I want to see a chart of hourly sales to identify peak times. | P1 |
| **US-D6** | As an owner, I want the dashboard to auto-refresh every minute. | P1 |
| **US-D7** | As an owner, I want to see low stock alerts on the dashboard. | P2 |

### 3.3 Orders Management

| ID | Story | Priority |
|----|-------|----------|
| **US-O1** | As an owner, I want to view all orders for a selected date range. | P0 |
| **US-O2** | As an owner, I want to filter orders by status (completed, pending, cancelled). | P0 |
| **US-O3** | As an owner, I want to click an order to see its full details (items, customer, payment). | P0 |
| **US-O4** | As an owner, I want to search orders by order number or customer name. | P1 |
| **US-O5** | As an owner, I want to see which cashier processed each order. | P1 |

### 3.4 Products & Catalog

| ID | Story | Priority |
|----|-------|----------|
| **US-P1** | As an owner, I want to view my product catalog with prices and availability. | P0 |
| **US-P2** | As an owner, I want to filter products by category. | P0 |
| **US-P3** | As an owner, I want to search products by name. | P1 |
| **US-P4** | As an owner, I want to toggle a product's availability (out of stock). | P1 |
| **US-P5** | As an owner, I want to edit a product's price from the dashboard. | P2 |

### 3.5 Reports & Export

| ID | Story | Priority |
|----|-------|----------|
| **US-R1** | As an owner, I want to see a daily sales summary for any date. | P0 |
| **US-R2** | As an owner, I want to see weekly and monthly sales reports. | P1 |
| **US-R3** | As an owner, I want to export sales data to CSV/Excel. | P1 |
| **US-R4** | As an owner, I want to see a product performance report (best/worst sellers). | P1 |
| **US-R5** | As an owner, I want to see payment method breakdown (cash vs card). | P2 |

---

## 4. Functional Requirements

### 4.1 Authentication System

| ID | Requirement | Details |
|----|-------------|---------|
| **FR-A1** | Email/Password Auth | Use Supabase Auth with email verification |
| **FR-A2** | Session Persistence | JWT with 30-day refresh token |
| **FR-A3** | Password Reset | Email-based reset flow |
| **FR-A4** | Protected Routes | Middleware redirects unauthenticated users |
| **FR-A5** | Tenant Context | Store selected tenant_id in session/localStorage |

### 4.2 Multi-Tenant Data Access

| ID | Requirement | Details |
|----|-------------|---------|
| **FR-T1** | Tenant-Owner Link | `tenant_owners` table links auth.users to tenants |
| **FR-T2** | RLS Policies | Row-Level Security filters data by tenant ownership |
| **FR-T3** | Tenant Switcher | UI component to select active restaurant |
| **FR-T4** | Cross-Tenant Queries | For consolidated reports (P2) |

### 4.3 Dashboard Data

| ID | Requirement | Details |
|----|-------------|---------|
| **FR-D1** | Real-time Stats | Fetch from Supabase views with caching |
| **FR-D2** | Date Range Picker | Today, Yesterday, This Week, This Month, Custom |
| **FR-D3** | Auto-Refresh | Polling every 60 seconds (configurable) |
| **FR-D4** | Comparison Data | Calculate % change vs previous period |

### 4.4 Data Tables

| ID | Requirement | Details |
|----|-------------|---------|
| **FR-DT1** | Pagination | Server-side pagination (25 rows default) |
| **FR-DT2** | Sorting | Click column headers to sort |
| **FR-DT3** | Filtering | Dropdown filters + search input |
| **FR-DT4** | Export | CSV download for visible data |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| **NFR-P1** | Initial Load | < 2 seconds (LCP) |
| **NFR-P2** | Dashboard Refresh | < 500ms |
| **NFR-P3** | Table Pagination | < 300ms per page |
| **NFR-P4** | Concurrent Users | Support 100+ simultaneous users |

### 5.2 Security

| ID | Requirement | Details |
|----|-------------|---------|
| **NFR-S1** | HTTPS Only | Enforce TLS in production |
| **NFR-S2** | RLS Enforcement | All queries filtered by tenant ownership |
| **NFR-S3** | Session Security | HTTP-only cookies, CSRF protection |
| **NFR-S4** | Audit Logging | Log sensitive actions (login, export, edits) |

### 5.3 Usability

| ID | Requirement | Details |
|----|-------------|---------|
| **NFR-U1** | Responsive | Works on tablet and mobile |
| **NFR-U2** | Dark Mode | Linear-style dark theme (default) |
| **NFR-U3** | Accessibility | WCAG 2.1 AA compliance |
| **NFR-U4** | Language | French primary, Arabic secondary (P2) |

### 5.4 Reliability

| ID | Requirement | Target |
|----|-------------|--------|
| **NFR-R1** | Uptime | 99.9% availability |
| **NFR-R2** | Error Handling | Graceful degradation, retry logic |
| **NFR-R3** | Offline Banner | Show when connection lost |

---

## 6. Technical Architecture

### 6.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLOUD ADMIN WEB APP                         │
│  Next.js 14 (App Router) + TailwindCSS + shadcn/ui             │
│  Deployed: Vercel / Netlify                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Supabase JS Client
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE CLOUD                              │
│  Project: zhfietudqhbjuqjqfvpa (rms)                           │
│  Region: EU Central (Frankfurt)                                 │
├─────────────────────────────────────────────────────────────────┤
│  AUTH        │ Email/Password, JWT, Row Level Security         │
│  DATABASE    │ PostgreSQL 17 with tenant_owners, views          │
│  REALTIME    │ Live subscriptions for orders (P2)              │
│  STORAGE     │ Product images (if needed)                       │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ Sync Engine (existing)
┌─────────────────────────────────────────────────────────────────┐
│                     POS TERMINALS (Per Restaurant)              │
│  PocketBase (local) → Sync → Supabase (cloud)                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Database Schema Additions

```sql
-- NEW: Link Supabase Auth users to tenants
CREATE TABLE tenant_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' 
    CHECK (role IN ('owner', 'manager', 'viewer')),
  permissions JSONB DEFAULT '{"read": true, "write": false, "export": true}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Indexes
CREATE INDEX idx_tenant_owners_user ON tenant_owners(user_id);
CREATE INDEX idx_tenant_owners_tenant ON tenant_owners(tenant_id);

-- RLS
ALTER TABLE tenant_owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memberships" ON tenant_owners
  FOR SELECT USING (user_id = auth.uid());
```

### 6.3 Analytics Views

```sql
-- Daily sales aggregation
CREATE OR REPLACE VIEW v_daily_sales AS
SELECT 
  tenant_id,
  DATE(created_at) AS date,
  COUNT(*) AS order_count,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
  COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_count,
  SUM(total) AS total_revenue,
  SUM(total) FILTER (WHERE status = 'completed') AS completed_revenue,
  AVG(total) AS avg_order_value
FROM orders
GROUP BY tenant_id, DATE(created_at);

-- Product performance
CREATE OR REPLACE VIEW v_product_performance AS
SELECT 
  p.tenant_id,
  p.id AS product_id,
  p.name,
  p.price,
  COUNT(ol.id) AS times_sold,
  SUM(ol.quantity) AS total_quantity,
  SUM(ol.total) AS total_revenue
FROM products p
LEFT JOIN order_lines ol ON ol.product_id = p.id
LEFT JOIN orders o ON o.id = ol.order_id AND o.status = 'completed'
WHERE o.created_at > NOW() - INTERVAL '30 days'
GROUP BY p.tenant_id, p.id, p.name, p.price;
```

### 6.4 Folder Structure

```
apps/sahara_admin_web/
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── .env.example
├── README.md
├── public/
│   └── logo.svg
└── src/
    ├── app/
    │   ├── layout.tsx           # Root layout with providers
    │   ├── page.tsx             # Redirect to /dashboard
    │   ├── globals.css          # Tailwind + custom styles
    │   ├── (auth)/
    │   │   ├── login/
    │   │   │   └── page.tsx
    │   │   ├── forgot-password/
    │   │   │   └── page.tsx
    │   │   └── layout.tsx       # Auth layout (centered card)
    │   └── (dashboard)/
    │       ├── layout.tsx       # Dashboard layout (sidebar)
    │       ├── dashboard/
    │       │   └── page.tsx     # Main dashboard
    │       ├── orders/
    │       │   ├── page.tsx     # Orders list
    │       │   └── [id]/
    │       │       └── page.tsx # Order detail
    │       ├── products/
    │       │   └── page.tsx     # Products list
    │       ├── reports/
    │       │   └── page.tsx     # Reports & analytics
    │       └── settings/
    │           └── page.tsx     # Restaurant settings
    ├── components/
    │   ├── ui/                  # shadcn/ui components
    │   ├── layout/
    │   │   ├── sidebar.tsx
    │   │   ├── header.tsx
    │   │   └── tenant-switcher.tsx
    │   ├── dashboard/
    │   │   ├── stats-card.tsx
    │   │   ├── revenue-chart.tsx
    │   │   ├── top-products.tsx
    │   │   └── recent-orders.tsx
    │   ├── orders/
    │   │   ├── orders-table.tsx
    │   │   └── order-detail-modal.tsx
    │   └── products/
    │       └── products-table.tsx
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts        # Browser client
    │   │   ├── server.ts        # Server client
    │   │   └── middleware.ts    # Auth middleware
    │   ├── hooks/
    │   │   ├── use-tenant.ts
    │   │   ├── use-dashboard.ts
    │   │   └── use-orders.ts
    │   └── utils/
    │       ├── format.ts        # Currency, date formatters
    │       └── cn.ts            # classnames helper
    └── types/
        └── database.ts          # Generated Supabase types
```

---

## 7. UI/UX Specifications

### 7.1 Design System

- **Style:** Linear.app inspired (dark, minimal, professional)
- **Colors:**
  - Background: `#0E0E10` (primary), `#1A1A1D` (secondary)
  - Accent: `#8B5CF6` (purple)
  - Text: `#F9FAFB` (primary), `#A1A1AA` (secondary)
  - Border: `#2A2A2D`
- **Typography:** Inter font, 13-14px body
- **Spacing:** 4px grid system
- **Radius:** 6px (buttons), 8px (cards)

### 7.2 Key Screens

#### Login Page
- Centered card on dark background
- Email input, password input, submit button
- "Forgot password?" link
- Error messages inline

#### Dashboard
```
┌──────────────────────────────────────────────────────────────┐
│ [Logo] SaharaOS              [Restaurant ▼]  [User Avatar ▼] │
├────────────┬─────────────────────────────────────────────────┤
│ Dashboard  │  Today's Performance           [Date: Today ▼] │
│ Orders     │ ┌─────────┬─────────┬─────────┬─────────┐      │
│ Products   │ │ Revenue │ Orders  │ Avg     │ Top     │      │
│ Reports    │ │ 45,000  │ 127     │ 354 DA  │ Pizza   │      │
│ Settings   │ │ +12%    │ +8%     │ -2%     │ Sold 45 │      │
│            │ └─────────┴─────────┴─────────┴─────────┘      │
│            │                                                 │
│            │ Revenue Chart (24h)                             │
│            │ [═══════════════════════════════════════]       │
│            │                                                 │
│            │ Recent Orders                    [View All →]   │
│            │ ┌────────┬──────────┬────────┬─────────┐       │
│            │ │ #1234  │ 12:45 PM │ 450 DA │ ✓ Done  │       │
│            │ │ #1233  │ 12:32 PM │ 280 DA │ ⏳ Prep │       │
│            │ └────────┴──────────┴────────┴─────────┘       │
└────────────┴─────────────────────────────────────────────────┘
```

#### Orders List
- Filterable data table
- Date range picker
- Status filter chips
- Click row to open detail modal

---

## 8. Acceptance Criteria

### Feature: Owner Dashboard Login

```gherkin
Scenario: Owner logs in successfully
  Given I am on the login page
  When I enter my registered email "ahmed@restaurant.dz"
  And I enter my password "********"
  And I click "Sign In"
  Then I should be redirected to the dashboard
  And I should see my restaurant name in the header
  And I should see today's revenue widget

Scenario: Owner with multiple restaurants
  Given I am logged in as an owner with 2 restaurants
  When I click the restaurant switcher dropdown
  Then I should see both restaurant names
  When I select "Pizza Empire - Oran"
  Then the dashboard should refresh with Oran's data
```

### Feature: View Daily Sales

```gherkin
Scenario: Owner views today's sales
  Given I am on the dashboard
  Then I should see "Today's Revenue" card
  And the revenue should match sum of completed orders
  And I should see percentage change vs yesterday

Scenario: Owner changes date range
  Given I am on the dashboard
  When I click the date picker
  And I select "This Week"
  Then all widgets should update to show weekly totals
```

---

## 9. Implementation Phases

### Phase 1: Foundation (Days 1-3) 🏗️

- [ ] Create Next.js project structure
- [ ] Setup TailwindCSS + shadcn/ui
- [ ] Create Supabase migrations (`tenant_owners`, views)
- [ ] Implement auth pages (login, forgot password)
- [ ] Add auth middleware

### Phase 2: Dashboard (Days 4-7) 📊

- [ ] Create dashboard layout (sidebar, header)
- [ ] Implement tenant switcher
- [ ] Build stats cards (revenue, orders, avg)
- [ ] Add revenue chart (hourly)
- [ ] Add recent orders widget
- [ ] Add top products widget

### Phase 3: Orders & Products (Days 8-10) 📦

- [ ] Orders list page with table
- [ ] Order filters (date, status, search)
- [ ] Order detail modal
- [ ] Products list page
- [ ] Category filter

### Phase 4: Reports & Polish (Days 11-14) 📈

- [ ] Sales report page
- [ ] Date range comparisons
- [ ] CSV export
- [ ] Mobile responsive fixes
- [ ] Error handling & loading states
- [ ] Deployment to Vercel

---

## 10. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **User Adoption** | 80% of owners use dashboard weekly | Analytics |
| **Page Load** | < 2s initial load | Vercel Analytics |
| **Session Duration** | > 5 minutes average | Analytics |
| **Mobile Usage** | > 40% of sessions | Device breakdown |
| **Support Tickets** | < 5/month dashboard-related | Zendesk |

---

## 11. Dependencies

| Dependency | Status | Owner |
|------------|--------|-------|
| Supabase Project (rms) | ✅ Active | Infra |
| POS Sync Engine | ✅ Working | Dev |
| `tenants` table | ✅ Exists | DB |
| `tenant_owners` table | ❌ To Create | DB |
| Owner email list | ❌ Needed | Business |

---

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Sync delay** | Dashboard shows stale data | Show "Last synced" timestamp |
| **Large datasets** | Slow queries | Use materialized views, pagination |
| **Auth issues** | Users locked out | Implement password reset, support contact |
| **Mobile UX** | Poor experience on phones | Mobile-first responsive design |

---

## 13. Future Enhancements (Post-MVP)

- **P2:** Real-time order notifications via Supabase Realtime
- **P2:** Product editing (price, availability)
- **P2:** Staff management screen
- **P3:** Multi-language support (AR/FR/EN)
- **P3:** Push notifications (web + mobile)
- **P3:** Flutter mobile app version
- **P3:** Inventory management
- **P3:** Customer analytics

---

## 14. Appendix

### A. Supabase Project Details

| Property | Value |
|----------|-------|
| Project ID | `zhfietudqhbjuqjqfvpa` |
| Region | EU Central (Frankfurt) |
| URL | `https://zhfietudqhbjuqjqfvpa.supabase.co` |
| Status | Active |

### B. Related Documents

- `apps/sahara_admin/sahara_admin_prd.md` - Local Admin PRD
- `docs/ECOSYSTEM_PRESENTATION.md` - System overview
- `supabase/migrations/20241201_tenant_onboarding.sql` - Tenant schema

### C. Glossary

| Term | Definition |
|------|------------|
| **Tenant** | A restaurant/business using SaharaOS |
| **Owner** | Authenticated user with dashboard access |
| **RLS** | Row Level Security (Supabase) |
| **POS** | Point of Sale (cashier terminal) |

---

**Document Owner:** Development Team  
**Approved By:** _Pending_  
**Next Review:** _After MVP Launch_
