# Coesco Web Platform - Development Roadmap

## Current State Overview

| Module | Status | Description |
|--------|--------|-------------|
| Sales/CRM | ✅ Complete | Companies, contacts, journeys, quotes, configuration builder |
| Form Builder | ✅ Complete | Dynamic forms with conditional logic, external access |
| Performance Sheets | ✅ Complete | Versioning, linking to configurations |
| Admin/Auth | ✅ Complete | RBAC, Microsoft SSO, audit logging, sessions |
| Production | 🟡 Basic | Machine tracking only, no work orders |
| Warehouse | ❌ Not Started | Stub pages exist, no backend |
| Time Tracking | ❌ Not Started | Empty directory |
| Test Coverage | ❌ Critical Gap | Only middleware tests exist |

---

## Phase 1: Immediate Priorities

### 1.1 Security & Bug Fixes

- [x] Add admin role validation in `apps/server/src/controllers/core/lock.controller.ts`
  - ~~Search for "TODO: Add admin role validation here" (2 occurrences)~~
  - Implemented proper authorization checks for `forceReleaseLock`, `getAllLocks`, and `clearAllLocks`

- [x] Fix itemId mapping in data pipeline
  - Added logic to look up Item by modelNumber in both `_migrateQuoteItems` and `_migrateCustomQuoteItems`
  - Fixed `QuoteStatus.ACTIVE` → `QuoteStatus.OPEN` in `quotes.ts`

### 1.2 Data Migration

- [x] Complete catalog migration module (`scripts/data-pipeline/catalog.ts`)
  - Migrates: CoilTypes, ProductClasses, Items, OptionCategories, OptionHeaders
- [x] Complete employees migration module (`scripts/data-pipeline/employees.ts`)
  - Migrates: Departments, Users, Employees, Manager relationships
- [x] Complete quotes migration module (`scripts/data-pipeline/quotes.ts`)
  - Migrates: Quotes, QuoteRevisions, QuoteItems
  - Includes revision status and latest revision updates
- [ ] Add validation/verification step to confirm migrated data integrity
- [ ] Document migration process and rollback procedures

### 1.3 Code Cleanup

- [x] Remove deprecated `apps/client/src/pages/_old/` directory
- [x] Document company detail codes in `apps/client/src/pages/sales/company-details.tsx`
  - Converted `TERMS_CODE_OPTIONS` from raw codes to descriptive labels (Net 30, Net 45, etc.)
  - Updated select dropdown and display to show human-readable labels
- [x] Update legacy service mapping in `apps/server/src/services/core/legacy.service.ts`
  - Added `primaryKey` field to ID map config
  - Created `getPrimaryKeyField()` helper method
  - Updated `getById` and `update` methods to use mapping instead of hardcoded values
- [x] Fix typo in `CREDIT_STATUS_OPTIONS` ("Accouting" → "Accounting")
- [x] Register warehouse module in `modules.ts` (status: development)
- [x] Remove debug `console.log` statements from `_base.repository.ts`

---

## Phase 2: Warehouse Management

### 2.1 Database Schema

- [ ] Add warehouse models to `apps/server/prisma/schema.prisma`:
  ```
  - Warehouse (id, name, location, isActive)
  - InventoryItem (id, itemId, warehouseId, quantity, reorderPoint, reorderQty)
  - InventoryTransaction (id, itemId, warehouseId, type, quantity, reference, notes)
  - InventoryTransactionType enum (RECEIVE, SHIP, ADJUST, TRANSFER, COUNT)
  ```
- [ ] Run `npm run db:generate` to create migrations and repositories

### 2.2 Backend Implementation

- [ ] Create `apps/server/src/routes/warehouse.routes.ts`
- [ ] Create `apps/server/src/services/warehouse/` service layer:
  - `inventory.service.ts` - CRUD for inventory items
  - `transaction.service.ts` - Record and query transactions
  - `reporting.service.ts` - Stock levels, reorder alerts
- [ ] Create `apps/server/src/controllers/warehouse/` controllers

### 2.3 Frontend Implementation

- [ ] Register warehouse module in `apps/client/src/config/modules.ts`
- [ ] Build out `apps/client/src/pages/warehouse/dashboard.tsx`
  - Stock level overview
  - Low stock alerts
  - Recent transactions
- [ ] Build out `apps/client/src/pages/warehouse/inventory.tsx`
  - Inventory list with search/filter
  - Add/edit inventory items
  - Adjust quantities
- [ ] Build out `apps/client/src/pages/warehouse/transactions.tsx`
  - Transaction history
  - Create new transactions (receive, ship, adjust)
  - Filter by type, date, item

---

## Phase 3: Production Expansion

### 3.1 Database Schema

- [ ] Add production models to `apps/server/prisma/schema.prisma`:
  ```
  - WorkOrder (id, number, itemId, quantity, status, priority, dueDate, notes)
  - WorkOrderStatus enum (PENDING, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED)
  - WorkOrderOperation (id, workOrderId, machineId, sequence, description, setupTime, runTime)
  - WorkOrderLog (id, workOrderId, status, notes, employeeId, timestamp)
  ```
- [ ] Run `npm run db:generate`

### 3.2 Backend Implementation

- [ ] Create `apps/server/src/services/production/workorder.service.ts`
- [ ] Expand `apps/server/src/routes/production.routes.ts` with work order endpoints
- [ ] Add work order status change notifications via Socket.IO

### 3.3 Frontend Implementation

- [ ] Create `apps/client/src/pages/production/work-orders.tsx`
  - Work order list with status filters
  - Create/edit work orders
  - Status updates
