import { lazy, Suspense, useState, useMemo } from 'react'
import { Toaster } from 'react-hot-toast'
import { Warning, CaretLeft, Question, DoorOpen, Spinner, Lock, Wrench, MagnifyingGlass, LinkBreak, SquaresFour } from '@phosphor-icons/react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AuthProvider, useAuth,
  ToastProvider,
  ThemeProvider, useTheme,
  LanguageProvider,
  FeatureFlagsProvider, useFeatureFlags,
  CustomizeProvider,
} from '@context'
import DashboardLayout from '@core/layouts/DashboardLayout'

import { GlobalErrorBoundary } from '@shared/components'
import { logErrorToSupabase } from '@shared/utils/errorLogger'
import { Component } from 'react'
import { getAccessibleNavItems } from '@core/layouts/navItems'

// ─── Lazy Loading Guard ───────────────────────────────────────────────────────

function lazyRetry(componentImport) {
  return lazy(async () => {
    try {
      return await componentImport()
    } catch (error) {
      if (error.message?.includes('Failed to fetch') || error.message?.includes('dynamically imported module')) {
        console.warn('[LazyRetry] Chunk load failed. Reloading window...')
        window.location.reload()
        return { default: () => null }
      }
      throw error
    }
  })
}

// ─── Lazy-loaded Pages ────────────────────────────────────────────────────────

// Public
const LandingPage = lazyRetry(() => import('@features/public/pages/LandingPage.jsx'))
const LoginPage = lazyRetry(() => import('@features/auth/pages/LoginPage.jsx'))
const ParentCheckPage = lazyRetry(() => import('@features/auth/pages/ParentCheckPage.jsx'))
const InformationPage = lazyRetry(() => import('@features/public/pages/InformationPage.jsx'))
// Core
const DashboardPage = lazyRetry(() => import('@features/dashboard/pages/DashboardPage.jsx'))
const TaskCenterPage = lazyRetry(() => import('@features/dashboard/pages/TaskCenterPage.jsx'))
const SettingsPage = lazyRetry(() => import('@features/settings/pages/SettingsPage.jsx'))

// Admin-only
const UserPage = lazyRetry(() => import('@features/admin/pages/UserPage.jsx'))
const LogsPage = lazyRetry(() => import('@features/admin/pages/LogsPage.jsx'))
const AdminSettingsPage = lazyRetry(() => import('@features/admin/pages/SettingsPage.jsx'))
const DatabasePage = lazyRetry(() => import('@features/admin/pages/DatabasePage.jsx'))
const StoragePage = lazyRetry(() => import('@features/admin/pages/StoragePage.jsx'))
const TasksPage = lazyRetry(() => import('@features/admin/pages/TasksPage.jsx'))
const PlaygroundPage = lazyRetry(() => import('@features/admin/pages/PlaygroundPage.jsx'))
const NewsListPage = lazyRetry(() => import('@features/news/pages/NewsListPage.jsx'))
const NewsEditorPage = lazyRetry(() => import('@features/news/pages/NewsEditorPage.jsx'))
const AiInsightsPage = lazyRetry(() => import('@features/admin/pages/ai/AiInsightsPage.jsx'))
const AdminDashboardPage = lazyRetry(() => import('@features/admin/pages/AdminDashboardPage.jsx'))

// Master Data
const StudentsPage = lazyRetry(() => import('@features/students/pages/StudentsPage.jsx'))
const TeachersPage = lazyRetry(() => import('@features/teachers/pages/TeachersPage.jsx'))
const TeacherImportPage = lazyRetry(() => import('@features/teachers/pages/TeacherImportPage.jsx'))
const TeacherExportPage = lazyRetry(() => import('@features/teachers/pages/TeacherExportPage.jsx'))
const ClassesPage = lazyRetry(() => import('@features/classes/pages/ClassesPage.jsx'))
const ClassImportPage = lazyRetry(() => import('@features/classes/pages/ClassImportPage.jsx'))
const ClassExportPage = lazyRetry(() => import('@features/classes/pages/ClassExportPage.jsx'))
const PeriodsPage = lazyRetry(() => import('@features/periods/pages/PeriodsPage.jsx'))
const PeriodImportPage = lazyRetry(() => import('@features/periods/pages/PeriodImportPage.jsx'))
const PeriodExportPage = lazyRetry(() => import('@features/periods/pages/PeriodExportPage.jsx'))

