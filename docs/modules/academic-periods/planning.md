# Academic Periods Module — Remediation Planning

| Field | Value |
|-------|-------|
| **Document ID** | `PLN-AP-2026-001` |
| **Module** | Master Data — Tahun Pelajaran / Academic Periods |
| **Primary Surface** | `src/features/periods/pages/PeriodsPage.jsx` |
| **Classification** | Internal — Engineering & Product |
| **Status** | Draft — Pending stakeholder sign-off |
| **Version** | 1.0 |
| **Last Updated** | 2026-07-17 |
| **Owner** | Engineering (Frontend) |
| **Reviewers** | Product, QA, Data/Backend |

---

## 1. Executive Summary

Modul **Tahun Pelajaran** adalah master data fondasional dalam ERP KoperasiMu. Periode akademik aktif menentukan konteks operasional modul turunan (kelas, siswa, penilaian, keuangan koperasi, laporan).

Audit teknis terhadap `PeriodsPage.jsx` mengidentifikasi **16 isu** yang berpotensi:

- **Runtime failure** (crash UI saat kondisi tertentu)
- **Integritas data** (multi-active period, export/import tidak akurat)
- **Audit trail gap** (riwayat perubahan tidak tampil)
- **Inkonsistensi RBAC** (read-only tidak enforced merata)
- **UX/regresi** (kolom salah, pagination, timeline)

Dokumen ini mendefinisikan **remediation program** tingkat enterprise: prioritas, fase delivery, acceptance criteria, risk register, dan strategi QA/UAT sebelum release ke production.

### 1.1 Business Impact (ERP Context)

| Risk if unresolved | Downstream impact |
|--------------------|-------------------|
| Multiple active periods | Kelas/siswa terikat periode salah; laporan period-over-period invalid |
| Export hanya data aktif | Compliance export & backup tidak representatif |
| Audit timeline broken | SOX-style change tracking gagal untuk modul master |
| Import case corruption | Filter semester & reporting Ganjil/Genap tidak reliable |
| RBAC bypass | Guru/staff read-only masih mutasi master data |

---

## 2. Scope

### 2.1 In Scope

| Area | Components |
|------|------------|
| Page orchestration | `PeriodsPage.jsx` |
| Form & validation | `PeriodFormModal.jsx` |
| Archive lifecycle | `PeriodArchiveModal.jsx`, `PeriodConfirmModals.jsx` |
| Import / Export | `PeriodImportModal.jsx`, `PeriodExportModal.jsx` |
| Shared audit | `AuditTimeline` integration |
| Feature flags | `module.periods`, `access.teacher_academic` |

### 2.2 Out of Scope (Phase 1 Program)

- Database schema migration (kecuali constraint verification)
- Refactor full module split (tracked as Phase 7 — optional)
- Modul turunan (Classes, Students) — hanya regression smoke test
- i18n / multi-tenant period isolation

### 2.3 Assumptions

1. **Single active period invariant** — Hanya satu record `periods.is_active = true` pada satu waktu (enforced DB constraint `23505`).
2. **Semester canonical values** — `Ganjil` | `Genap` (case-sensitive, Title Case).
3. **Soft delete** — Arsip via `deleted_at`; restore sebelum hard delete.
4. **Audit logs** — Table name canonical: `periods` (bukan legacy `academic_years`).

---

## 3. Stakeholders & RACI

| Role | Responsibility | Accountable for |
|------|----------------|-----------------|
| **Product Owner** | Prioritas bisnis, sign-off UAT | Acceptance criteria §8 |
| **Engineering Lead** | Arsitektur fix, PR review | Delivery timeline |
| **Frontend Dev** | Implementasi PR-1 s/d PR-7 | Code quality |
| **QA** | Test plan execution, regression | Release gate §9 |
| **Backend/DB** | Verifikasi constraint & RLS | Data integrity §4.2 |
| **Admin Sekolah** | UAT skenario operasional | Usability sign-off |

**RACI legend:** R = Responsible, A = Accountable, C = Consulted, I = Informed

| Activity | PO | Eng | QA | Backend | Admin |
|----------|----|----|----|---------|-------|
| Issue triage | C | R/A | C | C | I |
| Implementation | I | R/A | I | C | I |
| UAT | A | C | R | I | R |
| Production release | A | R | R | C | I |

---

## 4. Current State Assessment

### 4.1 Architecture Snapshot

