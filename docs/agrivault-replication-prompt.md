# AgriVault Replication Prompt

Use this prompt to replicate the AgriVault system and mobile API.

## Build Objective

Build **AgriVault**, a professional farm records and analytics system for web and mobile. It must support farms that need practical daily record keeping, offline-first mobile capture, crop and livestock management, inventory automation, finance tracking, team roles, subscription tiers, professional report exports, traceability/compliance records, and buyer/loan/audit/insurance-ready evidence.

The system is not a pitch site. It is an operational product. The first user-facing authenticated experience must be the farm management dashboard. Public pages are limited to landing, pricing, login, registration, support/legal/security, and activation flows.

## Technology and Architecture

Use this stack unless adapting to a target platform:

- Web: Next.js App Router, TypeScript, React, Tailwind CSS.
- Backend: Next.js REST route handlers.
- Database: MySQL with Prisma ORM.
- Auth: NextAuth credential login for web, JWT bearer auth for mobile.
- Password hashing: bcrypt.
- Mobile: Flutter/Dart with Riverpod, go_router, dio, flutter_secure_storage, flutter_dotenv, fl_chart, google_fonts, intl, shimmer.
- PDF/report export: server-generated professional PDFs with cover page, tables, charts where possible, section dividers, portrait layout, farm name, generated date, and paginated records.
- Maps: Leaflet/OpenStreetMap or equivalent.
- Icons: flat professional icons only. No emoji-style icons.
- Theme: cold, professional blue/cyan/slate identity. Use Nunito or equivalent rounded professional sans-serif.

## Core Product Functions

Implement these functional areas:

1. Authentication and account activation.
2. Trial, regular, enterprise, and large-enterprise subscription tiers.
3. Tier configuration admin workflow: add/edit/remove/hide tiers, configure offer package, limits, feature flags, pricing, featured tier, public visibility, CTA label and destination.
4. Public landing and registration pages that pull live public tier configuration.
5. Trial rules:
   - Trial users can add/edit records for 7 days.
   - After 7 days, write access is revoked.
   - Trial users keep view-only access for 14 more days.
   - After that, view access is revoked until upgraded/reactivated.
6. Farm switching and multi-farm support.
7. Role-based access:
   - owner: all access.
   - manager: fields, crops, activities, employees, yields, reports, documents, equipment, livestock.
   - agronomist: fields, crops, activities, yields, reports, documents, livestock.
   - accountant: finance, employees, reports, documents.
   - field_worker: activities, yields, livestock only.
   - viewer: fields, crops, yields, reports, documents, livestock read access.
8. Fields and maps:
   - Create fields with total area, cultivatable area, soil type, GPS coordinates, notes.
   - Draw field boundaries as GeoJSON.
   - Add field zones.
   - Add farm markers such as borehole, irrigation, shed, road, gate, other.
   - Show remaining cultivatable land when assigning new crops.
9. Seasons and crops:
   - Pre-create seasons.
   - Select existing active seasons when adding crops, or enter manual season.
   - Crop records link crop type, field, variety, area planted, season, status.
   - Active and archived crops are separated.
   - Calendar shows active and harvested/archived crops.
   - Timeline focuses on active crops.
10. Guided crop timelines:
   - For supported crops, maintain expected stages from land preparation to storage.
   - Activity form type options should be based on the selected crop’s expected timeline plus “Other”.
   - Maize must include basal fertilizer application before first weeding.
   - Alerts/notifications for due/overdue recommended activities must show detail view, not open the activity form.
11. Activities:
   - Record activity type, field, optional crop, date, notes, responsible employee or free-text responsible person for piece work.
   - Add labour records, input records, and other costs.
   - Activities validate duplicate records and date windows.
   - Inputs may be selected from inventory, costing should use acquisition cost plus time value of money.
   - Inventory is decremented when inputs are consumed.
12. Employees and payroll:
   - Track name, role, pay rate, pay unit, phone, active status.
   - Link labour records to activities.
13. Yields:
   - Record crop harvest date, quantity, unit, unit weight, notes.
   - Convert kg/tonne/bags to total kg for analytics.
   - Harvest yields may create inventory items.
14. Finance:
   - Track income and expense transactions with category, amount, date, description, season, field, crop, harvest link.
   - Track overhead expenses separately and allocate them across active crops/fields in reports.
   - Export expense report and cashflow report.
15. Inventory:
   - Track items by name, category, unit, quantity, acquisition unit cost, acquired date, unit weight, season, linked crop/harvest, notes.
   - Purchases/acquisitions increase stock.
   - Activities consume stock.
   - Sales and disposals reduce stock.
   - Low-stock alerts.
   - Cost per crop should come from actual inventory cost.
   - Inventory quantity edits should be restricted; stock changes should happen through acquisition, sale, disposal, activity consumption, or other stock movement workflows.
   - Inventory history should preserve past items and stock movement records.
   - Inventory reports should show levels over months/years.
16. Documents and attachments:
   - Types: receipt, field_photo, vet_record, buyer_contract, loan_document, insurance_evidence, certificate, other.
   - Allow only PDF, DOC, DOCX, JPG, JPEG, PNG, WEBP.
   - External document URLs must use HTTPS and valid extension.
   - Data URLs allowed for supported MIME types.
   - Max upload size 10 MB.
   - Store document URL/data in a long text field.
   - Preview PDFs/images inside the system.
17. Livestock:
   - Livestock type register with name, category, flat icon.
   - Animal register: tag, name, group, sex, birth date, acquisition date/type/cost, breed, colour, weight, parent, status, notes.
   - Health records: type, description, vet, cost, date, next due date, notes.
   - Production records: animal optional, type, quantity, unit, date, price per unit, total value, notes.
   - Weight records.
   - Expenses: animal optional, category, description, amount, date, notes.
   - Sales: animal, sale date, quantity, weight at sale, price per kg, total amount, buyer, notes.
   - General livestock activities/costs that are not animal-specific, e.g. housing rehabilitation, security, cleaning.
   - Livestock sales create finance income records.
   - Livestock profitability and health-cost analytics.
