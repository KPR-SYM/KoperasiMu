import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import { Calendar, CaretDown, CaretLeft, CaretRight, XCircle } from '@phosphor-icons/react'
import { createPortal } from 'react-dom'

import { useLanguage } from '@context'

const LOCALES = {
    id: {
        months: [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ],
        monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
        daysShort: ['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg'],
        formatResting: (d, m, y) => `${d} ${LOCALES.id.months[m]} ${y}`,
        formatTyped: (d, m, y) => `${d}/${m + 1}/${y}`,
        placeholder: 'Pilih Tanggal',
        today: 'Hari Ini',
        clear: 'Hapus',
        formatHint: 'Ketik dengan format: dd/mm/yyyy (mis. 20/07/2026)',
        invalid: 'Format tidak dikenali, coba dd/mm/yyyy',
        prev: 'Sebelumnya',
        next: 'Berikutnya',
        back: 'Kembali',
        openCalendar: 'Buka kalender',
        toggleCalendar: 'Tampilkan/sembunyikan kalender',
        dir: 'ltr',
        parse: (str) => {
            const clean = str.trim()
            let match = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
            if (match) {
                const day = parseInt(match[1], 10)
                const month = parseInt(match[2], 10) - 1
                const year = parseInt(match[3], 10)
                return { day, month, year }
            }
            return null
        }
    },
    en: {
        months: [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ],
        monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        daysShort: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
        formatResting: (d, m, y) => `${LOCALES.en.months[m]} ${d}, ${y}`,
        formatTyped: (d, m, y) => `${m + 1}/${d}/${y}`,
        placeholder: 'Choose Date',
        today: 'Today',
        clear: 'Clear',
        formatHint: 'Type as: mm/dd/yyyy (e.g. 07/20/2026)',
        invalid: 'Unrecognized format, try mm/dd/yyyy',
        prev: 'Previous',
        next: 'Next',
        back: 'Back',
        openCalendar: 'Open calendar',
        toggleCalendar: 'Show/hide calendar',
        dir: 'ltr',
        parse: (str) => {
            const clean = str.trim()
            let match = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
            if (match) {
                const month = parseInt(match[1], 10) - 1
                const day = parseInt(match[2], 10)
                const year = parseInt(match[3], 10)
                return { day, month, year }
            }
            return null
        }
    },
    ar: {
        months: [
            '?????', '??????', '????', '?????', '????', '?????',
            '?????', '?????', '??????', '??????', '??????', '??????'
        ],
        monthsShort: ['???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???'],
        daysShort: ['?', '?', '?', '?', '?', '?', '?'],
        formatResting: (d, m, y) => `${d} ${LOCALES.ar.months[m]} ${y}`,
        formatTyped: (d, m, y) => `${d}/${m + 1}/${y}`,
        placeholder: '???? ???????',
        today: '?????',
        clear: '???',
        formatHint: '???? ?????: ???/???/??? (????: 20/07/2026)',
        invalid: '???? ??? ??????? ???? ???/???/???',
        prev: '??????',
        next: '??????',
        back: '????',
        openCalendar: '??? ???????',
        toggleCalendar: '?????/????? ???????',
        dir: 'rtl',
        parse: (str) => {
            const clean = str.trim()
            let match = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
            if (match) {
                const day = parseInt(match[1], 10)
                const month = parseInt(match[2], 10) - 1
                const year = parseInt(match[3], 10)
                return { day, month, year }
            }
            return null
        }
    }
}

const ARABIC_DIGITS = ['?', '?', '?', '?', '?', '?', '?', '?', '?', '?']

const normalizeArabicDigits = (str) => {
    if (!str) return ''
    return str.replace(/[?-?]/g, d => String(ARABIC_DIGITS.indexOf(d)))
}

// Parse typed strings dynamically based on selected system language
const parseDateString = (str, lang) => {
    if (!str) return null
    const clean = normalizeArabicDigits(str.trim())

    // First try standard database format YYYY-MM-DD or YYYY/MM/DD
    let match = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
    if (match) {
        const y = parseInt(match[1], 10)
        const m = parseInt(match[2], 10) - 1
        const d = parseInt(match[3], 10)
        const date = new Date(y, m, d)
        if (!isNaN(date.getTime()) && date.getFullYear() === y && date.getMonth() === m && date.getDate() === d) {
            return date
        }
    }

    // Next, try localized parser
    const parser = LOCALES[lang] || LOCALES.id
    const parsed = parser.parse(clean)
    if (parsed) {
        const { day, month, year } = parsed
        const date = new Date(year, month, day)
        if (!isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
            return date
        }
    }
    return null
}

