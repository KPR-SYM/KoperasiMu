import { useState, useCallback, useRef, useEffect, createElement, Fragment } from 'react'

const DEFAULT_MASKS = {
  year:     (v) => v.replace(/\d(?=\d{2})/g, 'X'),      // 2024/2025 → 2X24/2X25
  semester: (v) => v.replace(/[a-zA-Z]/g, '?'),           // Ganjil → ??????
  date:     (v) => v.replace(/\d/g, 'X'),                  // 2024-07-14 → XXXX-XX-XX
  duration: (v) => v.replace(/\d+/g, '**'),               // 6 bulan → ** bulan
  id:       (v) => v?.toString().replace(/\d/g, '*'),      // 1 → *
  text:     (v) => '••••',
  phone:    (v) => v.replace(/.(?=.{3})/g, 'X'),          // 08123456789 → XXXXXXXXX89
  email:    (v) => {
    const [local, domain] = v.split('@')
    return `${local[0]}•••@${domain}`
  },
  name:     (v) => {
    const parts = v.split(' ')
    return parts.map(p => p[0] + '•••').join(' ')
  },
}

export function usePrivacyMode({ defaultMasks = {}, idleTimeout = 0 } = {}) {
  const [isPrivacyMode, setIsPrivacyMode] = useState(false)
  const idleRef = useRef(null)
  const masks = { ...DEFAULT_MASKS, ...defaultMasks }

  const NULL_FALLBACK = {
    year: '2XXX/2XXX', semester: '??????', date: 'XXXX-XX-XX', duration: '** bulan',
    id: 'ID: ****', text: '••••', phone: 'XXXXXXXXXXX', email: 'x•••@domain',
    name: 'X••• X•••',
  }

  const maskValue = useCallback((value, type = 'text') => {
    if (!isPrivacyMode) return value
    if (value == null) return NULL_FALLBACK[type] || NULL_FALLBACK.text
    const maskFn = masks[type] || masks.text
    return maskFn(value)
  }, [isPrivacyMode, masks])

  const togglePrivacyMode = useCallback(() => setIsPrivacyMode(v => !v), [])

  // Idle detection: auto-enable privacy after inactivity
  useEffect(() => {
    if (!idleTimeout || idleTimeout <= 0) return

    const reset = () => {
      if (idleRef.current) clearTimeout(idleRef.current)
      idleRef.current = setTimeout(() => setIsPrivacyMode(true), idleTimeout)
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, reset))
    reset()

    return () => {
      if (idleRef.current) clearTimeout(idleRef.current)
      events.forEach(e => window.removeEventListener(e, reset))
    }
  }, [idleTimeout])

  // Keyboard shortcut: Ctrl+Shift+P to toggle
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        setIsPrivacyMode(v => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Print protection: inject CSS when privacy is active
  useEffect(() => {
    if (typeof document === 'undefined') return
    const styleId = '__privacy_print_protection'
    let el = document.getElementById(styleId)
    if (isPrivacyMode) {
      if (!el) {
        el = document.createElement('style')
        el.id = styleId
        el.textContent = `
          @media print {
            [data-privacy-masked] { visibility: hidden !important; }
            [data-privacy-masked]::after {
              content: " [TERPROTEKSI] ";
              visibility: visible !important;
              color: #999;
              font-size: 8px;
            }
          }
        `
        document.head.appendChild(el)
      }
    } else {
      el?.remove()
    }
    return () => el?.remove()
  }, [isPrivacyMode])

  return { isPrivacyMode, setIsPrivacyMode, togglePrivacyMode, maskValue }
}

function useLongPress(callback, duration = 600) {
  const timerRef = useRef(null)
  const cbRef = useRef(callback)
  cbRef.current = callback

  const start = useCallback(() => {
    timerRef.current = setTimeout(() => cbRef.current?.(), duration)
  }, [duration])

  const end = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => () => end(), [end])

  return { onMouseDown: start, onMouseUp: end, onMouseLeave: end, onTouchStart: start, onTouchEnd: end }
}

export function PrivacyValue({
  children,
  active,
  className = '',
  revealOn = 'hover',        // 'hover' | 'click' | 'longpress' | 'none'
  revealDuration = 2000,     // ms before re-masking
  onReveal,                  // callback when revealed (for audit)
}) {
  const [isRevealed, setIsRevealed] = useState(false)
  const timeoutRef = useRef(null)
  const containerRef = useRef(null)

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const reveal = useCallback(() => {
    setIsRevealed(true)
    onReveal?.()
    if (revealDuration > 0) {
      clearTimeouts()
      timeoutRef.current = setTimeout(() => setIsRevealed(false), revealDuration)
    }
  }, [revealDuration, onReveal, clearTimeouts])

  const hide = useCallback(() => {
    setIsRevealed(false)
    clearTimeouts()
  }, [clearTimeouts])

  const longPressProps = useLongPress(reveal, 600)

  const eventHandlers = revealOn === 'hover' ? {
    onMouseEnter: reveal,
    onMouseLeave: hide,
    onTouchStart: (e) => { e.preventDefault(); reveal() },
  } : revealOn === 'click' ? {
    onClick: (e) => { e.stopPropagation(); isRevealed ? hide() : reveal() },
    ...longPressProps,
  } : revealOn === 'longpress' ? {
    ...longPressProps,
  } : {}

  // Clipboard prevention
  const handleCopy = useCallback((e) => {
    if (!isRevealed) {
      e.preventDefault()
      e.clipboardData.setData('text/plain', '')
    }
  }, [isRevealed])

  if (!active) return createElement(Fragment, null, children)

  return createElement(
    'span',
    {
      ref: containerRef,
      ...eventHandlers,
      onCopy: handleCopy,
      'data-privacy-masked': !isRevealed ? 'true' : undefined,
      'aria-label': isRevealed ? undefined : 'Data terlindungi',
      className: `inline-block align-middle select-none transition-all duration-200 ${className}`,
      style: {
        filter: !isRevealed ? 'blur(6px)' : 'blur(0px)',
        cursor: revealOn !== 'none' ? 'pointer' : 'default',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: isRevealed ? 'text' : 'none',
        WebkitUserSelect: isRevealed ? 'text' : 'none',
      },
    },
    children
  )
}
