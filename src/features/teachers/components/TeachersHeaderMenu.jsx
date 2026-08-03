import { memo, useEffect, useState } from 'react'
import { Archive, FileArrowDown, FileArrowUp } from '@phosphor-icons/react'
import { createPortal } from 'react-dom'

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator?.platform)
const MOD = isMac ? '⌘' : 'Ctrl'

function getPortalContainer(id) {
    if (typeof document === 'undefined') return null
    let el = document.getElementById(id)
    if (!el) {
        el = document.createElement('div')
        el.id = id
        document.body.appendChild(el)
    }
    return el
}

const TeachersHeaderMenu = memo(function TeachersHeaderMenu({
    isOpen, rect, mounted, onClose,
    onImportClick, onExportClick, onArchivedClick,
    archivedCount = 0,
}) {
    const [activeIdx, setActiveIdx] = useState(-1)

    const items = [
        { id: 'import', label: 'Import CSV / Excel', desc: 'Unggah data guru masal dari file Excel/CSV', icon: FileArrowDown, color: 'emerald', shortcut: `${MOD}+I`, onClick: onImportClick },
        { id: 'export', label: 'Export Data', desc: 'Cadangkan seluruh database ke format Excel', icon: FileArrowUp, color: 'amber', shortcut: `${MOD}+E`, onClick: onExportClick },
        null,
        { id: 'archived', label: 'Arsip Guru', desc: 'Lihat & pulihkan data guru tidak aktif', icon: Archive, color: 'orange', badge: archivedCount, onClick: onArchivedClick },
    ]

    const colorMap = {
        emerald: 'bg-emerald-500/10 text-emerald-500',
        amber: 'bg-amber-500/10 text-amber-500',
        orange: 'bg-orange-500/10 text-orange-500',
    }

    useEffect(() => {
        if (!isOpen) return
        const handler = (e) => {
            if (e.key === 'Escape') onClose()
            const clickable = items.filter(i => i)
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActiveIdx(prev => (prev + 1) % clickable.length)
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActiveIdx(prev => (prev - 1 + clickable.length) % clickable.length)
            } else if (e.key === 'Enter' && activeIdx >= 0) {
                e.preventDefault()
                clickable[activeIdx]?.onClick?.()
                onClose()
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [isOpen, onClose, activeIdx])

    useEffect(() => {
        if (isOpen) setActiveIdx(-1)
    }, [isOpen])

    if (!mounted || !rect) return null

    let clickableIdx = -1

    return createPortal(
        <>
            <div
                className={`fixed inset-0 z-[9990] transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />
            <div
                className={`fixed z-[9991] w-60 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl p-1.5 transition-all duration-200 ease-out origin-top-right
                ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'}`}
                style={{
                    top: rect.bottom + 8,
                    left: Math.max(10, rect.right - 240)
                }}
            >
                {items.map((item, i) => {
                    if (item === null) {
                        return <div key={`div-${i}`} className="h-px bg-[var(--color-border)] my-1 mx-2" />
                    }

                    const idx = ++clickableIdx
                    const isActive = activeIdx === idx
                    const Icon = item.icon

                    return (
                        <button
                            key={item.id}
                            onClick={() => { onClose(); item.onClick?.() }}
                            onMouseEnter={() => setActiveIdx(idx)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group cursor-pointer
                            ${isActive ? 'bg-[var(--color-surface-alt)]' : ''}`}
                        >
                            <div className={`w-8 h-8 rounded-lg ${colorMap[item.color]} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                                <Icon className="w-3.5 h-3.5" weight="bold" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-[11px] font-black leading-tight text-[var(--color-text)] truncate">{item.label}</p>
                                    {item.badge > 0 && (
                                        <span className="px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-600 text-[8px] font-black shrink-0">
                                            {item.badge}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[9px] font-medium text-[var(--color-text-muted)] leading-tight mt-0.5 truncate">{item.desc}</p>
                            </div>
                            {item.shortcut && (
                                <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--color-surface-alt)] border border-[var(--color-border)]/60 text-[8px] font-bold text-[var(--color-text-muted)] font-mono shrink-0">
                                    {item.shortcut}
                                </kbd>
                            )}
                        </button>
                    )
                })}
            </div>
        </>,
        getPortalContainer('portal-teacher-header-menu')
    )
})

export default TeachersHeaderMenu
