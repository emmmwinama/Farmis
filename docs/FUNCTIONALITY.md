# AgriVault (Farmis) — Functionality Catalog

Scanned from the current codebase at `C:\Users\emmanuel.mwinama\Code\Farmis` on 2026-07-22. This documents what is actually implemented, not just the aspirational spec in [docs/agrivault-replication-prompt.md](agrivault-replication-prompt.md).

## 1. Tech Stack

- **Web**: Next.js 14 (App Router), TypeScript, React 18, Tailwind CSS 4, Radix UI, Recharts, Leaflet + leaflet-draw.
- **Backend**: Next.js REST route handlers, Prisma ORM 6 over MySQL.
- **Auth**: NextAuth (credentials) for web sessions; hand-rolled JWT bearer auth (`jsonwebtoken`/`jose`) for mobile.
- **Mobile**: Expo + React Native (managed workflow), **plain React hooks** for state (no Redux/Zustand/Riverpod), raw `fetch` via a hand-rolled API client, `expo-secure-store` for token/draft persistence. This differs from `docs/agrivault-replication-prompt.md`, which describes a Flutter/Riverpod app — that was never built; the real mobile client is a single 961-line `mobile/App.tsx`.
- **Passwords**: bcrypt.

## 2. Data Model

43 Prisma models (`prisma/schema.prisma`), matching the spec doc's schema exactly. Core entity groups:

- **Identity & access**: `User`, `AdminUser`, `Farm`, `TeamMember`, `Notification`.
- **Land**: `Field`, `FieldBoundary`, `FieldZone`, `FarmMarker`.
- **Crops**: `CropType`, `CropField`, `HarvestYield`.
- **Activities & labour**: `FarmActivity`, `ActivityLabour`, `ActivityInput`, `ActivityOtherCost`, `Employee`.
- **Finance**: `Transaction`, `OverheadExpense`.
- **Inventory**: `InventoryItem`, `InventorySale`, `InventorySaleLink`.
- **Livestock**: `LivestockType`, `Animal`, `AnimalHealth`, `AnimalProduction`, `AnimalWeight`, `AnimalExpense`, `AnimalSale`.
- **Billing**: `SubscriptionTier`, `Subscription`, `Payment`.
- **Support data**: `MarketPrice`, `FarmCreditScore`, `WeatherCache`, `FarmDocument`.
- **Marketing/CMS**: `SiteContent`, `CmsPage`, `CmsFeature`, `CmsMedia`, `ContactSubmission`, `DemoBooking`, `Testimonial`.

## 3. Web Application

### 3.1 Public / marketing pages

| Route | Purpose |
|---|---|
| `app/landing` | Main marketing landing page (feature highlights, pricing teasers). |
| `app/[slug]` | Static content pages: about, blog, careers, press, privacy, terms, security, changelog, roadmap, support — driven by CMS content. |
| `app/login` | Customer sign-in (NextAuth). |
| `app/register` | Signup with subscription tier selection. |
| `app/activate` | Account activation via emailed token, set initial password. |
| `app/invite` | Team invite acceptance via token. |
| `app/pitch/executive-summary`, `app/strategy` | Empty directories — no page files, dead routes. |

### 3.2 Farm dashboard (`app/dashboard/*`)

| Page | Purpose |
|---|---|
| `activities` | Field activity log — labour, inputs, other costs, notes. |
| `business` | Hub page linking to Finance, Inventory, Employees, Seasons. |
| `calendar` | Calendar view of crop/activity events by field. |
| `compliance` | Record completeness / traceability evidence-gap checklist. |
| `credit-score` | Farm credit-readiness score with factor breakdown. |
| `crops` | Crop record CRUD — variety, season, harvest, status, timeline. |
| `documents` | Upload/manage evidence documents (receipts, photos, contracts, certs). |
| `employees` | Employee/payroll roster — roles, pay rates, contacts. |
| `equipment` | Equipment/machinery register and cost tracking. |
| `farm` | Hub page linking to Fields, Crops, Activities, Seasons, Livestock, Map. |
| `field-capture` | Offline-capture queue landing page (routes users to real capture forms). |
| `fields` / `fields/[id]/map` | Field records (area, soil, GPS) plus per-field boundary/zone drawing (Leaflet). |
| `finance` | Income/expense transactions, season profitability. |
| `funders` | Redirect stub → `/dashboard/compliance`. |
| `impact`, `market` | Empty directories — dead routes. |
| `insights` | Hub page linking to Reports, Weather, Credit readiness, Record packs. |
| `inventory` | Harvested produce stock, sales, storage tracking. |
| `livestock` (+ `[id]`, `health`, `weight`) | Livestock register, health records, weight tracking, sales. |
| `map` | Farm-wide Leaflet map of all field boundaries/zones/markers, satellite toggle. |
| `notifications` | Notification inbox. |
| `records` | Buyer/loan/audit/insurance "record packs" with section filters. |
| `report-builder` | Custom report builder — pick sections/columns/filters, export. |
| `reports` (+ `trends`) | Analytics dashboard — cashflow, crop/field profitability, cost per ha/kg. |
| `seasons` (+ `compare`) | Season records and season-over-season comparison. |
| `settings` (+ `password`) | Farm/account settings, password change. |
| `team` | Team member management and invites for the farm. |
| `templates` | Seasonal activity/payroll/sales templates by crop. |
| `weather` | Current + 7-day forecast (Open-Meteo), farm-location aware. |
| `yields` | Harvest yield records per crop/field/season. |