```
PeriodsPage (monolith ~3,600 LOC)
├── Data layer      fetchData / fetchArchived → supabase.periods
├── State           filters, pagination, URL sync, selection
├── CRUD            handleSubmit, inline edit, archive/restore
├── Bulk ops        activate, lock, archive
├── Import/Export   XLSX/CSV/PDF pipelines
├── Views           table | timeline
└── Modals          form, archive, audit, confirm
```

### 4.2 Known Good Patterns (Preserve)

- Soft delete + undo toast (single archive)
- URL search param sync (`q`, `semester`, `status`, `page`, …)
- Debounced search input
- Lazy-loaded import/export modals
- Privacy mode integration
- Audit logging via `logAudit()` on mutations

---

## 5. Issue Registry

Semua isu diberi ID permanen untuk tracking (Jira/Linear/GitHub Issues).

| ID | Severity | Priority | Category | Summary | Primary file |
|----|----------|----------|----------|---------|--------------|
| **AP-001** | P0 — Critical | P1 | Runtime | `Warning` icon used but not imported → crash on overlap badge | `PeriodsPage.jsx` |
| **AP-002** | P1 — High | P1 | Data/UX | Smart default `handleAdd` uses `startDate`/`endDate`; modal reads `start_date`/`end_date` | `PeriodsPage.jsx` |
| **AP-003** | P0 — Critical | P1 | Data integrity | New period insert always `is_active: true` regardless of form toggle | `PeriodsPage.jsx` |
| **AP-004** | P0 — Critical | P1 | Data integrity | Bulk activate sets multiple periods active — violates single-active invariant | `PeriodsPage.jsx` |
| **AP-005** | P1 — High | P2 | Reporting | `getExportData` hard-filters `is_active = true` for all scopes | `PeriodsPage.jsx` |
| **AP-006** | P1 — High | P2 | Data integrity | Import commits semester as lowercase (`ganjil`/`genap`) | `PeriodsPage.jsx` |
| **AP-007** | P1 — High | P2 | Compliance | `AuditTimeline` queries `academic_years`; logs write `periods` | `PeriodsPage.jsx` |
| **AP-008** | P2 — Medium | P2 | Data completeness | `fetchData` omits `registration_start` / `registration_end` | `PeriodsPage.jsx` |
| **AP-009** | P2 — Medium | P2 | UX | Table "Tahun Pelajaran" column displays `semester` instead of `academic_year` | `PeriodsPage.jsx` |
| **AP-010** | P2 — Medium | P3 | UX parity | Timeline archive action only visible for **active** periods | `PeriodsPage.jsx` |
| **AP-011** | P2 — Medium | P3 | UX | Page index not reset when search/filters change | `PeriodsPage.jsx` |
| **AP-012** | P3 — Low | P3 | UX | Empty state `colSpan="5"` static; breaks when columns hidden | `PeriodsPage.jsx` |
| **AP-013** | P1 — High | P2 | Validation | Overlap check inconsistent — some paths ignore semester filter | `PeriodsPage.jsx`, `PeriodFormModal.jsx` |
| **AP-014** | P1 — High | P2 | Governance | Inline/modal edit lacks validation; locked periods editable via modal | `PeriodsPage.jsx` |
| **AP-015** | P1 — High | P2 | Security/RBAC | `canEdit` not enforced on import, export, generate, bulk, keyboard shortcuts | `PeriodsPage.jsx` |
| **AP-016** | P2 — Medium | P3 | Feature flag | `module.periods` flag defined but not checked on page | `PeriodsPage.jsx` |

### 5.1 Severity Definitions

| Level | Definition |
|-------|------------|
| **P0 — Critical** | Production crash, data corruption, or audit/compliance failure |
| **P1 — High** | Incorrect business state, misleading reports, or RBAC bypass |
| **P2 — Medium** | Functional gap with workaround; UX inconsistency |
| **P3 — Low** | Cosmetic / layout; no data impact |

---

## 6. Remediation Program — Delivery Phases

### Phase 0 — Program Kickoff & Baseline

**Duration:** 0.5 day  
**Gate:** Stakeholder decisions recorded (§10)

| Task | Deliverable |
|------|-------------|
| Capture baseline behavior | Screen recording + DB snapshot (periods count, active ID) |
| Confirm DB constraints | Verify unique partial index on `is_active`, exclusion constraint `23P01` |
| Create tracking tickets | AP-001 … AP-016 in issue tracker |
| Branch strategy | `fix/periods-remediation` → PR branches per phase |

