/**
 * ─── Shared NavigationArrow Items ──────────────────────────────────────────────────
 * Single source of truth for all navigation data.
 * Used by: Sidebar, SlimTopBar (search), BottomNav/MasterSheet (mobile).
 */
import { House, CreditCard, PiggyBank, Clipboard, Users, GraduationCap, Buildings, CalendarDots, UserPlus, SquaresFour, NewspaperClipping, Robot, ClockCounterClockwise, UserGear, Database, FolderOpen, HardDrives, GearSix, Palette, WarningCircle, Warning, Info, CheckCircle, Stack, ClipboardText } from '@phosphor-icons/react'

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
    { to: "/master/enrollment", label: "Pendaftaran Baru (PPDB)", icon: UserPlus, desc: "Manajemen pendaftaran dan penerimaan siswa baru", color: "bg-emerald-500/10 text-emerald-600" },
    { to: "/master/inventory", label: "Inventaris & Aset", icon: Stack, desc: "Pencatatan sarana prasarana sekolah, inventaris asrama & kelas", color: "bg-blue-500/10 text-blue-600" },
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
 * Funnel nav items based on feature flags and role.
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