18. Equipment and machinery:
   - Register tractors/implements/equipment in inventory category equipment.
   - Track fuel, maintenance, service reminders, hired equipment, and machinery costs.
   - Equipment reports: fuel use, maintenance, activities, hire costs.
19. Compliance and traceability:
   - Crop lot IDs.
   - Buyer-ready traceability report.
   - Chemical/spray records.
   - Harvest-to-sale linkage.
   - Audit checklist and completeness scoring.
20. Reports:
   - Reports page split by categories to reduce clutter.
   - Every report should have graph visual presentation where useful.
   - All records/reports filterable by date/date range, crop, season, field, archived/active.
   - Reports include:
     - cashflow by month,
     - crop profitability ranking,
     - field profitability comparison,
     - input efficiency: cost/ha, cost/kg, yield response,
     - livestock profitability and health cost,
     - inventory levels/history,
     - expense report,
     - season comparison with line graphs,
     - yield per hectare,
     - cost per hectare,
     - cost per kg,
     - revenue vs expenses,
     - expense breakdown,
     - employee/payroll report,
     - traceability/compliance report,
     - custom report builder.
21. Custom report builder:
   - Let users choose data categories, columns, filters, charts, and branding.
   - Export to PDF.
   - Include all relevant data categories: fields, crops, activities, inputs, labour, yields, finance, overhead, inventory, inventory sales, documents, livestock, employees, compliance, seasons, reports.
22. Dashboard:
   - No AI section unless a real subscription-backed AI provider exists.
   - Show charts/graphs for analytics.
   - Show getting-started actions.
   - Show alerts: overdue harvest, high input cost, low margin, missing records, low inventory, due/overdue crop timeline activity.
23. Offline-first:
   - Do not create separate duplicate capture forms.
   - Original forms should queue writes when offline.
   - Queue should sync through `/mobile/sync`.
   - Expired trial/write lock must reject sync writes.
24. SEO and public pages:
   - sitemap, robots, metadata, Open Graph, Twitter cards, structured data.
   - noindex dashboard/admin/API/private pages.
25. Production hardening:
   - Auth required for protected routes.
   - Farm ownership checks on record IDs.
   - Role permission checks.
   - Tier write/read checks.
   - Rate limit login.
   - Security headers.
   - Strong secrets in production.

## Database Schema

Implement these models and relations. Types shown are Prisma/MySQL-oriented; adapt as needed while preserving fields and behavior.