### 3.3 Admin panel (`app/admin/*`)

| Page | Purpose |
|---|---|
| `login` | Separate admin authentication. |
| `cms` | Marketing site content management — site content, features, testimonials, tiers. |
| `inquiries` | Contact form / demo request submissions. |
| `market` | CRUD for `MarketPrice` reference data (crop, market, region, price range, season). |
| `payments` | Payment record management. |
| `subscriptions` | Subscription lifecycle management, auto-expiry of past-due accounts. |
| `tiers` | Subscription tier configuration (limits, features, pricing, visibility). |
| `users` | User account and role management. |

## 4. Access Control & Billing Logic

- **Roles**: owner (full access), manager, agronomist, accountant, field_worker, viewer — each scoped to a permission set (fields, crops, activities, finance, employees, yields, reports, team, documents, equipment, livestock).
- **Subscription tiers**: Trial (7-day write / +14-day view-only grace), Regular, Enterprise, Large Enterprise — each with per-resource limits (`maxFields`, `maxCrops`, `maxActivities`, `maxTransactions`, `maxEmployees`, `maxFarms`, `maxTeamMembers`; `-1` = unlimited) and feature flags (season analytics, yield suggestions, cost/ha, payroll, multi-farm, team accounts, custom reports, API access).
- **Multi-farm support** with farm switching; team invites via token.

## 5. Web API (`app/api/*`)

| Group | Endpoints | Purpose |
|---|---|---|
| Auth | `auth/[...nextauth]`, `register`, `activate`, `settings/password` | NextAuth session, signup, account activation, password change. |
| Admin | `admin/login`, `admin/logout`, `admin/overview`, `admin/users[/[id]]`, `admin/users/[id]/activation`, `admin/tiers[/[id]]`, `admin/subscriptions[/[id]]`, `admin/payments[/[id]]`, `admin/inquiries[/[id]]`, `admin/testimonials[/[id]]`, `admin/market[/[id]]`, `admin/cms/*` (features, impact, media, pages, pitch) | Full admin back office for accounts, billing, marketing content, market data. |
| Public content | `public/content`, `public/pages[/[slug]]`, `public/pitch`, `public/tiers` | Serves live CMS/tier data to public pages. |
| Farm core | `farms`, `farm-context`, `fields[/[id]]`, `fields/[id]/boundary`, `fields/[id]/zones[/[zoneId]]`, `farm-map`, `markers[/[id]]` | Farm/field CRUD, GIS boundaries, zones, map markers. |
| Crops & seasons | `crop-types`, `crops[/[id]]`, `crops/[id]/archive`, `seasons`, `seasons/compare`, `templates`, `templates/seasonal` | Crop type registry, crop lifecycle, season data, seasonal planning templates. |
| Activities & yields | `activities[/[id]]`, `yields[/[id]]`, `yields/suggestions` | Activity/labour/input logging, harvest yield records and suggestions. |
| Finance | `finance[/[id]]`, `overhead[/[id]]` | Income/expense transactions, overhead expense allocation. |
| Inventory | `inventory[/[id]]` | Stock items, acquisitions, sales, disposals. |
| Employees | `employees[/[id]]` | Payroll roster CRUD. |
| Livestock | `livestock/types[/[id]]`, `livestock/animals[/[id]]`, `livestock/health[/[id]]`, `livestock/production[/[id]]`, `livestock/weight`, `livestock/expenses[/[id]]`, `livestock/sales[/[id]]`, `livestock/stats` | Full livestock lifecycle and analytics. |
| Documents | `documents[/[id]]`, `documents/[id]/file` | Evidence document upload, storage, retrieval. |
| Reporting | `reports`, `reports/trends`, `report-builder`, `report-builder/export`, `export`, `export/records`, `stats`, `dashboard` | Dashboard stats, canned reports, custom report builder, CSV/PDF export. |
| Compliance | `traceability`, `impact` | Lot traceability/buyer-ready evidence, impact metrics. |
| Team | `team[/[id]]`, `team/accept` | Team member management and invite acceptance. |
| Billing | `subscription`, `subscription/me`, `credit-score` | Subscription status/self-lookup, farm credit-readiness scoring. |
| Ancillary | `weather`, `market/compare`, `notifications`, `contact`, `demo`, `debug-tiers` | Weather forecast (Open-Meteo), market price comparison, notifications, contact/demo form intake, tier debug endpoint. |
| Not implemented | `ai/chat`, `ai/insights`, `ai/suggestions`, `ai/summary` | Route directories exist but contain no `route.ts` — AI features are scaffolded only, not functional. |