- [ ] Create `apps/client/src/pages/production/scheduling.tsx`
  - Calendar/Gantt view of work orders
  - Drag-and-drop scheduling
  - Machine assignment
- [ ] Enhance `apps/client/src/pages/production/dashboard.tsx`
  - Work order status overview
  - Machine utilization metrics
  - Production throughput

---

## Phase 4: Time Tracking

### 4.1 Database Schema

- [ ] Add time tracking models to `apps/server/prisma/schema.prisma`:
  ```
  - TimeEntry (id, employeeId, workOrderId, clockIn, clockOut, breakMinutes, notes)
  - TimesheetPeriod (id, startDate, endDate, status)
  - TimesheetApproval (id, periodId, employeeId, approvedById, approvedAt)
  ```
- [ ] Run `npm run db:generate`

### 4.2 Backend Implementation

- [ ] Create `apps/server/src/routes/time.routes.ts`
- [ ] Create `apps/server/src/services/time/` service layer:
  - `clock.service.ts` - Clock in/out operations
  - `timesheet.service.ts` - Period management, approvals
  - `reporting.service.ts` - Hours summaries, overtime calculations

### 4.3 Frontend Implementation

- [ ] Register time tracking module in `apps/client/src/config/modules.ts`
- [ ] Create `apps/client/src/pages/time-tracking/clock.tsx`
  - Clock in/out interface
  - Current status display
  - Break tracking
- [ ] Create `apps/client/src/pages/time-tracking/timesheet.tsx`
  - Weekly/bi-weekly timesheet view
  - Edit entries
  - Submit for approval
- [ ] Create `apps/client/src/pages/time-tracking/admin.tsx`
  - View all employee timesheets
  - Approve/reject timesheets
  - Generate reports

---

## Phase 5: Service Reports

### 5.1 Backend Implementation

- [ ] Verify `ServiceReport` model exists in schema (or add it)
- [ ] Create `apps/server/src/routes/service.routes.ts`
- [ ] Create `apps/server/src/services/service/report.service.ts`
  - CRUD operations
  - PDF generation
  - Email distribution

### 5.2 Frontend Implementation

- [ ] Create `apps/client/src/pages/service/reports.tsx`
  - List of service reports
  - Create/edit reports
  - Link to customers and configurations
- [ ] Create `apps/client/src/pages/service/report-builder.tsx`
  - Form-based report creation
  - Photo attachments
  - Signature capture

---

## Phase 6: Testing & Quality

### 6.1 Unit Tests

- [ ] Add repository tests in `apps/server/src/__tests__/repositories/`
  - Test base repository methods
  - Test custom repository methods
- [ ] Add service tests in `apps/server/src/__tests__/services/`
  - `quote.service.test.ts`
  - `company.service.test.ts`
  - `form.service.test.ts`
  - `auth.service.test.ts`

### 6.2 Integration Tests

- [ ] Add route tests in `apps/server/src/__tests__/routes/`
  - `auth.routes.test.ts` - Login, logout, token refresh
  - `sales.routes.test.ts` - Company, contact, quote CRUD
  - `form.routes.test.ts` - Form creation, submission
  - `admin.routes.test.ts` - User management, permissions

### 6.3 End-to-End Tests

- [ ] Set up Playwright or Cypress for E2E testing
- [ ] Create critical path tests:
  - User login flow
  - Create quote workflow
  - Form submission workflow
  - Admin user management

### 6.4 Coverage Goals

- [ ] Achieve 50% coverage milestone
- [ ] Achieve 70% coverage milestone
- [ ] Set up coverage reporting in CI/CD

---

## Phase 7: Documentation & Polish

### 7.1 API Documentation

- [ ] Expand Swagger documentation for all endpoints
- [ ] Add request/response examples
- [ ] Document authentication requirements
- [ ] Add error response documentation

### 7.2 Code Documentation

- [ ] Add JSDoc comments to all service methods
- [ ] Document complex business logic
- [ ] Create architecture decision records (ADRs) for major decisions

### 7.3 User Documentation

- [ ] Create user guide for sales module
- [ ] Create user guide for form builder
- [ ] Create admin guide for user management
- [ ] Create data migration guide

---

## Phase 8: Performance & Optimization

### 8.1 Database Optimization

- [ ] Add database indexes for frequently queried fields
- [ ] Optimize slow queries (identify via logging)
- [ ] Implement connection pooling tuning

### 8.2 Caching

- [ ] Expand Redis caching for:
  - User sessions and permissions
  - Catalog data (items, options)
  - Dashboard metrics
- [ ] Implement cache invalidation strategies

### 8.3 Frontend Performance

- [ ] Implement code splitting for large modules
- [ ] Optimize bundle size
- [ ] Add service worker for offline capability
- [ ] Lazy load images and heavy components

---

## Technical Debt Tracker

| Issue | File | Priority | Status |
|-------|------|----------|--------|
| ~~Admin validation missing~~ | `lock.controller.ts` | High | ✅ Done |
| ~~ItemId mapping incomplete~~ | `data-pipeline.ts` | High | ✅ Done |
| ~~Legacy mapping TODO~~ | `legacy.service.ts` | Medium | ✅ Done |
| LLM integration incomplete | `agent.service.ts` | Low | Open |
| ~~Company codes undocumented~~ | `company-details.tsx` | Low | ✅ Done |

---

## Notes

- All schema changes require running `npm run db:generate` in `apps/server`
- Never manually edit auto-generated repository files
- Follow existing patterns in codebase for consistency
- Test locally before pushing to staging
