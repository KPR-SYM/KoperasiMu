import React, { useState, useCallback, useRef, useEffect, createPortal } from 'react'
import { createPortal as portal } from 'react-dom'

const PrivacyMask = React.memo(function PrivacyMask({
    active = false,
    children,
    className = '',
    blur = '4px',
    variant = 'auto', // 'auto' | 'blur' | 'pill' | 'block' | 'redacted'
    revealOn = 'hover', // 'hover' | 'click' | 'none'
    revealDuration = 2000, // ms
    onReveal, // callback when revealed
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
        setTooltipPos({
            top: rect.top - 8,
            left: rect.left + rect.width / 2,
        })
        setShowTooltip(true)
        if (revealOn === 'hover') {
            reveal()
        }
    }, [revealOn, reveal])

    const handleMouseLeave = useCallback(() => {
        setShowTooltip(false)
        if (revealOn === 'hover') {
            hide()
        }
    }, [revealOn, hide])

    useEffect(() => {
        return () => clearTimeouts()
    }, [clearTimeouts])

    if (!active) return <>{children}</>

    const isRedacted = variant === 'redacted'
    const isPill = variant === 'pill'
    const isBlock = variant === 'block' || variant === 'auto'

    const baseStyle = {
        userSelect: 'none',
        WebkitUserSelect: 'none',
        cursor: revealOn !== 'none' ? 'pointer' : 'default',
        transition: 'filter 0.15s ease, background-color 0.15s ease, opacity 0.15s ease',
    }

    const blurFilter = isRedacted || isRevealed ? {} : {
        filter: `blur(${blur})`,
        WebkitFilter: `blur(${blur})`,
    }

    const revealedStyle = isRevealed ? {
        filter: 'none',
        WebkitFilter: 'none',
    } : {}

    const redactedStyle = isRedacted && !isRevealed ? {
        filter: 'none',
        WebkitFilter: 'none',
        backgroundColor: 'var(--color-text-muted, #6b7280)',
        color: 'transparent',
        borderRadius: '0.25rem',
        padding: '0.125rem 0.375rem',
        opacity: 0.6,
    } : {}

    const pillStyle = isPill ? {
        borderRadius: '9999px',
        padding: '0.125rem 0.5rem',
        backgroundColor: isRevealed ? 'transparent' : 'var(--color-surface-alt, #f3f4f6)',
        minWidth: '3rem',
        textAlign: 'center',
    } : {}

    const blockStyle = isBlock && !isPill ? {
        borderRadius: '0.375rem',
        padding: '0.125rem 0.375rem',
        backgroundColor: isRevealed ? 'transparent' : 'var(--color-surface-alt, #f3f4f6)',
    } : {}

    const finalStyle = {
        ...baseStyle,
        ...blurFilter,
        ...revealedStyle,
        ...redactedStyle,
        ...pillStyle,
        ...blockStyle,
    }

    return (
        <>
            <span
                ref={triggerRef}
                className={`inline-block ${className}`}
                style={finalStyle}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
            >
                {children}
            </span>
            {showTooltip && portal(
                <div
                    role="tooltip"
                    className="fixed z-[99999] px-2.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold shadow-lg pointer-events-none"
                    style={{
                        top: tooltipPos.top,
                        left: tooltipPos.left,
                        transform: 'translate(-50%, -100%)',
                    }}
                >
                    Data terlindungi
                </div>,
                document.body
            )}
        </>
    )
})

export default PrivacyMask
