# Shared Component Library — Refactoring Plan

## Goals

1. **Eliminate Duplikasi** — Extract 10+ pola UI yang di-copy-paste di 4-6 modul jadi shared components
2. **Konsistensi** — Satu sumber kebenaran untuk styling, behavior, dan accessibility
3. **Maintainability** — Bug fix dan improvement otomatis ke semua modul
4. **Developer Experience** — Module developer tinggal config, tidak perlu rebuild UI dari scratch

## Architecture

```
src/shared/components/
├── Badge.jsx              ← NEW: StatusBadge, RoleBadge, NotifBadge
├── Tabs.jsx               ← NEW: Pill, Underline, Segmented variants
├── DropdownMenu.jsx       ← NEW: Portaled dropdown with backdrop
├── DebouncedSearchInput.jsx ← NEW: Search + debounce + loading
├── Alert.jsx              ← NEW: Warning, Info, Error banners
├── ViewSwitcher.jsx       ← NEW: Table/Card/List toggle
├── Dropzone.jsx           ← NEW: Drag-and-drop file upload
├── ImportWizard/
│   ├── index.js           ← Export
│   ├── ImportWizardModal.jsx  ← Shell: 3-step wizard
│   ├── StepIndicator.jsx      ← Stepper circles
│   ├── StepUpload.jsx         ← Drag-drop + file info
│   ├── StepMapping.jsx        ← Column mapping dropdowns
│   ├── StepReview.jsx         ← Preview table + validation
│   ├── EditableCell.jsx       ← Portal-based cell editor
│   └── useImportWizard.js     ← Shared hook (state + logic)
├── DataTable.jsx          ← ENHANCE: Sorting, selection, column visibility (merge with DataDisplay)
├── Modal.jsx              ← EXISTING (no changes)
├── ... (existing components)
```

## ERD — Component Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                        │
│                                                                 │
│  StudentsPage  TeachersPage  ClassesPage  PeriodsPage  DormsPage│
│       │              │            │            │           │     │
│       ▼              ▼            ▼            ▼           ▼     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              MODULE-SPECIFIC CONFIG                     │    │
│  │  { systemCols, parseRow, validateRow, commitRow, ... } │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            │                                     │
│                            ▼                                     │
├─────────────────────────────────────────────────────────────────┤
│                     SHARED COMPONENT LAYER                       │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │  Badge   │ │   Tabs   │ │Dropdown  │ │DebouncedSearch   │   │
│  │          │ │          │ │Menu      │ │Input             │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │  Alert   │ │  View    │ │Dropzone  │ │ ImportWizard     │   │
│  │          │ │ Switcher │ │          │ │ ┌──────────────┐ │   │
│  └──────────┘ └──────────┘ └──────────┘ │ │Modal         │ │   │
│                                          │ │StepIndicator │ │   │
│  ┌──────────────────────────────────┐   │ │StepUpload    │ │   │
│  │         DataTable (enhanced)     │   │ │StepMapping   │ │   │
│  │  sort │ select │ col visibility │   │ │StepReview    │ │   │
│  │  │ inline edit │ drag reorder   │   │ │EditableCell  │ │   │
│  └──────────────────────────────────┘   │ │useImportWiz  │ │   │
│                                          │ └──────────────┘ │   │
│                                          └──────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                       BASE UI LAYER                             │
│  Modal  Pagination  Skeleton  Checkbox  RichSelect  PageHeader │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Phases

---

### Phase 1: Quick Wins (Estimated: 1-2 days)
**Goal:** 3 components baru, immediate impact di 4-6 modul

#### 1.1 Badge / StatusBadge
**Duplicated di:** Attendance (StatusBadge), Counseling (urgency/category), Admin (RoleBadge), SlimTopBar (NotifBadge)

