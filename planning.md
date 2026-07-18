# Planning — Fitur Baru PeriodsPage (Tahun Pelajaran)

Dokumen ini merangkum rencana pengembangan fitur baru untuk modul **Periods / Tahun Pelajaran**
(`src/features/periods/`). Setiap fitur dilengkapi tujuan, detail teknis, referensi ke kode
yang sudah ada, estimasi effort, dan kriteria selesai (acceptance criteria).

---

## Konteks Saat Ini

Modul Periods sudah memiliki fitur berikut (jangan diulang):

- CRUD periode + inline edit (`PeriodsTable`, `InlineCell`, `handleInlineSave`)
- Bulk actions: arsip, aktifkan, kunci/buka, edit massal (`BulkActionsBar`)
- Import/Export CSV, Excel, PDF (`usePeriodsImportExport`, `PeriodImportModal`, `PeriodExportModal`)
- Dua tampilan: **table** & **timeline** (`viewMode`, `PeriodsTable`, `PeriodsTimeline`)
- Filter, sort, search, pagination (`PeriodsToolbar`, `Pagination`)
- Kustomisasi & reorder kolom (`visibleCols`, `columnOrder`, `moveColumnLeft/Right`)
- Privacy mode (`isPrivacyMode`, `maskValue`, shortcut Ctrl+P)
- Keyboard shortcuts (`PeriodsShortcutMenu`)
- Riwayat / history perubahan (`PeriodsHistoryModal`, `handleOpenHistory`)
- Deteksi **overlap** periode (`findOverlappingPeriods` di `periodValidation.js`)
- Generate tahun pelajaran otomatis (`handleGenerateNextYear`, batch 1–5)
- Arsip + restore (`PeriodArchiveModal`)
- Undo toast untuk perubahan (`addUndoToast`, `lastChange`)

### File Kunci

| File | Peran |
|------|-------|
| `src/features/periods/pages/PeriodsPage.jsx` | Orkestrasi halaman |
| `src/features/periods/hooks/usePeriodsCore.jsx` | State & handler inti |
| `src/features/periods/hooks/usePeriodsImportExport.jsx` | Logika import/export |
| `src/features/periods/utils/periodValidation.js` | Validasi & deteksi overlap |
| `src/features/periods/components/PeriodsTimeline.jsx` | View timeline |
| `src/features/periods/components/PeriodsTable.jsx` | View tabel |
| `src/features/periods/components/PeriodsToolbar.jsx` | Filter / view switch |

---

## Ringkasan Prioritas

| # | Fitur | Prioritas | Effort | Risiko |
|---|-------|-----------|--------|--------|
| 1 | Deteksi gap antar periode | Tinggi | S | Rendah |
| 2 | Auto-transition status periode | Tinggi | M | Sedang |
| 3 | Undo/redo penuh untuk inline edit | Tinggi | M | Sedang |
| 4 | Salin jadwal dari periode lain | Tinggi | S | Rendah |
| 5 | Kalender view (viewMode ketiga) | Menengah | L | Sedang |
| 6 | Quick stats per periode | Menengah | M | Sedang |
| 7 | Template periode | Menengah | M | Rendah |
| 8 | Notifikasi / reminder jadwal | Menengah | M | Rendah |
| 9 | Pin / favorite periode | Rendah | S | Rendah |
| 10 | Export iCal (.ics) | Rendah | S | Rendah |
| 11 | Saved filter presets | Rendah | S | Rendah |
| 12 | Comparison view (bandingkan 2 periode) | Rendah | M | Rendah |
| 13 | Filter rentang tanggal kustom | Menengah | S | Rendah |
| 14 | Quick-action badges (toggle langsung) | Menengah | S | Rendah |
| 15 | Indikator progress periode | Rendah | S | Rendah |
| 16 | Duplikasi cepat (1 klik ke tahun berikutnya) | Rendah | S | Rendah |
| 17 | Shift tanggal massal | Rendah | M | Sedang |
| 18 | Preview periode berdekatan | Rendah | S | Rendah |

Effort: **S** = < ½ hari, **M** = ½–1 hari, **L** = 1–2 hari.

---

## Prioritas Tinggi

### 1. Deteksi Gap Antar Periode

**Tujuan.** Selain overlap (sudah ada), deteksi *celah/bolong* tanggal antar periode
berurutan (mis. Genap 2024 berakhir 30 Jun, Ganjil 2025 baru mulai 1 Sep → gap 2 bulan).

**Detail teknis.**
- Tambah fungsi `findPeriodGaps(periods)` di `periodValidation.js`:
  - Urutkan periode per `semester` berdasarkan `start_date`.
  - Bandingkan `end_date` periode ke-i dengan `start_date` periode ke-(i+1).
  - Kembalikan `[{ before, after, gapDays }]` bila jarak > 1 hari.