```prisma
model User {
  id String @id @default(cuid())
  name String?
  email String @unique
  password String
  role String @default("admin")
  createdAt DateTime @default(now())
  isActive Boolean @default(true)
  activationToken String? @unique
  farms Farm[]
  activities FarmActivity[]
  subscription Subscription?
  teamMemberships TeamMember[]
  creditScores FarmCreditScore[]
  notifications Notification[]
}

model Farm {
  id String @id @default(cuid())
  name String
  location String
  createdAt DateTime @default(now())
  userId String
  ownerId String?
  user User @relation(fields: [userId], references: [id])
  fields Field[]
  employees Employee[]
  transactions Transaction[]
  overheadExpenses OverheadExpense[]
  teamMembers TeamMember[]
  inventory InventoryItem[]
  documents FarmDocument[]
  livestockTypes LivestockType[]
  animals Animal[]
  animalExpenses AnimalExpense[]
  animalProductions AnimalProduction[]
  boundaries FieldBoundary[]
  markers FarmMarker[]
  creditScores FarmCreditScore[]
  weatherCache WeatherCache?
}

model Field {
  id String @id @default(cuid())
  name String
  totalArea Float
  cultivatableArea Float
  soilType String
  locationLat Float?
  locationLng Float?
  boundaryPoints Json?
  notes String?
  createdAt DateTime @default(now())
  farmId String
  farm Farm @relation(fields: [farmId], references: [id], onDelete: Cascade)
  cropFields CropField[]
  activities FarmActivity[]
  transactions Transaction[]
  boundary FieldBoundary?
  zones FieldZone[]
}

model CropType {
  id String @id @default(cuid())
  name String @unique
  isCustom Boolean @default(false)
  cropFields CropField[]
}

model CropField {
  id String @id @default(cuid())
  variety String
  areaPlanted Float
  season String
  plantingDate DateTime
  expectedHarvestDate DateTime
  status String @default("Active")
  isArchived Boolean @default(false)
  archivedAt DateTime?
  archivedReason String?
  createdAt DateTime @default(now())
  fieldId String
  cropTypeId String
  field Field @relation(fields: [fieldId], references: [id], onDelete: Cascade)
  cropType CropType @relation(fields: [cropTypeId], references: [id])
  activities FarmActivity[]
  yields HarvestYield[]
  transactions Transaction[]
  inventoryItems InventoryItem[]
  fieldZones FieldZone[]
}

model Employee {
  id String @id @default(cuid())
  name String
  role String
  payRate Float
  payRateUnit String
  phone String?
  isActive Boolean @default(true)
  createdAt DateTime @default(now())
  farmId String
  farm Farm @relation(fields: [farmId], references: [id], onDelete: Cascade)
  labourRecords ActivityLabour[]
  responsibleFor FarmActivity[] @relation("ResponsibleEmployee")
}

model FarmActivity {
  id String @id @default(cuid())
  activityType String
  date DateTime
  notes String?
  responsiblePersonName String?
  createdAt DateTime @default(now())
  fieldId String
  cropFieldId String?
  responsibleEmployeeId String?
  createdById String
  field Field @relation(fields: [fieldId], references: [id], onDelete: Cascade)
  cropField CropField? @relation(fields: [cropFieldId], references: [id])
  responsibleEmployee Employee? @relation("ResponsibleEmployee", fields: [responsibleEmployeeId], references: [id])
  createdBy User @relation(fields: [createdById], references: [id])
  labourRecords ActivityLabour[]
  inputs ActivityInput[]
  otherCosts ActivityOtherCost[]
}

model ActivityLabour {
  id String @id @default(cuid())
  hoursWorked Float @default(0)
  daysWorked Float @default(0)
  totalCost Float
  activityId String
  employeeId String
  activity FarmActivity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  employee Employee @relation(fields: [employeeId], references: [id])
}

model ActivityInput {
  id String @id @default(cuid())
  inputName String
  category String
  quantity Float
  unit String
  unitCost Float
  totalCost Float
  acquisitionUnitCost Float?
  timeValueCost Float?
  inventoryItemId String?
  activityId String
  activity FarmActivity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  inventoryItem InventoryItem? @relation(fields: [inventoryItemId], references: [id])
}

model ActivityOtherCost {
  id String @id @default(cuid())
  description String
  amount Float
  activityId String
  activity FarmActivity @relation(fields: [activityId], references: [id], onDelete: Cascade)
}

model Transaction {
  id String @id @default(cuid())
  type String
  category String
  amount Float
  date DateTime
  description String
  createdAt DateTime @default(now())
  farmId String
  season String?
  fieldId String?
  cropFieldId String?
  inventoryItemId String?
  harvestYieldId String?
  field Field? @relation(fields: [fieldId], references: [id])
  cropField CropField? @relation(fields: [cropFieldId], references: [id])
  farm Farm @relation(fields: [farmId], references: [id], onDelete: Cascade)
  inventorySales InventorySale[]
  saleLinks InventorySaleLink[]
  harvestYield HarvestYield? @relation(fields: [harvestYieldId], references: [id])
}

model OverheadExpense {
  id String @id @default(cuid())
  farmId String
  description String
  category String
  amount Float
  date DateTime
  recurring Boolean @default(false)
  notes String?
  createdAt DateTime @default(now())
  farm Farm @relation(fields: [farmId], references: [id], onDelete: Cascade)
}

model HarvestYield {
  id String @id @default(cuid())
  cropFieldId String
  harvestDate DateTime
  quantity Float
  unit String
  unitWeight Float?
  notes String?
  createdAt DateTime @default(now())
  cropField CropField @relation(fields: [cropFieldId], references: [id], onDelete: Cascade)
  inventoryItems InventoryItem[]
  transactions Transaction[]
}

model SubscriptionTier {
  id String @id @default(cuid())
  name String
  description String
  priceMonthly Float
  priceAnnual Float?
  audience String?
  ctaLabel String?
  ctaHref String?
  offerItems Json?
  isActive Boolean @default(true)
  isPublic Boolean @default(true)
  createdAt DateTime @default(now())
  isFeatured Boolean @default(false)
  sortOrder Int @default(0)
  maxFields Int @default(1)
  maxCrops Int @default(1)
  maxActivities Int @default(10)
  maxTransactions Int @default(5)
  maxEmployees Int @default(1)
  maxFarms Int @default(1)
  maxTeamMembers Int @default(1)
  seasonAnalytics Boolean @default(false)
  yieldSuggestions Boolean @default(false)
  costPerHectare Boolean @default(false)
  payrollTracking Boolean @default(false)
  multipleFarms Boolean @default(false)
  teamAccounts Boolean @default(false)
  customReports Boolean @default(false)
  apiAccess Boolean @default(false)
  dataRetentionLifetime Boolean @default(true)
  subscriptions Subscription[]
}

model Subscription {
  id String @id @default(cuid())
  userId String @unique
  tierId String
  status String @default("active")
  billingCycle String @default("monthly")
  startDate DateTime @default(now())
  endDate DateTime?
  trialEndsAt DateTime?
  createdAt DateTime @default(now())
  activationToken String? @unique
  activatedAt DateTime?
  notes String?
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  tier SubscriptionTier @relation(fields: [tierId], references: [id])
  payments Payment[]
}

model Payment {
  id String @id @default(cuid())
  subscriptionId String
  amount Float
  currency String @default("MWK")
  status String
  method String
  reference String?
  notes String?
  paidAt DateTime?
  createdAt DateTime @default(now())
  createdByAdminId String?
  subscription Subscription @relation(fields: [subscriptionId], references: [id])
}

model AdminUser {
  id String @id @default(cuid())
  email String @unique
  password String
  name String
  isSuperAdmin Boolean @default(false)
  createdAt DateTime @default(now())
  lastLoginAt DateTime?
  notifications Notification[]
}

model SiteContent {
  id String @id @default(cuid())
  key String @unique
  value String @db.Text
  type String @default("text")
  group String @default("general")
  label String?
  updatedAt DateTime @updatedAt
  updatedBy String?
}

model ContactSubmission {
  id String @id @default(cuid())
  name String
  email String
  message String @db.Text
  status String @default("new")
  notes String? @db.Text
  createdAt DateTime @default(now())
  repliedAt DateTime?
}

model DemoBooking {
  id String @id @default(cuid())
  name String
  email String
  farm String
  message String? @db.Text
  status String @default("pending")
  notes String? @db.Text
  bookedFor DateTime?
  createdAt DateTime @default(now())
}

model Testimonial {
  id String @id @default(cuid())
  quote String @db.Text
  name String
  role String
  initials String
  isActive Boolean @default(true)
  sortOrder Int @default(0)
  createdAt DateTime @default(now())
}

model TeamMember {
  id String @id @default(cuid())
  farmId String
  userId String
  role String
  permissions Json
  inviteEmail String?
  inviteToken String? @unique
  status String @default("active")
  createdAt DateTime @default(now())
  invitedBy String?
  farm Farm @relation(fields: [farmId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model CmsPage {
  id String @id @default(cuid())
  slug String @unique
  title String
  content String @db.LongText
  isPublic Boolean @default(true)
  updatedAt DateTime @updatedAt
}

model CmsFeature {
  id String @id @default(cuid())
  icon String
  title String
  description String @db.Text
  sortOrder Int @default(0)
  isActive Boolean @default(true)
}

model CmsMedia {
  id String @id @default(cuid())
  key String @unique
  url String
  type String
  label String
  updatedAt DateTime @updatedAt
}

model InventoryItem {
  id String @id @default(cuid())
  farmId String
  name String
  category String
  unit String
  quantity Float @default(0)
  acquisitionUnitCost Float?
  acquiredAt DateTime?
  unitWeight Float?
  season String?
  cropFieldId String?
  harvestYieldId String?
  notes String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  farm Farm @relation(fields: [farmId], references: [id], onDelete: Cascade)
  cropField CropField? @relation(fields: [cropFieldId], references: [id])
  harvestYield HarvestYield? @relation(fields: [harvestYieldId], references: [id])
  sales InventorySale[]
  inventorySaleLinks InventorySaleLink[]
  activityInputs ActivityInput[]
}

model InventorySale {
  id String @id @default(cuid())
  inventoryItemId String
  transactionId String?
  quantitySold Float
  unit String
  pricePerUnit Float
  totalAmount Float
  buyerName String?
  saleDate DateTime
  notes String?
  createdAt DateTime @default(now())
  inventoryItem InventoryItem @relation(fields: [inventoryItemId], references: [id], onDelete: Cascade)
  transaction Transaction? @relation(fields: [transactionId], references: [id])
}

model InventorySaleLink {
  id String @id @default(cuid())
  inventoryItemId String
  transactionId String
  quantitySold Float
  unit String
  revenueAmount Float
  createdAt DateTime @default(now())
  inventoryItem InventoryItem @relation(fields: [inventoryItemId], references: [id], onDelete: Cascade)
  transaction Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
}

model MarketPrice {
  id String @id @default(cuid())
  cropName String
  variety String?
  unit String
  priceMin Float
  priceMax Float
  priceAvg Float
  market String
  region String
  currency String @default("MWK")
  season String?
  recordedAt DateTime @default(now())
  source String @default("ADMARC")
  isActive Boolean @default(true)
}

model FarmCreditScore {
  id String @id @default(cuid())
  userId String
  farmId String
  score Int
  grade String
  factors Json
  generatedAt DateTime @default(now())
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  farm Farm @relation(fields: [farmId], references: [id], onDelete: Cascade)
}

model WeatherCache {
  id String @id @default(cuid())
  farmId String @unique
  data Json
  cachedAt DateTime @default(now())
  farm Farm @relation(fields: [farmId], references: [id])
}

model FarmDocument {
  id String @id @default(cuid())
  farmId String
  name String
  type String
  url String @db.LongText
  size Int?
  linkedTo String?
  linkedType String?
  notes String?
  uploadedAt DateTime @default(now())
  farm Farm @relation(fields: [farmId], references: [id], onDelete: Cascade)
}

model Notification {
  id String @id @default(cuid())
  userId String
  farmId String
  type String
  title String
  message String
  isRead Boolean @default(false)
  link String?
  createdAt DateTime @default(now())
  adminUserId String?
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  adminUser AdminUser? @relation(fields: [adminUserId], references: [id])
}

model LivestockType {
  id String @id @default(cuid())
  farmId String
  name String
  category String
  icon String @default("Cattle")
  farm Farm @relation(fields: [farmId], references: [id])
  animals Animal[]
}

model Animal {
  id String @id @default(cuid())
  farmId String
  livestockTypeId String
  tag String?
  name String?
  group String?
  sex String @default("Unknown")
  birthDate DateTime?
  acquisitionDate DateTime @default(now())
  acquisitionType String @default("Born on farm")
  acquisitionCost Float?
  status String @default("Active")
  breed String?
  colour String?
  weight Float?
  notes String?
  parentId String?
  createdAt DateTime @default(now())
  farm Farm @relation(fields: [farmId], references: [id])
  livestockType LivestockType @relation(fields: [livestockTypeId], references: [id])
  healthRecords AnimalHealth[]
  productions AnimalProduction[]
  weightRecords AnimalWeight[]
  expenses AnimalExpense[]
  sales AnimalSale[]
  parent Animal? @relation("ParentChild", fields: [parentId], references: [id])
  offsprings Animal[] @relation("ParentChild")
}

model AnimalHealth {
  id String @id @default(cuid())
  animalId String
  farmId String
  type String
  description String
  veterinarian String?
  cost Float @default(0)
  date DateTime
  nextDueDate DateTime?
  notes String?
  createdAt DateTime @default(now())
  animal Animal @relation(fields: [animalId], references: [id], onDelete: Cascade)
}

model AnimalProduction {
  id String @id @default(cuid())
  animalId String?
  farmId String
  type String
  quantity Float
  unit String
  date DateTime
  pricePerUnit Float?
  totalValue Float?
  notes String?
  createdAt DateTime @default(now())
  animal Animal? @relation(fields: [animalId], references: [id], onDelete: Cascade)
  farm Farm @relation(fields: [farmId], references: [id])
}

model AnimalWeight {
  id String @id @default(cuid())
  animalId String
  weight Float
  unit String @default("kg")
  date DateTime
  notes String?
  animal Animal @relation(fields: [animalId], references: [id], onDelete: Cascade)
}

model AnimalExpense {
  id String @id @default(cuid())
  animalId String?
  farmId String
  category String
  description String
  amount Float
  date DateTime
  notes String?
  createdAt DateTime @default(now())
  animal Animal? @relation(fields: [animalId], references: [id])
  farm Farm @relation(fields: [farmId], references: [id])
}

model AnimalSale {
  id String @id @default(cuid())
  animalId String
  farmId String
  saleDate DateTime
  quantity Int @default(1)
  weightAtSale Float?
  pricePerKg Float?
  totalAmount Float
  buyer String?
  notes String?
  createdAt DateTime @default(now())
  animal Animal @relation(fields: [animalId], references: [id])
}

model FieldBoundary {
  id String @id @default(cuid())
  fieldId String @unique
  farmId String
  geoJson Json
  areaHa Float?
  centroidLat Float?
  centroidLng Float?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  field Field @relation(fields: [fieldId], references: [id], onDelete: Cascade)
  farm Farm @relation(fields: [farmId], references: [id], onDelete: Cascade)
  zones FieldZone[]
}

model FieldZone {
  id String @id @default(cuid())
  boundaryId String
  fieldId String
  farmId String
  name String
  type String
  cropFieldId String?
  geoJson Json
  areaHa Float?
  colour String?
  notes String?
  createdAt DateTime @default(now())
  boundary FieldBoundary @relation(fields: [boundaryId], references: [id], onDelete: Cascade)
  field Field @relation(fields: [fieldId], references: [id], onDelete: Cascade)
  cropField CropField? @relation(fields: [cropFieldId], references: [id])
}

model FarmMarker {
  id String @id @default(cuid())
  farmId String
  fieldId String?
  type String
  label String
  lat Float
  lng Float
  notes String?
  icon String?
  createdAt DateTime @default(now())
  farm Farm @relation(fields: [farmId], references: [id], onDelete: Cascade)
}
```

