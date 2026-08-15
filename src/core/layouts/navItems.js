/**
 * ─── Shared NavigationArrow Items ──────────────────────────────────────────────────
 * Single source of truth for all navigation data.
 * Used by: Sidebar, SlimTopBar (search), BottomNav/MasterSheet (mobile), NotFoundPage.
 */
import { House, CreditCard, PiggyBank, Clipboard, Users, GraduationCap, Buildings, CalendarDots, SquaresFour, NewspaperClipping, Robot, ClockCounterClockwise, UserGear, Database, FolderOpen, HardDrives, GearSix, Palette, WarningCircle, Warning, Info, CheckCircle, Stack, ClipboardText, Storefront, ShoppingCartSimple, ArrowUUpLeft, Barcode, Package, Tag, Money, Bank, Wallet, BookOpenText, ArrowDown, ArrowUp, ArrowsLeftRight, HandCoins, Receipt, ChartBar, ChartPie, ChartLineUp, TrendUp, Truck, Gift, Percent, Ticket, ShieldCheck, Printer, FloppyDisk, Student, Coins, FileText } from '@phosphor-icons/react'

// ─── Dashboard & Pusat Tugas (standalone) ────────────────────────────────────
export const DASHBOARD_ITEM = {
    to: "/dashboard", label: "Dashboard", icon: House,
    desc: "Ringkasan utama dan statistik sistem",
    color: "bg-indigo-500/10 text-indigo-600",
}

export const TASK_CENTER_ITEM = {
    to: "/task-center", label: "Pusat Tugas", icon: ClipboardText,
    desc: "Daftar tugas harian dan persetujuan staf",
    color: "bg-amber-500/10 text-amber-600",
}

// Semua item standalone (di luar NAV_GROUPS) dikumpulkan di sini.
// Kalau nanti nambah item standalone baru, tinggal deklarasi di atas lalu push ke array ini.
export const STANDALONE_ITEMS = [DASHBOARD_ITEM, TASK_CENTER_ITEM]

// ─── Keuangan & SPP ───────────────────────────────────────────────────────────
export const FINANCE_ITEMS = [
    { to: "/finance/invoices", label: "Tagihan & SPP", icon: CreditCard, desc: "Kelola invoice SPP bulanan, uang makan, & iuran pembangunan", color: "bg-amber-500/10 text-amber-600" },
    { to: "/finance/saving", label: "Tabungan Santri", icon: PiggyBank, desc: "Sistem deposit uang saku santri untuk pencegahan kehilangan", color: "bg-indigo-500/10 text-indigo-600" },
    { to: "/finance/payments", label: "Riwayat Pembayaran", icon: Clipboard, desc: "Rekapitulasi transaksi lunas, tunggakan, & kwitansi wali santri", color: "bg-emerald-500/10 text-emerald-600" },
]

// ─── Master Data ──────────────────────────────────────────────────────────────
export const MASTER_ITEMS = [
    { to: "/master/students", label: "Data Siswa", icon: Users, desc: "Pusat database seluruh santri aktif dalam sistem", color: "bg-indigo-500/10 text-indigo-600" },
    { to: "/master/teachers", label: "Data Guru", icon: GraduationCap, desc: "Data akun pengajar, musyrif, dan staf sekolah", color: "bg-indigo-500/10 text-indigo-600" },
    { to: "/master/classes", label: "Data Kelas", icon: Buildings, desc: "Pengaturan struktur kelas dan pembagian asrama", color: "bg-indigo-500/10 text-indigo-600" },
    { to: "/master/periods", label: "Tahun Akademik", icon: CalendarDots, desc: "Manajemen semester dan periode kalender akademik", color: "bg-indigo-500/10 text-indigo-600" },
    { to: "/master/inventory", label: "Inventaris & Aset", icon: Stack, desc: "Pencatatan sarana prasarana sekolah, inventaris asrama & kelas", color: "bg-blue-500/10 text-blue-600" },
]

