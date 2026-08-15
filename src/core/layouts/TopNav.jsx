import { useEffect, useRef, useState, useCallback } from "react"
import { Archive, Money, Bell, Robot, Cube, Calendar, CalendarBlank, CaretDown, ClipboardText, Database, ClockCounterClockwise, StackSimple, SignOut, Moon, NewspaperClipping, Palette, PresentationChart, Buildings, HardDrives, GearSix, Sun, UserGear, UserPlus, Users, Wallet, Wrench } from '@phosphor-icons/react'
import { NavLink, useNavigate } from "react-router-dom"
import { createPortal } from "react-dom"

import { useTheme, useAuth, useFeatureFlags, useLanguage } from "@context"
import { useNotifications, translateNotification } from "@hooks/useNotifications"
import { NotifBadge, NotifPanelInner } from "./notifShared"

// ─── Avatar component — handles image error state properly ────────────────────
// Gradient hanya muncul saat tidak ada foto. Kalau foto gagal load,
// otomatis fallback ke inisial tanpa gradient bocor.
function Avatar({ url, name, size = "w-10 h-10", textSize = "text-base", rounded = "rounded-2xl" }) {
    const [imgError, setImgError] = useState(false)
    const letter = name?.charAt(0)?.toUpperCase() || 'U'
    const showImg = url && !imgError

    return (
        <div className={`${size} ${rounded} overflow-hidden shrink-0 flex items-center justify-center font-black text-white
            ${showImg ? 'bg-[var(--color-surface-alt)]' : 'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]'}`}>
            {showImg
                ? <img src={url} alt={name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
                : <span className={textSize}>{letter}</span>
            }
        </div>
    )
}

// ─── Portal container helper ──────────────────────────────────────────────────
// Singleton di module-level — dibuat SEKALI saat module di-load, tidak pernah
// dihapus. Mencegah removeChild crash di React 18 Strict Mode / concurrent render.
const _portalContainers = {}
function getPortalContainer(id) {
    if (!_portalContainers[id]) {
        let el = document.getElementById(id)
        if (!el) {
            el = document.createElement('div')
            el.id = id
            document.body.appendChild(el)
        }
        _portalContainers[id] = el
    }
    return _portalContainers[id]
}

const MASTER_ITEMS = [
    { to: "/master/students", label: "Data Siswa", icon: Users, desc: "Pusat database seluruh santri aktif dalam sistem" },
    { to: "/master/teachers", label: "Data Guru", icon: PresentationChart, desc: "Data akun pengajar, musyrif, dan staf sekolah" },
    { to: "/master/classes", label: "Data Kelas", icon: Buildings, desc: "Pengaturan struktur kelas dan pembagian asrama" },
    { to: "/master/periods", label: "Tahun Pelajaran", icon: Calendar, desc: "Manajemen semester dan periode kalender akademik" },
    { to: "/master/enrollment", label: "PSB / Enrollment", icon: UserPlus, desc: "Manajemen pendaftaran dan penerimaan siswa baru", color: "bg-emerald-500/10 text-emerald-600" },
]

const FINANCE_ITEMS = [
    { to: "/finance/invoices", label: "Tagihan SPP", icon: Money, desc: "Kelola tagihan bulanan dan iuran sekolah", color: "bg-amber-500/10 text-amber-600" },
    { to: "/finance/payments", label: "Riwayat Bayar", icon: Wallet, desc: "Rekapitulasi pembayaran dan tunggakan wali", color: "bg-emerald-500/10 text-emerald-600" },
]

const REPORTS_ITEMS = [
    { to: "/attendance", label: "Absensi Bulanan", icon: CalendarBlank, desc: "Rekapitulasi Absensi Santri", color: "bg-emerald-500/10 text-emerald-600" },
]

// Admin-only items — hanya tampil untuk developer & admin
const ADMIN_ITEMS = [
    { to: "/admin", label: "Admin Dashboard Center", icon: Cube, desc: "Pusat monitoring teknis & integrasi sistem", color: "bg-indigo-600/10 text-indigo-600" },
    { to: "/admin/news", label: "Manajemen Informasi", icon: NewspaperClipping, desc: "Update Informasi & info terbaru ke landing page", color: "bg-emerald-500/10 text-emerald-600" },
    { to: "/admin/ai-insights", label: "AI Insights Center", icon: Robot, desc: "Audit perckapan AI dan analisis performa mesin", color: "bg-indigo-500/10 text-indigo-600" },
    { to: "/admin/logs", label: "Audit Logs", icon: ClockCounterClockwise, desc: "Log historis aktivitas user dan perubahan data", color: "bg-purple-500/10 text-purple-600" },
    { to: "/admin/users", label: "User Management", icon: UserGear, desc: "Pengaturan hak akses, role, dan kredensial user", color: "bg-rose-500/10 text-rose-600" },
    { to: "/admin/database", label: "Database Health", icon: Database, desc: "Pemantauan status database & kesehatan tabel", color: "bg-cyan-500/10 text-cyan-600" },
    { to: "/admin/storage", label: "Storage Manager", icon: Archive, desc: "Manajemen media, foto siswa, dan berkas sistem", color: "bg-amber-500/10 text-amber-600" },
    { to: "/admin/tasks", label: "Background Tasks", icon: HardDrives, desc: "Status sinkronisasi background & automasi sistem", color: "bg-indigo-500/10 text-indigo-600" },
    { to: "/admin/settings", label: "Pengaturan", icon: Wrench, desc: "Panel pusat pengaturan parameter aplikasi utama", color: "bg-slate-500/10 text-slate-600" },
    { to: "/admin/playground", label: "UI Playground", icon: Palette, desc: "Panduan visual komponen dan dokumentasi desain", color: "bg-pink-500/10 text-pink-600" },
]

// Panel notifikasi desktop — posisi mengikuti tombol bell
// KEY FIX: menerima isOpen prop — portal selalu di-render, content dikondisikan di dalam.
// Pola ini mencegah removeChild crash saat concurrent unmount.
function DesktopNotifPanel({ isOpen, notifications, loading, refreshing, onDismiss, onRefresh, onNavigate, anchorRef, panelRef }) {
    const container = getPortalContainer('portal-notif')

    // Hitung posisi SAAT render (sync) — tidak ada useEffect, tidak ada glitch
    let style = {}
    if (anchorRef?.current) {
        const rect = anchorRef.current.getBoundingClientRect()
        style = {
            position: 'fixed',
            top: rect.bottom + 12,
            right: window.innerWidth - rect.right - 8, // Offset 8px to the right for better balance
            width: 340,
        }
    }

    return createPortal(
        !isOpen ? null : (
            <div ref={panelRef} style={{ ...style, zIndex: 9999 }}>
                <NotifPanelInner
                    notifications={notifications}
                    loading={loading}
                    refreshing={refreshing}
                    onDismiss={onDismiss}
                    onRefresh={onRefresh}
                    onNavigate={onNavigate}
                />
            </div>
        ),
        container
    )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function TopNav({ title, subtitle }) {
    const { isDark, toggleTheme } = useTheme()
    const { profile, signOut } = useAuth()
    const { flags } = useFeatureFlags()
    const navigate = useNavigate()
    const { notifications, loading, refreshing, dismiss, refresh } = useNotifications()
    const { t } = useLanguage()

    // ── Filter nav items by feature flags
    const visibleReportsItems = REPORTS_ITEMS.filter(it => {
        if (it.to === '/attendance') return flags['nav.absensi'] !== false
        return true
    })
    const role = profile?.role?.toLowerCase()
    const isStaff = role === 'staff'
    const filteredReportsItems = visibleReportsItems

    // Filter master items by nav flags
    const filteredMasterItems = MASTER_ITEMS.filter(it => {
        if (it.to === '/master/students') return flags['nav.students'] !== false
        if (it.to === '/master/teachers') return flags['nav.teachers'] !== false
        if (it.to === '/master/classes') return flags['nav.classes'] !== false
        if (it.to === '/master/periods') return flags['nav.periods'] !== false
        return true
    })

    const [masterOpen, setMasterOpen] = useState(false)
    const [financeOpen, setFinanceOpen] = useState(false)
    const [reportsOpen, setReportsOpen] = useState(false)
    const [adminOpen, setAdminOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)
    const [notifOpen, setNotifOpen] = useState(false)

    const masterRef = useRef(null)
    const financeRef = useRef(null)
    const reportsRef = useRef(null)
    const adminRef = useRef(null)
    const desktopProfileRef = useRef(null)
    const notifBtnRef = useRef(null)
    const notifPanelRef = useRef(null)

    // Jumlah notif yang butuh perhatian (error + warning)
    const urgentCount = notifications.filter(n => n.type === 'error' || n.type === 'warning').length
    const totalCount = notifications.length

    // Close on outside click
    useEffect(() => {
        const onClick = (e) => {
            if (masterRef.current && !masterRef.current.contains(e.target)) setMasterOpen(false)
            if (financeRef.current && !financeRef.current.contains(e.target)) setFinanceOpen(false)
            if (reportsRef.current && !reportsRef.current.contains(e.target)) setReportsOpen(false)
            if (adminRef.current && !adminRef.current.contains(e.target)) setAdminOpen(false)

                        const isOutsideDesktop = desktopProfileRef.current && !desktopProfileRef.current.contains(e.target)
            if (isOutsideDesktop) setProfileOpen(false)

            const isOutsideNotifBtn = notifBtnRef.current && !notifBtnRef.current.contains(e.target)
            const isOutsideNotifPanel = notifPanelRef.current && !notifPanelRef.current.contains(e.target)
            if (isOutsideNotifBtn && isOutsideNotifPanel) setNotifOpen(false)
        }
        window.addEventListener("mousedown", onClick)
        return () => window.removeEventListener("mousedown", onClick)
    }, [])

    const handleNotifNavigate = useCallback((route) => {
        setNotifOpen(false)
        navigate(route)
    }, [navigate])

    const tabClass = ({ isActive }) =>
        `px-3 py-2 rounded-xl text-sm font-bold transition
     ${isActive ? "bg-[var(--color-surface)] shadow-sm text-[var(--color-text)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/50 dark:hover:bg-white/5"}`

    const today = new Date().toLocaleDateString("id-ID", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
    })

    // Bell button — hanya tombol, panel dirender sekali di luar
    const BellButton = () => {
        const { t } = useLanguage()
        return (
            <div className="relative" ref={notifBtnRef}>
                <button
                    onClick={() => setNotifOpen(v => !v)}
                    className={`relative p-2.5 rounded-xl transition
                        ${notifOpen
                            ? 'bg-[var(--color-surface-alt)] text-[var(--color-primary)]'
                            : 'hover:bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)]'}
                        ${urgentCount > 0 ? 'animate-[bellShake_2s_ease-in-out_infinite]' : ''}`}
                    aria-label={t('notif.header')}
                    title={t('notif.header')}
                    type="button"
                >
                    <Bell />
                    <NotifBadge count={urgentCount || (totalCount > 0 ? totalCount : 0)} />
                </button>
            </div>
        )
    }

    // ── Hide on Scroll Logic ──
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        let lastY = window.scrollY
        const handleScroll = () => {
            const currentY = window.scrollY

            // Tampilkan jika:
            // 1. Scroll ke atas
            // 2. Masih di paling atas (< 50px)
            if (currentY < lastY || currentY < 50) {
                setIsVisible(true)
            } else if (currentY > lastY && currentY > 100) {
                // Sembunyikan jika scroll ke bawah > 100px
                setIsVisible(false)
            }

            lastY = currentY
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <>
            {/* Animasi bell shake untuk notif urgent */}
            <style>{`
                @keyframes bellShake {
                    0%, 85%, 100% { transform: rotate(0deg); }
                    88% { transform: rotate(-12deg); }
                    92% { transform: rotate(12deg); }
                    96% { transform: rotate(-8deg); }
                    98% { transform: rotate(8deg); }
                }
            `}</style>

            <header
                className={`sticky top-0 z-40 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
                ${!isVisible ? 'lg:translate-y-0 -translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
            >
                <div className="mx-auto max-w-[1800px] px-3 sm:px-4 lg:px-6 pt-3">

                    {/* ===================== */}
                    {/* MOBILE */}
                    {/* ===================== */}
                    <div className="lg:hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/70 backdrop-blur-md shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                            {/* Left */}
                            <div className="min-w-0 flex-1">
                                <div className="text-[15px] font-extrabold text-[var(--color-text)] truncate leading-tight">
                                    {title || "Dashboard"}
                                </div>
                                <div className="text-[9px] font-bold tracking-widest uppercase text-[var(--color-text-muted)] truncate">
                                    {subtitle || today}
                                </div>
                            </div>

                            {/* Right: Theme toggle only (Bell & Profile pindah ke BottomNav) */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={toggleTheme}
                                    aria-label={isDark ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
                                    className="p-2 rounded-xl hover:bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition"
                                    type="button"
                                >
                                    {isDark ? <Sun /> : <Moon />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ===================== */}
                    {/* DESKTOP */}
                    {/* ===================== */}
                    <div className="hidden lg:block rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/85 backdrop-blur-xl shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                        <div className="flex items-center justify-between px-4 py-3">

                            {/* Left: Logo */}
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-9 h-9 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center shrink-0"
                                    aria-label="Koperasi SenyumMu Logo"
                                    role="img"
                                >
                                    <span aria-hidden="true">L</span>
                                </div>

                                <div>
                                    <p className="text-sm font-extrabold text-[var(--color-text)] leading-tight">{title || "Dashboard"}</p>
                                    <p className="text-[9px] font-bold tracking-widest uppercase text-[var(--color-text-muted)]">{subtitle || today}</p>
                                </div>
                            </div>
                            <div className="flex justify-center">
                                <nav className="flex items-center gap-1.5 bg-[var(--color-surface-alt)]/60 rounded-2xl p-1.5">
                                    <NavLink to="/dashboard" className={tabClass}>Dashboard</NavLink>
                                    <div className="relative" ref={financeRef}>
                                        <button onClick={() => setFinanceOpen(v => !v)} className={`px-3 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${financeOpen ? "bg-[var(--color-surface)] shadow-sm text-[var(--color-text)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/50 dark:hover:bg-white/5"}`} type="button">
                                            <Money className="opacity-70" /> Keuangan <CaretDown className={`w-2.5 h-2.5 transition-transform ${financeOpen ? "rotate-180" : ""}`} />
                                        </button>
                                        {financeOpen && (
                                            <div className="absolute left-0 mt-2 w-64 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                                                <div className="px-3 py-2 text-[10px] font-black tracking-widest text-[var(--color-text-muted)] uppercase border-b border-[var(--color-border)]">Manajemen Keuangan</div>
                                                <div className="p-2">
                                                    {FINANCE_ITEMS.map(it => (
                                                        <button key={it.to} onClick={() => { setFinanceOpen(false); navigate(it.to) }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-surface-alt)] transition group" type="button">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${it.color}`}><it.icon className="text-xs" /></div>
                                                            <div className="text-left"><p className="text-[11px] font-black text-[var(--color-text)] leading-tight">{it.label}</p><p className="text-[9px] text-[var(--color-text-muted)] font-medium leading-tight mt-0.5">{it.desc}</p></div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative" ref={reportsRef}>
                                        <button onClick={() => setReportsOpen(v => !v)} className={`px-3 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${reportsOpen ? "bg-[var(--color-surface)] shadow-sm text-[var(--color-text)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/50 dark:hover:bg-white/5"}`} type="button">
                                            <ClipboardText className="opacity-70" /> Laporan <CaretDown className={`w-2.5 h-2.5 transition-transform ${reportsOpen ? "rotate-180" : ""}`} />
                                        </button>
                                        {reportsOpen && (
                                            <div className="absolute left-0 mt-2 w-64 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                                                <div className="px-3 py-2 text-[10px] font-black tracking-widest text-[var(--color-text-muted)] uppercase border-b border-[var(--color-border)]">Rekapitulasi</div>
                                                <div className="p-2">
                                                    {REPORTS_ITEMS.map(it => (
                                                        <button key={it.to} onClick={() => { setReportsOpen(false); navigate(it.to) }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-surface-alt)] transition group" type="button">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${it.color}`}><it.icon className="text-xs" /></div>
                                                            <div className="text-left"><p className="text-[11px] font-black text-[var(--color-text)] leading-tight">{it.label}</p><p className="text-[9px] text-[var(--color-text-muted)] font-medium leading-tight mt-0.5">{it.desc}</p></div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative" ref={masterRef}>
                                        <button onClick={() => setMasterOpen(v => !v)} className={`px-3 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${masterOpen ? "bg-[var(--color-surface)] shadow-sm text-[var(--color-text)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/50 dark:hover:bg-white/5"}`} type="button">
                                            <StackSimple className="opacity-70" /> Master <CaretDown className={`w-2.5 h-2.5 transition-transform ${masterOpen ? "rotate-180" : ""}`} />
                                        </button>
                                        {masterOpen && (
                                            <div className="absolute left-0 mt-2 w-64 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                                                <div className="px-3 py-2 text-[10px] font-black tracking-widest text-[var(--color-text-muted)] uppercase border-b border-[var(--color-border)]">Pusat Data Master</div>
                                                <div className="p-2">
                                                    {MASTER_ITEMS.map(it => (
                                                        <button key={it.to} onClick={() => { setMasterOpen(false); navigate(it.to) }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-surface-alt)] transition group" type="button">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-indigo-500/10 text-indigo-600`}><it.icon className="text-xs" /></div>
                                                            <div className="text-left"><p className="text-[11px] font-black text-[var(--color-text)] leading-tight">{it.label}</p><p className="text-[9px] text-[var(--color-text-muted)] font-medium leading-tight mt-0.5">{it.desc}</p></div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Admin Dropdown — developer & admin only */}
                                    {['developer', 'admin'].includes(profile?.role?.toLowerCase()) && (
                                        <div className="relative" ref={adminRef}>
                                            <button
                                                onClick={() => setAdminOpen(v => !v)}
                                                aria-label="List Admin"
                                                className={`px-3 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2
                                                    ${adminOpen
                                                        ? "bg-[var(--color-surface)] shadow-sm text-[var(--color-text)]"
                                                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/50 dark:hover:bg-white/5"}`}
                                                type="button"
                                            >
                                                <UserGear />
                                                Admin
                                                <CaretDown className={`text-xs transition-transform ${adminOpen ? "rotate-180" : ""}`} />
                                            </button>

                                            {adminOpen && (
                                                <div className="absolute right-0 lg:left-auto lg:right-0 mt-2 w-[calc(100vw-2rem)] sm:w-[480px] rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 origin-top-right z-50">
                                                    <div className="px-5 py-3.5 text-[10px] font-black tracking-[0.2em] text-[var(--color-text-muted)] uppercase border-b border-[var(--color-border)]/50 bg-[var(--color-surface-alt)]/30">
                                                        Infrastructure & Control
                                                    </div>
                                                    <div className="p-3 grid grid-cols-2 gap-1.5">
                                                        {ADMIN_ITEMS.map((it, idx) => (
                                                            <button
                                                                key={it.to}
                                                                onClick={() => { setAdminOpen(false); navigate(it.to) }}
                                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-[var(--color-surface-alt)] transition-all group border border-transparent hover:border-[var(--color-border)] ${idx === 0 ? 'col-span-2 bg-indigo-500/5 !border-indigo-500/20' : ''}`}
                                                                type="button"
                                                            >
                                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 ${it.color} shadow-sm`}>
                                                                    <it.icon className="text-sm" />
                                                                </div>
                                                                <div className="text-left min-w-0">
                                                                    <p className={`text-[11px] font-black text-[var(--color-text)] leading-tight truncate ${idx === 0 ? 'text-indigo-600' : ''}`}>{it.label}</p>
                                                                    <p className="text-[9px] text-[var(--color-text-muted)] font-bold leading-tight mt-0.5 opacity-60 line-clamp-1">{it.desc}</p>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="px-5 py-3 bg-[var(--color-surface-alt)]/50 flex justify-between items-center border-t border-[var(--color-border)]/50">
                                                        <span className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Koperasi SenyumMu</span>
                                                        <div className="flex gap-1">
                                                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">All Systems Operational</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Divider */}
                                    <div className="w-px h-5 bg-[var(--color-border)] mx-1 opacity-50" />

                                    <div className="flex items-center">
                                        <BellButton />
                                        <button
                                            onClick={toggleTheme}
                                            aria-label={isDark ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
                                            className="p-2.5 rounded-xl hover:bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition"
                                            type="button"
                                        >
                                            {isDark ? <Sun /> : <Moon />}
                                        </button>
                                    </div>
                                </nav>
                            </div>

                            {/* Right: Profile */}
                            <div className="flex items-center justify-end">
                                {/* Profile dropdown */}
                                <div className="relative" ref={desktopProfileRef}>
                                    <button
                                        onClick={() => setProfileOpen(v => !v)}
                                        aria-label="List Profil"
                                        className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-2xl hover:bg-[var(--color-surface-alt)] transition border border-transparent hover:border-[var(--color-border)]"
                                        type="button"
                                    >
                                        <Avatar url={profile?.avatar_url} name={profile?.name} />
                                        <div className="hidden sm:flex flex-col items-start leading-tight">
                                            <span className="text-sm font-extrabold text-[var(--color-text)]">{profile?.name || "User"}</span>
                                            <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--color-text-muted)]">{profile?.role || "Staff"}</span>
                                        </div>
                                        <CaretDown
                                            className={`text-xs text-[var(--color-text-muted)] transition-transform ${profileOpen ? "rotate-180" : ""}`}
                                        />
                                    </button>

                                    {profileOpen && (
                                        <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl overflow-hidden">
                                            <button
                                                onClick={() => { setProfileOpen(false); navigate("/settings") }}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-alt)] transition font-bold text-sm text-[var(--color-text)]"
                                                type="button"
                                            >
                                                <GearSix /> GearSix
                                            </button>
                                            <button
                                                onClick={async () => { setProfileOpen(false); await signOut(); navigate("/login") }}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-alt)] transition font-bold text-sm text-red-600"
                                                type="button"
                                            >
                                                <SignOut /> Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </header>
            {/* KEY FIX: Selalu render panel, jangan conditional mount.
                Portal unmount = crash. Pass isOpen sebagai prop, biarkan
                panel yang putuskan render null di dalam portal. */}
            <DesktopNotifPanel
                isOpen={notifOpen}
                notifications={notifications.map(n => translateNotification(n, t))}
                loading={loading}
                refreshing={refreshing}
                onDismiss={dismiss}
                onRefresh={refresh}
                onNavigate={handleNotifNavigate}
                anchorRef={notifBtnRef}
                panelRef={notifPanelRef}
            />
        </>
    )
}