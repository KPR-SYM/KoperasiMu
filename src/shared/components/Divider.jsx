/**
 * Divider — horizontal rule with optional label.
 *
 * @param {string} label - optional text label centered on the divider
 * @param {string} className - additional classes
 */
export default function Divider({ label, className = '' }) {
    if (label) {
        return (
            <div className={`flex items-center gap-3 ${className}`}>
                <div className="flex-1 h-px bg-[var(--color-border)]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] shrink-0">
                    {label}
                </span>
                <div className="flex-1 h-px bg-[var(--color-border)]" />
            </div>
        )
    }
    return <hr className={`border-0 h-px bg-[var(--color-border)] ${className}`} />
}