// ─── Koperasi & Unit Usaha ────────────────────────────────────────────────────
// Struktur bertingkat: kategori (dengan children) → item leaf.
// Route leaf selalu berprefix /master/koperasi/... dan sementara render placeholder.
export const KOPERASI_ITEMS = [
    {
        to: "/master/koperasi/kasir",
        label: "Kasir & POS",
        icon: Storefront,
        desc: "Transaksi penjualan di koperasi / kantin sekolah",
        color: "bg-emerald-500/10 text-emerald-600",
        children: [
            { to: "/master/koperasi/kasir/pos", label: "Kasir / POS", icon: ShoppingCartSimple, desc: "Layar kasir untuk transaksi penjualan cepat", color: "bg-emerald-500/10 text-emerald-600" },
            { to: "/master/koperasi/kasir/riwayat", label: "Riwayat Transaksi", icon: ClockCounterClockwise, desc: "Catatan historis seluruh transaksi kasir", color: "bg-emerald-500/10 text-emerald-600" },
            { to: "/master/koperasi/kasir/tutup", label: "Tutup Buka Kas", icon: Wallet, desc: "Sesi buka/tutup kas dan saldo per kasir", color: "bg-emerald-500/10 text-emerald-600" },
        ],
    },
    {
        to: "/master/koperasi/produk",
        label: "Produk & Stok",
        icon: Package,
        desc: "Manajemen produk, kategori, dan persediaan stok",
        color: "bg-amber-500/10 text-amber-600",
        children: [
            { to: "/master/koperasi/produk/list", label: "Daftar Produk", icon: Package, desc: "Katalog seluruh produk yang dijual koperasi", color: "bg-amber-500/10 text-amber-600" },
            { to: "/master/koperasi/produk/kategori", label: "Kategori Produk", icon: Tag, desc: "Pengelompokan produk berdasarkan kategori", color: "bg-amber-500/10 text-amber-600" },
            { to: "/master/koperasi/produk/stok", label: "Stok & Persediaan", icon: Stack, desc: "Pemantauan stok masuk, keluar, dan opname", color: "bg-amber-500/10 text-amber-600" },
            { to: "/master/koperasi/produk/barcode", label: "Cetak Barcode", icon: Barcode, desc: "Pembuatan label barcode untuk produk", color: "bg-amber-500/10 text-amber-600" },
        ],
    },
    {
        to: "/master/koperasi/paket",
        label: "Paket Siswa Baru",
        icon: Student,
        desc: "Paket seragam dan perlengkapan siswa baru",
        color: "bg-indigo-500/10 text-indigo-600",
        children: [
            { to: "/master/koperasi/paket/list", label: "Daftar Paket", icon: Student, desc: "Paket seragam & perlengkapan yang tersedia", color: "bg-indigo-500/10 text-indigo-600" },
            { to: "/master/koperasi/paket/harga", label: "Harga Paket", icon: Money, desc: "Konfigurasi harga dan komposisi paket", color: "bg-indigo-500/10 text-indigo-600" },
            { to: "/master/koperasi/paket/penjualan", label: "Penjualan Paket", icon: Receipt, desc: "Transaksi penjualan paket ke siswa baru", color: "bg-indigo-500/10 text-indigo-600" },
        ],
    },
    {
        to: "/master/koperasi/pembelian",
        label: "Pembelian & Supplier",
        icon: Truck,
        desc: "Pembelian barang, retur, dan manajemen supplier",
        color: "bg-blue-500/10 text-blue-600",
        children: [
            { to: "/master/koperasi/pembelian/list", label: "Pembelian Barang", icon: ArrowDown, desc: "Catatan pembelian & PO ke supplier", color: "bg-blue-500/10 text-blue-600" },
            { to: "/master/koperasi/pembelian/retur", label: "Retur Pembelian", icon: ArrowUUpLeft, desc: "Pengembalian barang ke supplier", color: "bg-blue-500/10 text-blue-600" },
            { to: "/master/koperasi/suppliers", label: "Daftar Supplier", icon: Buildings, desc: "Database supplier dan kontaknya", color: "bg-blue-500/10 text-blue-600" },
        ],
    },
    {
        to: "/master/koperasi/keuangan",
        label: "Keuangan / Kas",
        icon: BookOpenText,
        desc: "Buku kas, penerimaan, dan pengeluaran koperasi",
        color: "bg-emerald-500/10 text-emerald-600",
        children: [
            { to: "/master/koperasi/keuangan/kas-masuk", label: "Kas Masuk", icon: ArrowDown, desc: "Penerimaan kas dari penjualan dan putusan", color: "bg-emerald-500/10 text-emerald-600" },
            { to: "/master/koperasi/keuangan/kas-keluar", label: "Kas Keluar", icon: ArrowUp, desc: "Pengeluaran operasional koperasi", color: "bg-emerald-500/10 text-emerald-600" },
            { to: "/master/koperasi/keuangan/buku-besar", label: "Buku Besar", icon: BookOpenText, desc: "Rekapitulasi seluruh pergerakan kas", color: "bg-emerald-500/10 text-emerald-600" },
            { to: "/master/koperasi/keuangan/rekonsiliasi", label: "Rekonsiliasi", icon: ArrowsLeftRight, desc: "Mencocokkan kas fisik dengan catatan", color: "bg-emerald-500/10 text-emerald-600" },
        ],
    },
    {
        to: "/master/koperasi/kasbon",
        label: "Kasbon / Piutang",
        icon: HandCoins,
        desc: "Kasbon anggota & piutang pelanggan koperasi",
        color: "bg-rose-500/10 text-rose-600",
        children: [
            { to: "/master/koperasi/kasbon/kasbon", label: "Kasbon Karyawan", icon: HandCoins, desc: "Pinjaman & kasbon untuk pengurus/karyawan", color: "bg-rose-500/10 text-rose-600" },
            { to: "/master/koperasi/kasbon/piutang", label: "Piutang Pelanggan", icon: ClipboardText, desc: "Tagihan yang belum dilunasi pelanggan", color: "bg-rose-500/10 text-rose-600" },
            { to: "/master/koperasi/kasbon/pembayaran", label: "Pembayaran Piutang", icon: Money, desc: "Pencatatan angsuran & pelunasan piutang", color: "bg-rose-500/10 text-rose-600" },
        ],
    },
    {
        to: "/master/koperasi/laporan",
        label: "Laporan & Analitik",
        icon: ChartBar,
        desc: "Laporan penjualan, keuangan, dan tren bisnis",
        color: "bg-purple-500/10 text-purple-600",
        children: [
            { to: "/master/koperasi/laporan/penjualan", label: "Laporan Penjualan", icon: ChartLineUp, desc: "Rekap penjualan per periode & per produk", color: "bg-purple-500/10 text-purple-600" },
            { to: "/master/koperasi/laporan/keuangan", label: "Laporan Keuangan", icon: ChartPie, desc: "Ringkasan laba rugi dan posisi kas", color: "bg-purple-500/10 text-purple-600" },
            { to: "/master/koperasi/laporan/stok", label: "Laporan Stok", icon: Stack, desc: "Analisa pergerakan dan nilai persediaan", color: "bg-purple-500/10 text-purple-600" },
            { to: "/master/koperasi/laporan/analitik", label: "Analitik & Tren", icon: TrendUp, desc: "Dashboard data penjualan & produk terlaris", color: "bg-purple-500/10 text-purple-600" },
        ],
    },
    {
        to: "/master/koperasi/promo",
        label: "Promo & Diskon",
        icon: Gift,
        desc: "Promo, diskon, dan program loyalitas",
        color: "bg-pink-500/10 text-pink-600",
        children: [
            { to: "/master/koperasi/promo/diskon", label: "Diskon & Promo", icon: Percent, desc: "Buat promo dan potongan harga produk", color: "bg-pink-500/10 text-pink-600" },
            { to: "/master/koperasi/promo/kupon", label: "Kupon & Voucher", icon: Ticket, desc: "Penerbitan dan validasi kupon belanja", color: "bg-pink-500/10 text-pink-600" },
        ],
    },
    {
        to: "/master/koperasi/pengguna",
        label: "Pengguna & Akses",
        icon: Users,
        desc: "Manajemen pengguna dan hak akses koperasi",
        color: "bg-slate-500/10 text-slate-600",
        children: [
            { to: "/master/koperasi/pengguna/list", label: "Daftar Pengguna", icon: Users, desc: "Pengurus, kasir, dan staf koperasi", color: "bg-slate-500/10 text-slate-600" },
            { to: "/master/koperasi/pengguna/roles", label: "Role & Hak Akses", icon: ShieldCheck, desc: "Pengaturan peran dan izin akses menu", color: "bg-slate-500/10 text-slate-600" },
        ],
    },
    {
        to: "/master/koperasi/pengaturan",
        label: "Pengaturan Koperasi",
        icon: GearSix,
        desc: "Profil koperasi, printer, dan preferensi",
        color: "bg-cyan-500/10 text-cyan-600",
        children: [
            { to: "/master/koperasi/pengaturan/profil", label: "Profil Koperasi", icon: Storefront, desc: "Identitas, nama, dan kontak koperasi", color: "bg-cyan-500/10 text-cyan-600" },
            { to: "/master/koperasi/pengaturan/devices", label: "Perangkat & Printer", icon: Printer, desc: "Konfigurasi printer struk & perangkat kasir", color: "bg-cyan-500/10 text-cyan-600" },
            { to: "/master/koperasi/pengaturan/backup", label: "Backup & Restore", icon: FloppyDisk, desc: "Cadangkan dan pulihkan data koperasi", color: "bg-cyan-500/10 text-cyan-600" },
        ],
    },
]