---

### Phase 1 — Hotfix & Display Correctness

**PR:** `PR-AP-01`  
**Issues:** AP-001, AP-002, AP-009  
**Duration:** 0.25–0.5 day  
**Risk:** Low

| ID | Remediation spec |
|----|------------------|
| AP-001 | Add `Warning` to `@phosphor-icons/react` imports |
| AP-002 | Align smart-default payload: use `start_date`/`end_date` OR extend `PeriodFormModal` to accept both naming conventions |
| AP-009 | Primary cell label = `academic_year`; semester remains badge/subtitle |

**Exit criteria:** Overlap badge renders without error; add-form pre-fills dates; desktop table shows correct year label.

---

### Phase 2 — Data Integrity Core

**PR:** `PR-AP-02`  
**Issues:** AP-003, AP-004, AP-006, AP-008  
**Duration:** 0.5 day  
**Risk:** Medium — touches write paths

| ID | Remediation spec |
|----|------------------|
| AP-003 | Insert with `is_active: Boolean(formData.makeActive)`; if true, deactivate others atomically (transaction or ordered updates with error handling) |
| AP-004 | Bulk activate: **Option A (recommended)** — disable when `selectedIds.length !== 1` + helper text; **Option B** — activate last-selected only + warning toast |
| AP-006 | Normalize semester on import: `trim` → title-case map `{ ganjil: 'Ganjil', genap: 'Genap' }` |
| AP-008 | Extend `fetchData` select: `registration_start, registration_end, locked_at, locked_by` |

**Exit criteria:** Single active invariant holds after create/bulk; import stores canonical semester; edit form shows registration dates.

---

### Phase 3 — Reporting & Audit Compliance

**PR:** `PR-AP-03`  
**Issues:** AP-005, AP-007  
**Duration:** 0.5 day  
**Risk:** Medium

| ID | Remediation spec |
|----|------------------|
| AP-005 | Refactor `getExportData`: remove default active filter; implement scope matrix (§6.3.1) |
| AP-007 | Change `AuditTimeline` prop to `tableName="periods"`; verify `logAudit` recordId alignment |

#### 6.3.1 Export Scope Matrix (Target Behavior)

| Scope | Data source | Filters applied |
|-------|-------------|-----------------|
| `filtered` | Client `filtered` array OR equivalent server query | Mirror UI: search, semester, status, lock, timeStatus |
| `selected` | Rows matching `selectedIds` | None (include active + inactive) |
| `all` | All non-deleted periods | `deleted_at IS NULL` only |

**Exit criteria:** Export row counts match UI expectation per scope; audit history visible for CRUD operations.

---

### Phase 4 — Validation & Governance

**PR:** `PR-AP-04`  
**Issues:** AP-013, AP-014  
**Duration:** 1 day  
**Risk:** Medium

| ID | Remediation spec |
|----|------------------|
| AP-013 | Extract shared util `src/features/periods/utils/periodValidation.js`: `periodsOverlap(a,b)`, `findOverlappingPeriod({ semester, startDate, endDate, excludeId, periods })` — semester-aware |
| AP-014 | `handleInlineSave`: guard locked state, date order, overlap; block `handleEdit` when `is_locked`; disable edit buttons in table/timeline |

**Shared validation module (enterprise pattern):**

```
periodValidation.js
├── normalizeSemester(value)
├── isValidDateRange(start, end)
├── periodsOverlap(a, b)          // same semester only
├── findOverlappingPeriod(...)
└── assertEditable(period, canEdit)
```

**Exit criteria:** Ganjil + Genap same year allowed; same-semester overlap rejected consistently; locked periods immutable.

---

### Phase 5 — UX Parity & Navigation

**PR:** `PR-AP-05`  
**Issues:** AP-010, AP-011, AP-012  
**Duration:** 0.5 day  
**Risk:** Low

| ID | Remediation spec |
|----|------------------|
| AP-010 | Timeline archive button: show for non-active (align table); respect lock state |
| AP-011 | `useEffect` → `setPage(1)` on filter/search/sort/pageSize change |
| AP-012 | Dynamic `colSpan` derived from visible column count |

---

### Phase 6 — RBAC & Module Gating

**PR:** `PR-AP-06`  
**Issues:** AP-015, AP-016  
**Duration:** 0.5 day  
**Risk:** Low–Medium

