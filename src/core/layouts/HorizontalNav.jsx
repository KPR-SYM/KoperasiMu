import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { CaretDown, House, ClipboardText } from '@phosphor-icons/react'
import { NavLink, useLocation } from 'react-router-dom'
import { createPortal } from 'react-dom'

import { useAuth, useFeatureFlags, useLanguage } from '@context'
import {
    DASHBOARD_ITEM, TASK_CENTER_ITEM, NAV_GROUPS, filterNavItems, flattenNavItems,
} from './navItems'

// ─── NavIcon Helper ─────────────────────────────────────────────────────────
function NavIcon({ icon, className = '' }) {
    if (!icon) return null
    const IconComponent = icon
    return <IconComponent className={className || 'w-4 h-4'} strokeWidth={2} />
}

// ─── Dropdown Item ──────────────────────────────────────────────────────────
function DropdownItem({ item, onClick }) {
    const { tNav } = useLanguage()
    return (
        <NavLink
            to={item.to}
            onClick={onClick}
            className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-semibold transition-all
                ${isActive
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold'
                    : 'text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]'}`
            }
        >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[var(--color-surface-alt)]">
                <NavIcon icon={item.icon} className="w-3.5 h-3.5" />
            </div>
            <span className="truncate">{tNav(item)}</span>
        </NavLink>
    )
}

// ─── Group Dropdown ─────────────────────────────────────────────────────────
function GroupDropdown({ group, isOpen, onToggle, onClose }) {
    const { tNav, tGroup } = useLanguage()
    const { flags } = useFeatureFlags()
    const { profile } = useAuth()
    const role = profile?.role?.toLowerCase() || ''
    const btnRef = useRef(null)
    const dropdownRef = useRef(null)
    const [coords, setCoords] = useState(null)

    const visibleItems = useMemo(() =>
        flattenNavItems(filterNavItems(group.items, flags, role)),
        [group.items, flags, role]
    )

    // Auto-close on outside click
    useEffect(() => {
        if (!isOpen) return
        const handler = (e) => {
            if (
                btnRef.current && !btnRef.current.contains(e.target) &&
                dropdownRef.current && !dropdownRef.current.contains(e.target)
            ) {
                onClose()
            }
        }
        document.addEventListener('pointerdown', handler)
        return () => document.removeEventListener('pointerdown', handler)
    }, [isOpen, onClose])

    const handleToggle = useCallback(() => {
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect()
            setCoords({
                top: rect.bottom + 4,
                left: rect.left,
            })
        }
        onToggle()
    }, [onToggle])

    const handleClose = useCallback(() => {
        onClose()
    }, [onClose])

    return (
        <div className="relative">
            <button
                ref={btnRef}
                onClick={handleToggle}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all
                    ${isOpen
                        ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]'}`}
            >
                <NavIcon icon={group.icon} className="w-4 h-4" />
                <span className="hidden md:inline">{tGroup(group.key, group.label)}</span>
                <CaretDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && coords && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed z-[99999] w-56 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-150"
                    style={{ top: coords.top, left: coords.left }}
                >
                    <p className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-muted)] px-3 pt-1 pb-1.5">
                        {tGroup(group.key, group.label)}
                    </p>
                    {visibleItems.map(item => (
                        <DropdownItem key={item.to} item={item} onClick={handleClose} />
                    ))}
                </div>,
                document.body
            )}
        </div>
    )
}

// ─── Main HorizontalNav ─────────────────────────────────────────────────────
export default function HorizontalNav() {
    const { profile } = useAuth()
    const { flags } = useFeatureFlags()
    const location = useLocation()
    const [openGroup, setOpenGroup] = useState(null)

    const role = profile?.role?.toLowerCase() || ''

    const visibleGroups = useMemo(() =>
        NAV_GROUPS.filter(group => {
            if (group.requireRoles && !group.requireRoles.includes(role)) return false
            if (group.hideForRoles && group.hideForRoles.includes(role)) return false
            return true
        }),
        [role]
    )

    // Close dropdown on route change
    useEffect(() => {
        setOpenGroup(null)
    }, [location.pathname])

    // Close on Escape
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape') setOpenGroup(null)
        }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [])

    // Check if a group has active route
    const isGroupActive = useCallback((group) => {
        return flattenNavItems(group.items).some(item =>
            location.pathname === item.to || location.pathname.startsWith(item.to + '/')
        )
    }, [location.pathname])

    return (
        <nav className="hidden lg:flex items-center gap-1 px-4 lg:px-6 h-10 border-b border-[var(--color-border)] bg-[var(--color-surface)] overflow-x-auto no-scrollbar">
            {/* Dashboard */}
            <NavLink
                to={DASHBOARD_ITEM.to}
                className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all shrink-0
                    ${isActive
                        ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]'}`
                }
            >
                <House className="w-4 h-4" strokeWidth={2} />
                <span className="hidden md:inline">Dashboard</span>
            </NavLink>

            {/* Task Center */}
            <NavLink
                to={TASK_CENTER_ITEM.to}
                className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all shrink-0
                    ${isActive
                        ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]'}`
                }
            >
                <ClipboardText className="w-4 h-4" strokeWidth={2} />
                <span className="hidden md:inline">Pusat Tugas</span>
            </NavLink>

            {/* Divider */}
            <div className="w-px h-5 bg-[var(--color-border)] mx-1 shrink-0" />

            {/* Groups */}
            {visibleGroups.map(group => (
                <GroupDropdown
                    key={group.key}
                    group={group}
                    isOpen={openGroup === group.key}
                    isHighlighted={isGroupActive(group)}
                    onToggle={() => setOpenGroup(prev => prev === group.key ? null : group.key)}
                    onClose={() => setOpenGroup(null)}
                />
            ))}
        </nav>
    )
}
