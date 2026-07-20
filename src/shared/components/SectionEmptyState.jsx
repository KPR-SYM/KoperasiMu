import { Info } from '@phosphor-icons/react'

/**
 * SectionEmptyState — compact inline empty state for sections/panels.
 *
 * @param {string} label - description text (e.g. "riwayat konseling")
 * @param {ReactNode} icon - icon component (default: Info)
 */
export default function SectionEmptyState({ label, icon: Icon = Info, className = '' }) {
    return (
        <div className={`py-4 flex flex-col items-center justify-center text-center space-y-2 border border-dashed border-[var(--color-border)] rounded-xl bg-[var(--color-surface-alt)]/30 ${className}`}>
            <div className="w-8 h-8 rounded-full bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-muted)] shadow-sm">
                <Icon className="w-3 h-3 opacity-40" />
            </div>
            <p className="text-[10px] font-bold text-[var(--color-text-muted)]">
                {label ? `Data ${label} belum tersedia` : 'Belum ada data'}
            </p>
        </div>
    )
}
