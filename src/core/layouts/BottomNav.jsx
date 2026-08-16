import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { NavLink, useNavigate } from "react-router-dom"
import { House, StackSimple, GearSix, CreditCard, DotsThree, Bell, SignOut, Storefront } from '@phosphor-icons/react'
import { useAuth, useLanguage } from "@context"
import { useNotifications, translateNotification } from "@hooks/useNotifications"
import MasterSheet from "./MasterSheet"
import { NotifBadge, NotifPanelInner } from "./notifShared"

// ─── Portal container helper ──────────────────────────────────────────────────
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

// ─── NavItem (route link) ────────────────────────────────────────────────────
function NavItem({ to, icon, label, badge = 0 }) {
    const IconComp = icon
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 px-1 transition-all duration-300
                 ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`
            }
        >
            {({ isActive }) => (
                <>
                    {/* Active pill background around icon */}
                    <div className={`relative w-11 h-6.5 rounded-xl flex items-center justify-center transition-all duration-300
                        ${isActive 
                            ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/10' 
                            : 'bg-transparent text-[var(--color-text-muted)]'}`}
                    >
                        <IconComp
                            className={`w-[18px] h-[18px] transition-transform duration-300 ${isActive ? 'scale-105' : ''}`}
                            strokeWidth={isActive ? 2.5 : 2}
                        />
                        {badge > 0 && (
                            <span className="absolute -top-1.5 -right-2 min-w-[14px] h-3.5 px-0.5 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center leading-none pointer-events-none ring-2 ring-[var(--color-surface)]">
                                {badge > 9 ? '9+' : badge}
                            </span>
                        )}
                    </div>
                    <span className={`text-[9px] font-black tracking-tight leading-none transition-all duration-300 ${isActive ? 'text-[var(--color-primary)] font-black' : 'text-[var(--color-text-muted)] font-bold'}`}>
                        {label}
                    </span>
                </>
            )}
        </NavLink>
    )
}

// ─── MenuButton (sheet trigger) ──────────────────────────────────────────────
function MenuButton({ icon, label, onClick, active = false, badge = 0 }) {
    const IconComp = icon
    return (
        <button
            onClick={onClick}
            type="button"
            aria-label={`Buka menu ${label}`}
            className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 px-1 transition-all duration-300
                ${active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
        >
            {/* Active pill background around icon */}
            <div className={`relative w-11 h-6.5 rounded-xl flex items-center justify-center transition-all duration-300
                ${active 
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/10' 
                    : 'bg-transparent text-[var(--color-text-muted)]'}`}
            >
                <IconComp
                    className={`w-[18px] h-[18px] transition-transform duration-300 ${active ? 'scale-105' : ''}`}
                    strokeWidth={active ? 2.5 : 2}
                />
                {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[14px] h-3.5 px-0.5 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center leading-none pointer-events-none ring-2 ring-[var(--color-surface)]">
                        {badge > 9 ? '9+' : badge}
                    </span>
                )}
            </div>
            <span className={`text-[9px] font-black tracking-tight leading-none transition-all duration-300 ${active ? 'text-[var(--color-primary)] font-black' : 'text-[var(--color-text-muted)] font-bold'}`}>
                {label}
            </span>
        </button>
    )
}

// ─── Avatar inisial (profile button) ─────────────────────────────────────────
function ProfileButton({ profile, onClick, active = false }) {
    const letter = profile?.name?.charAt(0)?.toUpperCase() || 'U'
    return (
        <button
            onClick={onClick}
            type="button"
            aria-label="Menu profil"
            className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 px-1 transition-all duration-300
                ${active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
        >
            <div className={`w-11 h-6.5 rounded-xl flex items-center justify-center transition-all duration-300
                ${active 
                    ? 'bg-[var(--color-primary)]/10 ring-1 ring-[var(--color-primary)]/10' 
                    : 'bg-transparent'}`}
            >
                <div className={`w-[22px] h-[22px] rounded-full shadow-sm flex items-center justify-center font-black text-[10px] text-white
                    ${active ? 'bg-[var(--color-primary)]' : 'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]'}`}>
                    {letter}
                </div>
            </div>
            <span className={`text-[9px] font-black tracking-tight leading-none transition-all duration-300 ${active ? 'text-[var(--color-primary)] font-black' : 'text-[var(--color-text-muted)] font-bold'}`}>
                {active ? 'Aktif' : 'Profil'}
            </span>
        </button>
    )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BottomNav() {
    // openSheet: null | 'finance' | 'master' | 'admin' | 'more'
    const [openSheet, setOpenSheet] = useState(null)
    const [notifOpen, setNotifOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)
    const [isVisible, setIsVisible] = useState(true)
    const { profile, signOut } = useAuth()
    const { t } = useLanguage()
    const navigate = useNavigate()
    const { notifications, loading, refreshing, dismiss, refresh } = useNotifications()

    const navRef = useRef(null)
    const notifPanelRef = useRef(null)
    const profilePanelRef = useRef(null)

    const role = profile?.role?.toLowerCase()
    const isAdminUp = ['developer', 'admin'].includes(role)
    const isStaff = role === 'staff'

    const urgentCount = notifications.filter(n => n.type === 'error' || n.type === 'warning').length
    const notifBadge = urgentCount || notifications.length

    const open = (section) => { setNotifOpen(false); setProfileOpen(false); setOpenSheet(section) }
    const close = () => setOpenSheet(null)

    // ── Hide on Scroll ──
    useEffect(() => {
        let lastY = window.scrollY
        const handleScroll = () => {
            const currentY = window.scrollY
            const windowHeight = window.innerHeight
            const docHeight = document.documentElement.scrollHeight

            const isNearBottom = (windowHeight + currentY) >= (docHeight - 60)
            const isNearTop = currentY < 50
            const isScrollingUp = currentY < lastY
            const isScrollingDown = currentY > lastY

            if (isNearBottom || isNearTop || isScrollingUp) {
                setIsVisible(true)
            } else if (isScrollingDown && currentY > 100) {
                setIsVisible(false)
            }

            lastY = currentY
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    // Close on outside click (notif & profile panel)
    useEffect(() => {
        const onClick = (e) => {
            const isInsideNav = navRef.current && navRef.current.contains(e.target)
            const isInsideNotif = notifPanelRef.current && notifPanelRef.current.contains(e.target)
            const isInsideProfile = profilePanelRef.current && profilePanelRef.current.contains(e.target)
            if (!isInsideNav && !isInsideNotif) setNotifOpen(false)
            if (!isInsideNav && !isInsideProfile) setProfileOpen(false)
        }
        document.addEventListener("mousedown", onClick)
        return () => document.removeEventListener("mousedown", onClick)
    }, [])

    const handleNotifNavigate = (route) => {
        setNotifOpen(false)
        navigate(route)
    }

    const handleLogout = async () => {
        setProfileOpen(false)
        await signOut()
        navigate("/login")
    }

    const containerNotif = getPortalContainer('portal-notif-mobile')
    const containerProfile = getPortalContainer('portal-profile-mobile')

    return (
        <>
            <nav
                ref={navRef}
                className={`lg:hidden fixed bottom-0 left-0 right-0 z-[200]
                    transition-transform duration-300 ease-in-out
                    ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
            >
                {/* Safe area padding for notched phones */}
                <div className="mx-auto max-w-lg px-3 pb-2">
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-xl shadow-[0_-4px_24px_rgba(15,23,42,0.10)] overflow-hidden">

                        {/* ── Admin / Developer: Dashboard, Koperasi, Lainnya, + Notif + Profil ── */}
                        {isAdminUp && (
                            <div className="grid grid-cols-5">
                                <NavItem to="/dashboard" icon={House} label={t('nav.dashboard')} />
                                <MenuButton
                                    icon={Storefront}
                                    label={t('nav.koperasi')}
                                    onClick={() => open(openSheet === 'koperasi' ? null : 'koperasi')}
                                    active={openSheet === 'koperasi'}
                                />
                                <MenuButton
                                    icon={DotsThree}
                                    label={t('ui.more')}
                                    onClick={() => open(openSheet === 'more' ? null : 'more')}
                                    active={openSheet === 'more'}
                                />
                                <MenuButton
                                    icon={Bell}
                                    label={t('notif.header')}
                                    onClick={() => { setOpenSheet(null); setProfileOpen(false); setNotifOpen(v => !v) }}
                                    active={notifOpen}
                                    badge={notifBadge}
                                />
                                <ProfileButton profile={profile} onClick={() => { setOpenSheet(null); setNotifOpen(false); setProfileOpen(v => !v) }} />
                            </div>
                        )}

                        {/* ── Satpam: Dashboard, Settings, + Notif + Profil ── */}
                        {isStaff && (
                            <div className="grid grid-cols-4">
                                <NavItem to="/dashboard" icon={House} label={t('nav.dashboard')} />
                                <NavItem to="/settings" icon={GearSix} label={t('nav.settings')} />
                                <MenuButton
                                    icon={Bell}
                                    label={t('notif.header')}
                                    onClick={() => { setOpenSheet(null); setProfileOpen(false); setNotifOpen(v => !v) }}
                                    active={notifOpen}
                                    badge={notifBadge}
                                />
                                <ProfileButton profile={profile} onClick={() => { setOpenSheet(null); setNotifOpen(false); setProfileOpen(v => !v) }} />
                            </div>
                        )}

                        {/* ── Regular User: Dashboard, Koperasi, Lainnya, + Notif + Profil ── */}
                        {!isAdminUp && !isStaff && (
                            <div className="grid grid-cols-5">
                                <NavItem to="/dashboard" icon={House} label={t('nav.dashboard')} />
                                <MenuButton
                                    icon={Storefront}
                                    label={t('nav.koperasi')}
                                    onClick={() => open(openSheet === 'koperasi' ? null : 'koperasi')}
                                    active={openSheet === 'koperasi'}
                                />
                                <MenuButton
                                    icon={DotsThree}
                                    label={t('ui.more')}
                                    onClick={() => open(openSheet === 'more' ? null : 'more')}
                                    active={openSheet === 'more'}
                                />
                                <MenuButton
                                    icon={Bell}
                                    label={t('notif.header')}
                                    onClick={() => { setOpenSheet(null); setProfileOpen(false); setNotifOpen(v => !v) }}
                                    active={notifOpen}
                                    badge={notifBadge}
                                />
                                <ProfileButton profile={profile} onClick={() => { setOpenSheet(null); setNotifOpen(false); setProfileOpen(v => !v) }} />
                            </div>
                        )}

                    </div>
                </div>
            </nav>

            {/* Panel Notifikasi — muncul di atas bottom nav */}
            {createPortal(
                notifOpen ? (
                    <div ref={notifPanelRef} className="fixed inset-x-0 bottom-[92px] z-[9999] px-3">
                        <div className="mx-auto max-w-lg">
                            <NotifPanelInner
                                notifications={notifications.map(n => translateNotification(n, t))}
                                loading={loading}
                                refreshing={refreshing}
                                onDismiss={dismiss}
                                onRefresh={refresh}
                                onNavigate={handleNotifNavigate}
                            />
                        </div>
                    </div>
                ) : null,
                containerNotif
            )}

            {/* Menu Profil — muncul di atas bottom nav */}
            {createPortal(
                profileOpen ? (
                    <div ref={profilePanelRef} className="fixed bottom-[92px] left-0 right-0 z-[9999] px-3">
                        <div className="mx-auto max-w-lg">
                            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden">
                                {/* Header profil */}
                                <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--color-border)]">
                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center font-black text-white text-sm shrink-0">
                                        {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-extrabold text-[var(--color-text)] truncate">{profile?.name || 'User'}</p>
                                        <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--color-text-muted)]">{profile?.role || 'Staff'}</p>
                                    </div>
                                </div>
                                <div className="p-2">
                                    <button
                                        onClick={() => { setProfileOpen(false); navigate("/settings") }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-[var(--color-surface-alt)] transition font-bold text-sm text-[var(--color-text)]"
                                        type="button"
                                    >
                                        <GearSix /> Pengaturan
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-[var(--color-surface-alt)] transition font-bold text-sm text-red-600"
                                        type="button"
                                    >
                                        <SignOut /> Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null,
                containerProfile
            )}

            {/* MasterSheet: 'finance' | 'master' | 'admin' */}
            <MasterSheet isOpen={openSheet !== null} section={openSheet} onClose={close} />
        </>
    )
}