**Component API:**
```jsx
<Badge
  color="emerald"          // emerald | rose | amber | indigo | purple | sky | slate
  variant="soft"           // soft | solid | outline
  dot                      // show dot indicator
  icon={ClockIcon}         // optional leading icon
  removable                // show X button
  onRemove={() => {}}
>
  Aktif
</Badge>

// Preset wrappers:
<StatusBadge status="active" />    // auto color from status
<RoleBadge role="admin" />         // auto color from role
```

**Impact:** 4 files updated, ~200 lines of inline badge code eliminated

#### 1.2 DebouncedSearchInput
**Duplicated di:** Students, Teachers, Classes, Periods (DebouncedSearchInput.jsx)

**Component API:**
```jsx
<DebouncedSearchInput
  value={searchQuery}
  onChange={setSearchQuery}
  placeholder="Cari..."
  loading={loading}
  onFocus={() => searchInputRef.current?.focus()}
  ref={searchInputRef}
  shortcutKey="f"          // optional: Ctrl+K focus
  debounceMs={350}
/>
```

**Impact:** 4 files updated, ~150 lines eliminated

#### 1.3 Alert / Banner
**Duplicated di:** SettingsPage (maintenance warning), PeriodsPage (overlap/gap banners), import modals

**Component API:**
```jsx
<Alert
  variant="warning"        // warning | error | info | success
  icon={Warning}
  title="12 periode tumpang tindih"
  action={<button>Filter</button>}
  onClose={() => {}}
  dismissible
/>
```

**Impact:** 6+ inline alerts standardized

**Phase 1 Deliverables:**
- [ ] Create `Badge.jsx`
- [ ] Create `DebouncedSearchInput.jsx`
- [ ] Create `Alert.jsx`
- [ ] Update `index.js` exports
- [ ] Migrate: AttendancePage, CounselingPage, UserPage → Badge
- [ ] Migrate: StudentsPage, TeachersPage, ClassesPage → DebouncedSearchInput
- [ ] Migrate: PeriodsPage alerts, SettingsPage alert → Alert
- [ ] Build verification

---

### Phase 2: Medium Components (Estimated: 2-3 days)
**Goal:** 3 components baru, eliminate portaled dropdown + tab duplication

#### 2.1 Tabs
**Duplicated di:** DormsPage (pill), SettingsPage (pill+icon), CounselingPage (view switcher), PlaygroundPage (pill+count), TeacherProfileModal (underline)

**Component API:**
```jsx
<Tabs
  value={activeTab}
  onChange={setActiveTab}
  variant="pill"           // pill | underline | segmented
  size="sm"                // sm | md
  fullWidth                // stretch to container width
  items={[
    { key: "list", label: "Tabel", icon: Table, count: 12 },
    { key: "timeline", label: "Lini Masa", icon: Clock },
    { key: "calendar", label: "Kalender", icon: Calendar },
  ]}
/>
```

**Impact:** 5+ files updated, ~300 lines eliminated

#### 2.2 DropdownMenu
**Duplicated di:** TeachersPage, ClassesPage, EnrollmentPage, PeriodsHeaderMenu, PeriodsShortcutMenu (7 locations with identical portal + positioning logic)

**Component API:**
```jsx
<DropdownMenu
  trigger={
    <button className="h-9 w-9 rounded-lg ...">
      <SlidersHorizontal />
    </button>
  }
  items={[
    { key: "import", label: "Import", icon: FileArrowUp, onClick: handleImport },
    { key: "export", label: "Export", icon: FileArrowDown, onClick: handleExport },
    { type: "separator" },
    { key: "archive", label: "Arsip", icon: Archive, onClick: handleArchive, disabled: !canEdit },
  ]}
  align="end"              // start | end
  width="w-56"
/>
```

**Impact:** 5+ files updated, ~500 lines eliminated

#### 2.3 ViewSwitcher
**Duplicated di:** CounselingPage, DormTabPlotting, PeriodsToolbar, NewsListPage

**Component API:**
```jsx
<ViewSwitcher
  value={viewMode}
  onChange={setViewMode}
  views={[
    { key: "table", icon: Table },
    { key: "card", icon: CardsThree },
    { key: "list", icon: List },
  ]}
/>
```