// Koperasi & Unit Usaha (semua submenu masih placeholder "Coming Soon")
const KoperasiComingSoonPage = lazyRetry(() => import('@features/koperasi/pages/KoperasiComingSoonPage.jsx'))

// ─── Role Hierarchy ───────────────────────────────────────────────────────────

const DEV_ONLY = ['developer']
const DEV_ADMIN = ['developer', 'admin']
const DEV_ADMIN_TEACHER = ['developer', 'admin', 'teacher']
const ALL_STAFF = ['developer', 'admin', 'teacher', 'staff', 'pimpinan']

const ROUTE_ALIASES = [
  // English ↔ Indonesian aliases
  // Master data aliases
  { from: '/master/student', to: '/master/students' },
  { from: '/master/teacher', to: '/master/teachers' },
  { from: '/master/class', to: '/master/classes' },

  // Admin data aliases
  { from: '/admin/log', to: '/admin/logs' },
  { from: '/admin/user', to: '/admin/users' },
  { from: '/admin/setting', to: '/admin/settings' },
  { from: '/admin/db', to: '/admin/database' },
  { from: '/admin/task', to: '/admin/tasks' },
  { from: '/playground', to: '/admin/playground' },
  { from: '/master/academic-years', to: '/master/periods' },
  { from: '/master/academic-year', to: '/master/periods' },
]

// ─── Loading Spinner ──────────────────────────────────────────────────────────
function PageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-[3px] border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        <p className="text-[var(--color-text-muted)] text-sm font-medium">Memuat halaman...</p>
      </div>
    </div>
  )
}

// ─── Auth Guards ──────────────────────────────────────────────────────────────

/** Blocks unauthenticated users. */
function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) return <PageSpinner />
  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}

/** Blocks authenticated users from visiting public pages (e.g. /login). */
function PublicRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <PageSpinner />
  if (user) return <Navigate to="/dashboard" replace />

  return children
}

/**
 * Role-based guard — wraps a single page element.
 * Redirects to /dashboard if the user's role is not in `allowedRoles`.
 *
 * Usage:
 *   <Route path="/user" element={<RoleRoute roles={ADMIN_ROLES}><UserPage /></RoleRoute>} />
 */
