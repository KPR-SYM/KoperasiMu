# Planning — Fitur Baru PeriodsPage

## 1. Konfirmasi Bulk Lock/Unlock
**Masalah:** `handleBulkLock` / `handleBulkUnlock` langsung execute tanpa konfirmasi, beda dengan arsip yang pakai modal.

**Solusi:**
- Pakai `ConfirmModal` yang sudah ada (lihat `ArchiveModal`)
- Tampilkan jumlah item yang akan dikunci/dibuka
- Eksekusi hanya setelah user konfirmasi

**File:**
- `src/features/periods/pages/PeriodsPage.jsx` — tambah state `isBulkLockOpen` / `isBulkUnlockOpen`, render `ConfirmModal`
- `src/shared/components/ConfirmModal.jsx` — reusable (cek apakah sudah ada)

---

## 2. Undo Action via Toast
**Masalah:** Setelah arsip/lock/unlock, tidak ada cara cepat untuk membatalkan.

**Solusi:**
- `addToast` sudah tersedia dari hook
- Setelah sukses, tampilkan toast dengan tombol "Urungkan"
- Panggil inverse operation (misal: `handleBulkUnlock` setelah `handleBulkLock`)

**File:**
- `src/features/periods/hooks/usePeriods.js` — tambah logic undo di handler
- `src/features/periods/pages/PeriodsPage.jsx` — render toast action button

---

## 3. Column Visibility Persist
**Masalah:** `visibleCols` di-reset setiap refresh.

**Solusi:**
- Baca/simpan `visibleCols` ke `localStorage` dengan key `periods_visibleCols`
- Fallback ke default jika tidak ada atau corrupt

**File:**
- `src/features/periods/hooks/usePeriods.js` — tambah `useEffect` untuk persist
- Atau di `PeriodsPage.jsx` dengan `useEffect` + `useState` init dari localStorage

---

## 4. Shortcut Privacy Mode (Ctrl+P / Cmd+P)
**Masalah:** Privacy mode cuma bisa di-toggle lewat UI, belum ada keyboard shortcut.

**Solusi:**
- Register `keydown` listener global di `PeriodsPage`
- `Ctrl+P` / `Cmd+P` toggle `isPrivacyMode` (cegah default browser print)

**File:**
- `src/features/periods/pages/PeriodsPage.jsx` — tambah `useEffect` + event listener

---

## 5. Export Selected Items
**Masalah:** Export seluruh data, tidak bisa pilih item tertentu.

**Solusi:**
- Tambah opsi "Export Selected (N)" di dropdown export
- Filter `getExportData` berdasarkan `selectedIds`
- Nonaktifkan jika `selectedIds.length === 0`

**File:**
- `src/features/periods/components/PeriodExportModal.jsx` — tambah radio/checkbox "Export Selected"
- `src/features/periods/hooks/usePeriodsImportExport.jsx` — filter data by selectedIds

---

## 6. Auto-Save Indicator (Debounce + Status)
**Masalah:** Inline edit langsung save, tapi tidak ada indicator sukses/gagal.

**Solusi:**
- Tambah state `saveStatus` (`idle | saving | saved | error`)
- Tampilkan badge kecil "Tersimpan" / "Gagal simpan" setelah edit
- Gunakan `addToast` untuk error

**File:**
- `src/features/periods/pages/PeriodsPage.jsx` — state + indicator UI
- `src/features/periods/hooks/usePeriods.js` — return save status dari `handleInlineSave`

---

## Prioritas Eksekusi

| # | Fitur | Effort | Impact |
|---|-------|--------|--------|
| 1 | Konfirmasi Bulk Lock/Unlock | Kecil | Sedang |
| 2 | Undo Action via Toast | Kecil | Tinggi |
| 3 | Column Visibility Persist | Kecil | Sedang |
| 4 | Shortcut Privacy Mode | Sangat Kecil | Rendah |
| 5 | Export Selected Items | Sedang | Sedang |
| 6 | Auto-Save Indicator | Kecil | Rendah |

**Rekomendasi:** Kerjakan 1→2→3→4→5→6 sesuai effort.