## Mobile Authentication and Access Rules

All mobile endpoints except `/api/mobile/login` require:

```http
Authorization: Bearer <jwt>
Content-Type: application/json
```

JWT payload:

```ts
type MobileSession = {
  userId: string;
  farmId: string | null;
  email: string;
  role: string;
}
```

JWT expires in 7 days and is signed using `JWT_SECRET`.

Mobile permission categories:

```ts
type MobilePermission =
  | "fields" | "crops" | "activities" | "finance" | "employees"
  | "yields" | "reports" | "team" | "documents" | "equipment" | "livestock";
```

For mobile mutation methods `POST`, `PATCH`, `PUT`, `DELETE`, enforce `assertSubscriptionCanWrite(userId)`.
For reads, enforce `assertSubscriptionCanRead(userId)`.

Subscription logic:

- `active`: readable/writable while `endDate` is null or future.
- `trial`: writable until `trialEndsAt`/`endDate`.
- `trial`: readable until `trialEndsAt + 14 days`.
- all other statuses are locked.

Tier limits:

- `maxFields`, `maxCrops`, `maxActivities`, `maxTransactions`, `maxEmployees`, `maxFarms`, `maxTeamMembers`.
- `-1` means unlimited.

## Mobile API Endpoints

Base URL:

```text
https://agrivault.bytebridgemw.tech/api/mobile
```

