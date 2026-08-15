import { useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Storefront, CaretLeft } from '@phosphor-icons/react'
import { KOPERASI_ITEMS, flattenNavItems } from '@core/layouts/navItems'

// ─── Placeholder halaman Koperasi ─────────────────────────────────────────────
// Semua route /master/koperasi/... sementara render di sini ("Coming Soon").
// Struktur menu sudah lengkap; fungsionalitas tiap modul menyusul.
export default function KoperasiComingSoonPage() {
    const location = useLocation()
    const navigate = useNavigate()

    const current = useMemo(() => {
        const matches = flattenNavItems(KOPERASI_ITEMS).filter(item => location.pathname === item.to)
        return matches[0] || null
    }, [location.pathname])

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient glow */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-24 -right-24 w-[460px] h-[460px] bg-emerald-500/8 rounded-full blur-[120px]" />
                <div className="absolute -bottom-24 -left-24 w-[460px] h-[460px] bg-indigo-500/8 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 flex flex-col items-center max-w-md w-full text-center">
                {/* Icon */}
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-[2.5rem] blur-xl" />
                    <div className="relative w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                        {current?.icon
                            ? <current.icon className="text-3xl text-white drop-shadow-md" weight="duotone" />
                            : <Storefront className="text-3xl text-white drop-shadow-md" weight="duotone" />}
                    </div>
                </div>

                {/* Badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-4">
                    Modul Koperasi
                </span>

                {/* Label */}
                <h2 className="text-2xl font-black text-[var(--color-text)] tracking-tight mb-2">
                    {current?.label || 'Modul Koperasi'}
                </h2>
                <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed opacity-80 mb-3">
                    Modul ini sedang dalam tahap pengembangan.
                </p>
                <p className="text-[12px] text-[var(--color-text-muted)] leading-relaxed opacity-60 mb-8">
                    Halaman <span className="font-mono text-[10px] bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-md px-1.5 py-0.5">{location.pathname}</span>{" "}
                    akan segera hadir dalam sistem Koperasi SenyumMu.
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex-1 h-11 px-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[11px] font-black text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-primary)]/30 transition-all flex items-center justify-center gap-2"
                        type="button"
                    >
                        <CaretLeft className="text-sm" />
                        Kembali
                    </button>
                    <button
                        onClick={() => navigate('/master/koperasi/kasir')}
                        className="flex-1 h-11 px-6 rounded-2xl bg-[var(--color-primary)] text-white text-[11px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[var(--color-primary)]/20 flex items-center justify-center gap-2"
                        type="button"
                    >
                        <Storefront className="text-sm" />
                        Buka Kasir
                    </button>
                </div>
            </div>
        </div>
    )
}