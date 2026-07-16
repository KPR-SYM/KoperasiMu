import React, { useState, useRef, useEffect, useMemo } from 'react'
import { 
    ChevronLeft, ChevronRight, Today, Calendar, 
    Plus, Pencil, Trash, ArrowCounterClockwise,
    GripVertical, GripHorizontal, ClockCounterClockwise
} from '@phosphor-icons/react'
import { createPortal } from 'react-dom'

import { Modal, EmptyState } from '@shared/components'

const MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

const SEMESTER_COLORS = {
    Ganjil: { 
        bg: 'bg-indigo-500', 
        light: 'bg-indigo-500/10', 
        border: 'border-indigo-500/30',
        text: 'text-indigo-600',
        hover: 'hover:bg-indigo-500/20'
    },
    Genap: { 
        bg: 'bg-purple-500', 
        light: 'bg-purple-500/10', 
        border: 'border-purple-500/30',
        text: 'text-purple-600',
        hover: 'hover:bg-purple-500/20'
    }
}

const STATUS_COLORS = {
    active: { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-500/10' },
    inactive: { bg: 'bg-gray-400', text: 'text-gray-500', light: 'bg-gray-400/10' },
    locked: { bg: 'bg-rose-500', text: 'text-rose-600', light: 'bg-rose-500/10' },
    upcoming: { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-500/10' },
    ended: { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-500/10' }
}

function getPeriodStatus(period, today = new Date()) {
    const start = new Date(period.start_date)
    const end = new Date(period.end_date)
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    
    if (period.is_locked) return 'locked'
    if (!period.is_active) return 'inactive'
    if (todayStart < start) return 'upcoming'
    if (todayStart > end) return 'ended'
    return 'active'
}

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay()
}

function formatDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function addDays(date, days) {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
}

export default function PeriodCalendarView({
    periods,
    onEdit,
    onDelete,
    onSetActive,
    onToggleLock,
    onDuplicate,
    onOpenHistory,
    canEdit,
    isPrivacyMode,
    viewDate,
    setViewDate,
    setSelectedPeriodId
}) {
    const [hoveredPeriod, setHoveredPeriod] = useState(null)
    const [resizingPeriod, setResizingPeriod] = useState(null)
    const [resizeDirection, setResizeDirection] = useState(null)
    const [resizeStartX] = useState(0)
    const [resizeStartDate, setResizeStartDate] = useState(null)
    const [contextMenu, setContextMenu] = useState({ x: 0, y: 0, period: null, visible: false })
    const calendarRef = useRef(null)
    const [cellWidth, setCellWidth] = useState(0)

    useEffect(() => {
        if (calendarRef.current) {
            const grid = calendarRef.current.querySelector('.calendar-grid')
            if (grid) {
                const dayCells = grid.querySelectorAll('.day-cell')
                if (dayCells.length > 0) {
                    setCellWidth(dayCells[0].offsetWidth)
                }
            }
        }
    }, [viewDate, periods.length])

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!resizingPeriod || !resizeStartDate) return
            const deltaX = e.clientX - resizeStartX
            const dayDelta = Math.round(deltaX / cellWidth)
            
            if (dayDelta === 0) return

            let newDate
            if (resizeDirection === 'start') {
                const proposed = addDays(resizeStartDate, dayDelta)
                const end = new Date(resizingPeriod.end_date)
                if (proposed < end) newDate = proposed
            } else {
                const proposed = addDays(resizeStartDate, dayDelta)
                const start = new Date(resizingPeriod.start_date)
                if (proposed > start) newDate = proposed
            }

            if (newDate) {
                setContextMenu(prev => ({ ...prev, previewDate: newDate, previewDirection: resizeDirection }))
            }
        }

        const handleMouseUp = () => {
            if (resizingPeriod && resizeStartDate && contextMenu.previewDate) {
                const updatePayload = resizeDirection === 'start'
                    ? { start_date: formatDateKey(contextMenu.previewDate) }
                    : { end_date: formatDateKey(contextMenu.previewDate) }
                
                onEdit?.({ ...resizingPeriod, ...updatePayload })
            }
            setResizingPeriod(null)
            setResizeDirection(null)
            setResizeStartDate(null)
            setContextMenu(prev => ({ ...prev, previewDate: null, previewDirection: null }))
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [resizingPeriod, resizeDirection, resizeStartX, cellWidth, contextMenu.previewDate, onEdit, resizeStartDate])

    useEffect(() => {
        const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }))
        document.addEventListener('click', handleClick)
        return () => document.removeEventListener('click', handleClick)
    }, [])

    const currentMonth = useMemo(() => new Date(viewDate), [viewDate])
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    const today = new Date()
    const todayKey = formatDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate()))

    const periodBars = useMemo(() => {
        return periods
            .filter(p => {
                const start = new Date(p.start_date)
                const end = new Date(p.end_date)
                const monthStart = new Date(year, month, 1)
                const monthEnd = new Date(year, month + 1, 0)
                return start <= monthEnd && end >= monthStart
            })
            .map(p => {
                const start = new Date(p.start_date)
                const end = new Date(p.end_date)
                const barStart = start < new Date(year, month, 1) ? 1 : start.getDate()
                const barEnd = end > new Date(year, month + 1, 0) ? daysInMonth : end.getDate()
                const status = getPeriodStatus(p)
                const colors = SEMESTER_COLORS[p.semester] || SEMESTER_COLORS.Ganjil
                
                return {
                    ...p,
                    barStart,
                    barEnd,
                    barWidth: barEnd - barStart + 1,
                    status,
                    colors
                }
            })
            .sort((a, b) => a.barStart - b.barStart)
    }, [periods, year, month, daysInMonth])

    const groupedBars = useMemo(() => {
        const rows = []
        periodBars.forEach(bar => {
            let placed = false
            for (let row = 0; row < rows.length; row++) {
                const overlap = rows[row].some(existing => 
                    !(bar.barEnd < existing.barStart || bar.barStart > existing.barEnd)
                )
                if (!overlap) {
                    rows[row].push(bar)
                    placed = true
                    break
                }
            }
            if (!placed) {
                rows.push([bar])
            }
        })
        return rows
    }, [periodBars])

    const goToToday = () => {
        setViewDate(new Date())
    }

    const goToMonth = (delta) => {
        setViewDate(d => new Date(d.getFullYear(), d.getMonth() + delta, 1))
    }

    const showContextMenu = (e, period) => {
        e.preventDefault()
        e.stopPropagation()
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            period,
            visible: true
        })
    }

    const handlePeriodClick = (e, period) => {
        e.stopPropagation()
        setSelectedPeriodId(period.id)
        setContextMenu(prev => ({ ...prev, visible: false }))
    }

    const renderDayCell = (day, isCurrentMonth, dateKey) => {
        const isToday = dateKey === todayKey
        const barsForDay = groupedBars.flat().filter(b => 
            b.barStart <= day && b.barEnd >= day
        )
        
        return (
            <div
                key={dateKey}
                className={`day-cell relative min-h-[80px] border-r border-b border-[var(--color-border)]/50 ${
                    !isCurrentMonth ? 'bg-[var(--color-surface-alt)]/30' : ''
                } ${isToday ? 'bg-[var(--color-primary)]/5 ring-1 ring-[var(--color-primary)]/20' : ''}`}
                style={{ width: `${100 / 7}%` }}
            >
                <div className={`absolute top-1 left-1 text-[10px] font-medium ${isToday ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>
                    {day}
                </div>
                
                <div className="absolute top-0 left-0 right-0 bottom-0 pt-5 overflow-hidden space-y-1 px-0.5">
                    {barsForDay.map((bar, idx) => (
                        <div
                            key={`${bar.id}-${day}`}
                            className={`period-bar inline-block w-full ${bar.colors.bg} ${bar.colors.border} rounded text-[9px] font-black px-1 py-0.5 truncate transition-all duration-200 cursor-pointer ${bar.colors.hover}`}
                            style={{ 
                                marginLeft: `${((bar.barStart - day) / 7) * 100}%`,
                                width: `${(bar.barWidth / 7) * 100}%`,
                                zIndex: 10 + idx
                            }}
                            onClick={(e) => handlePeriodClick(e, bar)}
                            onContextMenu={(e) => showContextMenu(e, bar)}
                            onMouseEnter={() => setHoveredPeriod(bar)}
                            onMouseLeave={() => setHoveredPeriod(null)}
                            onDoubleClick={(e) => {
                                e.stopPropagation()
                                onEdit?.(bar)
                            }}
                        >
                            {bar.barStart === day && (
                                <span className="flex items-center gap-1">
                                    {bar.semester === 'Ganjil' ? '📗' : '📘'}
                                    {isPrivacyMode ? '****' : bar.academic_year}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const renderWeekRow = (weekStart, weekIndex) => {
        const cells = []
        for (let i = 0; i < 7; i++) {
            const date = addDays(weekStart, i)
            const day = date.getDate()
            const isCurrentMonth = date.getMonth() === month
            const dateKey = formatDateKey(date)
            cells.push(renderDayCell(day, isCurrentMonth, dateKey))
        }
        return (
            <div key={weekIndex} className="flex" style={{ height: '90px' }}>
                {cells}
            </div>
        )
    }

    const weekRows = []
    let weekStart = new Date(year, month, 1 - firstDay)
    for (let w = 0; w < 6; w++) {
        const monthEnd = new Date(year, month + 1, 0)
        if (weekStart > monthEnd && w > 0) break
        weekRows.push(renderWeekRow(weekStart, w))
        weekStart = addDays(weekStart, 7)
    }

    const legendItems = [
        { label: 'Ganjil', color: 'bg-indigo-500' },
        { label: 'Genap', color: 'bg-purple-500' },
        { label: 'Aktif', color: 'bg-emerald-500' },
        { label: 'Nonaktif', color: 'bg-gray-400' },
        { label: 'Terkunci', color: 'bg-rose-500' },
        { label: 'Akan Datang', color: 'bg-blue-500' },
        { label: 'Selesai', color: 'bg-amber-500' }
    ]

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => goToMonth(-1)}
                        className="p-2 rounded-lg hover:bg-[var(--color-surface-alt)] transition-colors"
                        title="Bulan Sebelumnya"
                    >
                        <ChevronLeft className="w-5 h-5 text-[var(--color-text)]" />
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={goToToday}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider bg-[var(--color-surface-alt)] hover:bg-[var(--color-border)] transition-colors"
                        >
                            <Today className="w-3.5 h-3.5" />
                            Hari Ini
                        </button>
                        
                        <span className="text-lg font-black text-[var(--color-text)]">
                            {MONTHS[month]} {year}
                        </span>
                    </div>
                    
                    <button
                        onClick={() => goToMonth(1)}
                        className="p-2 rounded-lg hover:bg-[var(--color-surface-alt)] transition-colors"
                        title="Bulan Berikutnya"
                    >
                        <ChevronRight className="w-5 h-5 text-[var(--color-text)]" />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--color-surface-alt)] text-[10px] font-medium text-[var(--color-text-muted)]">
                        {legendItems.slice(0, 2).map((l, i) => (
                            <span key={i} className="flex items-center gap-1">
                                <span className={`w-2.5 h-2.5 rounded ${l.color}`} />
                                {l.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Day Headers */}
            <div className="flex border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]/50 sticky top-[52px] z-10">
                {DAYS_SHORT.map((d, i) => (
                    <div key={d} className={`day-header w-[${100/7}%] px-1 py-1.5 text-center text-[9px] font-black uppercase tracking-wider text-[var(--color-text-muted)] ${i === 0 || i === 6 ? 'text-red-500' : ''}`}>
                        {d}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div 
                ref={calendarRef}
                className="calendar-grid flex-1 overflow-auto relative"
                style={{ minHeight: 0 }}
            >
                <div className="relative">
                    {weekRows}
                    
                    {/* Today indicator line */}
                    {today.getMonth() === month && today.getFullYear() === year && (
                        <div className="absolute left-0 right-0 h-0.5 bg-[var(--color-primary)] z-5 pointer-events-none" 
                             style={{ top: `${(today.getDate() - 1) % 7 * 100 / 7}%` }} />
                    )}
                </div>
            </div>

            {/* Hover Tooltip */}
            {hoveredPeriod && createPortal(
                <div className="fixed z-[9999] pointer-events-none">
                    <div className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl p-3 max-w-xs animate-in fade-in zoom-in-95`}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`w-2.5 h-2.5 rounded ${hoveredPeriod.colors.bg}`} />
                            <span className="font-bold text-[var(--color-text)]">
                                {isPrivacyMode ? '****' : hoveredPeriod.academic_year}
                            </span>
                        </div>
                        <div className="text-[11px] text-[var(--color-text-muted)] space-y-1">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDateKey(hoveredPeriod.start_date)} – {formatDateKey(hoveredPeriod.end_date)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${hoveredPeriod.colors.bg} ${hoveredPeriod.colors.text}`}>
                                    {hoveredPeriod.semester}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${STATUS_COLORS[hoveredPeriod.status].bg} ${STATUS_COLORS[hoveredPeriod.status].text}`}>
                                    {hoveredPeriod.status === 'active' ? 'Aktif' : 
                                     hoveredPeriod.status === 'inactive' ? 'Nonaktif' :
                                     hoveredPeriod.status === 'locked' ? 'Terkunci' :
                                     hoveredPeriod.status === 'upcoming' ? 'Akan Datang' : 'Selesai'}
                                </span>
                            </div>
                            {hoveredPeriod.is_locked && (
                                <div className="flex items-center gap-1.5 text-rose-500">
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/10 text-rose-600">
                                        🔒 Terkunci
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Resize Preview */}
            {contextMenu.previewDate && resizingPeriod && createPortal(
                <div className="fixed z-[9999] pointer-events-none">
                    <div className={`bg-[var(--color-primary)]/10 border-2 border-dashed border-[var(--color-primary)] rounded text-[10px] font-black px-2 py-1`}>
                        {resizeDirection === 'start' 
                            ? `Mulai: ${formatDateKey(contextMenu.previewDate)}` 
                            : `Selesai: ${formatDateKey(contextMenu.previewDate)}`}
                    </div>
                </div>,
                document.body
            )}

            {/* Context Menu */}
            {contextMenu.visible && contextMenu.period && createPortal(
                <div className="fixed z-[9999] animate-in fade-in zoom-in-95">
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden min-w-[180px]">
                        <div className="px-3 py-2 border-b border-[var(--color-border)]">
                            <p className="font-bold text-[var(--color-text)] truncate">
                                {isPrivacyMode ? '****' : contextMenu.period.academic_year}
                            </p>
                            <p className="text-[11px] text-[var(--color-text-muted)]">
                                {contextMenu.period.semester} • {formatDateKey(contextMenu.period.start_date)} – {formatDateKey(contextMenu.period.end_date)}
                            </p>
                        </div>
                        <div className="py-1">
                            {canEdit && !contextMenu.period.is_locked && (
                                <div>
                                    <button 
                                        onClick={() => { onEdit?.(contextMenu.period); setContextMenu(p => ({ ...p, visible: false })) }} 
                                        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-medium hover:bg-[var(--color-surface-alt)]"
                                    >
                                        <Pencil className="w-4 h-4" /> Edit Periode
                                    </button>
                                    <button 
                                        onClick={() => { onDuplicate?.(contextMenu.period); setContextMenu(p => ({ ...p, visible: false })) }} 
                                        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-medium hover:bg-[var(--color-surface-alt)]"
                                    >
                                        <GripVertical className="w-4 h-4" /> Duplikat
                                    </button>
                                    <button 
                                        onClick={() => { onSetActive?.(contextMenu.period); setContextMenu(p => ({ ...p, visible: false })) }} 
                                        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-medium hover:bg-[var(--color-surface-alt)]"
                                    >
                                        <ArrowCounterClockwise className="w-4 h-4" /> {contextMenu.period.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                    </button>
                                    <button 
                                        onClick={() => { onToggleLock?.(contextMenu.period); setContextMenu(p => ({ ...p, visible: false })) }} 
                                        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-medium hover:bg-[var(--color-surface-alt)]"
                                    >
                                        <GripHorizontal className="w-4 h-4" /> {contextMenu.period.is_locked ? 'Buka Kunci' : 'Kunci'}
                                    </button>
                                </div>
                            )}
                            <button 
                                onClick={() => { onOpenHistory?.(contextMenu.period); setContextMenu(p => ({ ...p, visible: false })) }} 
                                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-medium hover:bg-[var(--color-surface-alt)]"
                            >
                                <ClockCounterClockwise className="w-4 h-4" /> Riwayat
                            </button>
                            <div className="border-t border-[var(--color-border)] my-1" />
                            <button 
                                onClick={() => { onDelete?.(contextMenu.period); setContextMenu(p => ({ ...p, visible: false })) }} 
                                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-red-500 hover:bg-red-500/10"
                            >
                                <Trash className="w-4 h-4" /> Hapus
                            </button>
                        </div>
                    </div>
                    <div 
                        className="fixed inset-0 z-[9998]" 
                        onClick={() => setContextMenu(p => ({ ...p, visible: false }))} 
                    />
                </div>,
                document.body
            )}

            {/* Empty State Overlay */}
            {periods.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface)]/80 backdrop-blur-sm">
                    <EmptyState 
                        icon={Calendar} 
                        title="Belum Ada Periode" 
                        description="Tambah periode pertama untuk memulai kalender akademik" 
                    />
                </div>
            )}
        </div>
    )
}