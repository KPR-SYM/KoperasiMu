import { useEffect, useMemo, useState, useCallback, lazy, Suspense } from 'react'
import { Money, CreditCard, FileText, TrendUp, Users, ArrowCounterClockwise, CurrencyCircleDollar, WarningCircle } from '@phosphor-icons/react'
import StatsCarousel from '@shared/components/StatsCarousel'

import { useNavigate } from 'react-router-dom'
import DashboardLayout from '@core/layouts/DashboardLayout'
import PageHeader from '@shared/components/PageHeader'
import { EmptyState } from '@shared/components'
import { StatCard } from '@shared/components/DataDisplay'

// Lazy loaded widgets
const QuickActions = lazy(() => import('@features/dashboard/components/widgets/QuickActions').then(m => ({ default: m.QuickActions })))
const TaskCenterWidget = lazy(() => import('@features/dashboard/components/widgets/TaskCenterWidget').then(m => ({ default: m.TaskCenterWidget })))
const PaymentTrendChart = lazy(() => import('@features/dashboard/components/widgets/PaymentTrendChart').then(m => ({ default: m.PaymentTrendChart })))
const ClassDistributionWidget = lazy(() => import('@features/dashboard/components/widgets/ClassDistributionWidget').then(m => ({ default: m.ClassDistributionWidget })))
import { useAuth } from '@context/Auth'
import { supabase } from '@lib/supabase'

function startOfMonth() {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
}

function formatCurrency(amount) {
    return 'Rp' + (amount || 0).toLocaleString('id-ID')
}

