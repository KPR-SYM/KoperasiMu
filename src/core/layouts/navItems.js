/**
 * ─── Shared Navigation Items ────────────────────────────────────────────────
 * Single source of truth for all navigation data.
 * Used by: Sidebar, SlimTopBar (search), BottomNav/MasterSheet (mobile), NotFoundPage.
 */
import { useMemo } from 'react'
import {
    House, CreditCard, PiggyBank, Clipboard, Users, GraduationCap, Buildings,
    CalendarDots, SquaresFour, NewspaperClipping, Robot, ClockCounterClockwise,
    UserGear, Database, FolderOpen, HardDrives, GearSix, Palette, WarningCircle,
    Warning, Info, CheckCircle, Stack, ClipboardText, Storefront, ShoppingCartSimple,
    ArrowUUpLeft, Barcode, Package, Tag, Money, Wallet, BookOpenText, ArrowDown,
    ArrowUp, ArrowsLeftRight, HandCoins, Receipt, ChartBar, ChartPie, ChartLineUp,
    TrendUp, Truck, Gift, Percent, Ticket, ShieldCheck, Printer, FloppyDisk, Student,
    Bank, Star, Lightning, Ruler, Target, Hourglass, GridFour, MapPin, Monitor, List,
} from '@phosphor-icons/react'

// ─── Color tokens ──────────────────────────────────────────────────────────
// Single source of truth for badge colors. Change a shade once, applies everywhere.
export const COLOR = {
    indigo: "bg-indigo-500/10 text-indigo-600",
    emerald: "bg-emerald-500/10 text-emerald-600",
    amber: "bg-amber-500/10 text-amber-600",
    blue: "bg-blue-500/10 text-blue-600",
    rose: "bg-rose-500/10 text-rose-600",
    purple: "bg-purple-500/10 text-purple-600",
    pink: "bg-pink-500/10 text-pink-600",
    slate: "bg-slate-500/10 text-slate-600",
    cyan: "bg-cyan-500/10 text-cyan-600",
}

// ─── Dashboard & Pusat Tugas (standalone) ────────────────────────────────────
export const DASHBOARD_ITEM = {
    to: "/dashboard", label: "Dashboard", icon: House,
    desc: "Ringkasan utama dan statistik sistem",
    color: COLOR.indigo,
}

export const TASK_CENTER_ITEM = {
    to: "/task-center", label: "Pusat Tugas", icon: ClipboardText,
    desc: "Daftar tugas harian dan persetujuan staf",
    color: COLOR.amber,
}

// Semua item standalone (di luar NAV_GROUPS) dikumpulkan di sini.
// Kalau nanti nambah item standalone baru, tinggal deklarasi di atas lalu push ke array ini.
export const STANDALONE_ITEMS = [DASHBOARD_ITEM, TASK_CENTER_ITEM]

// ─── Keuangan & SPP ───────────────────────────────────────────────────────────
export const FINANCE_ITEMS = [
    { to: "/finance/invoices", label: "Tagihan & SPP", icon: CreditCard, desc: "Kelola invoice SPP bulanan, uang makan, & iuran pembangunan", color: COLOR.amber },
    { to: "/finance/saving", label: "Tabungan Santri", icon: PiggyBank, desc: "Sistem deposit uang saku santri untuk pencegahan kehilangan", color: COLOR.indigo, flagKey: "nav.saving" },
    { to: "/finance/payments", label: "Riwayat Pembayaran", icon: Clipboard, desc: "Rekapitulasi transaksi lunas, tunggakan, & kwitansi wali santri", color: COLOR.emerald },
]