### Auth

`POST /login`

Body:

```json
{ "email": "user@example.com", "password": "password" }
```

Rules:

- Rate limit by IP, 10 attempts per 60 seconds.
- Normalize email to lowercase.
- Reject inactive users.
- Compare bcrypt password.
- Return first owned farm as active farm.

Response:

```json
{
  "token": "jwt",
  "user": { "id": "id", "name": "Name", "email": "email", "role": "admin" },
  "farm": { "id": "id", "name": "Farm", "location": "Location" },
  "subscription": { "status": "trial", "tierName": "Trial" }
}
```

### Farm Context

`GET /farm-context`

Returns accessible farms and current active farm ID:

```json
{ "farms": [], "activeFarmId": "farmId" }
```

`POST /farm-context`

Body:

```json
{ "farmId": "farmId" }
```

Rules:

- User must own farm or be active team member.
- Return new JWT with switched farm and role.

Response:

```json
{ "token": "newJwt", "activeFarmId": "farmId" }
```

### Dashboard

`GET /dashboard?period=This year&from=YYYY-MM-DD&to=YYYY-MM-DD&crop=<cropIdOrName>&season=<season>`

Returns:

- farmName, userName
- totalFields, totalArea
- activeCrops
- activeEmployees, totalEmployees
- seasons
- income, expense, net
- expenseBreakdown
- fieldLandUse
- recentActivities

### Fields

`GET /fields`

Returns list of fields with active crops:

```ts
{
  id, name, totalArea, cultivatableArea, soilType,
  locationLat, locationLng, notes, createdAt,
  allocatedArea, cropCount, crops: string[]
}
```

`POST /fields`

Body:

```json
{
  "name": "North Field",
  "totalArea": 5,
  "cultivatableArea": 4.5,
  "soilType": "Loam",
  "locationLat": -13.9,
  "locationLng": 33.7,
  "notes": "optional"
}
```

Rules:

- Enforce `maxFields`.
- Required: name, totalArea, cultivatableArea, soilType.
- cultivatableArea cannot exceed totalArea.

`GET /fields/:id`

Returns field detail with crops and 10 recent activities.

`PATCH /fields/:id`

Partial update of field properties. Must belong to active farm.

`DELETE /fields/:id`

Deletes field if it belongs to active farm.

### Crop Types

`GET /crop_types`

Returns all crop types ordered by name.

`POST /crop_types`

Body:

```json
{ "name": "Custom crop" }
```

Rules:

- If crop exists, return existing.
- Otherwise create with `isCustom: true`.

### Crops

`GET /crops?archived=true|false`

Returns crop records with timeline status:

```ts
{
  id, cropTypeName, cropTypeId, variety, areaPlanted, season,
  plantingDate, expectedHarvestDate, status, fieldId, fieldName,
  fieldCultivatable, createdAt, activities,
  timeline: {
    crop, daysAfterPlanting, completedCount, totalSteps,
    dueSteps, nextStep, steps
  } | null
}
```

`POST /crops`

