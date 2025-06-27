# Refactoring Plan for SWG Crafter

This document outlines the identified areas for refactoring in the SWG Crafter codebase, organized by priority and complexity.

## 🎯 **Refactoring Priorities**

### **HIGH PRIORITY**

#### 1. Architecture Compliance Violations ⚠️

**Status**: ✅ COMPLETED  
**Files Affected**:

- ~~`src/routes/resources/+page.server.ts`~~ ✅ Fixed
- ~~`src/routes/resources/[id]/+page.server.ts`~~ ✅ Fixed

**Issues**:

- ~~Both files directly import and use `$lib/data` functions instead of using API endpoints~~ ✅ Resolved
- ~~Violates our established guideline: "SvelteKit loading functions should fetch data from the API endpoints, not from the database directly"~~ ✅ Compliant

**Completed Changes**:

- ✅ Updated `resources/+page.server.ts` to use `/api/resources` endpoint with proper query parameters
- ✅ Updated `resources/[id]/+page.server.ts` to use `/api/resources/[id]` endpoint
- ✅ Removed direct `$lib/data` imports from these page server files
- ✅ Added proper error handling and fallback values

**Benefits**: Consistent architecture, better separation of concerns, easier testing

---

#### 2. Types Consolidation

**Status**: ✅ COMPLETED  
**Files Affected**: `src/lib/types.ts` (440+ lines) → Multiple focused files

**Issues**:

- ~~Single massive types file with mixed concerns (inventory, resources, schematics, mails, sales)~~ ✅ Resolved
- ~~Many utility functions mixed with type definitions~~ ✅ Organized
- ~~Hard to navigate and maintain~~ ✅ Improved

**Completed Structure**:

```
src/lib/types/
├── index.ts              # ✅ Re-exports all types
├── inventory.ts          # ✅ Inventory, InventoryItem, Settings types
├── schematics.ts         # ✅ Schematic, SchematicComponent, SchematicResource
├── resources.ts          # ✅ Resource, ResourceAttributes, ResourceStats
├── sales.ts              # ✅ MailData, Sale, MailImport, MailBatch
└── ships.ts              # ✅ ShipLoadout, ShipChassis types
```

**Legacy Support**: ✅ Old `src/lib/types.ts` maintained for backward compatibility

**Benefits**: Better organization, easier imports, reduced cognitive load, domain-focused modules

---

#### 3. Database Layer Consolidation

**Status**: High Impact  
**Files Affected**: `src/lib/data/database.ts` (300+ lines)

**Issues**:

- Very long database file with many table creation functions
- Multiple table creation functions could be modularized
- Database initialization scattered across multiple files

**Proposed Structure**:

```
src/lib/data/
├── database/
│   ├── index.ts          # Main database functions
│   ├── init.ts           # Database initialization
│   ├── tables/
│   │   ├── inventory.ts  # Inventory table creation
│   │   ├── schematics.ts # Schematics table creation
│   │   ├── resources.ts  # Resources table creation
│   │   ├── mails.ts      # Mails & sales tables
│   │   └── loadouts.ts   # Loadouts & chassis tables
│   └── migrations.ts     # Database migrations
```

**Benefits**: Better separation of concerns, easier testing, reduced complexity

---

### **MEDIUM PRIORITY**

#### 4. API Route Duplication

**Files Affected**: `src/routes/api/chat/+server.ts`, various API endpoints

**Issues**:

- Repeated function calling tool definitions
- Similar error handling patterns across multiple API routes
- Inventory analysis logic could be shared

**Proposed Changes**:

- Create `src/lib/api/` utilities for common patterns
- Extract OpenAI function tools to shared module
- Standardize error handling across all API routes

---

#### 5. Component Table Rendering

**Files Affected**:

- `src/routes/schematics/[id]/+page.svelte`
- `src/routes/resources/+page.svelte`
- `src/lib/components/DataTable.svelte`

**Issues**:

- Repeated table HTML structures
- Similar filtering and search logic
- Manual table row styling patterns

**Proposed Changes**:

- Enhance `DataTable.svelte` component with more flexible rendering
- Create reusable table cell components
- Standardize table styling and responsive behavior

---

#### 6. Data Processing Functions

**Files Affected**:

- `src/lib/data/schematics.ts`
- `src/lib/data/resources.ts`

**Issues**:

- Large processing functions (100+ lines)
- XML parsing logic mixed with business logic
- Similar caching patterns across different data types

**Proposed Changes**:

- Split large functions into smaller, focused utilities
- Extract XML parsing to shared utilities
- Create common caching interface

---

### **LOW PRIORITY**

#### 7. Resource Class Functions

**Files Affected**:

- `src/lib/data/resource-functions.ts`
- `src/lib/data/resource-tree-importer.ts`

**Issues**:

- Some function overlap between files
- Long attribute extraction functions

**Proposed Changes**:

- Consolidate overlapping functions
- Break down attribute extraction into smaller utilities

---

## 📋 **Implementation Plan**

### Phase 1: Critical Fixes ✅ COMPLETED

1. ✅ **Fix Architecture Violations** - Updated resource page servers to use API endpoints
2. ✅ **Types Split** - Broke down the monolithic types file into focused modules

### Phase 2: Core Refactoring (Week 2-3)

3. **Database Modularization** - Split database creation into modules
4. **API Utilities** - Extract common API patterns

### Phase 3: Component Enhancement (Week 4)

5. **Enhanced DataTable** - Improve table component reusability
6. **Data Processing** - Split large processing functions

### Phase 4: Polish (Week 5)

7. **Resource Functions** - Clean up remaining overlaps

---

## ✅ **Success Criteria**

- [x] All page servers use API endpoints (no direct `$lib/data` imports in page servers)
- [x] Types are organized into logical modules
- [ ] Database initialization is modular and testable
- [ ] No function duplication across API routes
- [ ] Table rendering is handled by reusable components
- [ ] All functions are under 50 lines
- [ ] Build times remain fast
- [ ] All tests pass

---

## 🔄 **Continuous Compliance**

After refactoring, we should:

1. **Add linting rules** to prevent direct `$lib/data` imports in page servers
2. **Update Copilot instructions** to reflect new structure
3. **Create documentation** for the new architecture patterns
4. **Add tests** for critical refactored components

---

_Last Updated: June 27, 2025_