function RoleRoute({ children, roles = [] }) {
  const { profile } = useAuth()

  if (!roles.length) return children

  const role = profile?.role?.toLowerCase()
  if (!role || !roles.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

/**
 * Combined Role + Flag guard.
 * Cek role dulu, lalu cek feature flag.
 */
function RoleFlagRoute({ children, roles = [], flag, label }) {
  const { profile } = useAuth()
  const { flags, loading } = useFeatureFlags()
  const navigate = useNavigate()

  const role = profile?.role?.toLowerCase()
  const hasRole = !roles.length || (role && roles.includes(role))

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner className="animate-spin text-2xl text-[var(--color-primary)]" />
      </div>
    </DashboardLayout>
  )

  // Role tidak sesuai
  if (!hasRole) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-rose-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-rose-500/20 rounded-3xl blur-xl" />
            <div className="relative w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-2xl shadow-rose-500/20">
              <Lock className="text-3xl text-white drop-shadow-md" />
            </div>
          </div>

          <div className="text-center space-y-3 mb-10">
            <h2 className="text-2xl font-black text-[var(--color-text)] tracking-tight">
              Akses Ditolak
            </h2>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed px-4 opacity-80">
              Maaf, halaman ini tidak dapat diakses oleh role <span className="font-bold text-rose-500 px-1.5 py-0.5 rounded-lg bg-rose-500/5 border border-rose-500/10 uppercase tracking-tighter text-[10px]">{(role?.charAt(0).toUpperCase() + role?.slice(1)) || 'Pengguna'}</span>.
            </p>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="group h-12 px-8 rounded-2xl bg-rose-500 text-white text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-rose-500/20 flex items-center gap-3"
          >
            <span>←</span>
            Kembali
          </button>
        </div>
      </div>
    </DashboardLayout>
  )

  // Flag off
  if (flag && flags[flag] === false) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-amber-500/20 rounded-3xl blur-xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-orange-500/20">
              <Lock className="text-3xl text-white drop-shadow-md" />
            </div>
          </div>

          <div className="text-center space-y-3 mb-10">
            <h2 className="text-2xl font-black text-[var(--color-text)] tracking-tight">
              Modul Tidak Aktif
            </h2>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed px-4 opacity-80">
              Fitur <span className="font-bold text-[var(--color-text)] px-1.5 py-0.5 rounded-lg bg-[var(--color-surface-alt)] border border-[var(--color-border)]">{label || flag}</span> saat ini sedang dinonaktifkan oleh administrator sistem.
            </p>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="group h-12 px-8 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 flex items-center gap-3"
          >
            <span>←</span>
            Kembali Sekarang
          </button>
        </div>
      </div>
    </DashboardLayout>
  )

  return children
}
// ─── Maintenance Page ─────────────────────────────────────────────────────────
function MaintenancePage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-app-bg)] px-4 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[520px] h-[520px] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-24 -left-24 w-[520px] h-[520px] bg-orange-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 text-center max-w-md w-full">
        {/* Icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-24 h-24 rounded-3xl bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center shadow-xl shadow-amber-500/10">
            <Wrench className="text-4xl text-amber-500" />
          </div>
        </div>

        {/* TextT */}
        <h1 className="text-3xl font-black font-heading tracking-tight text-[var(--color-text)] mb-3">
          Sedang Maintenance
        </h1>
        <p className="text-[var(--color-text-muted)] text-sm leading-relaxed mb-2">
          Sistem sedang dalam pemeliharaan oleh administrator.
        </p>
        <p className="text-[var(--color-text-muted)] text-sm leading-relaxed mb-8">
          Silakan kembali beberapa saat lagi.
        </p>

        {/* Info card */}
        <div className="glass rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 mb-8 text-left">
          <div className="flex items-start gap-3">
            <Warning className="text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-[12px] font-black text-amber-700 mb-1">Informasi</p>
              <p className="text-[11px] text-amber-600/80 leading-relaxed">
                Seluruh data kamu aman. Maintenance ini bersifat sementara dan tidak menghapus data apapun.
              </p>
            </div>
          </div>
        </div>

        {/* Login as different account or logout */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-[11px] text-[var(--color-text-muted)]">
            Login sebagai: <span className="font-black text-[var(--color-text)]">{profile?.name}</span>
            <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-[var(--color-surface-alt)] text-[10px] font-black uppercase border border-[var(--color-border)]">{profile?.role}</span>
          </p>
          <button
            onClick={async () => { await signOut(); navigate('/login') }}
            className="h-9 px-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[11px] font-black text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all"
          >
            Ganti Akun
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Maintenance guard — wrap di dalam ProtectedRoute.
 * Kalau system.maintenance = true dan user bukan developer → tampilkan MaintenancePage.
 * Developer tetap bisa akses semua halaman normal.
 */
function MaintenanceGuard({ children }) {
  const { profile } = useAuth()
  const { flags, loading } = useFeatureFlags()

  // Tunggu flags load dulu
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-[3px] border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        <p className="text-[var(--color-text-muted)] text-sm font-medium">Memuat...</p>
      </div>
    </div>
  )

  // Developer selalu bypass maintenance
  const isDeveloper = profile?.role?.toLowerCase() === 'developer'
  if (!isDeveloper && flags['system.maintenance'] === true) {
    return <MaintenancePage />
  }

  return children
}