// ─── Admin Panel ──────────────────────────────────────────────────────────────
export const ADMIN_ITEMS = [
    { to: "/admin", label: "Admin Dashboard", icon: SquaresFour, desc: "Pusat monitoring teknis & integrasi sistem", color: "bg-indigo-600/10 text-indigo-600" },
    { to: "/admin/news", label: "Manajemen Informasi", icon: NewspaperClipping, desc: "Update Informasi & info terbaru ke landing page", color: "bg-emerald-500/10 text-emerald-600" },
    { to: "/admin/ai-insights", label: "AI Insights Center", icon: Robot, desc: "Audit perckapan AI dan analisis performa mesin", color: "bg-indigo-500/10 text-indigo-600" },
    { to: "/admin/logs", label: "Audit Logs", icon: ClockCounterClockwise, desc: "Log historis aktivitas user dan perubahan data", color: "bg-purple-500/10 text-purple-600" },
    { to: "/admin/users", label: "Manajemen Pengguna", icon: UserGear, desc: "Pengaturan hak akses, role, dan kredensial user", color: "bg-rose-500/10 text-rose-600" },
    { to: "/admin/database", label: "Kesehatan Database", icon: Database, desc: "Pemantauan status database & kesehatan tabel", color: "bg-cyan-500/10 text-cyan-600" },
    { to: "/admin/storage", label: "Manajemen Penyimpanan", icon: FolderOpen, desc: "Manajemen media, foto siswa, dan berkas sistem", color: "bg-amber-500/10 text-amber-600" },
    { to: "/admin/tasks", label: "Tugas Latar Belakang", icon: HardDrives, desc: "Status sinkronisasi background & automasi sistem", color: "bg-indigo-500/10 text-indigo-600" },
    { to: "/admin/settings", label: "Pengaturan", icon: GearSix, desc: "Panel pusat pengaturan parameter aplikasi utama", color: "bg-slate-500/10 text-slate-600" },
    { to: "/admin/playground", label: "UI Playground", icon: Palette, desc: "Panduan visual komponen dan dokumentasi desain", color: "bg-pink-500/10 text-pink-600" },
]