| ID | Remediation spec |
|----|------------------|
| AP-015 | Centralize `canMutate = canEdit && !submitting`; guard: header menu mutations, bulk bar, shortcuts (`N`, `E`), inline cells, timeline actions |
| AP-016 | `useFlag('module.periods')` — if disabled: render module-unavailable state or redirect per product decision (§10) |

**RBAC matrix (target):**

| Action | `module.periods` | `canEdit` |
|--------|------------------|-----------|
| View list / export read | ✅ | ✅ |
| Create / edit / archive | ✅ | ✅ |
| Import / generate | ✅ | ✅ |
| Bulk mutate | ✅ | ✅ |
| Any mutation | ❌ if module off | ❌ if read-only |

---

### Phase 7 — Technical Debt (Optional Backlog)

**PR:** `PR-AP-07`  
**Duration:** 1–2 days  
**Not blocking release of Phases 1–6**

| Backlog ID | Item |
|------------|------|
| AP-TD-01 | Split monolith into hooks: `usePeriodsData`, `usePeriodsFilters`, `usePeriodsImport`, `usePeriodsExport` |
| AP-TD-02 | Fix `setState during render` (`headerMenuMounted`) → `useEffect` |
| AP-TD-03 | Keyboard handler `useCallback` + complete dependency array |
| AP-TD-04 | Split `submitting` → `isSaving`, `isDeleting`, `isImporting`, `isExporting` |
| AP-TD-05 | `fetchArchived` error propagation + user toast |
| AP-TD-06 | Import template "Kurikulum" column — remove or add to `SYSTEM_COLS` |
| AP-TD-07 | Unit tests for `periodValidation.js` |

---

## 7. Pull Request Strategy

| PR | Phase | Issues | Merge order | Rollback risk |
|----|-------|--------|-------------|---------------|
| PR-AP-01 | 1 | AP-001, 002, 009 | 1st | Low |
| PR-AP-02 | 2 | AP-003, 004, 006, 008 | 2nd | Medium |
| PR-AP-03 | 3 | AP-005, 007 | 3rd | Low |
| PR-AP-04 | 4 | AP-013, 014 | 4th | Medium |
| PR-AP-05 | 5 | AP-010, 011, 012 | 5th | Low |
| PR-AP-06 | 6 | AP-015, 016 | 6th | Low |
| PR-AP-07 | 7 | TD backlog | Post-release | Medium |

**Merge policy:** Each PR requires 1 engineering review + QA sign-off on phase checklist before merge to `main`.

---

## 8. Acceptance Criteria (Program Level)

Program dianggap **COMPLETE** when all conditions met:

### 8.1 Functional

- [ ] Exactly zero or one active period after any create/update/bulk operation
- [ ] No runtime error when overlap exists among active periods
- [ ] Export scopes return correct row sets (verified against UI)
- [ ] Audit timeline displays entries for INSERT/UPDATE on `periods`
- [ ] Import produces `Ganjil`/`Genap` semester values
- [ ] Registration period fields persist and reload on edit
- [ ] Overlap validation is semester-scoped across form, inline, and server error handling

### 8.2 Security & Governance

- [ ] Read-only user cannot mutate via UI, keyboard, or bulk bar
- [ ] Locked period cannot be edited (inline or modal)
- [ ] `module.periods = false` blocks module access per §10 decision

### 8.3 UX

- [ ] Desktop table shows academic year in primary column
- [ ] Filter/search resets pagination to page 1
- [ ] Timeline archive behavior matches table view

### 8.4 Non-functional

- [ ] No new console errors in happy path flows
- [ ] Existing URL bookmarking (`?q=&semester=&page=`) still works
- [ ] Smoke test on Classes module — period dropdown unaffected

---

## 9. QA & UAT Strategy

### 9.1 Test Environments

| Env | Purpose |
|-----|---------|
| Local / Preview | Dev verification per PR |
| Staging | Full regression + UAT |
| Production | Phased release with monitoring |

### 9.2 Regression Test Suite (Manual — Minimum)

| # | Scenario | Expected |
|---|----------|----------|
| T-01 | Create period, makeActive=false | Saved inactive |
| T-02 | Create period, makeActive=true | Only this period active |
| T-03 | Bulk select 2 → Activate | Blocked or single active (per §10) |
| T-04 | Import 5 rows Excel | Canonical semester + no dupes |
| T-05 | Export filtered vs all | Counts match UI |
| T-06 | Open audit history | Logs visible post-edit |
| T-07 | Lock period → try edit | Blocked |
| T-08 | Read-only user → Import | Blocked/hidden |
| T-09 | Overlap badge with 2 active Ganjil | Badge shows, no crash |
| T-10 | Archive → restore → hard delete | Lifecycle intact |