// ─── Master Data ──────────────────────────────────────────────────────────────
export const MASTER_ITEMS = [
    { to: "/master/students", label: "Data Siswa", icon: Users, desc: "Pusat database seluruh santri aktif dalam sistem", color: COLOR.indigo, flagKey: "nav.students" },
    { to: "/master/teachers", label: "Data Guru", icon: GraduationCap, desc: "Data akun pengajar, musyrif, dan staf sekolah", color: COLOR.indigo, flagKey: "nav.teachers" },
    { to: "/master/classes", label: "Data Kelas", icon: Buildings, desc: "Pengaturan struktur kelas dan pembagian asrama", color: COLOR.indigo, flagKey: "nav.classes" },
    { to: "/master/periods", label: "Tahun Akademik", icon: CalendarDots, desc: "Manajemen semester dan periode kalender akademik", color: COLOR.indigo, flagKey: "nav.periods" },
]

// ─── Koperasi & Unit Usaha ────────────────────────────────────────────────────
// Struktur bertingkat: KATEGORI (dengan children) → item leaf.
// Ini bukan daftar leaf item seperti FINANCE_ITEMS/MASTER_ITEMS — makanya
// dinamai _CATEGORIES, bukan _ITEMS, biar bedanya kelihatan dari namanya.
// Route leaf selalu berprefix /master/koperasi/... dan sementara render placeholder.
export const KOPERASI_CATEGORIES = [
    // ── 1. Operasional Harian (paling sering dipakai) ─────────────────────────
    {
        to: "/master/koperasi/kasir",
        label: "Kasir & POS",
        icon: Storefront,
        desc: "Transaksi penjualan di koperasi / kantin sekolah",
        color: COLOR.emerald,
        children: [
            { to: "/master/koperasi/kasir/pos", label: "Kasir / POS", icon: ShoppingCartSimple, desc: "Layar kasir untuk transaksi penjualan cepat", color: COLOR.emerald },
            { to: "/master/koperasi/kasir/multi-bayar", label: "Multi Pembayaran", icon: CreditCard, desc: "QRIS, e-wallet, kartu, dan tunai", color: COLOR.emerald },
            { to: "/master/koperasi/kasir/struk", label: "Struk Digital", icon: Printer, desc: "Kirim struk via email atau SMS", color: COLOR.emerald },
            { to: "/master/koperasi/kasir/riwayat", label: "Riwayat Transaksi", icon: ClockCounterClockwise, desc: "Catatan historis seluruh transaksi kasir", color: COLOR.emerald },
            { to: "/master/koperasi/kasir/tutup", label: "Tutup Buka Kas", icon: Wallet, desc: "Sesi buka/tutup kas dan saldo per kasir", color: COLOR.emerald },
            { to: "/master/koperasi/kasir/shift", label: "Shift Kerja", icon: ClockCounterClockwise, desc: "Jadwal shift kasir per hari", color: COLOR.emerald },
            { to: "/master/koperasi/kasir/retur", label: "Pusat Retur", icon: ArrowUUpLeft, desc: "Proses retur dan refund transaksi", color: COLOR.emerald },
        ],
    },
    {
        to: "/master/koperasi/produk",
        label: "Produk & Stok",
        icon: Package,
        desc: "Manajemen produk, kategori, dan persediaan stok",
        color: COLOR.amber,
        children: [
            { to: "/master/koperasi/produk/list", label: "Daftar Produk", icon: Package, desc: "Katalog seluruh produk yang dijual koperasi", color: COLOR.amber },
            { to: "/master/koperasi/produk/kategori", label: "Kategori Produk", icon: Tag, desc: "Pengelompokan produk berdasarkan kategori", color: COLOR.amber },
            { to: "/master/koperasi/produk/satuan", label: "Satuan Produk", icon: Stack, desc: "Pengaturan satuan (pcs, kg, liter, pack)", color: COLOR.amber },
            { to: "/master/koperasi/produk/merek", label: "Merek / Brand", icon: Tag, desc: "Daftar merek produk yang dijual", color: COLOR.amber },
            { to: "/master/koperasi/produk/varian", label: "Varian Produk", icon: GridFour, desc: "Ukuran, warna, rasa produk", color: COLOR.amber },
            { to: "/master/koperasi/produk/stok", label: "Stok & Persediaan", icon: Stack, desc: "Pemantauan stok masuk, keluar, dan opname", color: COLOR.amber },
            { to: "/master/koperasi/produk/alert", label: "Stok Minimum & Alert", icon: WarningCircle, desc: "Notifikasi otomatis saat stok menipis", color: COLOR.amber },
            { to: "/master/koperasi/produk/mutasi", label: "Mutasi Stok", icon: ArrowsLeftRight, desc: "Transfer stok antar gudang atau outlet", color: COLOR.amber },
            { to: "/master/koperasi/produk/gudang", label: "Gudang & Lokasi", icon: MapPin, desc: "Lokasi penyimpanan: gudang, rak, posisi", color: COLOR.amber },
            { to: "/master/koperasi/produk/batch", label: "Batch & Expired", icon: Hourglass, desc: "Tracking nomor batch & masa berlaku", color: COLOR.amber },
            { to: "/master/koperasi/produk/barcode", label: "Cetak Barcode", icon: Barcode, desc: "Pembuatan label barcode untuk produk", color: COLOR.amber },
            { to: "/master/koperasi/produk/bc-gen", label: "Barcode Generator", icon: Barcode, desc: "Generate barcode otomatis untuk produk baru", color: COLOR.amber },
        ],
    },
    {
        to: "/master/koperasi/keuangan",
        label: "Keuangan / Kas",
        icon: BookOpenText,
        desc: "Buku kas, penerimaan, dan pengeluaran koperasi",
        color: COLOR.emerald,
        children: [
            { to: "/master/koperasi/keuangan/kas-masuk", label: "Kas Masuk", icon: ArrowDown, desc: "Penerimaan kas dari penjualan dan putusan", color: COLOR.emerald },
            { to: "/master/koperasi/keuangan/kas-keluar", label: "Kas Keluar", icon: ArrowUp, desc: "Pengeluaran operasional koperasi", color: COLOR.emerald },
            { to: "/master/koperasi/keuangan/buku-besar", label: "Buku Besar", icon: BookOpenText, desc: "Rekapitulasi seluruh pergerakan kas", color: COLOR.emerald },
            { to: "/master/koperasi/keuangan/rekonsiliasi", label: "Rekonsiliasi", icon: ArrowsLeftRight, desc: "Mencocokkan kas fisik dengan catatan", color: COLOR.emerald },
            { to: "/master/koperasi/keuangan/laba-rugi", label: "Laba Rugi", icon: ChartPie, desc: "Ringkasan pendapatan vs pengeluaran", color: COLOR.emerald },
            { to: "/master/koperasi/keuangan/anggaran", label: "Anggaran Operasional", icon: Bank, desc: "Budgeting bulanan koperasi", color: COLOR.emerald },
        ],
    },
    // ── 2. Pembelian & Pasokan ───────────────────────────────────────────────
    {
        to: "/master/koperasi/pembelian",
        label: "Pembelian & Supplier",
        icon: Truck,
        desc: "Pembelian barang, retur, dan manajemen supplier",
        color: COLOR.blue,
        children: [
            { to: "/master/koperasi/suppliers", label: "Daftar Supplier", icon: Buildings, desc: "Database supplier dan kontaknya", color: COLOR.blue },
            { to: "/master/koperasi/pembelian/list", label: "Pembelian Barang", icon: ArrowDown, desc: "Catatan pembelian & PO ke supplier", color: COLOR.blue },
            { to: "/master/koperasi/pembelian/retur", label: "Retur Pembelian", icon: ArrowUUpLeft, desc: "Pengembalian barang ke supplier", color: COLOR.blue },
            { to: "/master/koperasi/pembelian/retur-auto", label: "Retur Otomatis", icon: ArrowUUpLeft, desc: "Retur otomatis untuk barang bermasalah", color: COLOR.blue },
            { to: "/master/koperasi/pembelian/hutang", label: "Pembayaran Hutang", icon: Money, desc: "Jadwal & tracking pembayaran ke supplier", color: COLOR.blue },
        ],
    },
    {
        to: "/master/koperasi/kasbon",
        label: "Kasbon / Piutang",
        icon: HandCoins,
        desc: "Kasbon anggota & piutang pelanggan koperasi",
        color: COLOR.rose,
        children: [
            { to: "/master/koperasi/kasbon/kasbon", label: "Kasbon Karyawan", icon: HandCoins, desc: "Pinjaman & kasbon untuk pengurus/karyawan", color: COLOR.rose },
            { to: "/master/koperasi/kasbon/piutang", label: "Piutang Pelanggan", icon: ClipboardText, desc: "Tagihan yang belum dilunasi pelanggan", color: COLOR.rose },
            { to: "/master/koperasi/kasbon/pembayaran", label: "Pembayaran Piutang", icon: Money, desc: "Pencatatan angsuran & pelunasan piutang", color: COLOR.rose },
            { to: "/master/koperasi/kasbon/jadwal", label: "Jadwal Angsuran", icon: CalendarDots, desc: "Jadwal angsuran & reminder jatuh tempo", color: COLOR.rose },
            { to: "/master/koperasi/kasbon/denda", label: "Bunga & Denda", icon: Percent, desc: "Kalkulasi otomatis bunga dan denda keterlambatan", color: COLOR.rose },
        ],
    },
    // ── 3. Marketing & Promosi ───────────────────────────────────────────────
    {
        to: "/master/koperasi/promo",
        label: "Promo & Diskon",
        icon: Gift,
        desc: "Promo, diskon, dan program loyalitas",
        color: COLOR.pink,
        children: [
            { to: "/master/koperasi/promo/diskon", label: "Diskon & Promo", icon: Percent, desc: "Buat promo dan potongan harga produk", color: COLOR.pink },
            { to: "/master/koperasi/promo/syarat", label: "Syarat Promo", icon: ClipboardText, desc: "Min. pembelian, produk berlaku, masa aktif", color: COLOR.pink },
            { to: "/master/koperasi/promo/target", label: "Target Promo", icon: Target, desc: "Semua siswa, siswa baru, staff, umum", color: COLOR.pink },
            { to: "/master/koperasi/promo/kupon", label: "Kupon & Voucher", icon: Ticket, desc: "Penerbitan dan validasi kupon belanja", color: COLOR.pink },
            { to: "/master/koperasi/promo/loyalty", label: "Loyalty Points", icon: Star, desc: "Sistem poin dari setiap transaksi pelanggan", color: COLOR.pink },
            { to: "/master/koperasi/promo/flash", label: "Flash Sale", icon: Lightning, desc: "Promo waktu terbatas dengan harga spesial", color: COLOR.pink },
        ],
    },
    // ── 4. Laporan & Analitik (periodik) ─────────────────────────────────────
    {
        to: "/master/koperasi/laporan",
        label: "Laporan & Analitik",
        icon: ChartBar,
        desc: "Laporan penjualan, keuangan, dan tren bisnis",
        color: COLOR.purple,
        children: [
            { to: "/master/koperasi/laporan/realtime", label: "Dashboard Realtime", icon: SquaresFour, desc: "Live data penjualan dan transaksi", color: COLOR.purple },
            { to: "/master/koperasi/laporan/penjualan", label: "Laporan Penjualan", icon: ChartLineUp, desc: "Rekap penjualan per periode & per produk", color: COLOR.purple },
            { to: "/master/koperasi/laporan/keuangan", label: "Laporan Keuangan", icon: ChartPie, desc: "Ringkasan laba rugi dan posisi kas", color: COLOR.purple },
            { to: "/master/koperasi/laporan/stok", label: "Laporan Stok", icon: ChartBar, desc: "Analisa pergerakan dan nilai persediaan", color: COLOR.purple },
            { to: "/master/koperasi/laporan/analitik", label: "Analitik & Tren", icon: TrendUp, desc: "Dashboard data penjualan & produk terlaris", color: COLOR.purple },
            { to: "/master/koperasi/laporan/export", label: "Export Laporan", icon: Stack, desc: "Export ke PDF, Excel, atau CSV", color: COLOR.purple },
            { to: "/master/koperasi/laporan/prediksi", label: "Prediksi Stok", icon: TrendUp, desc: "Prediksi AI kebutuhan stok berdasarkan tren", color: COLOR.purple },
        ],
    },
    // ── 5. Pendukung (jarang dipakai / musiman) ─────────────────────────────
    {
        to: "/master/koperasi/paket",
        label: "Paket Siswa Baru",
        icon: Student,
        desc: "Paket seragam dan perlengkapan siswa baru",
        color: COLOR.indigo,
        children: [
            { to: "/master/koperasi/paket/list", label: "Daftar Paket", icon: Student, desc: "Paket seragam & perlengkapan yang tersedia", color: COLOR.indigo },
            { to: "/master/koperasi/paket/harga", label: "Harga Paket", icon: Money, desc: "Konfigurasi harga dan komposisi paket", color: COLOR.indigo },
            { to: "/master/koperasi/paket/komponen", label: "Komponen Paket", icon: List, desc: "Item dalam paket: seragam, sepatu, tas", color: COLOR.indigo },
            { to: "/master/koperasi/paket/ukuran", label: "Ukuran Seragam", icon: Ruler, desc: "Daftar ukuran: S, M, L, XL, XXL", color: COLOR.indigo },
            { to: "/master/koperasi/paket/template", label: "Template Paket", icon: Student, desc: "Preset paket per jenjang (SD/SMP/SMA)", color: COLOR.indigo },
            { to: "/master/koperasi/paket/penjualan", label: "Penjualan Paket", icon: Receipt, desc: "Transaksi penjualan paket ke siswa baru", color: COLOR.indigo },
        ],
    },
    {
        to: "/master/koperasi/inventaris",
        label: "Inventaris & Aset",
        icon: HardDrives,
        desc: "Pencatatan aset dan peralatan koperasi",
        color: COLOR.blue,
        children: [
            { to: "/master/koperasi/inventaris/mesin-kasir", label: "Mesin Kasir", icon: Monitor, desc: "Daftar device kasir (HP, tablet, PC)", color: COLOR.blue },
            { to: "/master/koperasi/inventaris/printer", label: "Printer & Periferal", icon: Printer, desc: "Printer struk, scanner, barcode reader", color: COLOR.blue },
            { to: "/master/koperasi/inventaris/display", label: "Display & Etalase", icon: Stack, desc: "Etalase pajangan produk koperasi", color: COLOR.blue },
            { to: "/master/koperasi/inventaris/rak", label: "Rak & Shelving", icon: HardDrives, desc: "Rak penyimpanan dan display produk", color: COLOR.blue },
            { to: "/master/koperasi/inventaris/peralatan", label: "Peralatan Lainnya", icon: Package, desc: "Timbangan, kulkas, freezer, dll", color: COLOR.blue },
        ],
    },
    // ── 6. Admin & Pengaturan (admin only) ──────────────────────────────────
    {
        to: "/master/koperasi/pengguna",
        label: "Pengguna & Akses",
        icon: Users,
        desc: "Manajemen pengguna dan hak akses koperasi",
        color: COLOR.slate,
        children: [
            { to: "/master/koperasi/pengguna/list", label: "Daftar Pengguna", icon: Users, desc: "Pengurus, kasir, dan staf koperasi", color: COLOR.slate },
            { to: "/master/koperasi/pengguna/roles", label: "Role & Hak Akses", icon: ShieldCheck, desc: "Pengaturan peran dan izin akses menu", color: COLOR.slate },
            { to: "/master/koperasi/pengguna/role-custom", label: "Role Custom", icon: ShieldCheck, desc: "Buat role baru dengan permission kustom", color: COLOR.slate },
            { to: "/master/koperasi/pengguna/log", label: "Log Aktivitas", icon: ClockCounterClockwise, desc: "Audit trail perubahan data dan aktivitas", color: COLOR.slate },
        ],
    },
    {
        to: "/master/koperasi/pengaturan",
        label: "Pengaturan Koperasi",
        icon: GearSix,
        desc: "Profil koperasi, printer, dan preferensi",
        color: COLOR.cyan,
        children: [
            { to: "/master/koperasi/pengaturan/profil", label: "Profil Koperasi", icon: Storefront, desc: "Identitas, nama, dan kontak koperasi", color: COLOR.cyan },
            { to: "/master/koperasi/pengaturan/metode-bayar", label: "Metode Pembayaran", icon: Wallet, desc: "Tunai, QRIS, e-wallet, kartu kredit", color: COLOR.cyan },
            { to: "/master/koperasi/pengaturan/kategori-belanja", label: "Kategori Pengeluaran", icon: FolderOpen, desc: "Operasional, gaji, listrik, air, dll", color: COLOR.cyan },
            { to: "/master/koperasi/pengaturan/devices", label: "Perangkat & Printer", icon: Printer, desc: "Konfigurasi printer struk & perangkat kasir", color: COLOR.cyan },
            { to: "/master/koperasi/pengaturan/outlet", label: "Multi-Outlet", icon: Buildings, desc: "Manage cabang dan lokasi koperasi", color: COLOR.cyan },
            { to: "/master/koperasi/pengaturan/backup", label: "Backup & Restore", icon: FloppyDisk, desc: "Cadangkan dan pulihkan data koperasi", color: COLOR.cyan },
        ],
    },
]