// ─── Notification type styles ─────────────────────────────────────────────────
export const TYPE_STYLE = {
    error: { bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-500', text: 'text-red-500', icon: WarningCircle },
    warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-500', text: 'text-amber-500', icon: Warning },
    info: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-500', text: 'text-blue-500', icon: Info },
    success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-500', text: 'text-emerald-500', icon: CheckCircle },
}

// ─── Rows titles ───────────────────────────────────────────────────────────
export const SECTION_TITLES = {
    finance: "Keuangan",
    master: "Master Data",
    koperasi: "Koperasi",
    admin: "Admin",
}

// ─── NavigationArrow groups (structured for Sidebar) ──────────────────────────────
export const NAV_GROUPS = [
    {
        key: 'finance',
        label: SECTION_TITLES.finance,
        icon: CreditCard,
        items: FINANCE_ITEMS,
        hideForRoles: ['staff'],
    },
    {
        key: 'master',
        label: SECTION_TITLES.master,
        icon: Users,
        items: MASTER_ITEMS,
        hideForRoles: ['staff'],
    },
    {
        key: 'koperasi',
        label: SECTION_TITLES.koperasi,
        icon: Storefront,
        items: KOPERASI_ITEMS,
        hideForRoles: ['staff'],
    },
    {
        key: 'admin',
        label: SECTION_TITLES.admin,
        icon: UserGear,
        items: ADMIN_ITEMS,
        requireRoles: ['developer', 'admin'],
    },
]

// ─── Feature flag filter map ──────────────────────────────────────────────────
// Maps route path → feature flag key
export const ROUTE_FLAG_MAP = {
    '/finance/saving': 'nav.saving',
    '/master/students': 'nav.students',
    '/master/teachers': 'nav.teachers',
    '/master/classes': 'nav.classes',
    '/master/periods': 'nav.periods',
}

/**
 * Filter nav items based on feature flags and role.
 * @param {Array} items - Array of nav items
 * @param {Object} flags - Feature flags map
 * @param {string} role - User role (lowercase)
 * @returns {Array} Filtered items
 */
export function filterNavItems(items, flags = {}, role = '') {
    return items.filter(item => {
        const flagKey = ROUTE_FLAG_MAP[item.to]
        if (flagKey && flags[flagKey] === false) return false
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
    const flagFiltered = filterNavItems(allItems, flags, role)

    const seen = new Set()
    return flagFiltered.filter(item => {
        if (seen.has(item.to)) return false
        seen.add(item.to)
        return true
    })
}