## 6. Mobile API (`app/api/mobile/*`)

Bearer-JWT REST API mirroring most web functionality for the Expo app and any future native client. Full contract documented in [docs/agrivault-replication-prompt.md](agrivault-replication-prompt.md#mobile-api-endpoints).

| Group | Endpoints |
|---|---|
| Auth & session | `login`, `farm-context`, `profile` |
| Dashboard | `dashboard`, `graph-catalog` |
| Land | `fields[/[id]]`, `fields/[id]/boundary`, `fields/[id]/zones[/[zoneId]]`, `field-map`, `markers[/[id]]` |
| Crops | `crop-types`, `crop_types`, `crops[/[id]]`, `seasons`, `seasons/compare`, `templates` |
| Activities & yields | `activities[/[id]]`, `yields[/[id]]` |
| Finance | `finance[/[id]]`, `overhead[/[id]]` |
| Inventory | `inventory[/[id]]`, `inventory/sales[/[id]]` |
| Employees & team | `employees`, `team` |
| Equipment | `equipment` |
| Livestock | `livestock[/[id]]`, `livestock/records` |
| Documents | `documents` |
| Reporting | `reports`, `reports/export`, `report-builder` |
| Compliance | `compliance`, `traceability`, `credit-readiness` |
| Ancillary | `weather`, `market`, `notifications`, `funder-dashboard` |
| Offline | `sync` — batched offline-queue processor for activities/finance/documents |

**Gap**: nearly all of the above have working backend routes, but the mobile client UI (see §7) only calls a handful of them — most mobile endpoints (crops, livestock, inventory, equipment, seasons, weather, market, traceability, documents, etc.) currently have no corresponding screen in the shipped app.

## 7. Mobile App (Expo/React Native — `mobile/`)

Single-file app (`mobile/App.tsx`) with a manual tab switcher, not a router:

- **Login** — email/password against `/api/mobile/login`, editable API base URL field.
- **Home tab** — net income summary, fields/area/crops/workers metrics, fields list, recent activity feed (`/api/mobile/dashboard`, `/api/mobile/fields`).
- **Capture tab** — offline-first form to log Activity / Sale / Payroll entries, with seasonal-template quick-fill; saves as local drafts (`expo-secure-store`) and syncs via a manual "Sync" button to `/api/mobile/activities`, `/api/mobile/finance`, `/api/mobile/employees` (and the batched `/api/mobile/sync`).
- **Records tab** — read-only list of record-pack types (loan readiness, buyer records, audit file, insurance file); points users to the web app for actual export.
- **Settings tab** — account/farm info, API base URL, sign-out.

## 8. Notable Feature Implementations

- **Weather**: real Open-Meteo integration (no API key needed), 3-hour DB cache (`WeatherCache`), location inferred from farm name against known Malawi cities.
- **Credit readiness score**: computed from real farm data (fields, employees, transactions, overhead, inventory) — cashflow, activity cost, revenue factors.
- **Field map / GIS**: Leaflet-based boundary drawing and zone editing per field, farm-wide map with satellite toggle and markers (borehole, irrigation, shed, road, gate, other).
- **Report builder**: user picks data sections/columns/filters; web export produces a hand-built PDF (no external PDF library) and/or CSV.
- **Traceability**: crop lot IDs (`<season>-<fieldCode>-<cropCode>-<id>`), buyer-ready checklist scoring (activities, spray records, harvest/sale linkage).
- **Crop timeline engine**: stage-based guidance (land prep → harvest → storage) for maize, soybean, tobacco, groundnut, rice, sorghum, millet, sunflower, cassava, sweet potato, Irish potato, beans, cowpea, pigeon pea, cotton, sugarcane, banana, tomato, onion, cabbage — drives activity-type suggestions and due/overdue alerts.
- **Inventory-costed activities**: activity inputs can draw from inventory stock, costed at acquisition cost + time-value-of-money carrying charge (12%/yr), decrementing stock automatically.

## 9. Known Gaps / Dead Code

- `app/dashboard/impact`, `app/dashboard/market`, `app/pitch/executive-summary`, `app/strategy` — empty route directories, no pages.
- `app/api/ai/chat`, `app/api/ai/insights`, `app/api/ai/suggestions`, `app/api/ai/summary` — directories with no `route.ts`; AI features are not implemented despite being referenced in the spec doc.
- No farmer-facing market-price comparison page on the web dashboard, despite `MarketPrice` data and admin/mobile APIs existing (`app/dashboard/market` is empty).
- Mobile app UI covers only ~4 of the ~25 mobile API endpoint groups; most backend capability (crops, livestock, inventory, equipment, documents, reports, compliance, weather, market) is unreachable from the shipped mobile client today.
- The replication spec (`docs/agrivault-replication-prompt.md`) describes a Flutter/Riverpod mobile app; the actual mobile app is Expo/React Native with plain hooks — the spec is aspirational/inaccurate on this point.
