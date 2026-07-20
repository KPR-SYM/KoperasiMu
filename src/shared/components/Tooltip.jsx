import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

const POSITIONS = {
    top: { side: 'top', offset: { x: 0, y: -8 } },
    bottom: { side: 'bottom', offset: { x: 0, y: 8 } },
    left: { side: 'left', offset: { x: -8, y: 0 } },
    right: { side: 'right', offset: { x: 8, y: 0 } },
}

/**
 * Tooltip — hover tooltip with portal rendering and smart positioning.
 *
 * @param {ReactNode} children - trigger element
 * @param {string} content - tooltip text
 * @param {string} position - top|bottom|left|right (default: top)
 * @param {number} delay - show delay in ms (default: 300)
 */
export default function Tooltip({
    children,
    content,
    position = 'top',
    delay = 300,
    className = '',
}) {
    const [visible, setVisible] = useState(false)
    const [coords, setCoords] = useState({ top: 0, left: 0 })
    const triggerRef = useRef(null)
    const timeoutRef = useRef(null)

    const show = useCallback(() => {
        timeoutRef.current = setTimeout(() => {
            if (!triggerRef.current) return
            const rect = triggerRef.current.getBoundingClientRect()
            const { side, offset } = POSITIONS[position] || POSITIONS.top

            let top, left
            if (side === 'top') {
                top = rect.top + window.scrollY + offset.y
                left = rect.left + rect.width / 2 + offset.x
            } else if (side === 'bottom') {
                top = rect.bottom + window.scrollY + offset.y
                left = rect.left + rect.width / 2 + offset.x
            } else if (side === 'left') {
                top = rect.top + rect.height / 2 + offset.y
                left = rect.left + offset.x
            } else {
                top = rect.top + rect.height / 2 + offset.y
                left = rect.right + offset.x
            }

            setCoords({ top, left })
            setVisible(true)
        }, delay)
    }, [position, delay])

    const hide = useCallback(() => {
        clearTimeout(timeoutRef.current)
        setVisible(false)
    }, [])

    useEffect(() => {
        return () => clearTimeout(timeoutRef.current)
    }, [])

    if (!content) return children

    const transformOrigin = {
        top: 'bottom',
        bottom: 'top',
        left: 'right',
        right: 'left',
    }[position] || 'bottom'

    return (
        <>
            <span
                ref={triggerRef}
                onMouseEnter={show}
                onMouseLeave={hide}
                onFocus={show}
                onBlur={hide}
                className="inline-flex"
            >
                {children}
            </span>
            {visible && createPortal(
                <div
                    className={`fixed z-[99999] px-2.5 py-1.5 rounded-lg bg-[var(--color-text)] text-white text-[10px] font-bold shadow-lg pointer-events-none animate-in fade-in zoom-in-95 ${className}`}
                    style={{
                        top: coords.top,
                        left: coords.left,
                        transformOrigin,
                        transform: position === 'top' || position === 'bottom'
                            ? 'translateX(-50%)'
                            : 'translateY(-50%)',
                    }}
                >
                    {content}
                </div>,
                document.body
            )}
        </>
    )
}
