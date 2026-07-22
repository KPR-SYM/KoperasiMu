/**
 * NumberCircle — row index / step number circle.
 *
 * @param {number} value - number to display
 * @param {string} size - sm|md|lg (default: md)
 * @param {boolean} active - active/completed state
 * @param {boolean} completed - show check icon instead of number
 */
export default function NumberCircle({
    value,
    size = 'md',
    active = false,
    completed = false,
    className = '',
}) {
    const sizeStyles = {
        sm: 'w-5 h-5 text-[8px]',
        md: 'w-6 h-6 text-[10px]',
        lg: 'w-8 h-8 text-[11px]',
    }

    const sizeClass = sizeStyles[size] || sizeStyles.md

    return (
        <div
            role="img"
            aria-label={`Step ${value}`}
            className={`rounded-full flex items-center justify-center font-black shrink-0 transition-all shadow-sm
                ${sizeClass}
                ${active || completed
                    ? 'bg-[var(--color-primary)] text-white scale-110'
                    : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] border border-[var(--color-border)] opacity-40'
                }
                ${className}`}
        >
            {completed ? (
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            ) : (
                value
            )}
        </div>
    )
}