// ─── 404 Not Found Page ─────────────────────────────────────────────────────
function NotFoundPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')

  const currentUrl = location.pathname

  // ── Dynamic nav items dari navItems.js (single source of truth) ──
  const { profile } = useAuth()
  const { flags } = useFeatureFlags()
  const role = profile?.role?.toLowerCase() ?? ''

  // Semua halaman yang boleh diakses role ini (dashboard + task-center + semua NAV_GROUPS,
  // sudah difilter role & feature flag, sudah dedup). Sama persis dengan yang muncul di Sidebar.
  const allEligibleItems = useMemo(
    () =>
      getAccessibleNavItems(role, flags).map(item => ({
        label: item.label,
        path: item.to,
        Icon: item.icon,
      })),
    [role, flags]
  )

  const query = searchQuery.trim().toLowerCase()
  const isSearching = query.length > 0

  // Kalau lagi search → cari dari SEMUA item eligible (finance, master, admin, dsb).
  // Kalau kosong → tampilkan 6 quick links default.
  const results = isSearching
    ? allEligibleItems.filter(l => l.label.toLowerCase().includes(query))
    : allEligibleItems.slice(0, 9)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)] px-6 py-10 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-[var(--color-primary)]/5 rounded-full blur-[140px]" />
        <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[140px]" />
      </div>

      {/* ── Two-column card ── */}
      <div className="relative z-10 w-full max-w-3xl min-h-[420px] flex flex-col md:flex-row items-stretch gap-0 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] shadow-2xl shadow-black/5 overflow-hidden">

        {/* ── LEFT: Visual ── */}
        <div className="flex flex-col items-center justify-center text-center px-10 py-14 md:w-[45%] min-h-[380px] border-b md:border-b-0 md:border-r border-[var(--color-border)] bg-[var(--color-surface)]">

          {/* Icon illustration */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-[var(--color-primary)]/10 rounded-3xl blur-2xl" />
            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-[var(--color-primary)]/10 to-purple-500/10 border border-[var(--color-border)] flex items-center justify-center">
              <LinkBreak weight="duotone" className="text-5xl text-[var(--color-primary)]" />
            </div>
          </div>

          {/* 404 */}
          <div className="text-[80px] font-black font-heading leading-none gradient-text select-none tracking-tight">
            404
          </div>
          <h2 className="text-[15px] font-black text-[var(--color-text)] mt-1 mb-2">
            Halaman Tidak Ditemukan
          </h2>
          <p className="text-[12px] leading-relaxed mb-5" style={{ color: 'oklch(0.55 0 0)' }}>
            URL yang kamu akses tidak tersedia
            atau sudah dipindahkan.
          </p>

          {/* URL badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] max-w-full overflow-hidden">
            <span className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest shrink-0">URL</span>
            <span className="text-[11px] font-mono text-red-500 truncate">{currentUrl}</span>
          </div>
        </div>

        {/* ── RIGHT: Navigation ── */}
        <div className="flex flex-col justify-between px-8 py-10 md:flex-1">

          {/* Top block: label + search + quick links */}
          <div>
            <p className="text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-3">Navigasi Cepat</p>

            {/* Search */}
            <div className="relative mb-4">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-base pointer-events-none" />
              <input
                type="text"
                placeholder="Cari halaman..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[13px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/25 focus:border-[var(--color-primary)]/40 transition-all"
              />
            </div>

            {/* Quick links / hasil search — scrollable kalau lagi search & hasilnya banyak */}
            <div className={`flex-1 flex flex-col justify-center ${isSearching ? 'max-h-[220px] overflow-y-auto pr-1' : ''}`}>
              <div className="grid grid-cols-3 gap-2">
                {results.length > 0 ? results.map(({ label, path, Icon }) => (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    className="flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/5 transition-all group"
                  >
                    <Icon weight="duotone" className="text-lg text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors shrink-0" />
                    <span className="w-full truncate text-[10px] font-black text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors text-center leading-tight">
                      {label}
                    </span>
                  </button>
                )) : (
                  <div className="col-span-3 text-[11px] text-[var(--color-text-muted)] py-3 text-center">
                    Tidak ada halaman yang cocok.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom block: divider + action buttons */}
          <div>
            <div className="mb-5 border-t border-[var(--color-border)]" />
            <div className="flex gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[11px] font-black text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-primary)]/30 transition-all flex items-center justify-center gap-1.5">
                <CaretLeft className="text-sm" />
                Kembali
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 h-10 rounded-xl bg-[var(--color-primary)] text-white text-[11px] font-black hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[var(--color-primary)]/20 flex items-center justify-center gap-1.5">
                <SquaresFour className="text-sm" />
                Ke Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Routes ───────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>

        {/* ── Public ── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/check" element={<ParentCheckPage />} />
        <Route path="/login" element={
          <PublicRoute><LoginPage /></PublicRoute>
        } />
        <Route path="/informasi" element={<InformationPage />} />
        {/* ── Protected ── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MaintenanceGuard><Outlet /></MaintenanceGuard>}>

            {/* Core — module flag guarded */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/task-center" element={<TaskCenterPage />} />
            <Route path="/settings" element={<SettingsPage />} />

            <Route path="/admin/logs" element={
              <RoleFlagRoute roles={DEV_ADMIN}>
                <LogsPage />
              </RoleFlagRoute>
            } />
            <Route path="/admin/users" element={
              <RoleFlagRoute roles={DEV_ADMIN}>
                <UserPage />
              </RoleFlagRoute>
            } />
            <Route path="/admin/settings" element={
              <RoleFlagRoute roles={DEV_ADMIN}>
                <AdminSettingsPage />
              </RoleFlagRoute>
            } />
            <Route path="/admin/database" element={
              <RoleFlagRoute roles={DEV_ADMIN}>
                <DatabasePage />
              </RoleFlagRoute>
            } />
            <Route path="/admin/storage" element={
              <RoleFlagRoute roles={DEV_ADMIN}>
                <StoragePage />
              </RoleFlagRoute>
            } />
            <Route path="/admin/tasks" element={
              <RoleFlagRoute roles={DEV_ADMIN}>
                <TasksPage />
              </RoleFlagRoute>
            } />
            <Route path="/admin/playground" element={
              <RoleFlagRoute roles={DEV_ADMIN}>
                <PlaygroundPage />
              </RoleFlagRoute>
            } />

            {/* Master Data */}
            <Route path="/admin/news" element={
              <RoleFlagRoute roles={DEV_ADMIN}>
                <NewsListPage />
              </RoleFlagRoute>
            } />
            <Route path="/admin/news/create" element={
              <RoleFlagRoute roles={DEV_ADMIN}>
                <NewsEditorPage />
              </RoleFlagRoute>
            } />
            <Route path="/admin/news/edit/:id" element={
              <RoleFlagRoute roles={DEV_ADMIN}>
                <NewsEditorPage />
              </RoleFlagRoute>
            } />
            <Route path="/admin/ai-insights" element={
              <RoleFlagRoute roles={DEV_ADMIN}>
                <AiInsightsPage />
              </RoleFlagRoute>
            } />
            <Route path="/admin" element={
              <RoleFlagRoute roles={DEV_ADMIN}>
                <AdminDashboardPage />
              </RoleFlagRoute>
            } />

            <Route path="/master/students" element={
              <RoleFlagRoute roles={DEV_ADMIN_TEACHER} flag="module.students" label="Data Siswa">
                <StudentsPage />
              </RoleFlagRoute>
            } />
            <Route path="/master/teachers" element={
              <RoleFlagRoute roles={DEV_ADMIN_TEACHER} flag="module.teachers" label="Data Guru">
                <TeachersPage />
              </RoleFlagRoute>
            } />
            <Route path="/master/teachers/:id" element={
              <RoleFlagRoute roles={DEV_ADMIN_TEACHER} flag="module.teachers" label="Detail Guru">
                <TeachersPage />
              </RoleFlagRoute>
            } />
            <Route path="/master/teachers/import" element={
              <RoleFlagRoute roles={DEV_ADMIN_TEACHER} flag="module.teachers" label="Import Guru">
                <TeacherImportPage />
              </RoleFlagRoute>
            } />
            <Route path="/master/teachers/export" element={
              <RoleFlagRoute roles={DEV_ADMIN_TEACHER} flag="module.teachers" label="Export Guru">
                <TeacherExportPage />
              </RoleFlagRoute>
            } />
            <Route path="/master/classes" element={
              <RoleFlagRoute roles={DEV_ADMIN_TEACHER} flag="module.classes" label="Data Kelas">
                <ClassesPage />
              </RoleFlagRoute>
            } />
            <Route path="/master/classes/:id" element={
              <RoleFlagRoute roles={DEV_ADMIN_TEACHER} flag="module.classes" label="Detail Kelas">
                <ClassesPage />
              </RoleFlagRoute>
            } />
            <Route path="/master/classes/import" element={
              <RoleFlagRoute roles={DEV_ADMIN_TEACHER} flag="module.classes" label="Import Kelas">
                <ClassImportPage />
              </RoleFlagRoute>
            } />
            <Route path="/master/classes/export" element={
              <RoleFlagRoute roles={DEV_ADMIN_TEACHER} flag="module.classes" label="Export Kelas">
                <ClassExportPage />
              </RoleFlagRoute>
            } />
            <Route path="/master/periods" element={
              <RoleFlagRoute roles={DEV_ADMIN_TEACHER} flag="module.periods" label="Periode Akademik">
                <PeriodsPage />
              </RoleFlagRoute>
            } />
            <Route path="/master/periods/import" element={
              <RoleFlagRoute roles={DEV_ADMIN_TEACHER} flag="module.periods" label="Import Periode">
                <PeriodImportPage />
              </RoleFlagRoute>
            } />
            <Route path="/master/periods/export" element={
              <RoleFlagRoute roles={DEV_ADMIN_TEACHER} flag="module.periods" label="Export Periode">
                <PeriodExportPage />
              </RoleFlagRoute>
            } />
            <Route path="/master/periods/:id" element={
              <RoleFlagRoute roles={DEV_ADMIN_TEACHER} flag="module.periods" label="Detail Periode">
                <PeriodsPage />
              </RoleFlagRoute>
            } />

            {/* Koperasi — semua route /master/koperasi/* tetap render placeholder */}
            <Route path="/master/koperasi/*" element={
              <RoleFlagRoute roles={DEV_ADMIN_TEACHER}>
                <KoperasiComingSoonPage />
              </RoleFlagRoute>
            } />
            <Route path="/master/koperasi" element={
              <RoleFlagRoute roles={DEV_ADMIN_TEACHER}>
                <KoperasiComingSoonPage />
              </RoleFlagRoute>
            } />

            {/* Route Aliases */}
            {ROUTE_ALIASES.map(({ from, to }) => (
              <Route key={from} path={from} element={<Navigate to={to} replace />} />
            ))}
          </Route>
        </Route>

        {/* ── 404 ── */}
        <Route path="*" element={<NotFoundPage />} />

      </Routes>
    </Suspense>
  )
}

// ─── ErrorBoundary Bridge (inside BrowserRouter so resetKeys can use useLocation) ─
function ErrorBoundaryWithRouter({ children }) {
  const location = useLocation()
  return (
    <GlobalErrorBoundary
      resetKeys={[location.pathname]}
      onError={(error, errorInfo, errorId) => {
        logErrorToSupabase(error, errorInfo, errorId)
      }}
    >
      {children}
    </GlobalErrorBoundary>
  )
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundaryWithRouter>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 600,
              padding: '12px 16px',
            },
          }}
        />
        <LanguageProvider>
          <ThemeProvider>
            <CustomizeProvider>
              <ToastProvider>
                <AuthProvider>
                  <FeatureFlagsProvider>
                    <AppRoutes />
                  </FeatureFlagsProvider>
                </AuthProvider>
              </ToastProvider>
            </CustomizeProvider>
          </ThemeProvider>
        </LanguageProvider>
      </ErrorBoundaryWithRouter>
    </BrowserRouter>
  )
}