const parseYMD = (str) => {
    if (!str) return null
    const [y, m, d] = str.split('-').map(Number)
    if (!y || !m || !d) return null
    const date = new Date(y, m - 1, d)
    return isNaN(date.getTime()) ? null : date
}

const toYMD = (date) => {
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${date.getFullYear()}-${m}-${d}`
}

const addDays = (date, n) => {
    const d = new Date(date)
    d.setDate(d.getDate() + n)
    return d
}

const sameDay = (a, b) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

const DatePicker = memo(({
    value, // Format: YYYY-MM-DD
    onChange,
    placeholder,
    small = false,
    disabled = false,
    className = "",
    compact = false,
    clearable = true,
    minDate = null, // Format: YYYY-MM-DD � dates before this are disabled
    maxDate = null  // Format: YYYY-MM-DD � dates after this are disabled
}) => {
    // Access active language context with safe fallback
    let langCtx
    try {
        langCtx = useLanguage()
    } catch {
        langCtx = null
    }
    const systemLanguage = langCtx?.language || 'id'
    const tNum = langCtx?.tNum || ((val) => String(val))

    const currentLocale = useMemo(() => LOCALES[systemLanguage] || LOCALES.id, [systemLanguage])
    const isRTL = currentLocale.dir === 'rtl'
    const defaultPlaceholder = useMemo(() => {
        const ph = placeholder || currentLocale.placeholder
        return tNum(ph)
    }, [placeholder, currentLocale, tNum])

    const minD = useMemo(() => parseYMD(minDate), [minDate])
    const maxD = useMemo(() => parseYMD(maxDate), [maxDate])

    // Dev-time sanity check: silently disabling the entire calendar via a bad
    // prop combination is a confusing failure mode, so surface it loudly instead.
    if (process.env.NODE_ENV !== 'production' && minD && maxD && minD > maxD) {
        console.warn('[DatePicker] minDate is after maxDate � every day will be disabled.', { minDate, maxDate })
    }

    const [isOpen, setIsOpen] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [typedValue, setTypedValue] = useState('')
    const [inputInvalid, setInputInvalid] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [view, setView] = useState('days') // 'days' | 'months' | 'years'
    const [yearRangeStart, setYearRangeStart] = useState(() => Math.floor(new Date().getFullYear() / 12) * 12)
    const [monthDirection, setMonthDirection] = useState(0) // -1 | 0 | 1, drives slide animation
    const [focusedDay, setFocusedDay] = useState(null) // keyboard-driven cursor within the day grid

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const [currentDate, setCurrentDate] = useState(() => {
        if (value) {
            const d = new Date(value)
            if (!isNaN(d.getTime())) return d
        }
        return new Date()
    })

    const [coords, setCoords] = useState({ top: 0, bottom: 0, left: 0, width: 0, placement: 'bottom', maxHeight: 360 })
    const ref = useRef(null)
    const inputRef = useRef(null)
    const popoverRef = useRef(null)
    const rafRef = useRef(null)
    // Cached once per open session � avoids re-walking the DOM + getComputedStyle on every scroll frame
    const clippingAncestorRef = useRef(null)
    // Declared before any effect references it (previously declared after the
    // cleanup effect that reads it, which threw a ReferenceError on first render
    // due to the temporal dead zone on `const`).
    const invalidFlashTimeoutRef = useRef(null)

    useEffect(() => {
        return () => {
            if (invalidFlashTimeoutRef.current) clearTimeout(invalidFlashTimeoutRef.current)
        }
    }, [])

    // Synchronize currentDate and typedValue when value prop or active language changes
    useEffect(() => {
        if (value) {
            const d = new Date(value)
            if (!isNaN(d.getTime())) {
                setCurrentDate(d)

                const [y, m, dStr] = value.split('-')
                setTypedValue(currentLocale.formatTyped(parseInt(dStr, 10), parseInt(m, 10) - 1, parseInt(y, 10)))
                setInputInvalid(false)
            }
        } else if (!isFocused) {
            setTypedValue('')
        }
    }, [value, isFocused, currentLocale])

    // Single source of truth for closing � guarantees view never gets stuck on
    // 'months'/'years', and the keyboard focus cursor never lingers stale, the
    // next time the popover is reopened.
    const closePopover = useCallback(() => {
        setIsOpen(false)
        setView('days')
        setFocusedDay(null)
    }, [])

    // Walks ancestors once to find the nearest scroll-clipping container + collects
    // every scrollable ancestor (for scroll-listener binding). Called only on open,
    // never per-frame � see clippingAncestorRef usage in updateCoords below.
    const collectScrollContext = useCallback(() => {
        const scrollables = []
        let firstClipper = null
        let el = ref.current?.parentElement
        while (el && el !== document.body) {
            const { overflow, overflowY } = window.getComputedStyle(el)
            if (/(auto|scroll)/.test(overflow + overflowY)) {
                scrollables.push(el)
                if (!firstClipper) firstClipper = el
            }
            el = el.parentElement
        }
        clippingAncestorRef.current = firstClipper
        return scrollables
    }, [])

    const updateCoords = useCallback(() => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect()
            const dropdownHeight = 260
            const margin = 8

            let containerBottom = window.innerHeight - margin
            let containerTop = margin

            // Uses the ancestor cached at open-time instead of re-walking the DOM
            // and calling getComputedStyle on every scroll frame.
            const clipEl = clippingAncestorRef.current
            if (clipEl) {
                const containerRect = clipEl.getBoundingClientRect()
                containerBottom = containerRect.bottom - margin
                containerTop = containerRect.top + margin

                if (rect.bottom < containerTop || rect.top > containerBottom) {
                    closePopover()
                    return
                }
            }

            const spaceBelow = containerBottom - rect.bottom
            const spaceAbove = rect.top - containerTop
            const shouldFlip = spaceBelow < dropdownHeight && spaceAbove > spaceBelow

            setCoords({
                top: rect.top,
                bottom: rect.bottom,
                left: rect.left,
                width: rect.width,
                placement: shouldFlip ? 'top' : 'bottom',
                maxHeight: shouldFlip ? spaceAbove - 16 : spaceBelow - 16
            })
        }
    }, [closePopover])

    // Scroll/resize fire at high frequency � coalesce into one measurement per frame
    const scheduleUpdateCoords = useCallback(() => {
        if (rafRef.current) return
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null
            updateCoords()
        })
    }, [updateCoords])

    const openPopup = useCallback(() => {
        if (disabled) return
        collectScrollContext()
        updateCoords()
        setToday(new Date()) // guards against a dashboard tab left open across midnight
        setIsOpen(true)
    }, [disabled, updateCoords, collectScrollContext])

    const handleFocus = () => {
        setIsFocused(true)
        setInputInvalid(false)
        if (invalidFlashTimeoutRef.current) {
            clearTimeout(invalidFlashTimeoutRef.current)
            invalidFlashTimeoutRef.current = null
        }
        openPopup()
    }

    const handleBlur = () => {
        setIsFocused(false)

        // Restore input to match valid value
        if (value) {
            const [y, m, dStr] = value.split('-')
            setTypedValue(currentLocale.formatTyped(parseInt(dStr, 10), parseInt(m, 10) - 1, parseInt(y, 10)))
            setInputInvalid(false)
        } else if (typedValue.trim() === '') {
            setInputInvalid(false)
        } else {
            // Typed but unresolved: keep the red border briefly so the person notices
            // the rejection, instead of letting it vanish silently or get stuck forever.
            setInputInvalid(true)
            invalidFlashTimeoutRef.current = setTimeout(() => {
                setInputInvalid(false)
                setTypedValue('')
                invalidFlashTimeoutRef.current = null
            }, 900)
        }
    }

    const isDateDisabled = useCallback((year, month, day) => {
        if (!minD && !maxD) return false
        const d = new Date(year, month, day)
        if (minD && d < minD) return true
        if (maxD && d > maxD) return true
        return false
    }, [minD, maxD])

    const selectDate = useCallback((date) => {
        if (isDateDisabled(date.getFullYear(), date.getMonth(), date.getDate())) return
        onChange(toYMD(date))
        setTypedValue(currentLocale.formatTyped(date.getDate(), date.getMonth(), date.getFullYear()))
        setInputInvalid(false)
        closePopover()
    }, [isDateDisabled, onChange, currentLocale, closePopover])

    const handleInputChange = (e) => {
        const val = e.target.value
        setTypedValue(val)

        if (val.trim() === '') {
            setInputInvalid(false)
            return
        }

        const parsed = parseDateString(val, systemLanguage)
        if (parsed && !isDateDisabled(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())) {
            onChange(toYMD(parsed))
            setCurrentDate(parsed)
            setInputInvalid(false)
        } else {
            setInputInvalid(true)
        }
    }

    const handleInputKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            closePopover()
            e.currentTarget.blur()
        } else if (e.key === 'Enter') {
            e.preventDefault()
            const parsed = parseDateString(typedValue, systemLanguage)
            if (parsed) selectDate(parsed)
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            openPopup()
            const seed = parseYMD(value) || currentDate
            setFocusedDay(seed)
            requestAnimationFrame(() => popoverRef.current?.focus())
        }
    }, [typedValue, systemLanguage, selectDate, openPopup, value, currentDate, closePopover])

    useEffect(() => {
        if (!isOpen) return

        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                closePopover()
            }
        }
        document.addEventListener('mousedown', handleClickOutside)

        // Re-collect once for this open session (cheap � happens on open, not per scroll frame)
        // and reuse the same list for binding scroll listeners.
        const scrollableAncestors = collectScrollContext()
        scrollableAncestors.forEach(el => el.addEventListener('scroll', scheduleUpdateCoords, { passive: true }))
        window.addEventListener('scroll', scheduleUpdateCoords, true)
        window.addEventListener('resize', scheduleUpdateCoords)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            scrollableAncestors.forEach(a => a.removeEventListener('scroll', scheduleUpdateCoords))
            window.removeEventListener('scroll', scheduleUpdateCoords, true)
            window.removeEventListener('resize', scheduleUpdateCoords)
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [isOpen, scheduleUpdateCoords, collectScrollContext, closePopover])

    const month = currentDate.getMonth()
    const year = currentDate.getFullYear()
    const selectedDate = useMemo(() => parseYMD(value), [value])
    const [today, setToday] = useState(() => new Date())

    const handlePrevMonth = useCallback((e) => {
        e.stopPropagation()
        e.preventDefault()
        setMonthDirection(-1)
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
    }, [])

    const handleNextMonth = useCallback((e) => {
        e.stopPropagation()
        e.preventDefault()
        setMonthDirection(1)
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
    }, [])

    const handlePrevYear = useCallback((e) => {
        e.stopPropagation()
        e.preventDefault()
        setCurrentDate(prev => new Date(prev.getFullYear() - 1, prev.getMonth(), 1))
    }, [])

    const handleNextYear = useCallback((e) => {
        e.stopPropagation()
        e.preventDefault()
        setCurrentDate(prev => new Date(prev.getFullYear() + 1, prev.getMonth(), 1))
    }, [])

    const handlePrevYearRange = useCallback((e) => {
        e.stopPropagation()
        e.preventDefault()
        setYearRangeStart(prev => prev - 12)
    }, [])

    const handleNextYearRange = useCallback((e) => {
        e.stopPropagation()
        e.preventDefault()
        setYearRangeStart(prev => prev + 12)
    }, [])

    const handleHeaderClick = useCallback((e) => {
        e.stopPropagation()
        e.preventDefault()
        if (view === 'days') {
            setView('months')
        } else if (view === 'months') {
            setYearRangeStart(Math.floor(year / 12) * 12)
            setView('years')
        } else if (view === 'years') {
            setView('months')
        }
    }, [view, year])

    const handleSelectMonth = useCallback((idx) => {
        setCurrentDate(new Date(year, idx, 1))
        setView('days')
    }, [year])

    const handleSelectYear = useCallback((yearVal) => {
        setCurrentDate(new Date(yearVal, month, 1))
        setView('months')
    }, [month])

    const handleToday = useCallback((e) => {
        e.stopPropagation()
        e.preventDefault()
        if (isDateDisabled(today.getFullYear(), today.getMonth(), today.getDate())) return
        selectDate(today)
        setCurrentDate(today)
    }, [today, isDateDisabled, selectDate])

    const handleClear = useCallback((e) => {
        e.stopPropagation()
        e.preventDefault()
        onChange('')
        setTypedValue('')
        setInputInvalid(false)
        closePopover()
    }, [onChange, closePopover])

    // Generate days grid
    const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month])

    // First day of month index (adjusted so Monday = 0, ..., Sunday = 6)
    const firstDayIndex = useMemo(() => {
        const d = new Date(year, month, 1).getDay()
        return d === 0 ? 6 : d - 1
    }, [year, month])

    const calendarGrid = useMemo(() => {
        const cells = []
        for (let i = 0; i < firstDayIndex; i++) {
            cells.push(null)
        }
        for (let i = 1; i <= daysInMonth; i++) {
            cells.push(i)
        }
        return cells
    }, [firstDayIndex, daysInMonth])

    // One Date allocation per cell, and a single source of truth (isDateDisabled)
    // for the disabled check instead of duplicating the min/max comparison here.
    const dayCells = useMemo(() => {
        return calendarGrid.map((day) => {
            if (day === null) return null
            const d = new Date(year, month, day)
            const disabled = isDateDisabled(year, month, day)
            const selected = !!selectedDate && sameDay(selectedDate, d)
            const isTodayCell = sameDay(today, d)
            return { day, disabled, selected, today: isTodayCell }
        })
    }, [calendarGrid, year, month, isDateDisabled, selectedDate, today])

    // Display resting value (e.g., "29 Mei 2026" or "May 29, 2026")
    // Nav buttons stop at the edge instead of letting the person step into a month/year
    // where every date is disabled (a dead end with no visible way back).
    const prevNavDisabled = useMemo(() => {
        if (view === 'days') {
            return !!minD && new Date(year, month, 0) < minD
        }
        if (view === 'months') {
            return !!minD && new Date(year - 1, 11, 31) < minD
        }
        return !!minD && (yearRangeStart - 1) < minD.getFullYear()
    }, [view, year, month, minD, yearRangeStart])

    const nextNavDisabled = useMemo(() => {
        if (view === 'days') {
            return !!maxD && new Date(year, month + 1, 1) > maxD
        }
        if (view === 'months') {
            return !!maxD && new Date(year + 1, 0, 1) > maxD
        }
        return !!maxD && (yearRangeStart + 12) > maxD.getFullYear()
    }, [view, year, month, maxD, yearRangeStart])

    const displayVal = useMemo(() => {
        if (!value) return ''
        const [y, m, d] = value.split('-')
        const resting = currentLocale.formatResting(parseInt(d, 10), parseInt(m, 10) - 1, parseInt(y, 10))
        return tNum(resting)
    }, [value, currentLocale, tNum])

    // Keyboard navigation across the day grid � only active once focus has moved into the popover
    const handlePopoverKeyDown = useCallback((e) => {
        if (view !== 'days') {
            if (e.key === 'Escape') {
                closePopover()
                inputRef.current?.focus()
            }
            return
        }

        const base = focusedDay || selectedDate || currentDate
        // In RTL locales the visual "left"/"right" arrows should move the cursor
        // in the opposite logical direction, matching how the caret nav buttons
        // are also mirrored below.
        const horizontalStep = isRTL ? -1 : 1
        let next = null

        switch (e.key) {
            case 'ArrowLeft': next = addDays(base, -horizontalStep); break
            case 'ArrowRight': next = addDays(base, horizontalStep); break
            case 'ArrowUp': next = addDays(base, -7); break
            case 'ArrowDown': next = addDays(base, 7); break
            case 'PageUp': next = new Date(base.getFullYear(), base.getMonth() - 1, base.getDate()); break
            case 'PageDown': next = new Date(base.getFullYear(), base.getMonth() + 1, base.getDate()); break
            case 'Home': next = new Date(base.getFullYear(), base.getMonth(), 1); break
            case 'End': next = new Date(base.getFullYear(), base.getMonth() + 1, 0); break
            case 'Enter':
            case ' ':
                e.preventDefault()
                selectDate(base)
                inputRef.current?.focus()
                return
            case 'Escape':
                closePopover()
                inputRef.current?.focus()
                return
            default:
                return
        }

        e.preventDefault()
        setFocusedDay(next)
        if (next.getMonth() !== base.getMonth() || next.getFullYear() !== base.getFullYear()) {
            setMonthDirection(next > base ? 1 : -1)
            setCurrentDate(new Date(next.getFullYear(), next.getMonth(), 1))
        }
    }, [view, focusedDay, selectedDate, currentDate, selectDate, closePopover, isRTL])

    const handlePopoverBlur = useCallback((e) => {
        if (!ref.current?.contains(e.relatedTarget)) {
            closePopover()
        }
    }, [closePopover])

    const renderDaysView = () => (
        <>
            <div className="grid grid-cols-7 text-center mb-1.5 select-none" role="row">
                {currentLocale.daysShort.map((d, i) => (
                    <span key={i} role="columnheader" className="text-[9px] font-bold text-[var(--color-text-muted)] tracking-wider opacity-60">
                        {d}
                    </span>
                ))}
            </div>

            <div
                key={`${year}-${month}`}
                role="grid"
                aria-label={`${currentLocale.months[month]} ${year}`}
                className={`grid grid-cols-7 gap-1 animate-in fade-in duration-150 ${monthDirection > 0 ? 'slide-in-from-right-2' : monthDirection < 0 ? 'slide-in-from-left-2' : ''}`}
            >
                {dayCells.map((cell, idx) => {
                    if (cell === null) {
                        return <div key={`empty-${idx}`} role="gridcell" aria-hidden="true" />
                    }

                    const { day, selected, disabled: disabledDay, today: activeToday } = cell
                    const focusedByKeyboard = focusedDay && sameDay(focusedDay, new Date(year, month, day))

                    return (
                        <button
                            key={`day-${day}`}
                            type="button"
                            role="gridcell"
                            tabIndex={-1}
                            disabled={disabledDay}
                            onClick={() => selectDate(new Date(year, month, day))}
                            aria-label={`${day} ${currentLocale.months[month]} ${year}`}
                            aria-current={activeToday ? 'date' : undefined}
                            aria-selected={selected}
                            aria-disabled={disabledDay || undefined}
                            className={`w-full aspect-square max-w-[34px] max-h-[34px] mx-auto rounded-md text-[10px] font-bold transition-all relative flex items-center justify-center ${disabledDay
                                ? 'text-[var(--color-text-muted)] opacity-30 cursor-not-allowed'
                                : selected
                                    ? 'bg-[var(--color-primary)] text-white font-black shadow-md shadow-[var(--color-primary)]/10 scale-105'
                                    : activeToday
                                        ? 'border-2 border-[var(--color-primary)]/50 text-[var(--color-primary)] font-black'
                                        : 'hover:bg-[var(--color-surface-alt)] text-[var(--color-text)]'
                                } ${focusedByKeyboard && !selected ? 'ring-2 ring-offset-1 ring-[var(--color-primary)]/70' : ''}`}
                        >
                            {tNum(day)}
                        </button>
                    )
                })}
            </div>
        </>
    )

    const renderMonthsView = () => (
        <div className="grid grid-cols-3 gap-1.5 py-1">
            {currentLocale.monthsShort.map((label, idx) => {
                const monthStart = new Date(year, idx, 1)
                const monthEnd = new Date(year, idx + 1, 0)
                const disabledMonth = (maxD && monthStart > maxD) || (minD && monthEnd < minD)
                const isSelectedMonth = selectedDate && selectedDate.getFullYear() === year && selectedDate.getMonth() === idx
                const isCurrentMonth = today.getFullYear() === year && today.getMonth() === idx

                return (
                    <button
                        key={label}
                        type="button"
                        disabled={disabledMonth}
                        onClick={() => handleSelectMonth(idx)}
                        className={`h-9 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center ${disabledMonth
                            ? 'text-[var(--color-text-muted)] opacity-30 cursor-not-allowed'
                            : isSelectedMonth
                                ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/10'
                                : isCurrentMonth
                                    ? 'border-2 border-[var(--color-primary)]/50 text-[var(--color-primary)]'
                                    : 'hover:bg-[var(--color-surface-alt)] text-[var(--color-text)]'
                            }`}
                    >
                        {label}
                    </button>
                )
            })}
        </div>
    )

    const renderYearsView = () => {
        const selectedYear = selectedDate ? selectedDate.getFullYear() : null
        const inCurrentRange = selectedYear !== null && selectedYear >= yearRangeStart && selectedYear <= yearRangeStart + 11

        return (
            <div className="grid grid-cols-3 gap-1.5 py-1">
                {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map((yearVal) => {
                    const yearStart = new Date(yearVal, 0, 1)
                    const yearEnd = new Date(yearVal, 11, 31)
                    const disabledYear = (maxD && yearStart > maxD) || (minD && yearEnd < minD)
                    const isSelectedYear = selectedDate && selectedDate.getFullYear() === yearVal
                    const isCurrentYear = today.getFullYear() === yearVal

                    return (
                        <button
                            key={yearVal}
                            type="button"
                            disabled={disabledYear}
                            onClick={() => handleSelectYear(yearVal)}
                            className={`h-9 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center ${disabledYear
                                ? 'text-[var(--color-text-muted)] opacity-30 cursor-not-allowed'
                                : isSelectedYear
                                    ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/10'
                                    : isCurrentYear
                                        ? 'border-2 border-[var(--color-primary)]/50 text-[var(--color-primary)]'
                                        : inCurrentRange && yearVal === selectedYear
                                            ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                            : 'hover:bg-[var(--color-surface-alt)] text-[var(--color-text)]'
                                }`}
                        >
                            {tNum(yearVal)}
                        </button>
                    )
                })}
            </div>
        )
    }

    // Caret icons are mirrored for RTL: the "prev" action (earlier in time) is
    // still visually first-in-reading-order, so it points right in Arabic.
    const PrevIcon = isRTL ? CaretRight : CaretLeft
    const NextIcon = isRTL ? CaretLeft : CaretRight

    const renderCalendar = () => (
        <div
            ref={popoverRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={defaultPlaceholder}
            dir={currentLocale.dir}
            onKeyDown={handlePopoverKeyDown}
            onBlur={handlePopoverBlur}
            className={`p-2 outline-none bg-[var(--color-surface)] ${isMobile ? 'w-full max-w-sm px-4' : 'w-full'}`}
        >
            {/* Header: Month & Year Selector � click the label to jump by month/year */}
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-[var(--color-border)]/40 select-none">
                <button
                    type="button"
                    onClick={view === 'days' ? handlePrevMonth : view === 'months' ? handlePrevYear : handlePrevYearRange}
                    disabled={prevNavDisabled}
                    aria-label={currentLocale.prev}
                    className="w-6 h-6 rounded-md hover:bg-[var(--color-surface-alt)] text-[var(--color-text)] flex items-center justify-center transition-colors active:scale-90 disabled:opacity-20 disabled:pointer-events-none"
                >
                    <PrevIcon className="w-2.5 h-2.5 opacity-70" />
                </button>
                <button
                    type="button"
                    onClick={handleHeaderClick}
                    className={`text-[9px] font-black uppercase tracking-[0.15em] text-[var(--color-text)] px-1.5 py-0.5 rounded-md transition-colors ${view !== 'years' ? 'hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-primary)]' : 'hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-primary)]'}`}
                >
                    {view === 'days' && `${currentLocale.months[month]} ${tNum(year)}`}
                    {view === 'months' && tNum(year)}
                    {view === 'years' && `${tNum(yearRangeStart)} – ${tNum(yearRangeStart + 11)}`}
                </button>
                <button
                    type="button"
                    onClick={view === 'days' ? handleNextMonth : view === 'months' ? handleNextYear : handleNextYearRange}
                    disabled={nextNavDisabled}
                    aria-label={currentLocale.next}
                    className="w-6 h-6 rounded-md hover:bg-[var(--color-surface-alt)] text-[var(--color-text)] flex items-center justify-center transition-colors active:scale-90 disabled:opacity-20 disabled:pointer-events-none"
                >
                    <NextIcon className="w-2.5 h-2.5 opacity-70" />
                </button>
            </div>

            {view === 'days' && renderDaysView()}
            {view === 'months' && renderMonthsView()}
            {view === 'years' && renderYearsView()}

            {/* Footer Buttons */}
            {view === 'days' && (
                <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)] select-none">
                    {clearable ? (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-[8px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 px-1.5 py-1 rounded-lg transition-all border border-transparent hover:border-red-100"
                        >
                            {currentLocale.clear}
                        </button>
                    ) : (
                        <div />
                    )}
                    <button
                        type="button"
                        onClick={handleToday}
                        disabled={isDateDisabled(today.getFullYear(), today.getMonth(), today.getDate())}
                        className="text-[8px] font-black uppercase tracking-widest text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 px-1.5 py-1 rounded-lg transition-all border border-transparent disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        {currentLocale.today}
                    </button>
                </div>
            )}
        </div>
    )

    const iconStatusClasses = {
        error: 'text-rose-500 opacity-80',
        normal: 'text-[var(--color-text-muted)] opacity-50 group-focus-within:text-[var(--color-primary)]'
    }

    const hasCustomHeight = className && /\bh-\[?\w+\]?\b/.test(className)
    let heightClass = ''
    let leftPad = ''
    let showLeftIcon = true

    if (compact) {
        heightClass = 'h-8'
        leftPad = 'pl-2.5'
        showLeftIcon = false
    } else if (small) {
        heightClass = 'h-8 sm:h-9'
        leftPad = 'pl-9'
    } else {
        heightClass = 'h-11'
        leftPad = 'pl-9'
    }

    const showClear = clearable && !!value && !disabled
    const rightPad = showClear ? 'pr-16' : 'pr-8'

    return (
    <div className={`relative ${className}`} ref={ref} dir={currentLocale.dir}>
        <div
            className={`w-full relative flex items-center ${hasCustomHeight ? '' : heightClass} rounded-xl border ${inputInvalid ? 'border-rose-500/50 focus-within:border-rose-500' : 'border-[var(--color-border)] focus-within:border-[var(--color-primary)]'} bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)]/50 focus-within:ring-1 focus-within:ring-[var(--color-primary)] outline-none transition-all group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {showLeftIcon && (
                <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => !disabled && inputRef.current?.focus()}
                    aria-label={currentLocale.openCalendar}
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
                >
                    <Calendar className={`w-3 h-3 transition-colors ${iconStatusClasses.normal}`} />
                </button>
            )}
            <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={isFocused ? typedValue : displayVal}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleInputKeyDown}
                placeholder={defaultPlaceholder}
                disabled={disabled}
                autoComplete="off"
                aria-invalid={inputInvalid}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                title={inputInvalid ? currentLocale.invalid : undefined}
                className={`w-full bg-transparent outline-none text-[10px] font-bold ${leftPad} ${rightPad} ${hasCustomHeight ? '' : heightClass} placeholder:text-[var(--color-text-muted)] placeholder:opacity-60 text-[var(--color-text)] disabled:cursor-not-allowed`}
            />
            {showClear && (
                <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleClear(e) }}
                    aria-label={currentLocale.clear}
                    className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center justify-center text-[var(--color-text-muted)] hover:text-rose-500 transition-colors"
                >
                    <XCircle className="w-3.5 h-3.5" weight="fill" />
                </button>
            )}
            <button
                type="button"
                tabIndex={-1}
                onClick={() => !disabled && inputRef.current?.focus()}
                aria-label={currentLocale.toggleCalendar}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
            >
                <CaretDown className={`w-3 h-3 opacity-40 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`} />
            </button>
        </div>

        {isFocused && inputInvalid && (
            <div className="absolute left-0 top-full mt-1 text-[8px] font-bold text-rose-500 z-[1] select-none">
                {currentLocale.invalid}
            </div>
        )}
        {isFocused && !inputInvalid && typedValue.trim() === '' && (
            <div className="absolute left-0 top-full mt-1 text-[8px] font-semibold text-[var(--color-text-muted)] opacity-70 z-[1] select-none">
                {currentLocale.formatHint}
            </div>
        )}

        {isOpen && createPortal(
            isMobile ? (
                <>
                    <div
                        className="fixed inset-0 bg-black/40 z-[99998] animate-in fade-in duration-200"
                        onMouseDown={(e) => {
                            e.stopPropagation()
                            closePopover()
                        }}
                    />
                    <div
                        className="fixed bottom-0 left-0 right-0 z-[99999] bg-[var(--color-surface)] border-t border-[var(--color-border)] rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-200 flex flex-col pb-safe"
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{ maxHeight: '75vh', width: '100%' }}
                    >
                        <div className="w-12 h-1 bg-[var(--color-border)] rounded-full mx-auto my-2.5 shrink-0" />
                        <div className="flex justify-center w-full">
                            {renderCalendar()}
                        </div>
                    </div>
                </>
            ) : (
                <div
                    className={`fixed z-[99999] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl sm:rounded-2xl shadow-2xl animate-in fade-in ${coords.placement === 'top' ? 'slide-in-from-bottom-2' : 'slide-in-from-top-2'} flex flex-col`}
                    onMouseDown={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                    }}
                    style={{
                        width: coords.width,
                        maxHeight: Math.max(80, coords.maxHeight),
                        overflow: 'hidden',
                        left: coords.left,
                        top: coords.placement === 'top' ? 'auto' : coords.bottom + 8,
                        bottom: coords.placement === 'top' ? (window.innerHeight - coords.top) + 8 : 'auto',
                    }}
                >
                    {renderCalendar()}
                </div>
            ),
            document.body
        )}
    </div>
    )
})

// Component display name
DatePicker.displayName = 'DatePicker'

export default DatePicker