export default function DashboardPage() {
    const { profile } = useAuth()

    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [lastUpdated, setLastUpdated] = useState(new Date())
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeBills: 0,
        monthPayments: 0,
        monthRevenue: 0,
    })
    const [recentPayments, setRecentPayments] = useState([])
    const [weekTotal, setWeekTotal] = useState(0)
    const [paymentTrend, setPaymentTrend] = useState([])
    const [classStats, setClassStats] = useState([])

    const fetchDashboardData = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true)
        else setIsRefreshing(true)

        try {
            setError(null)

            // 1) total siswa aktif
            const { count: studentCount } = await supabase
                .from('students')
                .select('id', { count: 'exact', head: true })
                .is('deleted_at', null)

            // 2) tagihan aktif (belum lunas)
            const { count: activeBills } = await supabase
                .from('student_bills')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'pending')

            // 3) pembayaran bulan ini
            const monthStart = startOfMonth().toISOString()
            const { data: paymentsThisMonth } = await supabase
                .from('student_payments')
                .select('amount')
                .gte('paid_at', monthStart)

            const monthRevenue = (paymentsThisMonth || []).reduce((sum, p) => sum + (p.amount || 0), 0)
            const monthPaymentCount = paymentsThisMonth?.length || 0

            // 4) pembayaran terbaru
            const { data: recentData } = await supabase
                .from('student_payments')
                .select(`
                    id, amount, paid_at, payment_for,
                    students:student_id ( name, classes:class_id ( name ) )
                `)
                .order('paid_at', { ascending: false })
                .limit(5)

            const recent = (recentData || []).map((r) => ({
                id: r.id,
                student: r.students?.name || 'Siswa',
                class: r.students?.classes?.name || '-',
                amount: r.amount || 0,
                for: r.payment_for || 'SPP',
                time: new Date(r.paid_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            }))

            // 5) tren pembayaran 7 hari terakhir
            const weekStart = new Date()
            weekStart.setDate(weekStart.getDate() - 6)
            weekStart.setHours(0, 0, 0, 0)

            const { data: weekPayments } = await supabase
                .from('student_payments')
                .select('amount, paid_at')
                .gte('paid_at', weekStart.toISOString())

            const trend = Array.from({ length: 7 }).map((_, i) => {
                const dayStart = new Date(weekStart)
                dayStart.setDate(weekStart.getDate() + i)
                const dayEnd = new Date(dayStart)
                dayEnd.setDate(dayStart.getDate() + 1)
                const sum = (weekPayments || [])
                    .filter((p) => {
                        const t = new Date(p.paid_at).getTime()
                        return t >= dayStart.getTime() && t < dayEnd.getTime()
                    })
                    .reduce((acc, p) => acc + (p.amount || 0), 0)
                return {
                    name: dayStart.toLocaleDateString('id-ID', { weekday: 'short' }),
                    amount: sum,
                }
            })

            // 6) distribusi santri per kelas
            const { data: studentClassIds } = await supabase
                .from('students')
                .select('class_id')
                .is('deleted_at', null)

            const { data: classList } = await supabase
                .from('classes')
                .select('id, name')
                .order('name')

            const countByClass = {}
            ;(studentClassIds || []).forEach((s) => {
                if (!s.class_id) return
                countByClass[s.class_id] = (countByClass[s.class_id] || 0) + 1
            })

            const classStatsData = (classList || [])
                .map((c) => ({ name: c.name || '-', count: countByClass[c.id] || 0 }))
                .sort((a, b) => b.count - a.count)

            setStats({
                totalStudents: studentCount || 0,
                activeBills: activeBills || 0,
                monthPayments: monthPaymentCount,
                monthRevenue: monthRevenue,
            })

            setRecentPayments(recent)
            setPaymentTrend(trend)
            setWeekTotal(trend.reduce((acc, d) => acc + d.amount, 0))
            setClassStats(classStatsData)
            setLastUpdated(new Date())

        } catch (e) {
            console.error('Refresh Error:', e)
            setError(e?.message || 'Tidak dapat memuat data dashboard. Silakan coba lagi.')
        } finally {
            setLoading(false)
            setIsRefreshing(false)
        }
    }, [])

    useEffect(() => {
        fetchDashboardData()

        // ── REALTIME SUBSCRIPTION ──
        const channel = supabase
            .channel('dashboard-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'student_bills' }, () => fetchDashboardData(true))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'student_payments' }, () => fetchDashboardData(true))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => fetchDashboardData(true))
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchDashboardData])

    const handleRefresh = () => {
        fetchDashboardData(true)
    }

    const handleExportPDF = () => {
        // Native window.print() is more reliable for Tailwind v4 (oklch)
        // and produces way higher quality (vector) PDF.
        window.print()
    }

    const STATS = useMemo(() => ([
        {
            icon: Users,
            label: 'Total Santri',
            value: stats.totalStudents,
            subValue: `${stats.totalStudents} terdaftar`,
            color: 'indigo',
            onClick: () => navigate('/master/students')
        },
        {
            icon: CreditCard,
            label: 'Tagihan Aktif',
            value: stats.activeBills,
            subValue: 'belum lunas',
            color: 'amber',
            onClick: () => navigate('/finance/invoices')
        },
        {
            icon: Money,
            label: 'Pembayaran Bulan Ini',
            value: stats.monthPayments,
            subValue: `${stats.monthPayments} transaksi`,
            color: 'emerald',
            onClick: () => navigate('/finance/payments')
        },
        {
            icon: TrendUp,
            label: 'Pemasukan Bulan Ini',
            value: formatCurrency(stats.monthRevenue),
            subValue: 'total diterima',
            color: 'sky',
            onClick: () => navigate('/finance/payments')
        }
    ]), [stats, navigate])

    return (
        <DashboardLayout title="Dashboard">
            <div className="p-4 md:p-6">

                {/* ── PAGE HEADER ── */}
                <PageHeader
                    title={
                        <>
                            Selamat Datang, {profile?.name?.split(' ')[0] || 'User'}!
                            <span className="inline-block ml-1" role="img" aria-label="waving hand">👋</span>
                        </>
                    }
                    subtitle={
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span>Ringkasan tagihan, pembayaran, dan transaksi koperasi.</span>
                            <span className="w-1 h-1 rounded-full bg-[var(--color-border)] shrink-0" aria-hidden="true" />
                            <span className="text-[10px] font-bold opacity-50 uppercase tracking-tighter tabular-nums">
                                Updated: {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </span>
                    }
                    actions={
                        <div className="flex items-center gap-2">
                            {/* ── EXPORT SUMMARY ── */}
                            <button
                                type="button"
                                onClick={handleExportPDF}
                                disabled={loading || isRefreshing}
                                data-html2canvas-ignore="true"
                                className="h-9 w-9 sm:w-auto sm:px-3 rounded-lg border flex items-center justify-center sm:justify-start gap-2 transition-all active:scale-95 bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-50 disabled:pointer-events-none"
                                title="Unduh Ringkasan PDF"
                                aria-label="Unduh Ringkasan PDF"
                            >
                                <FileText className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">
                                    Export Summary
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={handleRefresh}
                                disabled={loading || isRefreshing}
                                data-html2canvas-ignore="true"
                                aria-label="Refresh Dashboard Data"
                                className={`h-9 w-9 sm:w-auto sm:px-3 rounded-lg border flex items-center justify-center sm:justify-start gap-2 transition-all active:scale-95 bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-50 disabled:pointer-events-none ${isRefreshing ? 'cursor-wait scale-95' : ''}`}
                                title="Refresh Data"
                            >
                                <ArrowCounterClockwise className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">
                                    Refresh
                                </span>
                            </button>
                        </div>
                    }
                />

                {/* ── ERROR BANNER ── */}
                {error && (
                    <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
                        <WarningCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" weight="fill" />
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-wider text-rose-500">Gagal Memuat Data</p>
                            <p className="text-[11px] font-medium text-rose-500/80 mt-0.5">{error}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => fetchDashboardData()}
                            className="shrink-0 text-[10px] font-black uppercase tracking-wider text-rose-500 underline hover:opacity-70 transition-opacity"
                        >
                            Coba Lagi
                        </button>
                    </div>
                )}

                {/* ── STATS CAROUSEL ── */}
                <div className="min-h-[110px]">
                    <StatsCarousel count={STATS.length}>
                        {STATS.map((stat, idx) => (
                            <StatCard
                                key={idx}
                                icon={stat.icon}
                                label={stat.label}
                                value={stat.value}
                                subValue={stat.subValue}
                                color={stat.color}
                                loading={loading}
                                onClick={stat.onClick}
                            />
                        ))}
                    </StatsCarousel>
                </div>

                {/* ── ANALYTICS ROW ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                    <div className="lg:col-span-2 min-w-0">
                        <Suspense fallback={
                            <div className="glass rounded-[1.5rem] p-5 h-[280px] animate-pulse bg-[var(--color-surface-alt)]" />
                        }>
                            <PaymentTrendChart chartData={paymentTrend} loading={loading} total={weekTotal} />
                        </Suspense>
                    </div>
                    <div className="min-w-0">
                        <Suspense fallback={
                            <div className="glass rounded-[1.5rem] p-5 h-[280px] animate-pulse bg-[var(--color-surface-alt)]" />
                        }>
                            <ClassDistributionWidget items={classStats} loading={loading} onViewAll={() => navigate('/master/classes')} />
                        </Suspense>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 items-start">
                    {/* ── LEFT MAIN COLUMN - Pembayaran Terbaru ── */}
                    <div className="flex-1 min-w-0 w-full">
                        <div className="glass rounded-[1.5rem] p-5 border border-[var(--color-border)]/50">
                            <div className="flex items-center justify-between mb-4 gap-2">
                                <h3 className="text-sm font-black text-[var(--color-text)]">Pembayaran Terbaru</h3>
                                <button
                                    type="button"
                                    onClick={() => navigate('/finance/payments')}
                                    className="text-[10px] font-bold text-[var(--color-primary)] hover:underline shrink-0"
                                >
                                    Lihat Semua →
                                </button>
                            </div>
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="flex items-center gap-3 animate-pulse">
                                            <div className="w-10 h-10 rounded-xl bg-[var(--color-border)]/50" />
                                            <div className="flex-1 space-y-1.5">
                                                <div className="h-3 w-32 max-w-full bg-[var(--color-border)]/50 rounded" />
                                                <div className="h-2 w-20 bg-[var(--color-border)]/30 rounded" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : recentPayments.length === 0 ? (
                                <EmptyState icon={CurrencyCircleDollar} title="Belum Ada Pembayaran" description="Belum ada pembayaran hari ini." variant="plain" color="slate" />
                            ) : (
                                <div className="space-y-2">
                                    {recentPayments.map((p) => (
                                        <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--color-surface-alt)] transition-colors">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                <Money className="w-5 h-5 text-emerald-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-[var(--color-text)] truncate">{p.student}</p>
                                                <p className="text-[11px] text-[var(--color-text-muted)] truncate">{p.for} · {p.class}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-black text-emerald-500 whitespace-nowrap">{formatCurrency(p.amount)}</p>
                                                <p className="text-[10px] text-[var(--color-text-muted)]">{p.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── RIGHT STICKY SIDEBAR ── */}
                    <div className="w-full lg:w-[320px] xl:w-[360px] shrink-0 flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
                        <Suspense fallback={
                            <div className="glass rounded-[1.5rem] p-5 h-[200px] animate-pulse bg-[var(--color-surface-alt)]" />
                        }>
                            <TaskCenterWidget />
                        </Suspense>
                        <Suspense fallback={<div className="glass rounded-[1.5rem] p-5 h-[240px] animate-pulse bg-[var(--color-surface-alt)]" />}>
                            <QuickActions />
                        </Suspense>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}