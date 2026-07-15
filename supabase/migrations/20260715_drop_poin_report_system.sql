/*
  Migration: Hapus tabel poin & laporan perilaku siswa
  Alasan: Sistem Koperasi Senyum tidak memerlukan fitur poin/prestasi/perilaku.
          Cukup data akademik dasar (nama, kelas, tagihan).

  TABEL YANG DIHAPUS:
    - reports                (poin pelanggaran/prestasi)
    - student_monthly_reports (raport bulanan)
    - behavior_reports        (laporan perilaku)
    - point_history           (riwayat poin)
    - point_rules             (konfigurasi poin)

  CATATAN:
    - Jalankan setelah backup database.
    - Tidak bisa di-rollback.
*/

-- 1. Hapus tabel (urutkan berdasarkan dependensi)
DROP TABLE IF EXISTS point_history CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS student_monthly_reports CASCADE;
DROP TABLE IF EXISTS behavior_reports CASCADE;
DROP TABLE IF EXISTS point_rules CASCADE;

-- 2. Opsional: Hapus kolom total_points di tabel students
-- ALTER TABLE students DROP COLUMN IF EXISTS total_points;