// ─── Admin Panel ──────────────────────────────────────────────────────────────
export const ADMIN_ITEMS = [
    { to: "/admin", label: "Admin Dashboard", icon: SquaresFour, desc: "Pusat monitoring teknis & integrasi sistem", color: COLOR.indigo },
    { to: "/admin/news", label: "Manajemen Informasi", icon: NewspaperClipping, desc: "Update Informasi & info terbaru ke landing page", color: COLOR.emerald },
    { to: "/admin/ai-insights", label: "AI Insights Center", icon: Robot, desc: "Audit percakapan AI dan analisis performa mesin", color: COLOR.indigo },
    { to: "/admin/logs", label: "Audit Logs", icon: ClockCounterClockwise, desc: "Log historis aktivitas user dan perubahan data", color: COLOR.purple },
    { to: "/admin/users", label: "Manajemen Pengguna", icon: UserGear, desc: "Pengaturan hak akses, role, dan kredensial user", color: COLOR.rose },
    { to: "/admin/database", label: "Kesehatan Database", icon: Database, desc: "Pemantauan status database & kesehatan tabel", color: COLOR.cyan },
    { to: "/admin/storage", label: "Manajemen Penyimpanan", icon: FolderOpen, desc: "Manajemen media, foto siswa, dan berkas sistem", color: COLOR.amber },
    { to: "/admin/tasks", label: "Tugas Latar Belakang", icon: HardDrives, desc: "Status sinkronisasi background & automasi sistem", color: COLOR.indigo },
    { to: "/admin/settings", label: "Pengaturan", icon: GearSix, desc: "Panel pusat pengaturan parameter aplikasi utama", color: COLOR.slate },
    { to: "/admin/playground", label: "UI Playground", icon: Palette, desc: "Panduan visual komponen dan dokumentasi desain", color: COLOR.pink },
]

