# Planning — Fitur Baru PeriodsPage

## Status Eksekusi: ✅ SELESAI (6/6)

| # | Fitur | Status | Keterangan |
|---|-------|--------|------------|
| 1 | Konfirmasi Bulk Lock/Unlock | ✅ | `LockModal` & `UnlockModal` di `PeriodConfirmModals.jsx` |
| 2 | Undo Action via Toast | ✅ | `addUndoToast` di `handleBulkLock`/`handleBulkUnlock` (6 detik) |
| 3 | Column Visibility Persist | ✅ | **Sudah ada** — `localStorage` key `periods_visibleCols` |
| 4 | Shortcut Privacy Mode (Ctrl+P) | ✅ | `useEffect` keydown listener, cegah print dialog |
| 5 | Export Selected Items | ✅ | **Sudah ada** — scope "Semua" / "Dipilih (N)" |
| 6 | Auto-Save Indicator | ✅ | Pill badge "Menyimpan... / Tersimpan / Gagal Simpan" |

---

## Ringkasan Perubahan

### Feature 1 — `PeriodConfirmModals.jsx`
- Tambah `LockModal` (ikon Lock, rose) dan `UnlockModal` (ikon LockOpen, emerald)
- Props: `isOpen, onClose, selectedCount, onConfirm, submitting`
- Body: "Sebanyak N periode akan dikunci/dibuka kembali"

### Feature 2 — `usePeriodsCore.jsx`
- Buat helper `setLockStatus(ids, locked)` reusable
- `handleBulkLock`: simpan `const ids = [...selectedIds]`, panggil `setLockStatus(ids, true)`, lalu `addUndoToast("Dikunci (N periode)", handler undo)`
- `handleBulkUnlock`: sama, inverse `locked` value

### Feature 4 — `PeriodsPage.jsx`
- `useEffect` global keydown: `Ctrl+P` / `Cmd+P` → `e.preventDefault()` + toggle `isPrivacyMode`

### Feature 6 — `usePeriodsCore.jsx` + `PeriodsPage.jsx`
- State `saveStatus: "idle" | "saving" | "saved" | "error"`
- `handleInlineSave`: set "saving" → "saved" (success, reset 2s) / "error" (fail, reset 2s)
- Badge absolute top-right di container data view

### Tidak perlu diubah (sudah ada)
- Feature 3: Column persist via localStorage
- Feature 5: Export scope "Semua" / "Dipilih"
- Pre-existing lint errors (9 errors, semua pre-existing hook destructuring)

---

## Build
- `vite build` — ✅ lulus
- `eslint PeriodsPage.jsx` — 9 errors (semua pre-existing)
- `eslint PeriodConfirmModals.jsx` — clean
- `eslint usePeriodsCore.jsx` — 2 pre-existing errors
