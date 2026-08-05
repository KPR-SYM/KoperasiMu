# Planning: UUID Migration untuk PeriodDetailPanel

## Context

URL detail periode saat ini pakai numeric ID (`/master/periods/2`), mudah ditebak
dan bisa di-enumerate. User ingin migrasi ke UUID supaya URL lebih aman.

**Status**: Sebelum dikerjakan di PC rumah.

---

## Current Schema (Updated)

### `periods` table
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `int4` | Primary Identity |
| `academic_year` | `varchar` | |
| `semester` | `varchar` | |
| `display_name` | `varchar` | Nullable |
| `start_date` | `date` | |
| `end_date` | `date` | |
| `is_active` | `bool` | |
| `is_locked` | `bool` | |
| `locked_at` | `timestamptz` | Nullable |
| `locked_by` | `uuid` | FK → `profiles.id` |
| `created_at` | `timestamptz` | Nullable |
| `updated_at` | `timestamptz` | Nullable |
| `deleted_at` | `timestamptz` | Soft delete |

### Tables dengan FK ke `periods.id`
1. **`enrollment_waves`** → `period_id` (`int4`) — langsung

### Tables yang akses periods (tanpa FK langsung)
2. **`classes`** → `academic_year` (`varchar`) — bukan FK, string match
3. **`students`** → via `enrollment_waves` — indirect (2 hop)

### Frontend yang akses `periods`
- `PeriodDetailPanel.jsx` — `.eq('id', periodId)`
- `PeriodFormModal` — query periods list
- `PeriodConfirmModals` — archive/delete
- Route: `/master/periods/:periodId`

### Catatan
- `audit_logs.record_id` sudah pakai `varchar` (bukan int) — bisa terima UUID
- RLS policy periods: `can_write_operational()` untuk ALL, `true` untuk SELECT

---

## Opsi: Tambah Kolom UUID vs Ubah PK

### Opsi A: Ubah PK ke UUID (Full Migration)
```
id: int4 → uuid
```
**Pro:**
- Schema clean, tidak ada kolom redundant
- Semua query `.eq('id', ...)` otomatis pakai UUID

**Kontra:**
- Perlu ubah semua FK di `classes`, `enrollment_waves`
- Data existing perlu di-migrate (generate UUID untuk row lama)
- Performa join sedikit lebih lambat (16 bytes vs 8 bytes)
- Risk lebih tinggi — kalau gagal, data correlation rusak

**Effort:** Tinggi (~2-3 jam kerja + testing)

### Opsi B: Tambah Kolom `uuid` Baru (Recommended)
```
+ uuid: uuid (gen_random_uuid(), UNIQUE, INDEXED)
```
**Pro:**
- PK tetap `int4` (performa join optimal)
- Zero downtime — kolom baru bisa ditambah tanpa ubah existing
- Query existing tidak berubah
- URL pakai UUID, internal logic tetap pakai int ID

**Kontra:**
- Ada kolom tambahan (16 bytes per row)
- Perlu 2 query: `WHERE uuid = ?` → get ID, lalu query by ID

**Effort:** Rendah (~30-45 menit)

---

## Rekomendasi: Opsi B (Tambah Kolom UUID)

### Alasan
1. **Minimal risk** — tidak ubah PK, tidak ubah FK
2. **Zero downtime** — tambah kolom baru tanpa lock table
3. **Rollback mudah** — hapus kolom uuid, balik ke numeric ID
4. **Performa** — UUID hanya untuk URL, join tetap pakai int
5. **Hanya 1 FK langsung** (`enrollment_waves`) — migration sangat simpel
6. **`audit_logs.record_id` sudah `varchar`** — bisa terima UUID tanpa ubah schema

---

## Implementation Plan (Opsi B)