**Impact:** 4 files updated, ~100 lines eliminated

**Phase 2 Deliverables:**
- [ ] Create `Tabs.jsx`
- [ ] Create `DropdownMenu.jsx`
- [ ] Create `ViewSwitcher.jsx`
- [ ] Update `index.js` exports
- [ ] Migrate: DormsPage, SettingsPage, CounselingPage → Tabs
- [ ] Migrate: TeachersPage, ClassesPage, PeriodsPage header menus → DropdownMenu
- [ ] Migrate: PeriodsToolbar, CounselingPage → ViewSwitcher
- [ ] Build verification

---

### Phase 3: Dropzone + Alert Enhancement (Estimated: 1-2 days)
**Goal:** Standardize file upload pattern across codebase

#### 3.1 Dropzone / FileUpload
**Duplicated di:** StudentBulkPhotoModal, 6 import modals, SettingsPage (signature), EnrollmentPaymentModal

**Component API:**
```jsx
<Dropzone
  accept={[".csv", ".xlsx"]}
  maxSize={10 * 1024 * 1024}   // 10MB
  onFileSelect={handleFileSelect}
  dragOver={dragOver}
  onDragOver={setDragOver}
  icon={UploadSimple}
  title="Seret file ke sini"
  subtitle="atau klik untuk memilih"
  loading={processing}
  error={error}
/>
```

**Impact:** 8+ inline dropzones standardized

#### 3.2 Enhance Alert → Toast-ready
**Add:** `useAlert` hook that can trigger alerts as toast or inline

**Phase 3 Deliverables:**
- [ ] Create `Dropzone.jsx`
- [ ] Migrate: all import modals, StudentBulkPhotoModal, SettingsPage
- [ ] Build verification

---

### Phase 4: Import Wizard (Estimated: 5-7 days) ← **Biggest ROI**
**Goal:** Eliminate ~5000 lines of duplicated import logic across 6 modules

#### Current State (Per Module)
```
Students:  StudentImportModal.jsx (788 lines)  + useStudentsImportExport.jsx (884 lines)  = 1672 lines
Teachers:  TeacherImportModal.jsx (~730 lines) + useTeachersImportExport.jsx (527 lines)  = 1257 lines
Classes:   ClassImportModal.jsx  (406 lines)  + inline in ClassesPage.jsx (~150 lines)   =  556 lines
Enrollment: EnrollmentImportModal.jsx (~740 lines) + useEnrollmentImportExport.jsx (734 lines) = 1474 lines
Periods:   PeriodImportModal.jsx (~800 lines)  + usePeriodsImportExport.jsx (627 lines)  = 1427 lines
Dorms:     DormsImportModal.jsx  (615 lines)  + inline in useDormsData.jsx (~285 lines)  =  900 lines
─────────────────────────────────────────────────────────────────────────────────────────────
TOTAL: ~7286 lines → Target: ~800 lines shared + 6 × ~100 lines config = ~1400 lines (80% reduction)
```

#### 4.1 Shared Hook: `useImportWizard(config)`
```javascript
// src/shared/components/ImportWizard/useImportWizard.js

export function useImportWizard(config) {
  // ── All 20+ state variables (identical across modules) ──
  const [importStep, setImportStep] = useState(1)
  const [importFileName, setImportFileName] = useState("")
  const [importPreview, setImportPreview] = useState([])
  const [importColumnMapping, setImportColumnMapping] = useState({})
  const [importIssues, setImportIssues] = useState([])
  const [importEditCell, setImportEditCell] = useState(null)
  const [importDragOver, setImportDragOver] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [importSkipDupes, setImportSkipDupes] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 })
  const [importValidationOpen, setImportValidationOpen] = useState(false)
  const [importRawData, setImportRawData] = useState([])
  const [importFileHeaders, setImportFileHeaders] = useState([])
  const importFileInputRef = useRef(null)

  // ── Computed (identical) ──
  const importReadyRows = useMemo(() =>
    importPreview.filter(r => !r._hasError && !(importSkipDupes && r._isDupe)),
    [importPreview, importSkipDupes]
  )
  const hasImportBlockingErrors = useMemo(() =>
    importPreview.some(r => r._hasError),
    [importPreview]
  )

  // ── Shared logic (config-driven) ──
  // processImportFile: uses config.systemCols for auto-mapping
  // handleImportCellEdit: generic row update + revalidate
  // handleRemoveImportRow: filter + revalidate
  // handleDownloadTemplate: uses config.templateColumns + templateSampleData

  // ── Module-specific (from config) ──
  // config.parseRow(raw) → normalized object
  // config.validateRow(row, idx, ctx) → issues[]
  // config.commitRow(row) → Promise<void>
  // config.editableColumnTypes → { colKey: { type, options/list } }

  return { /* all state + handlers */ }
}
```

