# Planning: Import/Export Enhancement — 12 Feature Suggestions

---

## Phase 1 — Foundation (no new DB tables)
*Built on existing infrastructure, minimal risk*

| # | Feature | Effort | Files |
|---|---------|--------|-------|
| 1 | **Keyboard shortcuts** | S | `PeriodsPage.jsx`, `usePeriodsKeyboard.jsx` |
| 2 | **Clipboard export** | S | `PeriodExportModal.jsx`, hook |
| 3 | **Import progress detail** | M | `usePeriodsImportExport.jsx`, `PeriodImportModal.jsx` |

---

## Phase 2 — Templates (new DB table: `period_export_templates`)
*Save/load mappings & export configs*

| # | Feature | Effort | Files |
|---|---------|--------|-------|
| 4 | **Import template save/load** | M | hook, modal, extend `usePeriodTemplates.jsx` |
| 5 | **Export template save/load** | M | `PeriodExportModal.jsx`, hook |

**DB Schema:**
```sql
CREATE TABLE period_export_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  config jsonb NOT NULL, -- { columns, format, orientation, template, scope }
  created_at timestamptz DEFAULT now()
);
```

---

## Phase 3 — Import Safety (high value, medium effort)
*Protect data before destructive imports*

| # | Feature | Effort | Files |
|---|---------|--------|-------|
| 6 | **Dry run mode** | M | hook (`handleCommitImport` has `dryRun` flag), modal step 3 UI |
| 7 | **Auto-backup sebelum import** | M | hook — export CSV before replace, save to Supabase Storage |
| 8 | **Recent imports** | M | new `useImportHistory.jsx`, Supabase `import_logs` table |

**DB Schema:**
```sql
CREATE TABLE import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imported_at timestamptz DEFAULT now(),
  imported_by uuid REFERENCES auth.users(id),
  file_name text,
  row_count integer,
  strategy text, -- skip/replace/keep
  backup_url text, -- Supabase Storage URL
  column_mapping jsonb
);
```

---

## Phase 4 — Import Power Features
*Advanced import capabilities*

| # | Feature | Effort | Files |
|---|---------|--------|-------|
| 9 | **Multi-file import** | L | `PeriodImportModal.jsx` — multiple file input, merge logic in hook |
| 10 | **Import from URL** | M | hook — fetch from URL, parse xlsx/csv |
| 11 | **Import resume** | L | hook — track import state, resume from last chunk |

---

## Phase 5 — Export Power Features
*Advanced export capabilities*

| # | Feature | Effort | Files |
|---|---------|--------|-------|
| 12 | **Compressed export** | S | hook — use `fflate` or `JSZip` for multi-file/CSV |
| 13 | **Email export** | L | hook + backend API route + email service |

---

## Phase 6 — History & Undo
*Full undo stack*

| # | Feature | Effort | Files |
|---|---------|--------|-------|
| 14 | **Multi-step undo** | L | hook — undo stack array, not just `lastImportedIds` |

**Architecture:**
```js
// Current: single undo
const [lastImportedIds, setLastImportedIds] = useState([])

// New: undo stack
const [undoStack, setUndoStack] = useState([]) // [{ids, timestamp, label}]
```

---

## Dependency Graph

```
Phase 1 (keyboard, clipboard, progress)
    ↓
Phase 2 (import/export templates)
    ↓
Phase 3 (dry run, auto-backup, history)
    ↓
Phase 4 (multi-file, URL import, resume)
    ↓
Phase 5 (compressed export, email)
    ↓
Phase 6 (multi-step undo)
```

---

## Recommended Build Order (MVP)

| Sprint | Features | Est. |
|--------|----------|------|
| **Sprint 1** | Keyboard shortcuts + Clipboard export + Progress detail | 2-3 days |
| **Sprint 2** | Import templates + Export templates | 3-4 days |
| **Sprint 3** | Dry run + Auto-backup + Import logs | 3-4 days |
| **Sprint 4** | Multi-file import + Import from URL | 3-4 days |
| **Sprint 5** | Multi-step undo + Recent imports | 2-3 days |
| **Sprint 6** | Compressed export + Email export | 2-3 days |

**Total: ~15-21 hari kerja**

---

## Key Decisions Needed

1. **Template storage** — extend existing `period_templates` table or create separate `period_export_templates`?
2. **Backup storage** — Supabase Storage bucket `import-backups`?
3. **Email service** — Resend, SendGrid, or existing backend?
4. **Import from URL** — trusted URLs only (whitelist) or open?
5. **Multi-file merge strategy** — append all, or validate no conflicts first?
