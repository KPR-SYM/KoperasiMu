import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"
import { CaretDown, CaretRight, Storefront } from '@phosphor-icons/react'
import { useAuth, useFeatureFlags, useLanguage } from "@context"
import {
    FINANCE_ITEMS, MASTER_ITEMS, KOPERASI_ITEMS, ADMIN_ITEMS,
    SECTION_TITLES, filterNavItems,
} from "./navItems"

// ─── Portal container ─────────────────────────────────────────────────────────
const _portalContainers = {}
function getPortalContainer(id) {
    if (!_portalContainers[id]) {
        let el = document.getElementById(id)
        if (!el) {
            el = document.createElement('div')
            el.id = id
            document.body.appendChild(el)
        }
        _portalContainers[id] = el
    }
    return _portalContainers[id]
}

// ─── NavIcon Helper ──────────────────────────────────────────────────────────
function NavIcon({ icon, className = "" }) {
    if (!icon) return null
    const IconComponent = icon
    return <IconComponent className={className || "w-4 h-4"} strokeWidth={2} />
}

// ─── Section (flat list) ─────────────────────────────────────────────────────
function Section({ title, items, onNavigate }) {
    return (
        <>
            <div className="px-4 pt-3 pb-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">{title}</p>
            </div>
            <div className="px-2 pb-1">
                {items.map((it) => (
                    <button key={it.to} onClick={() => onNavigate(it.to)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-[var(--color-surface-alt)] transition">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${it.color}`}>
                            <NavIcon icon={it.icon} className="w-4.5 h-4.5" />
                        </div>
                        <div className="text-left min-w-0">
                            <div className="text-[13px] font-bold text-[var(--color-text)] leading-tight">{it.label}</div>
                            {it.desc && <div className="text-[10px] text-[var(--color-text-muted)]">{it.desc}</div>}
                        </div>
                    </button>
                ))}
            </div>
        </>
    )
}

// ─── KoperasiSection (kategori + nested leaf) ───────────────────────────────
function KoperasiSection({ title, items, onNavigate }) {
    const [open, setOpen] = useState(() => {
        const init = {}
        items.forEach((it, i) => { init[it.to] = i === 0 })
        return init
    })

    return (
        <>
            <div className="px-4 pt-3 pb-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">{title}</p>
            </div>
            <div className="px-2 pb-1 space-y-1">
                {items.map((cat) => {
                    const isOpen = !!open[cat.to]
                    return (
                        <div key={cat.to}>
                            {/* Category header (expandable) */}
                            <button
                                type="button"
                                onClick={() => setOpen(prev => ({ ...prev, [cat.to]: !prev[cat.to] }))}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-[var(--color-surface-alt)] transition">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cat.color}`}>
                                    <NavIcon icon={cat.icon} className="w-4.5 h-4.5" />
                                </div>
                                <div className="text-left min-w-0 flex-1">
                                    <div className="text-[13px] font-bold text-[var(--color-text)] leading-tight">{cat.label}</div>
                                    {cat.desc && <div className="text-[10px] text-[var(--color-text-muted)]">{cat.desc}</div>}
                                </div>
                                <div className={`flex items-center justify-center shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
                                    <CaretRight className="w-4 h-4 text-[var(--color-text-muted)]" strokeWidth={2.5} />
                                </div>
                            </button>

                            {/* Child leaves */}
                            {isOpen && (
                                <div className="ml-4 pl-2 border-l border-[var(--color-border)]/60 space-y-[1px] mt-0.5 mb-1">
                                    {cat.children?.map((child) => (
                                        <button key={child.to} onClick={() => onNavigate(child.to)}
                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--color-surface-alt)] transition">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${child.color}`}>
                                                <NavIcon icon={child.icon} className="w-4 h-4" />
                                            </div>
                                            <div className="text-left min-w-0">
                                                <div className="text-[12.5px] font-semibold text-[var(--color-text)] leading-tight">{child.label}</div>
                                                {child.desc && <div className="text-[9.5px] text-[var(--color-text-muted)]">{child.desc}</div>}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </>
    )
}

// ─── Divider ──────────────────────────────────────────────────────────────────
function Divider() {
    return <div className="h-px bg-[var(--color-border)] mx-4 my-1" />
}

// ─── MasterSheet ─────────────────────────────────────────────────────────────
export default function MasterSheet({ isOpen, onClose, section }) {
    const navigate = useNavigate()
    const { profile } = useAuth()
    const { flags } = useFeatureFlags()
    const { t, tNav, tNavDesc } = useLanguage()

    const container = getPortalContainer('portal-sheet')

    const role = profile?.role?.toLowerCase()
    const isStaff = role === 'staff'
    const isAdminUp = ['developer', 'admin'].includes(role)

    // Translate helper: map raw navItems → { label, desc } via t() (recursive utk children)
    const translate = (items) => items.map(it => ({
        ...it,
        label: tNav(it),
        desc: tNavDesc(it),
        children: it.children?.length ? translate(it.children) : undefined,
    }))

    const visibleMaster = isStaff ? [] : translate(filterNavItems(MASTER_ITEMS, flags, role))
    const visibleFinance = translate(FINANCE_ITEMS)
    const visibleAdmin = translate(ADMIN_ITEMS)
    const visibleKoperasi = isStaff ? [] : translate(filterNavItems(KOPERASI_ITEMS, flags, role))

    // 'more' = Master + Koperasi + Admin gabungan (untuk tombol Lainnya di BottomNav)
    const isMore = section === 'more'

    // Tentukan section mana yang perlu ditampilkan
    const show = {
        finance: (!section || section === 'finance') && !isStaff,
        master: (!section || section === 'master' || isMore) && visibleMaster.length > 0,
        koperasi: (!section || section === 'master' || section === 'koperasi' || isMore) && visibleKoperasi.length > 0,
        admin: (!section || section === 'admin' || isMore) && isAdminUp,
    }

    useEffect(() => {
        if (!isOpen) return
        const prev = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => { document.body.style.overflow = prev }
    }, [isOpen])

    useEffect(() => {
        if (!isOpen) return
        const onKeyDown = (e) => e.key === "Escape" && onClose?.()
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [isOpen, onClose])

    const handleNav = (to) => { onClose?.(); navigate(to) }

    return createPortal(
        !isOpen ? null : (
            <div className="fixed inset-0 z-[100000] overflow-hidden" onClick={onClose}>
                <div className="absolute inset-0 bg-black/35 animate-in fade-in duration-200" />
                <div 
                    className="absolute left-0 right-0 bottom-0 px-3 pb-3 animate-in slide-in-from-bottom-full duration-300 ease-out" 
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        willChange: 'transform',
                        backfaceVisibility: 'hidden',
                        contain: 'content'
                    }}
                >
                    <div className="mx-auto max-w-xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden">

                        {/* Grabber */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="h-1 w-10 rounded-full bg-gray-300/80 dark:bg-gray-700/80" />
                        </div>

                        <div className="max-h-[75vh] overflow-y-auto no-scrollbar pb-2">
                            {/* ── Finance ── */}
                            {show.finance && (
                                <Section
                                    title={t('section.sheet.finance')}
                                    items={visibleFinance}
                                    onNavigate={handleNav}
                                />
                            )}

                            {/* ── Master Data ── */}
                            {show.master && (
                                <>
                                    {show.finance && <Divider />}
                                    <Section
                                        title={t('section.sheet.master')}
                                        items={visibleMaster}
                                        onNavigate={handleNav}
                                    />
                                </>
                            )}

                            {/* ── Koperasi ── */}
                            {show.koperasi && (
                                <div className="mt-2">
                                    {(show.finance || show.master) && <Divider />}
                                    <KoperasiSection
                                        title={t('section.sheet.koperasi')}
                                        items={visibleKoperasi}
                                        onNavigate={handleNav}
                                    />
                                </div>
                            )}

                            {/* ── Admin Panel ── */}
                            {show.admin && (
                                <div className="mt-2">
                                    {(show.finance || show.master || show.koperasi) && <Divider />}
                                    <Section
                                        title={t('section.sheet.admin')}
                                        items={visibleAdmin}
                                        onNavigate={handleNav}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="h-2" />
                    </div>
                </div>
            </div>
        ),
        container
    )
}