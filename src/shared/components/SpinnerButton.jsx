import { forwardRef } from 'react'
import Spinner from './Spinner'

const VARIANT_STYLES = {
    primary: 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20 hover:brightness-110 border border-white/10',
    destructive: 'bg-red-500 text-white shadow-md shadow-red-500/20 hover:bg-red-600 border border-white/10',
    outline: 'bg-transparent border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]',
    ghost: 'bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]',
    amber: 'bg-amber-500 text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 border border-white/10',
    emerald: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600 border border-white/10',
    rose: 'bg-rose-500 text-white shadow-md shadow-rose-500/20 hover:bg-rose-600 border border-white/10',
    indigo: 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-600 border border-white/10',
}

const SIZE_STYLES = {
    sm: 'h-8 px-3 text-[10px] gap-1.5 rounded-lg',
    md: 'h-9 px-4 text-[10px] gap-2 rounded-xl',
    lg: 'h-10 px-5 text-[11px] gap-2 rounded-xl',
}

/**
 * SpinnerButton — button with built-in loading spinner state.
 *
 * @param {boolean} loading - tampilkan spinner & disable button
 * @param {string} variant - primary|destructive|outline|ghost|amber|emerald|rose|indigo
 * @param {string} size - sm|md|lg
 * @param {ReactNode} icon - icon component (shown when not loading)
 * @param {boolean} disabled
 * @param {ReactNode} children
 */
const SpinnerButton = forwardRef(function SpinnerButton({
    loading = false,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    disabled = false,
    className = '',
    children,
    ...props
}, ref) {
    const variantClass = VARIANT_STYLES[variant] || VARIANT_STYLES.primary
    const sizeClass = SIZE_STYLES[size] || SIZE_STYLES.md

    return (
        <button
            ref={ref}
            disabled={disabled || loading}
            className={`inline-flex items-center justify-center font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${variantClass} ${sizeClass} ${className}`}
            {...props}
        >
            {loading ? (
                <Spinner size="xs" color="border-current" />
            ) : Icon ? (
                <Icon className="shrink-0" style={{ fontSize: '0.65em' }} />
            ) : null}
            {children}
        </button>
    )
})

export default SpinnerButton
