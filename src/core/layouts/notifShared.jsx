// notifShared.jsx
// Komponen notifikasi bersama — dipakai TopNav (desktop) & BottomNav (mobile)
/* eslint-disable react-refresh/only-export-components */

import { ArrowRight, ArrowClockwise, CheckCircle, Info, Warning, WarningCircle, X } from '@phosphor-icons/react'
import { useLanguage } from "@context"

// ── Warna & icon per type notifikasi
export const TYPE_STYLE = {
    error: { bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-500', text: 'text-red-500', icon: WarningCircle },
    warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-500', text: 'text-amber-500', icon: Warning },
    info: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-500', text: 'text-blue-500', icon: Info },
    success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-500', text: 'text-emerald-500', icon: CheckCircle },
}

// Badge merah di atas icon bell
export function NotifBadge({ count }) {
    if (!count) return null
    return (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center leading-none pointer-events-none">
            {count > 9 ? '9+' : count}
        </span>
    )
}

// Satu baris notifikasi di panel
export function NotifItem({ notif, onDismiss, onNavigate }) {
    const { t } = useLanguage()
    const s = TYPE_STYLE[notif.type] || TYPE_STYLE.info
    return (
        <div className={`group relative rounded-xl border p-3 transition-all ${s.bg} ${s.border}`}>
            <div className="flex items-start gap-2.5">
                <div className={`mt-0.5 text-sm shrink-0 ${s.text}`}>
                    <s.icon />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-[var(--color-text)] leading-tight">{notif.title}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 leading-snug">{notif.body}</p>
                    {notif.action && (
                        <button
                            onClick={() => onNavigate(notif.action.route)}
                            aria-label={notif.action.label}
                            className={`mt-1.5 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${s.text} hover:opacity-70 transition-opacity`}
                        >
                            {notif.action.label} <ArrowRight className="w-2 h-2" />
                        </button>
                    )}
                </div>
                <button
                    onClick={() => onDismiss(notif.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-md hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] text-[9px]"
                    title={t('notif.close')}
                    aria-label={t('notif.close')}
                >
                    <X />
                </button>
            </div>
        </div>
    )
}

// Isi panel (card) notifikasi — tanpa wrapper positioning
export function NotifPanelInner({ notifications, loading, refreshing, onDismiss, onRefresh, onNavigate }) {
    const { t } = useLanguage()
    const errCount = notifications.filter(n => n.type === 'error').length
    const warnCount = notifications.filter(n => n.type === 'warning').length

    return (
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
                <div>
                    <p className="text-[12px] font-black text-[var(--color-text)]">{t('notif.header')}</p>
                    {!loading && notifications.length > 0 && (
                        <p className="text-[9px] text-[var(--color-text-muted)] mt-0.5">
                            {errCount > 0 && <span className="text-red-500 font-bold">{errCount} {t('notif.need_action')} · </span>}
                            {warnCount > 0 && <span className="text-amber-500 font-bold">{warnCount} {t('notif.warning')} · </span>}
                            {notifications.length} {t('notif.total')}
                        </p>
                    )}
                </div>
                <button
                    onClick={onRefresh}
                    title={t('notif.refresh')}
                    aria-label={t('notif.refresh')}
                    className={`p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition text-xs ${refreshing ? 'animate-spin pointer-events-none' : ''}`}
                >
                    <ArrowClockwise />
                </button>
            </div>

            {/* Body */}
            <div className="max-h-[60vh] overflow-y-auto p-3 space-y-2">
                {loading ? (
                    <div className="py-8 flex flex-col items-center gap-2 text-[var(--color-text-muted)]">
                        <ArrowClockwise className="animate-spin w-5 h-5" />
                        <p className="text-[10px]">{t('notif.loading')}</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="py-8 flex flex-col items-center gap-2 text-[var(--color-text-muted)]">
                        <span className="text-2xl">🎉</span>
                        <p className="text-[11px] font-bold">{t('notif.empty_title')}</p>
                        <p className="text-[9px] text-center">{t('notif.empty_desc')}</p>
                    </div>
                ) : (
                    notifications.map(n => (
                        <NotifItem
                            key={n.id}
                            notif={n}
                            onDismiss={onDismiss}
                            onNavigate={onNavigate}
                        />
                    ))
                )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && !loading && (
                <div className="px-4 py-2.5 border-t border-[var(--color-border)] flex justify-end">
                    <button
                        onClick={() => notifications.forEach(n => onDismiss(n.id))}
                        className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition"
                    >
                        {t('notif.close_all')}
                    </button>
                </div>
            )}
        </div>
    )
}