- Di `PeriodsPage.jsx`, tampilkan badge kuning mirip badge overlap (baris ~403–417),
  dengan tombol aksi filter / highlight.
- Opsional: highlight gap secara visual pada `PeriodsTimeline`.

**Acceptance criteria.**
- [ ] `findPeriodGaps` punya unit test dasar (2–3 kasus).
- [ ] Badge muncul hanya bila ada gap; hilang bila tidak ada.
- [ ] Tidak memicu false positive untuk periode overlap.

---

### 2. Auto-Transition Status Periode

**Tujuan.** Saat periode aktif melewati `end_date`, sistem otomatis menandai "selesai"
dan menyarankan aktivasi periode berikutnya (aktivasi tetap butuh konfirmasi user).

**Detail teknis.**
- Manfaatkan `getTimeStatus` yang sudah ada untuk klasifikasi (belum mulai / berjalan / selesai).
- Tambah efek di `usePeriodsCore`: saat load / interval ringan, cek periode aktif yang sudah lewat.
- Tampilkan banner: "Periode X sudah berakhir. Aktifkan periode berikutnya?" + tombol.
- Jangan auto-aktivasi diam-diam; selalu konfirmasi lewat `ConfirmDialog`.

**Acceptance criteria.**
- [ ] Banner muncul saat periode aktif sudah lewat `end_date`.
- [ ] Aksi aktivasi memakai alur `handleSetActive` yang sudah ada.
- [ ] Tidak ada perubahan data tanpa konfirmasi user.

---

### 3. Undo/Redo Penuh untuk Inline Edit

**Tujuan.** Perluas undo toast yang sudah ada menjadi stack undo/redo penuh
dengan shortcut Ctrl+Z / Ctrl+Y.

**Detail teknis.**
- Tambah `undoStack` & `redoStack` di `usePeriodsCore` (menyimpan snapshot `{ id, field, prevValue, nextValue }`).
- `handleInlineSave` push ke `undoStack` & kosongkan `redoStack`.
- Handler keyboard global (pola sama seperti Ctrl+P di `PeriodsPage.jsx` baris ~176).
- Batasi kedalaman stack (mis. 20) agar hemat memori.
- Reuse `saveStatus` untuk feedback visual.

**Acceptance criteria.**
- [ ] Ctrl+Z mengembalikan perubahan inline terakhir.
- [ ] Ctrl+Y mengulangi perubahan yang di-undo.
- [ ] Stack dibatasi & tidak bocor antar sesi filter.

---

### 4. Salin Jadwal dari Periode Lain

**Tujuan.** Saat menambah/edit periode, sediakan tombol "Salin dari…" untuk
menyalin pola tanggal (pelaksanaan & pendaftaran) dari periode lain.

**Detail teknis.**
- Di `PeriodFormModal`, tambah dropdown sumber (daftar `years`).
- Saat dipilih, isi field tanggal relatif (mis. geser +1 tahun) atau salin apa adanya.
- Validasi via `isValidDateRange` & `findOverlappingPeriod` yang sudah ada.

**Acceptance criteria.**
- [ ] Field tanggal terisi otomatis dari periode sumber.
- [ ] Validasi overlap tetap berjalan setelah salin.

---

## Prioritas Menengah

### 5. Kalender View (viewMode Ketiga)

**Tujuan.** Tambah `viewMode: "calendar"` selain table & timeline — kalender visual
menampilkan rentang periode & jendela pendaftaran berwarna.

**Detail teknis.**
- Komponen baru `PeriodsCalendar.jsx`.
- Tambah opsi di `PeriodsToolbar` (switch view) & cabang render di `PeriodsPage.jsx` (~495).
- Warna berbeda untuk pelaksanaan vs pendaftaran; klik hari → detail periode.
- Reuse `getTimeStatus`, `formatDate`, `getDuration`.

**Acceptance criteria.**
- [ ] Switch view menampilkan kalender tanpa error.
- [ ] Rentang periode & pendaftaran terlihat jelas & bisa diklik.

---

### 6. Quick Stats per Periode

**Tujuan.** Tampilkan ringkasan (jumlah siswa terdaftar, enrollment aktif) per periode
saat hover/expand baris — integrasi dengan fitur `students` & `enrollment`.

**Detail teknis.**
- Query agregat per `period_id` (cek `src/features/enrollment`, `src/features/students`).
- Tampilkan pada tooltip/expandable row di `PeriodsTable` & kartu `PeriodsTimeline`.
- Cache ringan agar tidak query berulang.

**Acceptance criteria.**
- [ ] Angka statistik akurat per periode.
- [ ] Tidak memperlambat load daftar utama (lazy/on-demand).

