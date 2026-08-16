import { useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Clock, Lock, Package, CaretLeft, Sparkle } from '@phosphor-icons/react'
import DashboardLayout from '@core/layouts/DashboardLayout'
import { KOPERASI_CATEGORIES } from '@core/layouts/navItems'
import { PageHeader, Badge, StatsCarousel, StatCard } from '@shared/components'
import { useLanguage } from '@context'

// ─── FeaturePreviewCard: clean minimalis ──────────────────────────────────────
function FeaturePreviewCard({ child, tNav }) {
    const Icon = child.icon

    return (
        <div className="group rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] overflow-hidden hover:border-[var(--color-primary)]/30 hover:shadow-md transition-all">
            {/* Icon area */}
            <div className={`relative h-24 ${child.color} flex items-center justify-center overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                <Icon className="w-10 h-10 text-current opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-300" strokeWidth={1.5} />
            </div>

            {/* Info */}
            <div className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-[12px] font-bold text-[var(--color-text)] leading-tight truncate">
                        {tNav(child)}
                    </p>
                </div>
                <p className="text-[10px] text-[var(--color-text-muted)] leading-snug line-clamp-2">
                    {child.desc}
                </p>
            </div>
        </div>
    )
}

// ─── Placeholder halaman Koperasi ─────────────────────────────────────────────
export default function KoperasiComingSoonPage() {
    const location = useLocation()
    const navigate = useNavigate()
    const { tNav } = useLanguage()

    const { category, leaf } = useMemo(() => {
        for (const cat of KOPERASI_CATEGORIES) {
            const match = cat.children?.find(child => location.pathname === child.to)
            if (match) return { category: cat, leaf: match }
            if (location.pathname === cat.to) return { category: cat, leaf: null }
        }
        return { category: null, leaf: null }
    }, [location.pathname])

    const totalFeatures = category?.children?.length || 0

    return (
        <DashboardLayout title={category?.label || 'Koperasi'}>
            <div className="space-y-3 max-w-[1800px] mx-auto relative">
                {/* ── Header ── */}
                <PageHeader
                    title={leaf?.label || category?.label || 'Koperasi'}
                    subtitle={leaf?.desc || category?.desc || 'Modul ini sedang dalam tahap pengembangan.'}
                    actions={
                        <button
                            onClick={() => navigate(-1)}
                            className="h-9 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[11px] font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-primary)]/30 transition-all flex items-center gap-1.5"
                            type="button"
                        >
                            <CaretLeft className="w-3.5 h-3.5" />
                            <span>Kembali</span>
                        </button>
                    }
                />

                {/* ── Stats ── */}
                <StatsCarousel count={3} cols={3}>
                    <StatCard
                        icon={Package}
                        label="Total Fitur"
                        value={totalFeatures}
                        color="primary"
                    />
                    <StatCard
                        icon={Lock}
                        label="Belum Tersedia"
                        value={totalFeatures}
                        color="primary"
                    />
                    <StatCard
                        icon={Clock}
                        label="Status"
                        value="Soon"
                        color="primary"
                    />
                </StatsCarousel>

                {/* ── Feature Preview Grid ── */}
                {totalFeatures > 0 && (
                    <div className="glass rounded-2xl border border-[var(--color-border)] overflow-hidden">
                        <div className="border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkle className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                                    Pratinjau Fitur
                                </span>
                            </div>
                            <Badge color="amber" size="xs">
                                Coming Soon
                            </Badge>
                        </div>

                        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {category.children
                                .filter(child => child.to !== location.pathname)
                                .map(child => (
                                    <FeaturePreviewCard
                                        key={child.to}
                                        child={child}
                                        tNav={tNav}
                                    />
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}