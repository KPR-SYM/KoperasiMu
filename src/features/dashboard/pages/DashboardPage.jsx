import { useEffect, useMemo, useState, useCallback, lazy, Suspense, useRef } from 'react'
import { Money, CreditCard, FileText, TrendUp, Users, ArrowCounterClockwise } from '@phosphor-icons/react'
import StatsCarousel from '@shared/components/StatsCarousel'

import { useNavigate } from 'react-router-dom'
import DashboardLayout from '@core/layouts/DashboardLayout'
import PageHeader from '@shared/components/PageHeader'
import { StatCard } from '@shared/components/DataDisplay'

// Lazy loaded widgets
const QuickActions = lazy(() => import('@features/dashboard/components/widgets/QuickActions').then(m => ({ default: m.QuickActions })))
const TaskCenterWidget = lazy(() => import('@features/dashboard/components/widgets/TaskCenterWidget').then(m => ({ default: m.TaskCenterWidget })))
import { useAuth } from '@context/Auth'
import { supabase } from '@lib/supabase'

function startOfMonth() {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
}

function formatCurrency(amount) {
    return 'Rp' + (amount || 0).toLocaleString('id-ID')
}

function formatTrend(now, prev) {
    if (prev === 0 && now === 0) return '0%'
    if (prev === 0 && now > 0) return '+∞%'
    const pct = Math.round(((now - prev) / prev) * 100)
    const sign = pct > 0 ? '+' : ''
    return `${sign}${pct}%`
}

export default function DashboardPage() {
    const { profile } = useAuth()

    const navigate = useNavigate()
    const dashboardRef = useRef(null)
    const [loading, setLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState(new Date())
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeBills: 0,
        monthPayments: 0,
        monthRevenue: 0,
    })
    const [recentPayments, setRecentPayments] = useState([])


    const COLORS = useMemo(() => ([
        '#ef4444', '#f59e0b', '#6366f1', '#8b5cf6', '#10b981', '#3b82f6'
    ]), [])

    const fetchDashboardData = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true)
        else setIsRefreshing(true)

        try {
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

            setStats({
                totalStudents: studentCount || 0,
                activeBills: activeBills || 0,
                monthPayments: monthPaymentCount,
                monthRevenue: monthRevenue,
            })

            setRecentPayments(recent)
            setLastUpdated(new Date())

        } catch (e) {
            console.error('Refresh Error:', e)
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
            value: loading ? '…' : String(stats.totalStudents),
            subValue: `${stats.totalStudents} terdaftar`,
            color: 'indigo',
            onClick: () => navigate('/master/students')
        },
        {
            icon: CreditCard,
            label: 'Tagihan Aktif',
            value: loading ? '…' : String(stats.activeBills),
            subValue: 'belum lunas',
            borderColor: 'amber-500',
            iconBg: 'bg-amber-500/10 text-amber-600',
            onClick: () => navigate('/finance/invoices')
        },
        {
            icon: Money,
            label: 'Pembayaran Bulan Ini',
            value: loading ? '…' : String(stats.monthPayments),
            subValue: `${stats.monthPayments} transaksi`,
            color: 'emerald',
            onClick: () => navigate('/finance/payments')
        },
        {
            icon: TrendUp,
            label: 'Pemasukan Bulan Ini',
            value: loading ? '…' : formatCurrency(stats.monthRevenue),
            subValue: 'total diterima',
            color: 'blue',
            onClick: () => navigate('/finance/payments')
        }
    ]), [loading, stats, navigate])

    return (
        <DashboardLayout title="Dashboard">
            <div ref={dashboardRef} className="p-4 md:p-6 max-w-[1800px] mx-auto">

                {/* ── PAGE HEADER ── */}
                <PageHeader
                    badge="Dashboard"
                    title={
                        <>
                            Selamat Datang, {profile?.name?.split(' ')[0] || 'User'}!
                            <span className="inline-block ml-1" role="img" aria-label="waving hand">👋</span>
                        </>
                    }
                    subtitle={
                        <span className="flex items-center gap-2">
                            Ringkasan tagihan, pembayaran, dan transaksi koperasi.
                            <span className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
                            <span className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">
                                Updated: {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </span>
                    }
                    actions={
                        <div className="flex items-center gap-2">
                            {/* ── EXPORT SUMMARY ── */}
                            <button
                                onClick={handleExportPDF}
                                disabled={loading || isRefreshing}
                                data-html2canvas-ignore="true"
                                className="h-9 w-9 sm:w-auto sm:px-3 rounded-lg border flex items-center justify-center sm:justify-start gap-2 transition-all active:scale-95 bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                                title="DownloadSimple Ringkasan PDF"
                            >
                                <FileText className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">
                                    Export Summary
                                </span>
                            </button>

                            <button
                                onClick={handleRefresh}
                                disabled={loading || isRefreshing}
                                data-html2canvas-ignore="true"
                                aria-label="Refresh Dashboard Data"
                                className={`h-9 w-9 sm:w-auto sm:px-3 rounded-lg border flex items-center justify-center sm:justify-start gap-2 transition-all active:scale-95 bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] ${isRefreshing ? 'opacity-50 cursor-not-allowed scale-95' : ''}`}
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

                {/* ── STATS CAROUSEL ── */}
                <div className="min-h-[110px] mb-4">
                    <StatsCarousel count={STATS.length}>
                        {STATS.map((stat, idx) => (
                            <StatCard
                                key={idx}
                                icon={stat.icon}
                                label={stat.label}
                                value={stat.value}
                                trend={stat.trend}
                                trendUp={stat.trendUp}
                                loading={loading}
                                borderColor={stat.borderColor}
                                iconBg={stat.iconBg}
                            />
                        ))}
                    </StatsCarousel>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                    {/* ── LEFT MAIN COLUMN - Pembayaran Terbaru ── */}
                    <div className="flex-1 min-w-0 flex flex-col gap-4">
                        <div className="glass rounded-[1.5rem] p-5 border border-[var(--color-border)]/50">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-black text-[var(--color-text)]">Pembayaran Terbaru</h3>
                                <button
                                    onClick={() => navigate('/finance/payments')}
                                    className="text-[10px] font-bold text-[var(--color-primary)] hover:underline"
                                >
                                    Lihat Semua →
                                </button>
                            </div>
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="flex items-center gap-3 animate-pulse">
                                            <div className="w-10 h-10 rounded-xl bg-gray-400/20" />
                                            <div className="flex-1 space-y-1.5">
                                                <div className="h-3 w-32 bg-gray-400/20 rounded" />
                                                <div className="h-2 w-20 bg-gray-400/10 rounded" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : recentPayments.length === 0 ? (
                                <p className="text-sm text-[var(--color-text-muted)] text-center py-8">Belum ada pembayaran hari ini.</p>
                            ) : (
                                <div className="space-y-2">
                                    {recentPayments.map((p) => (
                                        <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--color-surface-alt)] transition-colors">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                <Money className="w-5 h-5 text-emerald-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-[var(--color-text)] truncate">{p.student}</p>
                                                <p className="text-[11px] text-[var(--color-text-muted)]">{p.for} · {p.class}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-black text-emerald-500">{formatCurrency(p.amount)}</p>
                                                <p className="text-[10px] text-[var(--color-text-muted)]">{p.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── RIGHT STICKY SIDEBAR ── */}
                    <div className="w-full lg:w-[320px] xl:w-[360px] shrink-0 flex flex-col gap-4 sticky top-6 self-start">
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