---

### 7. Template Periode

**Tujuan.** Simpan pola konfigurasi (mis. "pendaftaran = 30 hari sebelum mulai")
sebagai template yang dipakai saat tambah / generate.

**Detail teknis.**
- Struktur template: `{ name, offsetPendaftaran, durasiPelaksanaan, semesterDefault }`.
- Simpan di localStorage (atau tabel bila backend mendukung).
- Integrasi ke `PeriodFormModal` & `handleGenerateNextYear`.

**Acceptance criteria.**
- [ ] Template bisa dibuat, dipilih, dan diterapkan.
- [ ] Template persisten antar sesi.

---

### 8. Notifikasi / Reminder Jadwal

**Tujuan.** Badge/indikator "pendaftaran dibuka dalam N hari" atau
"periode aktif berakhir minggu ini".

**Detail teknis.**
- Hitung selisih hari dari `getTimeStatus` / tanggal periode.
- Badge di `StatsInline` atau baris periode terkait.
- Ambang waktu bisa dikonfigurasi (mis. 3 & 7 hari).

**Acceptance criteria.**
- [ ] Badge muncul sesuai ambang waktu.
- [ ] Tidak spam saat banyak periode.

---

---

### 13. Filter Rentang Tanggal Kustom

**Tujuan.** Tambah opsi filter by custom date range — tidak hanya `filterTimeStatus`
(Sedang Berjalan / Belum Mulai / Selesai), user bisa pilih rentang `start_date`–`end_date` manual.

**Detail teknis.**
- Tambah dua input tanggal (`dateFrom`, `dateTo`) di `PeriodsToolbar`.
- Parameter filter baru di `usePeriodsCore`: `dateFrom`, `dateTo`.
- Filter di `filtered` / `paged` (cek fungsi compute di hook ~line 200–300).
- Tampilkan sebagai `activeFilterCount` jika aktif.

**Acceptance criteria.**
- [ ] Input tanggal muncul dan bisa diisi.
- [ ] Filter bekerja bersamaan dengan filter lain (semester, status, dll).
- [ ] `activeFilterCount` bertambah saat date range aktif.

---

### 14. Quick-Action Badges (Toggle Langsung)

**Tujuan.** Klik badge "Aktif" / "Terkunci" pada baris tabel atau kartu timeline
untuk toggle status tanpa buka modal konfirmasi (undo toast sebagai fallback).

**Detail teknis.**
- Di `PeriodsTable` & `PeriodsTimeline`, ubah badge status jadi `button`.
- `onClick` → panggil handler dengan undo toast (`addUndoToast`).
- Konfirmasi cepat lewat `ConfirmDialog` ringan (opsional untuk aksi sensitif).
- Reuse `handleToggleLock` & `handleSetActive` yang sudah ada.

**Acceptance criteria.**
- [ ] Klik badge mengubah status tanpa buka modal penuh.
- [ ] Undo toast muncul untuk membatalkan perubahan.
- [ ] Badge tetap disabled saat `is_locked` atau `canEdit = false`.

---

## Prioritas Rendah

### 9. Pin / Favorite Periode
- Tandai periode agar selalu tampil di atas daftar.
- Simpan set `pinnedIds` di localStorage; sesuaikan `sortBy`.

### 10. Export iCal (.ics)
- Tambah opsi format di `PeriodExportModal` menghasilkan `.ics`
  (VEVENT untuk pelaksanaan & pendaftaran) agar bisa di-subscribe di Google Calendar.

### 11. Saved Filter Presets
- Simpan kombinasi `filterSemester/status/lock/timeStatus/sortBy` sebagai preset bernama.
- Dropdown di `PeriodsToolbar`; persist di localStorage.

### 12. Comparison View
- Pilih 2 periode → tampilkan berdampingan (tanggal, durasi, status, kunci).
- Modal baru `PeriodCompareModal.jsx`; picu dari bulk bar saat tepat 2 item terpilih.

---

### 13. Filter Rentang Tanggal Kustom
— *lihat bagian Prioritas Menengah di atas.*

### 14. Quick-Action Badges
— *lihat bagian Prioritas Menengah di atas.*

### 15. Indikator Progress Periode

**Tujuan.** Tampilkan progress bar visual di setiap baris tabel/kartu timeline
yang menunjukkan persentase hari sudah berjalan vs total durasi periode.

**Detail teknis.**
- Hitung `progressPct = ((today - start_date) / (end_date - start_date)) * 100`, clamp 0–100.
- Di `PeriodsTable`, kolom baru `duration` atau kolom progress terpisah (opsional).
- Di `PeriodsTimeline`, progress bar di bawah nama periode.
- Warna: hijau (< 80%), kuning (80–99%), merah (≥ 100% / overdue).
- Sembunyikan di privacy mode.