Body:

```json
{
  "fieldId": "fieldId",
  "cropTypeId": "cropTypeId",
  "variety": "SC 627",
  "areaPlanted": 2,
  "season": "2026",
  "plantingDate": "2026-01-10",
  "expectedHarvestDate": "2026-05-10"
}
```

Rules:

- Enforce `maxCrops`.
- Field must belong to active farm.
- Active crop area cannot exceed remaining cultivatable field area.

`GET /crops/:id`

Returns crop detail, costs, yields, and 10 recent activities.

`PATCH /crops/:id`

Supports:

```json
{ "action": "archive" }
{ "action": "restore" }
```

Or partial crop update:

```json
{ "variety": "...", "areaPlanted": 2, "season": "...", "plantingDate": "...", "expectedHarvestDate": "...", "status": "Active" }
```

`DELETE /crops/:id`

Deletes crop if it belongs to active farm.

### Activities

`GET /activities?fieldId=<id>&cropFieldId=<id>`

Returns:

- `activities`: activity records with cost totals, inputs, labourRecords, otherCosts.
- `allSeasons`.
- `byType`, `byField`, `bySeason` analytics.

`POST /activities`

Body:

```json
{
  "fieldId": "fieldId",
  "cropFieldId": "cropFieldId optional",
  "activityType": "Basal fertilizer application",
  "date": "2026-01-25",
  "notes": "optional",
  "responsibleEmployeeId": "employeeId optional",
  "responsiblePersonName": "piece worker optional",
  "inputs": [
    {
      "inventoryItemId": "optional",
      "inputName": "NPK",
      "category": "fertiliser",
      "quantity": 2,
      "unit": "bags",
      "unitCost": 65000
    }
  ],
  "labourRecords": [
    {
      "employeeId": "employeeId",
      "hoursWorked": 0,
      "daysWorked": 1,
      "totalCost": 5000
    }
  ],
  "otherCosts": [
    { "description": "Transport", "amount": 10000 }
  ]
}
```

Rules:

- Enforce `maxActivities`.
- Required: fieldId, activityType, date.
- Field must belong to farm.
- Optional crop must belong to farm.
- Activity date must be within crop planting and harvest window when crop is selected.
- Reject duplicate activity: same fieldId, cropFieldId/null, activityType, date, createdById.
- If inventoryItemId is used:
  - item must exist in farm.
  - unit must match inventory unit.
  - quantity cannot exceed stock.
  - unit cost at use = acquisition unit cost + time value.
  - annual carrying rate = 12%.
  - decrement inventory quantity.
- For manual inputs, also try matching inventory by name/unit/category and decrement if found.

`GET /activities/:id`

Returns activity detail with costs.

`DELETE /activities/:id`

Deletes activity if it belongs to active farm.

### Yields

`GET /yields?cropFieldId=<id>`

Returns yields and summary:

```ts
{
  yields: [
    { id, harvestDate, quantity, unit, unitWeight, notes, totalKg, cropFieldId, cropTypeName, variety, season, fieldName }
  ],
  summary: { totalRecords, totalKg, byCrop: [{ crop, count, totalKg }] }
}
```

`POST /yields`

Body:

```json
{
  "cropFieldId": "cropFieldId",
  "harvestDate": "2026-05-01",
  "quantity": 50,
  "unit": "bags",
  "unitWeight": 50,
  "notes": "optional"
}
```

Rules:

- Required: cropFieldId, harvestDate, quantity, unit.
- Crop must belong to active farm.

`DELETE /yields/:id`

Delete yield if crop belongs to active farm.

### Finance

`GET /finance?season=<season>&type=Income|Expense`

Returns transactions and summary:

- transactions: id, type, category, amount, date, description, season, fieldName, cropName.
- summary: income, expense, net, byCategory.

`POST /finance`

Body:

```json
{
  "type": "Income",
  "category": "Crop sales",
  "amount": 100000,
  "date": "2026-05-01",
  "description": "Sale",
  "season": "2026",
  "fieldId": "optional",
  "cropFieldId": "optional"
}
```

Rules:

- Enforce `maxTransactions`.
- Required: type, category, amount, date, description.

`PATCH /finance/:id`

Partial update: type, category, amount, date, description, season.

`DELETE /finance/:id`

Delete farm transaction.

### Overhead

`GET /overhead`

Returns overhead expenses and summary:

```ts
{ expenses: [{ id, description, category, amount, date, recurring, notes }], summary: { total, recurring } }
```

`POST /overhead`

Body:

```json
{ "description": "Rent", "category": "Rent", "amount": 100000, "date": "2026-01-01", "recurring": true, "notes": "" }
```

Rules:

- Enforce `maxTransactions`.
- Required: description, category, amount, date.

`DELETE /overhead/:id`

Delete overhead expense if it belongs to active farm.

### Inventory

`GET /inventory?category=<category>`

Returns:

```ts
{
  items: [{
    id, name, category, unit, quantity,
    acquisitionUnitCost, acquiredAt, unitWeight,
    season, cropFieldId, cropName, fieldName, notes,
    quantityKg, lowStock, totalRevenue, sales
  }]
}
```

`POST /inventory`

Body:

```json
{
  "name": "NPK",
  "category": "fertiliser",
  "unit": "bags",
  "quantity": 10,
  "unitWeight": 50,
  "acquisitionUnitCost": 65000,
  "acquiredAt": "2026-01-01",
  "season": "2026",
  "cropFieldId": "optional",
  "notes": "optional"
}
```

Rules:

- Required: name, category, unit, quantity.
- If an item exists with same farm, name, category, unit, season, cropFieldId, increase quantity and update acquisition metadata.

`GET /inventory/sales?inventoryItemId=<id>`

Returns inventory sales.

`POST /inventory/sales`

Body:

