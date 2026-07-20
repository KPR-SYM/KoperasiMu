import { memo } from 'react'

const SPINNER_SIZES = {
    xs: 'w-3 h-3 border',
    sm: 'w-3.5 h-3.5 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-8 h-8 border-[3px]',
    xl: 'w-12 h-12 border-[3px]',
}

/**
 * Spinner — loading indicator component.
 *
 * @param {string} size - xs|sm|md|lg|xl (default: sm)
 * @param {string} color - tailwind border color class (default: 'border-white')
 * @param {string} className - additional classes
 */
const Spinner = memo(function Spinner({
    size = 'sm',
    color = 'border-white',
    className = '',
    ...props
}) {
    const sizeClass = SPINNER_SIZES[size] || SPINNER_SIZES.sm
    return (
        <div
            className={`rounded-full animate-spin ${sizeClass} ${color} border-t-transparent shrink-0 ${className}`}
            {...props}
        />
    )
})

/**
 * SpinnerOverlay — full-screen or container-centered loading overlay.
 *
 * @param {string} text - optional loading text
 * @param {string} size - spinner size (default: lg)
 */
export function SpinnerOverlay({ text, size = 'lg', className = '' }) {
    return (
        <div className={`flex flex-col items-center justify-center gap-3 py-12 ${className}`}>
            <Spinner size={size} color="border-[var(--color-primary)]" />
            {text && (
                <p className="text-[11px] font-bold text-[var(--color-text-muted)] animate-pulse">
                    {text}
                </p>
            )}
        </div>
    )
}

/**
 * InlineSpinner — inline loading indicator for buttons and small spaces.
 */
export function InlineSpinner({ className = '' }) {
    return <Spinner size="xs" color="border-current" className={`opacity-70 ${className}`} />
}

export default Spinner