**Acceptance criteria.**
- [ ] Progress bar muncul di setiap baris/kartu.
- [ ] Persentase akurat dan update saat tanggal berubah.
- [ ] Warna berubah sesuai ambang batas.

---

### 16. Duplikasi Cepat (1 Klik ke Tahun Berikutnya)

**Tujuan.** Tombol "Duplikasi" sekali klik langsung membuat salinan periode
ke tahun ajaran berikutnya dengan semua atribut (semester, tanggal, dll).

**Detail teknis.**
- Tombol tambahan di action bar baris (`PeriodsTable` & `PeriodsTimeline`).
- Handler `handleQuickDuplicate(id)`: ambil data periode asli, ubah `academic_year`
  ke tahun berikutnya (via `generateNextAcademicYears`), insert ke DB.
- Tampilkan toast sukses + undo.
- Beda dengan `handleDuplicate` yang buka modal — ini langsung jadi.

**Acceptance criteria.**
- [ ] Satu klik langsung duplikasi + muncul toast.
- [ ] Undo berhasil membatalkan duplikasi.
- [ ] Gagal jika tahun berikutnya sudah ada.

---

### 17. Shift Tanggal Massal

**Tujuan.** Geser tanggal mulai/selesai/pendaftaran N hari ke depan/belakang
untuk beberapa periode terpilih sekaligus (di dalam `PeriodBulkEditModal`).

**Detail teknis.**
- Tambah section "Shift Tanggal" di `PeriodBulkEditModal` dengan input jumlah hari
  (positif = maju, negatif = mundur) dan checkbox field mana yang kena.
- Handler `handleBulkShift(days, fields[])`: `UPDATE periods SET start_date = start_date + interval 'N days' ...`
- Validasi bounding (jangan sampai shift ke luar rentang wajar, mis. > 365 hari).

**Acceptance criteria.**
- [ ] Shift bisa diterapkan ke 1+ field sekaligus.
- [ ] Toast sukses + undo.
- [ ] Tidak merusak data bila input tidak valid.

---

### 18. Preview Periode Berdekatan

**Tujuan.** Saat hover pada nama/tahun periode, tooltip menampilkan periode
sebelumnya dan berikutnya sebagai konteks.

**Detail teknis.**
- Komponen `PeriodContextTooltip` dengan `delay` 500ms.
- Hitung adjacent periods dari data `years` yang sudah ada (urutkan by `start_date`).
- Tampilkan: nama, tanggal, status, gap/overlap dengan periode yang di-hover.
- Picu dari `onMouseEnter` pada judul periode di `PeriodsTable` & `PeriodsTimeline`.

**Acceptance criteria.**
- [ ] Tooltip muncul 500ms setelah hover.
- [ ] Menampilkan info yang benar dan relevan.
- [ ] Tidak mengganggu scrolling/interaksi lain.

---

## Urutan Implementasi yang Disarankan

1. **#1 Deteksi gap** — infrastruktur (`periodValidation.js` + pola badge) sudah ada, cepat & aman.
2. **#4 Salin jadwal** — perubahan lokal di `PeriodFormModal`, low-risk.
3. **#13 Filter rentang tanggal kustom** — kecil, murni UI + filter compute, < ½ hari.
4. **#3 Undo/redo** — pola shortcut & state sudah ada, tinggal diperluas.
5. **#11 Saved filter presets** — kecil, murni UI + localStorage.
6. **#14 Quick-action badges** — sentuhan UX di komponen yang sudah ada.
7. **#2 Auto-transition** — mulai sentuh alur status.
8. **#5 Kalender view** — paling terlihat, effort terbesar.
9. **#15 Indikator progress** — visual ringan, tidak menyentuh DB.
10. **#16 Duplikasi cepat** — perlu handler baru tapi pola insert sudah ada.
11. **#17 Shift tanggal massal** — perlu hati-hati dengan query update.
12. **#18 Preview periode berdekatan** — tooltip murni frontend.
13. Sisanya (#6, #7, #8, #9, #10, #12) sesuai kebutuhan.

---

## Catatan Teknis Umum

- Ikuti konvensi alias impor (`@features/*`, `@shared/*`, `@core/*`) sesuai `jsconfig.json`.
- Reuse komponen shared: `ConfirmDialog`, `BulkActionsBar`, `StatsInline`, `Checkbox`, `Pagination`.
- Pertahankan gaya styling token CSS (`var(--color-*)`) & kelas Tailwind yang sudah dipakai.
- Hormati `canEdit`, `is_locked`, dan privacy mode di setiap fitur baru yang mengubah data.
- Tambahkan unit test untuk logika murni (utils) sebisa mungkin.