```json
{
  "inventoryItemId": "itemId",
  "quantitySold": 5,
  "unit": "bags",
  "pricePerUnit": 65000,
  "buyerName": "Buyer",
  "saleDate": "2026-05-01",
  "notes": "",
  "createFinanceRecord": true
}
```

Rules:

- Required: inventoryItemId, quantitySold, pricePerUnit, saleDate.
- Quantity cannot exceed stock.
- Create finance income record when `createFinanceRecord` is true.
- Decrement inventory.

### Documents

`GET /documents?type=<documentType>`

Returns documents for farm filtered by type.

Allowed document types:

```ts
receipt | field_photo | vet_record | buyer_contract | loan_document | insurance_evidence | certificate | other
```

Allowed MIME types:

```ts
application/pdf
application/msword
application/vnd.openxmlformats-officedocument.wordprocessingml.document
image/jpeg
image/png
image/webp
```

Max upload size: 10 MB.

`POST /documents`

Body:

```json
{
  "name": "Receipt",
  "type": "receipt",
  "url": "https://example.com/file.pdf or data:application/pdf;base64,...",
  "size": 12345,
  "linkedTo": "optional",
  "linkedType": "activity|transaction|crop optional",
  "notes": "optional"
}
```

Rules:

- HTTPS external URLs only.
- External URL pathname must end in pdf/doc/docx/jpg/jpeg/png/webp.
- Data URLs must be allowed MIME type.

### Employees

`GET /employees`

Returns employees for farm ordered by name.

`POST /employees`

Body:

```json
{ "name": "Worker", "role": "Field worker", "payRate": 5000, "payRateUnit": "day", "phone": "" }
```

Rules:

- Enforce `maxEmployees`.
- Required: name, role, payRate, payRateUnit.

### Equipment

`GET /equipment`

Returns:

- equipment: inventory items where category = equipment.
- costs: overhead expenses where category is Fuel, Maintenance, Machinery.

`POST /equipment`

For equipment cost:

```json
{ "kind": "cost", "description": "Fuel", "category": "Fuel", "amount": 10000, "date": "2026-01-01", "notes": "" }
```

For equipment register:

```json
{ "name": "Tractor", "unit": "unit", "quantity": 1, "notes": "" }
```

### Livestock

`GET /livestock`

Returns:

```ts
{ types: LivestockType[], animals: Animal[] }
```

Animals include recent healthRecords, productions, expenses, sales, weightRecords.

`POST /livestock`

Body:

```json
{
  "livestockTypeId": "typeId",
  "tag": "A001",
  "name": "Optional",
  "group": "Dairy",
  "sex": "Female",
  "birthDate": "2025-01-01",
  "acquisitionDate": "2026-01-01",
  "acquisitionType": "Bought",
  "acquisitionCost": 200000,
  "breed": "Breed",
  "colour": "Brown",
  "weight": 250,
  "notes": ""
}
```

`POST /livestock/records`

Body must include `recordType`.

Health:

```json
{ "recordType": "health", "animalId": "id", "type": "Vaccination", "description": "FMD", "veterinarian": "Vet", "cost": 10000, "date": "2026-01-01", "nextDueDate": "2026-07-01", "notes": "" }
```

Production:

```json
{ "recordType": "production", "animalId": "optional", "type": "Milk", "quantity": 20, "unit": "litres", "date": "2026-01-01", "pricePerUnit": 500, "totalValue": 10000, "notes": "" }
```

Expense:

```json
{ "recordType": "expense", "animalId": "optional", "category": "Feed", "description": "Feed", "amount": 10000, "date": "2026-01-01", "notes": "" }
```

Weight:

```json
{ "recordType": "weight", "animalId": "id", "weight": 250, "unit": "kg", "date": "2026-01-01", "notes": "" }
```

Sale:

```json
{ "recordType": "sale", "animalId": "id", "saleDate": "2026-01-01", "quantity": 1, "weightAtSale": 300, "pricePerKg": 1000, "totalAmount": 300000, "buyer": "Buyer", "notes": "" }
```

Rules:

- Animal-specific records require animalId except production and expense may be general farm-level livestock records.
- Sale creates finance income transaction category `Livestock sales`.

### Reports

`GET /reports?season=<season>&fieldId=<id>&cropFieldId=<id>&includeArchived=true|false&from=YYYY-MM-DD&to=YYYY-MM-DD`

Returns:

- filters
- financeSummary
- seasonReport
- cropReport
- fieldReport
- cropFieldDetail
- employeeReport
- inputReport
- yieldsReport.byType
- yieldsReport.records

Use this endpoint for mobile analytics and report screens.

### Report Builder

`GET /report-builder`

Returns:

```ts
{
  sections: { cropProfitability, fields },
  availableColumns: {
    cropProfitability: ["cropName", "variety", "fieldName", "season", "revenue", "totalCost", "netProfit", "inputCost", "costPerKg"],
    fields: ["name", "area", "cultivatableArea", "crops"]
  }
}
```

### Traceability

`GET /traceability`

Returns:

```ts
{
  lots: [{
    id, lotId, cropName, variety, fieldName, season, status,
    activityCount, sprayRecordCount, harvestCount, saleCount, revenue,
    checklist: { activities, sprayRecords, harvestLinked, salesLinked, buyerReady }
  }]
}
```

Lot ID format:

```text
<season>-<fieldCode>-<cropCode>-<last5CropId>
```

### Notifications

`GET /notifications`

Returns latest 50 notifications and unread count.

`POST /notifications`

Body:

```json
{ "markAllRead": true }
```

### Templates

`GET /templates`

Returns seasonal templates from server config.

### Funder / Cooperative Dashboard

`GET /funder-dashboard`

Returns aggregate accessible-farms portfolio:

```ts
{
  totals: { farms, highRisk, averageCompleteness },
  portfolio: [{
    id, name, location, fields, crops, activities, harvests,
    documents, net, recordCompleteness, risk
  }]
}
```

