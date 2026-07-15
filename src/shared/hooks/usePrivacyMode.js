import { useState, useCallback, useRef, createElement, Fragment } from 'react'

export function usePrivacyMode({ defaultMaskPatterns = {} } = {}) {
    const [isPrivacyMode, setIsPrivacyMode] = useState(false)

    const maskValue = useCallback((value, type = 'text') => {
        if (!isPrivacyMode) return value
        const patterns = {
            year: '****/****',
            semester: '******',
            date: '****-**-**',
            duration: '** bulan',
            id: 'ID: ****',
            text: '****',
            ...defaultMaskPatterns,
        }
        return patterns[type] ?? patterns.text
    }, [isPrivacyMode, defaultMaskPatterns])

    const togglePrivacyMode = useCallback(() => setIsPrivacyMode(v => !v), [])

    return { isPrivacyMode, setIsPrivacyMode, togglePrivacyMode, maskValue }
}

export function PrivacyValue({
    children,
    active,
    className = '',
    allowReveal = true,
    revealDuration = 2000,
}) {
    const [isRevealed, setIsRevealed] = useState(false)
    const timeoutRef = useRef(null)

    const clearRevealTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
    }, [])

    const handleMouseEnter = useCallback(() => {
        if (!allowReveal) return
        setIsRevealed(true)
    }, [allowReveal])

    const handleMouseLeave = useCallback(() => {
        if (!allowReveal) return
        setIsRevealed(false)
    }, [allowReveal])

    const handleTouchStart = useCallback(() => {
        if (!allowReveal) return
        setIsRevealed(true)
        clearRevealTimeout()
        timeoutRef.current = setTimeout(() => setIsRevealed(false), revealDuration)
    }, [allowReveal, revealDuration, clearRevealTimeout])

    if (!active) {
        return createElement(Fragment, null, children)
    }

    const shouldBlur = !isRevealed

    return createElement(
        'span',
        {
            onMouseEnter: handleMouseEnter,
            onMouseLeave: handleMouseLeave,
            onTouchStart: handleTouchStart,
            className: `inline-block align-middle transition-[filter] duration-200 ease-out select-none ${className}`,
            style: {
                filter: shouldBlur ? 'blur(4px)' : 'blur(0px)',
                cursor: allowReveal ? 'pointer' : 'default',
            },
        },
        children
    )
}