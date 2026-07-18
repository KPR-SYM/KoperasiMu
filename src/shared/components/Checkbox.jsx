import { memo, useRef, useEffect } from 'react'
import { Check, Minus } from '@phosphor-icons/react'

/**
 * Checkbox - A premium, reusable checkbox component with custom appearance,
 * indeterminate state support, and consistent theming via CSS variables.
 * Mirrors the design language of RichSelect.
 */
const Checkbox = memo(({
    checked = false,
    onChange,
    indeterminate = false,
    disabled = false,
    small = false,
    className = '',
}) => {
    const inputRef = useRef(null)

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.indeterminate = indeterminate && !checked
        }
    }, [indeterminate, checked])

    const size = small ? 'w-3.5 h-3.5' : 'w-4 h-4'
    const iconSize = small ? 'w-2.5 h-2.5' : 'w-3 h-3'

    return (
        <label
            className={`relative inline-flex items-center justify-center ${size} shrink-0 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${className}`}
        >
            <input
                ref={inputRef}
                type="checkbox"
                checked={checked}
                onChange={disabled ? undefined : onChange}
                disabled={disabled}
                className="peer sr-only"
            />
            <span
                className={`absolute inset-0 rounded-md border-2 transition-all
                    ${checked || indeterminate
                        ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
                        : 'bg-[var(--color-surface)] border-[var(--color-border)] peer-hover:border-[var(--color-primary)]/50'
                    }
                    peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-primary)]/30
                `}
            />
            {checked && !indeterminate && (
                <Check weight="bold" className={`absolute inset-0 m-auto z-10 ${iconSize} text-white pointer-events-none`} />
            )}
            {indeterminate && !checked && (
                <Minus weight="bold" className={`absolute inset-0 m-auto z-10 ${iconSize} text-white pointer-events-none`} />
            )}
        </label>
    )
})

Checkbox.displayName = 'Checkbox'

export default Checkbox