#### 4.2 Shared UI Components
```
ImportWizardModal.jsx    ← 3-step shell (Step 1/2/3)
├── StepIndicator.jsx    ← Stepper circles (pure presentational)
├── StepUpload.jsx       ← Dropzone + file status bar
├── StepMapping.jsx      ← Column mapping dropdowns
├── StepReview.jsx       ← Preview table + validation panel + stats bar
└── EditableCell.jsx     ← Portal-based cell editor (config-driven)
```

#### 4.3 Per-Module Config (~50-100 lines each)
```javascript
// src/features/students/config/importConfig.js

export const studentsImportConfig = {
  moduleName: "students",
  tableName: "students",

  systemCols: [
    { key: "name", label: "Nama Lengkap", synonyms: ["nama", "full_name"], required: true },
    { key: "class_name", label: "Kelas", synonyms: ["class", "rombel"], required: true },
    // ... 12 more columns
  ],

  parseRow: (raw) => ({
    name: raw["Nama Lengkap"] || raw["nama"] || "",
    class_name: raw["Kelas"] || raw["class"] || "",
    // ... transform all fields
  }),

  validateRow: (row, idx, ctx) => {
    const issues = []
    if (!row.name) issues.push({ level: "error", message: "Nama wajib diisi" })
    // ... validation rules
    return issues
  },

  editableColumnTypes: {
    class_id: { type: "fk", list: ctx.classesList, displayKey: "name", searchKeys: ["name"] },
    gender: { type: "enum", options: [{ id: "L", name: "Laki-laki" }, { id: "P", name: "Perempuan" }] },
  },

  commitRow: async (row, ctx) => {
    await ctx.supabase.from("students").insert({ ... })
  },

  templateColumns: [
    { header: "Nama Lengkap", width: 30 },
    { header: "Kelas", width: 15 },
  ],
  templateSampleData: [
    { "Nama Lengkap": "Ahmad Rizki", "Kelas": "XII IPA 1" },
  ],
  templateFilename: "template_siswa.xlsx",
}
```

#### 4.4 Migration Strategy (per module)
1. Create config file (~50-100 lines)
2. Replace import modal with `<ImportWizardModal config={config} state={wizardState} />`
3. Replace hook with `useImportWizard(config)`
4. Delete old modal + hook files
5. Verify import flow works end-to-end

**Phase 4 Deliverables:**
- [x] Create `ImportWizard/useImportWizard.js`
- [x] Create `ImportWizard/ImportWizardModal.jsx`
- [x] Create `ImportWizard/StepIndicator.jsx`
- [x] Create `ImportWizard/StepUpload.jsx`
- [x] Create `ImportWizard/StepMapping.jsx`
- [x] Create `ImportWizard/StepReview.jsx`
- [x] Create `ImportWizard/EditableCell.jsx`
- [x] Create `ImportWizard/index.js`
- [x] Create per-module config: students, teachers, classes, enrollment, periods, dorms
- [ ] Migrate: Students → ImportWizard (test import flow) — *in progress*
- [ ] Migrate: Teachers → ImportWizard (test import flow)
- [ ] Migrate: Classes → ImportWizard (test import flow)
- [ ] Migrate: Enrollment → ImportWizard (test import flow)
- [ ] Migrate: Periods → ImportWizard (test import flow)
- [ ] Migrate: Dorms → ImportWizard (test import flow)
- [ ] Delete old modal + hook files
- [ ] Build verification
- [ ] Full regression test on all 6 import flows

