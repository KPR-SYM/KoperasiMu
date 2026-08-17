import React, { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal as portal } from 'react-dom'

const PrivacyMask = React.memo(function PrivacyMask({
    active = false,
    children,
    className = '',
    variant = 'auto', // 'auto' | 'pill' | 'redacted'
    revealOn = 'hover', // 'hover' | 'click' | 'none'
    revealDuration = 2000,
    onReveal,
}) {
    const [isRevealed, setIsRevealed] = useState(false)
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })
    const [showTooltip, setShowTooltip] = useState(false)
    const triggerRef = useRef(null)
    const timeoutRef = useRef(null)

    const clearTimeouts = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
    }, [])

    const reveal = useCallback(() => {
        if (!active || revealOn === 'none') return
        setIsRevealed(true)
        onReveal?.()
        if (revealDuration > 0) {
            clearTimeouts()
            timeoutRef.current = setTimeout(() => setIsRevealed(false), revealDuration)
        }
    }, [active, revealOn, revealDuration, onReveal, clearTimeouts])

    const hide = useCallback(() => {
        setIsRevealed(false)
        clearTimeouts()
    }, [clearTimeouts])

    const handleClick = useCallback((e) => {
        if (revealOn === 'click') {
            e.stopPropagation()
            isRevealed ? hide() : reveal()
        }
    }, [revealOn, isRevealed, reveal, hide])

    const handleMouseEnter = useCallback(() => {
        if (!triggerRef.current) return
        const rect = triggerRef.current.getBoundingClientRect()
        setTooltipPos({ top: rect.top - 8, left: rect.left + rect.width / 2 })
        setShowTooltip(true)
        if (revealOn === 'hover') reveal()
    }, [revealOn, reveal])

    const handleMouseLeave = useCallback(() => {
        setShowTooltip(false)
        if (revealOn === 'hover') hide()
    }, [revealOn, hide])

    useEffect(() => () => clearTimeouts(), [clearTimeouts])

    const isRedacted = variant === 'redacted'
    const isPill = variant === 'pill'

    const maskedStyle = active && !isRevealed ? {
        color: 'transparent',
        backgroundColor: isRedacted
            ? 'var(--color-text-muted, #6b7280)'
            : 'var(--color-surface-alt, #f3f4f6)',
        borderRadius: isRedacted ? '0.25rem' : isPill ? '9999px' : '0.25rem',
        textShadow: 'none',
        filter: 'none',
        opacity: isRedacted ? 0.6 : 1,
        minWidth: isPill ? '3rem' : 'auto',
        textAlign: isPill ? 'center' : 'inherit',
    } : {}

    const revealedStyle = active && isRevealed ? {
        color: '',
        backgroundColor: 'transparent',
        filter: 'none',
        opacity: 1,
    } : {}

    const baseStyle = {
        display: 'inline-block',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        cursor: active && revealOn !== 'none' ? 'pointer' : 'default',
        transition: 'color 0.15s ease, background-color 0.15s ease',
    }

    const finalStyle = { ...baseStyle, ...maskedStyle, ...revealedStyle }

    return (
        <>
            <span
                ref={triggerRef}
                className={className}
                style={finalStyle}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
            >
                {children}
            </span>
            {showTooltip && active && portal(
                <div
                    role="tooltip"
                    className="fixed z-[99999] px-2.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold shadow-lg pointer-events-none"
                    style={{ top: tooltipPos.top, left: tooltipPos.left, transform: 'translate(-50%, -100%)' }}
                >
                    Data terlindungi
                </div>,
                document.body
            )}
        </>
    )
})

export default PrivacyMask