Risk:

- High if completeness < 50 or net < 0.
- Medium if completeness < 80.
- Low otherwise.

### Offline Sync

`POST /sync`

Body:

```json
{
  "queue": [
    { "clientId": "uuid", "type": "activity", "payload": {} },
    { "clientId": "uuid", "type": "finance", "payload": {} },
    { "clientId": "uuid", "type": "document", "payload": {} }
  ]
}
```

Rules:

- Requires active farm in JWT.
- Enforce subscription write permission before processing.
- User must own farm or be an active team member.
- Process each item independently and return result per clientId.
- Supported types:
  - `activity`: same simplified create fields as activity.
  - `finance`: create transaction.
  - `document`: validate and create document.
- Duplicate activity detection: fieldId, cropFieldId/null, activityType, date, createdById.

Response:

```json
{
  "results": [
    { "clientId": "uuid", "status": "created|duplicate|failed|unsupported", "id": "serverId", "error": "optional" }
  ],
  "snapshot": {
    "fields": 1,
    "activities": 10,
    "documents": 2,
    "inventory": 5,
    "syncedAt": "ISO date"
  }
}
```

## Crop Timeline Engine

Implement generic crop timeline guidance:

```ts
type CropTimelineStep = {
  id: string;
  title: string;
  startDay: number;
  endDay: number;
  category: "preparation" | "planting" | "crop-care" | "harvest" | "post-harvest";
  activityTypes: string[];
  recommendation: string;
}
```

Supported crop timelines:

- Maize/corn: land preparation, planting, gap filling and thinning, basal fertilizer application, first weeding, pest/disease scouting, top dressing, second weeding, harvesting, drying/storage.
- Soybean/soya: legume timeline with seed inoculation and treatment.
- Tobacco: nursery, land prep/ridging, transplanting, gap filling, weeding/banking, topping/suckering, harvest/curing, grading/storage.
- Groundnut/peanut: legume timeline with harvesting/lifting around day 115-140.
- Rice/paddy: nursery/paddy prep, transplanting/direct seeding, water management, weeding, top dressing, scouting, harvesting, drying/storage.
- Sorghum, millet, sunflower: cereal variants.
- Cassava, sweet potato, Irish potato: root/tuber timelines.
- Beans, cowpea, pigeon pea: legume variants.
- Cotton: land prep, planting, thinning/gap fill, weeding, pest scouting/spraying, picking, grading/storage.
- Sugarcane: land prep/furrowing, planting setts, gap fill, weeding, fertilizer/irrigation, cutting/loading, ratoon/residue.
- Banana: land prep/pits, planting, mulching/irrigation, desuckering/sanitation, feeding, propping/bunch care, harvesting, cleaning/storage.
- Tomato, onion, cabbage: vegetable timelines.

Timeline status:

- Calculate daysAfterPlanting.
- A step is done if any activity type matches any step activityTypes.
- upcoming if today < dueStart.
- due if today within start/end.
- overdue if today > dueEnd and not done.
- nextStep = first due/overdue else first upcoming.

Activity form should use the selected crop’s timeline step titles plus “Other”.

## Validation and Security

Implement:

- Strong JWT_SECRET and NEXTAUTH_SECRET in production.
- bcrypt password hashing.
- Login rate limiting.
- Bearer JWT auth for mobile.
- Farm ownership checks for every record by ID.
- Team role checks.
- Subscription read/write checks.
- Tier limits on creation.
- Document upload constraints.
- No private route indexing.
- Security headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS in production.

## UX Requirements

- Cold professional blue/cyan/slate theme.
- Large touch targets for mobile/tablet.
- Flat icons, no emojis.
- Farm switcher visible and sized properly.
- Breadcrumbs and page-level actions.
- Empty states should be role-based:
  - farmer: add farm/field/crop/activity.
  - manager: review team, activities, alerts.
  - accountant: finance, expenses, reports.
  - field worker: due tasks and activity capture.
- Premium features should show upgrade prompts/locks instead of simply disappearing.
- Use white space and tables in reports to avoid clutter.

## PDF Export Requirements

Every exported report must:

- Be portrait.
- Include AgriVault branding, farm name, date generated, filters used.
- Use tables for non-graph information.
- Include charts where available.
- Use page breaks and section dividers.
- Avoid CSV-only exports.
- Allow report selection and filters before export.

## Production Seed Requirements

Seed only production-safe defaults:

- Admin user only if `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are provided.
- Crop types.
- Trial, Regular, Enterprise, Large Enterprise tiers.
- CMS/landing content without fake AI or regional-only market copy.
- Legal pages.
- No sample farm/user/transaction data in production seed.

Default tiers:

- Trial: 7-day write access, 14-day view grace, 1 farm, no team members, public, free.
- Regular: single-user farm, 1 farm, no team members, paid monthly/annual.
- Enterprise: teams, multi-farm, role permissions, custom reports, priority support.
- Large Enterprise: custom onboarding, aggregate dashboards, custom reporting, commercial terms by agreement.

## Mobile App Implementation Notes

For Flutter:

- Use `dio` for REST.
- Store JWT in `flutter_secure_storage`.
- Store offline queue locally.
- Add an API interceptor that attaches `Authorization: Bearer <token>`.
- If API returns 401, force re-login.
- If API returns 403 subscription error, show upgrade/locked message.
- Original forms must work offline:
  - If online, submit immediately.
  - If offline/failure, queue request with clientId, type, payload, timestamp.
  - Sync queue through `/api/mobile/sync`.
- Use Riverpod repositories/providers by feature:
  - auth
  - dashboard
  - farm_context
  - fields
  - crops
  - activities
  - yields
  - finance
  - inventory
  - livestock
  - documents
  - reports
  - notifications
- Use `fl_chart` for dashboard/report charts.
- Use `intl` for date/currency formatting.
- Use shimmer loading states.