// ─── Notification type styles ─────────────────────────────────────────────────
export const TYPE_STYLE = {
    error: { bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-500', text: 'text-red-500', icon: WarningCircle },
    warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-500', text: 'text-amber-500', icon: Warning },
    info: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-500', text: 'text-blue-500', icon: Info },
    success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-500', text: 'text-emerald-500', icon: CheckCircle },
}

// ─── Navigation groups (structured for Sidebar) ────────────────────────────
// key dibuat konsisten sebagai slug pendek (bukan full path) di semua entri,
// termasuk hasil spread dari KOPERASI_CATEGORIES.
export const NAV_GROUPS = [
    // Koperasi: paling sering dipakai, muncul duluan (kasir → produk → keuangan → dst.)
    ...KOPERASI_CATEGORIES.map(cat => ({
        key: cat.to.split('/').pop(),
        label: cat.label,
        icon: cat.icon,
        items: cat.children ?? [],
        hideForRoles: ['staff'],
    })),
    // Keuangan SPP & Master Data: di bawah koperasi (jarang dipakai kasir)
    {
        key: 'finance',
        label: 'Keuangan',
        icon: CreditCard,
        items: FINANCE_ITEMS,
        hideForRoles: ['staff'],
    },
    {
        key: 'master',
        label: 'Master Data',
        icon: Users,
        items: MASTER_ITEMS,
        hideForRoles: ['staff'],
    },
    {
        key: 'admin',
        label: 'Admin',
        icon: UserGear,
        items: ADMIN_ITEMS,
        requireRoles: ['developer', 'admin'],
    },
]

/**
 * Filter nav items based on feature flags.
 * flagKey sekarang nempel di item itu sendiri (bukan map terpisah), jadi
 * gak ada risiko lupa daftarin route baru di tempat lain.
 * @param {Array} items - Array of nav items
 * @param {Object} flags - Feature flags map
 * @returns {Array} Filtered items
 */
export function filterNavItems(items, flags = {}) {
    return items.filter(item => {
        if (item.flagKey && flags[item.flagKey] === false) return false
        return true
    })
}

/**
 * Flatten nested nav items (kategori dengan children) menjadi daftar leaf (URL) saja.
 * Dipakai untuk search, breadcrumb, dan NotFound quick links.
 */
export function flattenNavItems(items) {
    return items.flatMap(item =>
        item.children?.length ? flattenNavItems(item.children) : [item]
    )
}

/**
 * Cek apakah sebuah grup NAV_GROUPS boleh dilihat oleh role tertentu.
 * @param {Object} group - Salah satu entry dari NAV_GROUPS
 * @param {string} role - User role (lowercase)
 * @returns {boolean}
 */
function isGroupVisibleForRole(group, role) {
    if (group.requireRoles && !group.requireRoles.includes(role)) return false
    if (group.hideForRoles && group.hideForRoles.includes(role)) return false
    return true
}

/**
 * Single source of truth untuk "semua halaman yang boleh diakses user ini".
 * Menggabungkan STANDALONE_ITEMS + semua item dari NAV_GROUPS yang eligible
 * berdasarkan role, lalu difilter lagi berdasarkan feature flags, lalu dedup by path.
 *
 * Pakai fungsi ini di Sidebar, SlimTopBar search, BottomNav, dan NotFoundPage
 * biar rule role/flag gak pernah divergen antar komponen.
 *
 * @param {string} role - User role (lowercase), mis. 'admin', 'developer', 'staff'
 * @param {Object} flags - Feature flags map dari useFeatureFlags()
 * @returns {Array<{to, label, icon, desc, color}>}
 */
export function getAccessibleNavItems(role = '', flags = {}) {
    const groupedItems = NAV_GROUPS
        .filter(group => isGroupVisibleForRole(group, role))
        .flatMap(group => flattenNavItems(group.items))

    const allItems = [...STANDALONE_ITEMS, ...groupedItems]
    const flagFiltered = filterNavItems(allItems, flags)

    const seen = new Set()
    return flagFiltered.filter(item => {
        if (seen.has(item.to)) return false
        seen.add(item.to)
        return true
    })
}

/**
 * Memoized hook version of getAccessibleNavItems, so Sidebar, SlimTopBar,
 * BottomNav, and NotFoundPage all share one computed result per (role, flags)
 * combo instead of each re-running flatten/filter/dedup on every render.
 *
 * Usage: const navItems = useNavItems(role, flags)
 */
export function useNavItems(role = '', flags = {}) {
    return useMemo(() => getAccessibleNavItems(role, flags), [role, flags])
}