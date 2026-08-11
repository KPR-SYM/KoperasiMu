import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import { Warning, CaretDown, Clock, Database, Fingerprint, ClockCounterClockwise, Info, Pen, Plus, ArrowClockwise, ArrowRight, MagnifyingGlass, ShieldCheck, Timer, Trash, Wrench } from '@phosphor-icons/react'
import { supabase } from '@lib/supabase'

import { fmtDateTime, fmtRelative } from '@utils/formatters'
import { EmptyState } from './DataDisplay'

const SEVERITY_STYLES = {
    LOW: { label: 'Low', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20', icon: Info },
    MEDIUM: { label: 'Medium', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Warning },
    HIGH: { label: 'High', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: Warning },
    CRITICAL: { label: 'Critical', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20', icon: ShieldCheck },
}

/**
 * ActionBadge — Chip kecil penanda tipe aksi (INSERT, UPDATE, DELETE, dst)
 * @param {string} action — Tipe aksi dari kolom `action` di audit_logs
 * @param {string} theme — Tema warna: 'default' | 'purple'
 */
export const ActionBadge = memo(function ActionBadge({ action, theme = 'default' }) {
    const purpleConfig = {
        INSERT: { label: 'TAMBAH', color: 'bg-purple-500/10 text-purple-500', icon: Plus },
        UPDATE: { label: 'UBAH', color: 'bg-purple-500/10 text-purple-500', icon: Pen },
        DELETE: { label: 'HAPUS', color: 'bg-purple-500/10 text-purple-500', icon: Trash },
        RESTORE: { label: 'PULIH', color: 'bg-purple-500/10 text-purple-500', icon: ClockCounterClockwise },
        EXECUTE: { label: 'JALAN', color: 'bg-purple-500/10 text-purple-500', icon: ArrowClockwise },
        LOGIN: { label: 'MASUK', color: 'bg-purple-500/10 text-purple-500', icon: ClockCounterClockwise },
        REPAIR: { label: 'PERBAIKAN', color: 'bg-purple-500/10 text-purple-500', icon: Wrench },
    }
    const defaultConfig = {
        INSERT: { label: 'TAMBAH', color: 'bg-emerald-500/10 text-emerald-500', icon: Plus },
        UPDATE: { label: 'UBAH', color: 'bg-amber-500/10 text-amber-500', icon: Pen },
        DELETE: { label: 'HAPUS', color: 'bg-rose-500/10 text-rose-500', icon: Trash },
        RESTORE: { label: 'PULIH', color: 'bg-indigo-500/10 text-indigo-500', icon: ClockCounterClockwise },
        EXECUTE: { label: 'JALAN', color: 'bg-sky-500/10 text-sky-500', icon: ArrowClockwise },
        LOGIN: { label: 'MASUK', color: 'bg-emerald-500/10 text-emerald-500', icon: ClockCounterClockwise },
        REPAIR: { label: 'PERBAIKAN', color: 'bg-purple-500/10 text-purple-500', icon: Wrench },
    }
    const config = theme === 'purple' ? purpleConfig : defaultConfig
    const c = config[action] || { label: action, color: 'bg-gray-500/10 text-gray-500', icon: ClockCounterClockwise }
    const IconComp = c.icon

    return (
        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1 w-fit ${c.color}`}>
            <IconComp className="w-2 h-2" />
            {c.label}
        </span>
    )
})

/**
 * JsonVisualizer â€” Tampilkan objek JSON dalam format key:value berwarna
 * @param {object} data â€” Objek JSON yang akan ditampilkan
 */
export const JsonVisualizer = memo(function JsonVisualizer({ data }) {
    if (!data || typeof data !== 'object') {
        return <span className="text-[var(--color-text-muted)]">null</span>
    }

    const renderValue = (val) => {
        if (val === null) return <span className="text-rose-400">null</span>
        if (typeof val === 'boolean') return <span className="text-amber-400">{val.toString()}</span>
        if (typeof val === 'number') return <span className="text-sky-400 font-mono">{val}</span>
        if (typeof val === 'string') return <span className="text-emerald-400">"{val}"</span>
        return JSON.stringify(val)
    }

    return (
        <div className="space-y-1 font-mono text-[10px]">
            {Object.entries(data).map(([key, val]) => (
                <div key={key} className="flex gap-2">
                    <span className="text-[var(--color-primary)] opacity-70 shrink-0">{key}:</span>
                    <span className="truncate">{renderValue(val)}</span>
                </div>
            ))}
        </div>
    )
})

// Helper internal â€” hitung diff antara dua objek
const _getDiff = (oldObj, newObj, changedFields = null) => {
    const changes = {}
    const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})])
    allKeys.forEach(key => {
        const oldVal = oldObj?.[key]
        const newVal = newObj?.[key]
        const bothNull = (oldVal === null || oldVal === undefined) && (newVal === null || newVal === undefined)
        if (bothNull) return
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            if (changedFields && changedFields.length > 0 && !changedFields.includes(key)) return
            changes[key] = { old: oldVal, new: newVal }
        }
    })
    return changes
}

/**
 * DiffViewer — Side-by-side diff antara old_data and new_data dari audit log
 */
export const DiffViewer = memo(function DiffViewer({ oldData, newData, changedFields }) {
    const diff = _getDiff(oldData, newData, changedFields || null)
    const keys = Object.keys(diff)

    if (keys.length === 0) return (
        <EmptyState icon={Info} title="Tidak Ada Perubahan Terbaca" description="Tidak ada field yang berubah pada record ini." variant="plain" color="slate" />
    )

    const formatValue = (val) => {
        if (val === null || val === undefined) return <span className="italic opacity-40">—</span>
        if (typeof val === 'boolean') return val ? 'Aktif' : 'Nonaktif'
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) return fmtDateTime(val)
        if (typeof val === 'object') return JSON.stringify(val)
        return String(val)
    }

    const getChangeType = (oldVal, newVal) => {
        if (oldVal === null || oldVal === undefined) return 'added'
        if (newVal === null || newVal === undefined) return 'removed'
        return 'modified'
    }

    return (
        <div className="space-y-1">
            {keys.map(key => {
                const isSensitive = ['password', 'secret', 'token'].includes(key.toLowerCase())
                const valOld = diff[key].old
                const valNew = diff[key].new
                const changeType = getChangeType(valOld, valNew)

                return (
                    <div key={key} className="group relative">
                        <div className="flex items-stretch rounded-lg border border-[var(--color-border)]/40 overflow-hidden hover:border-[var(--color-primary)]/30 transition-colors">
                            {/* Change indicator */}
                            <div className={`w-1 shrink-0 ${changeType === 'added' ? 'bg-emerald-500' : changeType === 'removed' ? 'bg-rose-500' : 'bg-amber-500'}`} />

                            {/* Content */}
                            <div className="flex-1 flex items-center gap-3 px-3 py-2 bg-[var(--color-surface)]">
                                {/* Field name */}
                                <div className="flex items-center gap-2 min-w-0 shrink-0">
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-text)]">
                                        {key.replace(/_/g, ' ')}
                                    </span>
                                </div>

                                {/* Separator */}
                                <div className="flex items-center gap-1 shrink-0">
                                    <div className="w-1 h-1 rounded-full bg-[var(--color-text-muted)]/30" />
                                    <ArrowRight className="w-3 h-3 text-[var(--color-text-muted)]/40" />
                                    <div className="w-1 h-1 rounded-full bg-[var(--color-text-muted)]/30" />
                                </div>

                                {/* Old value */}
                                <div className="flex-1 min-w-0">
                                    <code className={`text-[11px] font-mono truncate block ${changeType === 'removed' ? 'text-rose-500 line-through' : 'text-[var(--color-text-muted)]/60 line-through'}`}>
                                        {isSensitive ? '••••••••' : formatValue(valOld)}
                                    </code>
                                </div>

                                {/* Arrow */}
                                <ArrowRight className="w-3 h-3 text-[var(--color-text-muted)]/30 shrink-0" />

                                {/* New value */}
                                <div className="flex-1 min-w-0">
                                    <code className={`text-[11px] font-mono font-medium truncate block ${changeType === 'added' ? 'text-emerald-600' : 'text-emerald-600'}`}>
                                        {isSensitive ? '••••••••' : formatValue(valNew)}
                                    </code>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
})

/**
 * DeleteTombstone — Tampilkan snapshot record yang dihapus (old_data)
 */
export const DeleteTombstone = memo(function DeleteTombstone({ data }) {
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-6 opacity-40">
                <Database className="text-xl mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Data forensik tidak tersedia</p>
            </div>
        )
    }

    const sensitiveKeys = ['password', 'secret', 'token', 'hash']
    const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined)

    return (
        <div className="space-y-1">
            {entries.slice(0, 10).map(([key, val]) => {
                const isSensitive = sensitiveKeys.some(s => key.toLowerCase().includes(s))
                return (
                    <div key={key} className="flex items-stretch rounded-lg border border-rose-500/20 overflow-hidden">
                        <div className="w-1 shrink-0 bg-rose-500" />
                        <div className="flex-1 flex items-center gap-3 px-3 py-2 bg-[var(--color-surface)]">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-rose-500/70 shrink-0">
                                {key.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[11px] font-mono text-rose-600/80 truncate">
                                {isSensitive ? '••••••••' : (typeof val === 'object' ? JSON.stringify(val) : String(val))}
                            </span>
                        </div>
                    </div>
                )
            })}
            {entries.length > 10 && (
                <div className="text-center py-1">
                    <span className="text-[9px] font-bold text-rose-500/50">+{entries.length - 10} field lainnya</span>
                </div>
            )}
        </div>
    )
})

/**
 * InsertViewer — Tampilkan field-field record baru untuk aksi INSERT
 */
export const InsertViewer = memo(function InsertViewer({ data }) {
    if (!data || typeof data !== 'object') return null

    const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined)
    if (entries.length === 0) return null

    return (
        <div className="space-y-1">
            {entries.slice(0, 10).map(([key, val]) => (
                <div key={key} className="flex items-stretch rounded-lg border border-emerald-500/20 overflow-hidden">
                    <div className="w-1 shrink-0 bg-emerald-500" />
                    <div className="flex-1 flex items-center gap-3 px-3 py-2 bg-[var(--color-surface)]">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-500/70 shrink-0">
                            {key.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] font-mono text-emerald-600 truncate">
                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </span>
                    </div>
                </div>
            ))}
            {entries.length > 10 && (
                <div className="text-center py-1">
                    <span className="text-[9px] font-bold text-emerald-500/50">+{entries.length - 10} field lainnya</span>
                </div>
            )}
        </div>
    )
})

/**
 * AuditTimeline — ClockClockwise vertikal audit log untuk satu record spesifik.
 * @param {string} theme — Tema warna: 'default' | 'purple'
 */
export function AuditTimeline({ tableName, recordId, limit = 20, showSearch = false, stickyHeader = false, containerClassName = "", theme = "default" }) {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState(null)
    const [search, setSearch] = useState('')
    const [actionFilter, setActionFilter] = useState('ALL')
    const [restoringId, setRestoringId] = useState(null)
    const abortRef = useRef(null)

    const ACTION_FILTERS = [
        { id: 'ALL', label: 'Semua' },
        { id: 'INSERT', label: 'Tambah' },
        { id: 'UPDATE', label: 'Ubah' },
        { id: 'DELETE', label: 'Hapus' },
    ];

    const fetchLogs = useCallback(async () => {
        if (!tableName || !recordId) return
        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller
        setLoading(true)
        setLogs([])
        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .eq('table_name', tableName)
                .eq('record_id', recordId)
                .order('created_at', { ascending: false })
                .limit(limit)

            if (controller.signal.aborted) return
            if (error) throw error

            const uids = [...new Set((data || []).map(r => r.user_id).filter(Boolean))]
            let profileMap = {}
            if (uids.length) {
                const { data: pData } = await supabase
                    .from('profiles')
                    .select('id,full_name')
                    .in('id', uids)
                if (pData) pData.forEach(p => { profileMap[p.id] = p })
            }

            if (controller.signal.aborted) return
            setLogs((data || []).map(r => ({
                ...r,
                actor_name: profileMap[r.user_id]?.full_name || 'System',
            })))
        } catch (e) {
            if (e.name !== 'AbortError') console.error('[AuditTimeline]', e.message)
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false)
            }
        }
    }, [tableName, recordId, limit])

    const handleRestore = async (log) => {
        if (!confirm('Pulihkan data ini? Aksi ini akan menulis ulang state record saat ini.')) return
        setRestoringId(log.id)
        try {
            const targetData = log.old_data
            if (!targetData) throw new Error('Data forensik tidak ditemukan')

            const { error } = await supabase
                .from(tableName)
                .upsert({ id: recordId, ...targetData })
            if (error) throw error

            const { data: { user } } = await supabase.auth.getUser()
            await supabase.from('audit_logs').insert({
                user_id: user.id,
                action: 'RESTORE',
                source: 'MASTER',
                table_name: tableName,
                record_id: recordId,
                old_data: {},
                new_data: { restored_from: log.id, action: log.action },
                url: window.location.href,
            })
            fetchLogs()
        } catch (e) {
            console.error('[AuditTimeline] Restore failed:', e.message)
        } finally {
            setRestoringId(null)
        }
    }

    useEffect(() => {
        fetchLogs()
        return () => {
            abortRef.current?.abort()
        }
    }, [fetchLogs])

    const filteredLogs = useMemo(() => {
        let result = logs
        if (search) {
            const q = search.toLowerCase()
            result = result.filter(log =>
                log.actor_name?.toLowerCase().includes(q) ||
                log.action?.toLowerCase().includes(q)
            )
        }
        if (actionFilter !== 'ALL') {
            result = result.filter(log => log.action === actionFilter)
        }
        return result
    }, [logs, search, actionFilter])

    // Group logs by relative date
    const groupedLogs = useMemo(() => {
        const groups = {}
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const yesterday = new Date(today - 86400000)
        const twoDaysAgo = new Date(today - 172800000)

        filteredLogs.forEach(log => {
            const logDate = new Date(log.created_at)
            const logDay = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate())
            let groupKey

            if (logDay.getTime() === today.getTime()) {
                groupKey = 'Hari Ini'
            } else if (logDay.getTime() === yesterday.getTime()) {
                groupKey = 'Kemarin'
            } else if (logDay.getTime() === twoDaysAgo.getTime()) {
                groupKey = '2 hari lalu'
            } else {
                const daysDiff = Math.floor((today - logDay) / 86400000)
                if (daysDiff < 7) groupKey = `${daysDiff} hari lalu`
                else if (daysDiff < 30) groupKey = `${Math.floor(daysDiff / 7)} minggu lalu`
                else groupKey = logDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
            }

            if (!groups[groupKey]) groups[groupKey] = []
            groups[groupKey].push(log)
        })
        return groups
    }, [filteredLogs])

    const getInitials = (name) => {
        if (!name || name === 'System') return 'SY'
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-full min-h-[160px] space-y-4 p-2">
            <div className="space-y-4 w-full max-w-xs">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-surface-alt)]" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 w-1/2 bg-[var(--color-surface-alt)] rounded" />
                            <div className="h-2 w-1/4 bg-[var(--color-surface-alt)] rounded opacity-50" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )

    if (logs.length === 0) return (
        <div className="flex items-center justify-center h-full min-h-[160px]">
            <EmptyState icon={ClockCounterClockwise} title="Belum Ada Jejak Audit" description="Aktivitas forensik untuk data ini tidak ditemukan." variant="plain" color="slate" />
        </div>
    )

    return (
        <div className={`space-y-1 ${containerClassName} ${stickyHeader ? 'pt-0' : ''}`} style={{ scrollbarWidth: 'thin' }}>
            {showSearch && (
                <div className={`relative ${stickyHeader ? 'sticky top-0 z-[30] bg-[var(--color-surface)] backdrop-blur-md py-3 px-3 transition-shadow' : 'mb-3'}`}>
                    <div className="relative">
                        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] w-4 h-4" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Cari dalam riwayat..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white dark:bg-white/[0.06] border border-[var(--color-border)] text-[11px] font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all placeholder:text-[var(--color-text-muted)]/40"
                        />
                    </div>
                    {/* Action Filter Chips */}
                    <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto scrollbar-hide">
                        {ACTION_FILTERS.map(f => (
                            <button
                                key={f.id}
                                onClick={() => setActionFilter(f.id)}
                                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border
                                    ${actionFilter === f.id
                                        ? theme === 'purple'
                                            ? 'bg-purple-500/10 text-purple-600 border-purple-500/30'
                                            : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/30'
                                        : 'bg-transparent text-[var(--color-text-muted)] border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {filteredLogs.length === 0 ? (
                    <EmptyState icon={MagnifyingGlass} title="Tidak Ada Hasil" description="Tidak ada riwayat yang cocok dengan filter atau pencarian saat ini." variant="plain" color="slate" className="py-2" />
            ) : (
            <div className={`relative space-y-0 ${stickyHeader ? 'pb-3' : ''}`}>
                <div className="absolute left-[18px] top-2 bottom-2 w-px bg-[var(--color-border)] opacity-60" />

                {Object.entries(groupedLogs).map(([dateLabel, groupLogs]) => (
                    <div key={dateLabel} className="mb-3">
                        {/* Date Group Header */}
                        <div className="relative pl-8 mb-2">
                            <div className="absolute left-[14px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[var(--color-surface-alt)] border-2 border-[var(--color-border)]" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] opacity-60">
                                {dateLabel}
                            </span>
                        </div>

                        {groupLogs.map(log => {
                            const isExpanded = expandedId === log.id
                            return (
                                <div key={log.id} className="relative pl-8 pb-1 last:pb-0">
                                    <div className={`absolute left-[14px] top-[1.1rem] w-2 h-2 rounded-full border transition-all z-10
                                        ${theme === 'purple'
                                            ? 'bg-purple-500/30 border-purple-500/40'
                                            : log.action === 'INSERT' ? 'bg-emerald-500/30 border-emerald-500/40' :
                                                log.action === 'UPDATE' ? 'bg-orange-500/30 border-orange-500/40' :
                                                    log.action === 'DELETE' ? 'bg-rose-500/30 border-rose-500/40' :
                                                        'bg-indigo-500/30 border-indigo-500/40'}
                                        ${isExpanded ? 'ring-4 ring-current opacity-100 scale-125' : 'opacity-60'}`}
                                        style={isExpanded ? { '--tw-ring-color': theme === 'purple' ? 'rgba(168,85,247,0.1)' : log.action === 'INSERT' ? 'rgba(16,185,129,0.1)' : log.action === 'UPDATE' ? 'rgba(245,158,11,0.1)' : 'rgba(244,63,94,0.1)' } : {}}
                                    />

                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                                        className={`w-full text-left group transition-all rounded-2xl p-1.5 border
                                            ${isExpanded
                                                ? 'bg-[var(--color-surface-alt)] border-[var(--color-border)] shadow-sm'
                                                : 'bg-transparent border-transparent hover:bg-[var(--color-surface-alt)]/30'}`}
                                    >
                                        <div className="flex items-center justify-between mb-0.5">
                                            <div className="flex items-center gap-2">
                                                <ActionBadge action={log.action} theme={theme} />
                                                {/* User Avatar */}
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black shrink-0
                                                    ${theme === 'purple'
                                                        ? 'bg-purple-500/10 text-purple-600'
                                                        : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                                    }`}>
                                                    {getInitials(log.actor_name)}
                                                </div>
                                                <span className="text-[11px] font-black text-[var(--color-text)] tracking-tight">
                                                    {log.actor_name}
                                                </span>
                                            </div>
                                            <span className="text-[9px] font-bold text-[var(--color-text-muted)] tabular-nums opacity-50">
                                                {fmtRelative(log.created_at)}
                                            </span>
                                        </div>

                                        <p className="text-[9.5px] text-[var(--color-text-muted)] font-medium leading-tight opacity-60">
                                            {log.action === 'UPDATE' ? 'Melakukan perubahan data record'
                                                : log.action === 'INSERT' ? 'Membuat record baru di sistem'
                                                    : log.action === 'DELETE' ? 'Menghapus record dari sistem'
                                                        : 'Aktivitas sistem'}
                                            <span className="mx-1.5 opacity-30">·</span>
                                            {fmtDateTime(log.created_at)}
                                        </p>

                                        {isExpanded && (
                                            <div className="mt-2 pt-2.5 border-t border-[var(--color-border)] space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                                {/* Diff Content */}
                                                {log.action === 'UPDATE' && (
                                                    <DiffViewer
                                                        oldData={log.old_data}
                                                        newData={log.new_data}
                                                        changedFields={log.changed_fields}
                                                    />
                                                )}
                                                {log.action === 'DELETE' && (
                                                    <DeleteTombstone data={log.old_data} />
                                                )}
                                                {log.action === 'INSERT' && (
                                                    <InsertViewer data={log.new_data} />
                                                )}
                                                {!['UPDATE', 'DELETE', 'INSERT'].includes(log.action) && (
                                                    <DiffViewer oldData={log.old_data} newData={log.new_data} />
                                                )}

                                                {/* Footer: Metadata + Action */}
                                                <div className="flex items-center justify-between gap-4 pt-2 border-t border-[var(--color-border)]/40">
                                                    {/* Metadata inline */}
                                                    <div className="flex items-center gap-3 text-[9px] font-mono text-[var(--color-text-muted)]/60">
                                                        <span className="flex items-center gap-1">
                                                            <div className="w-1 h-1 rounded-full bg-emerald-500/60" />
                                                            {log.ip_address || '?.?.?.?'}
                                                        </span>
                                                        {log.duration_ms != null && (
                                                            <span className={`flex items-center gap-1 ${log.duration_ms > 2000 ? 'text-rose-500' : log.duration_ms > 500 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                                <Timer className="w-2.5 h-2.5" />
                                                                {log.duration_ms}ms
                                                            </span>
                                                        )}
                                                        {log.severity && (
                                                            <span className="flex items-center gap-1 text-amber-500/70">
                                                                <Warning className="w-2.5 h-2.5" />
                                                                {log.severity}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Action Button */}
                                                    {(log.action === 'DELETE' || log.action === 'UPDATE') && (
                                                        <button
                                                            onClick={e => { e.stopPropagation(); handleRestore(log) }}
                                                            disabled={restoringId === log.id}
                                                            className={`flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[8px] font-bold uppercase tracking-wider transition-all border
                                                                ${restoringId === log.id
                                                                    ? 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] border-[var(--color-border)] animate-pulse'
                                                                    : 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 active:scale-[0.97]'}`}
                                                        >
                                                            <ClockCounterClockwise className={`w-3 h-3 ${restoringId === log.id ? 'animate-spin' : ''}`} />
                                                            {restoringId === log.id ? '...' : 'Revert'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {!isExpanded && (
                                            <div className="flex items-center justify-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="flex items-center gap-1 text-[var(--color-text-muted)]">
                                                    <CaretDown className="w-3 h-3" />
                                                </span>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>
            )}
        </div>
    )
}