---

### Phase 5: DataTable Enhancement (Estimated: 3-4 days)
**Goal:** Merge existing `DataTable` from DataDisplay.jsx with table patterns in PeriodsTable, StudentsTable, etc.

#### Current State
- `DataDisplay.jsx` has a basic `DataTable` (column defs, loading, empty, row click)
- PeriodsTable, StudentsTable, etc. each build their own table with sorting, column visibility, selection, inline edit

#### Enhanced DataTable API
```jsx
<DataTable
  columns={columns}
  data={paged}
  loading={loading}
  emptyState={<EmptyState ... />}

  // Selection
  selectedIds={selectedIds}
  onSelect={toggleSelect}
  onSelectAll={toggleSelectAll}
  selectable

  // Sorting
  sortable
  sortBy={sortBy}
  onSort={setSortBy}

  // Column visibility
  visibleCols={visibleCols}
  onToggleCol={setVisibleCols}
  columnMenuRef={colMenuRef}

  // Inline edit
  inlineEditCell={inlineEditCell}
  onInlineEdit={handleInlineSave}

  // Row actions
  onRowClick={handleOpenReadOnlyDetail}
  rowActions={(row) => [
    { icon: Pencil, label: "Edit", onClick: () => handleEdit(row) },
    { icon: Clock, label: "Riwayat", onClick: () => handleOpenHistory(row) },
  ]}

  // Privacy
  isPrivacyMode={isPrivacyMode}
  maskValue={maskValue}

  // Rendering
  renderCell={(value, row, col) => /* custom render */}
  renderMobileCard={(row) => /* mobile card view */}
/>
```

**Phase 5 Deliverables:**
- [ ] Enhance `DataDisplay.jsx` DataTable with sorting, selection, column menu
- [ ] Create `DataTable` sub-components: `TableHeader`, `TableBody`, `TableRow`, `ColumnMenu`
- [ ] Migrate: PeriodsTable → enhanced DataTable
- [ ] Migrate: StudentsTable → enhanced DataTable
- [ ] Verify mobile responsiveness
- [ ] Build verification

---

## Summary — Line Count Impact

| Phase | Components | Before | After | Reduction |
|-------|-----------|--------|-------|-----------|
| 1 | Badge, SearchInput, Alert | ~350 lines | ~200 lines | 43% |
| 2 | Tabs, Dropdown, ViewSwitcher | ~900 lines | ~400 lines | 56% |
| 3 | Dropzone | ~300 lines | ~100 lines | 67% |
| 4 | ImportWizard (6 modules) | ~7286 lines | ~1400 lines | 81% |
| 5 | DataTable | ~2000 lines | ~800 lines | 60% |
| **Total** | | **~10,836 lines** | **~2,900 lines** | **73%** |

## Execution Order

```
Phase 1 (Quick Wins)          ← Start here, immediate value
    ↓
Phase 2 (Medium Components)   ← Build on Phase 1 patterns
    ↓
Phase 3 (Dropzone)            ← Prep for Phase 4
    ↓
Phase 4 (Import Wizard)       ← Biggest ROI, depends on Phase 1-3
    ↓
Phase 5 (DataTable)           ← Independent, can run in parallel
```

## Risk Mitigation

1. **Build verification** — Run `npx vite build --logLevel silent` after each component
2. **Incremental migration** — Migrate one module at a time, verify, then next
3. **Feature parity** — Each migrated module must pass same manual test flow
4. **Rollback plan** — Keep old files until new implementation verified
5. **No breaking changes** — New components are additive; old code still works