### Phase 1: Database Migration
```sql
-- 1. Tambah kolom uuid
ALTER TABLE periods ADD COLUMN uuid uuid DEFAULT gen_random_uuid();

-- 2. Generate UUID untuk data existing
UPDATE periods SET uuid = gen_random_uuid() WHERE uuid IS NULL;

-- 3. Set NOT NULL setelah semua row punya UUID
ALTER TABLE periods ALTER COLUMN uuid SET NOT NULL;

-- 4. Unique constraint
ALTER TABLE periods ADD CONSTRAINT periods_uuid_unique UNIQUE (uuid);

-- 5. Index untuk query by UUID
CREATE INDEX idx_periods_uuid ON periods (uuid);

-- 6. (Optional) Tambah kolom uuid di enrollment_waves juga
-- Supaya enrollment_waves juga bisa pakai UUID reference
ALTER TABLE enrollment_waves ADD COLUMN period_uuid uuid;
UPDATE enrollment_waves ew
  SET period_uuid = p.uuid
  FROM periods p
  WHERE ew.period_id = p.id;
ALTER TABLE enrollment_waves ALTER COLUMN period_uuid SET NOT NULL;

-- 7. Verifikasi
SELECT id, uuid, academic_year FROM periods;
SELECT id, period_id, period_uuid, name FROM enrollment_waves;
```

### Phase 2: Frontend Changes

#### A. Route Change
```js
// Sebelum
<Route path="/master/periods/:periodId" element={<PeriodDetailPanel />} />

// Sesudah — support UUID
<Route path="/master/periods/:periodId" element={<PeriodDetailPanel />} />
// periodId sekarang bisa numeric ATAU UUID
```

#### B. PeriodDetailPanel.jsx
```js
// Fetch: support both numeric ID dan UUID
const fetchPeriod = useCallback(async () => {
    // Coba fetch by UUID dulu
    let query = supabase.from('periods').select('*').is('deleted_at', null)
    
    // Detect apakah periodId adalah UUID atau numeric
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(periodId)
    
    if (isUUID) {
        query = query.eq('uuid', periodId)
    } else {
        query = query.eq('id', periodId)
    }
    
    const { data, error } = await query.single()
    // ...
}, [periodId])
```

#### C. Navigation Updates
```js
// Semua navigate() yang ke detail period
navigate(`/master/periods/${period.uuid}`)  // pakai UUID

// Bukan:
navigate(`/master/periods/${period.id}`)    // jangan pakai numeric ID
```

#### D. List/Table Updates
```js
// Period list/table — link ke UUID
<Link to={`/master/periods/${period.uuid}`}>
    {period.academic_year}
</Link>
```

### Phase 3: Copy Summary (Bonus)
```js
// Ringkasan termasuk URL lengkap
const summary = `...
URL: ${window.location.origin}/master/periods/${period.uuid}
...`
```

---

## Rollback Plan

Kalau ada masalah:
```sql
-- Hapus kolom uuid di enrollment_waves
ALTER TABLE enrollment_waves DROP COLUMN period_uuid;

-- Hapus kolom uuid di periods
ALTER TABLE periods DROP COLUMN uuid;
```

Frontend otomatis fallback ke numeric ID (karena detection logic).

---

## Testing Checklist

- [ ] Semua data existing periods punya UUID
- [ ] Semua data existing enrollment_waves punya period_uuid
- [ ] Query periods by UUID return data yang benar
- [ ] Query periods by numeric ID masih jalan (backward compat)
- [ ] Query enrollment_waves by period_uuid jalan
- [ ] Navigate ke detail period pakai UUID works
- [ ] Copy summary include URL dengan UUID
- [ ] Neighboring periods navigation pakai UUID
- [ ] Copy ID button copy UUID, bukan numeric ID
- [ ] Modal form submit tetap jalan
- [ ] Lock/unlock/activate/deactivate tetap jalan
- [ ] Archive modal tetap jalan
- [ ] Keyboard shortcuts tetap jalan
- [ ] Audit log tetap jalan (record_id sudah varchar, aman)
- [ ] Import wizard yang pakai periods tetap jalan

---

## Notes

- `database.md` perlu di-update setelah migration
- Pastikan Supabase RLS tidak terpengaruh (UUID vs int)
- Pertimbangkan apakah audit log `recordId` juga perlu pakai UUID