### 9.3 Automated Testing (Phase 7+)

| Layer | Target |
|-------|--------|
| Unit | `periodValidation.js` — overlap, semester normalize |
| Integration | `handleSubmit` mock supabase — active invariant |
| E2E (future) | Critical path: create → activate → export |

---

## 10. Open Decisions (Requires Product Sign-off)

| # | Decision | Options | Recommendation | Status |
|---|----------|---------|----------------|--------|
| D-01 | Bulk activate multi-select | A) Disable if ≠1 selected B) Last-wins + warning | **A** — explicit, ERP-safe | ⏳ Pending |
| D-02 | Locked period edit policy | A) Fully immutable B) Admin override flag | **A** — audit integrity | ⏳ Pending |
| D-03 | `module.periods` off behavior | A) Hide nav B) Disabled page message | **B** — clearer for admins | ⏳ Pending |
| D-04 | Export `filtered` source | A) Client-side from `filtered` B) Server re-query | **A** — WYSIWYG guarantee | ⏳ Pending |

---

## 11. Risk Register

| Risk ID | Description | Likelihood | Impact | Mitigation |
|---------|-------------|------------|--------|------------|
| R-01 | Fix AP-003 breaks existing create flow | Medium | High | Staging UAT T-01/T-02; monitor 23505 errors |
| R-02 | Export refactor changes user workflows | Medium | Medium | Communicate scope matrix; UAT T-05 |
| R-03 | RBAC guards too aggressive — block legit admin | Low | Medium | Test with multiple role fixtures |
| R-04 | Monolith edits introduce regressions | High | Medium | Small PRs; phase gates; smoke Classes |
| R-05 | Legacy data has lowercase semester | Medium | Low | One-time data cleanup script (optional) |

---

## 12. Timeline

| Phase | Duration | Cumulative | Target |
|-------|----------|------------|--------|
| Phase 0 — Kickoff | 0.5 d | 0.5 d | Day 1 AM |
| Phase 1 — Hotfix | 0.5 d | 1 d | Day 1 PM |
| Phase 2 — Data integrity | 0.5 d | 1.5 d | Day 2 AM |
| Phase 3 — Export/Audit | 0.5 d | 2 d | Day 2 PM |
| Phase 4 — Validation | 1 d | 3 d | Day 3 |
| Phase 5 — UX | 0.5 d | 3.5 d | Day 4 AM |
| Phase 6 — RBAC | 0.5 d | 4 d | Day 4 PM |
| QA/UAT buffer | 1 d | 5 d | Day 5 |
| Phase 7 — Tech debt | 1–2 d | — | Post-release |

**Estimated program duration (Phases 0–6 + UAT):** 5 working days  
**With Phase 7 refactor:** +1–2 working days

---

## 13. Release & Rollback Plan

### 13.1 Release

1. Merge PR-AP-01 → PR-AP-06 sequentially to `main`
2. Deploy to staging → execute regression suite §9.2
3. Admin UAT sign-off
4. Deploy to production (off-peak)
5. Post-deploy: verify single active period; spot-check audit log

### 13.2 Rollback

| Trigger | Action |
|---------|--------|
| P0 crash in production | Revert last merged PR; hotfix forward if isolated |
| Data integrity breach (multi-active) | Revert + run SQL script to normalize active flag |
| Export regression | Revert PR-AP-03 only |

### 13.3 Post-Release Monitoring

- Supabase error rate on `periods` table (23505, 23P01)
- Client error logs tagged `[PeriodsPage]`
- Support tickets tagged `academic-periods` (7-day watch)

---

## 14. Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-07-17 | Engineering | Initial remediation plan from code audit |

### Related Documents

- `README.md` — project overview
- `database.md` — schema reference
- Issue tracker: AP-001 … AP-016 (to be created)

---

## 15. Appendix — File Change Map

| File | Phases |
|------|--------|
| `src/features/periods/pages/PeriodsPage.jsx` | 1–6 |
| `src/features/periods/components/PeriodFormModal.jsx` | 4 |
| `src/features/periods/utils/periodValidation.js` | 4 (new) |
| `src/shared/components/AuditTimeline.jsx` | — (consumer fix only in PeriodsPage) |

---

*End of document PLN-AP-2026-001*
