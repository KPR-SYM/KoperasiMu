import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import { Warning, CaretDown, Database, ClockCounterClockwise, Info, Pen, Plus, ArrowClockwise, ArrowRight, MagnifyingGlass, Timer, Trash, Wrench } from '@phosphor-icons/react'
import { supabase } from '@lib/supabase'
import { useToast } from '@context/Toast'
import { fmtDateTime, fmtRelative } from '@utils/formatters'
import { EmptyState } from './DataDisplay'
import ConfirmDialog from './ConfirmDialog'

/**
 * Helper formatting audit data secara user-friendly
 */
const formatAuditValue = (val, profiles = {}) => {
    if (val === null || val === undefined) {
        return <span className="italic opacity-40">—</span>
    }
    if (typeof val === 'boolean') {
        return val ? 'Aktif' : 'Nonaktif'
    }
    if (typeof val === 'string') {
        // Date / Timestamp ISO
        if (/^\d{4}-\d{2}-\d{2}T/.test(val)) {
            return fmtDateTime(val)
        }
        // UUID (resolve to user profile full_name if exists)
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)) {
            if (profiles[val]) {
                const name = profiles[val].full_name || 'User'
                return (
                    <span title={val} className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {name}
                    </span>
                )
            }
            return (
                <span title={val} className="cursor-help underline decoration-dotted decoration-[var(--color-text-muted)]/30">
                    {val.slice(0, 8)}…
                </span>
            )
        }
    }
    if (typeof val === 'object') {
        return JSON.stringify(val)
    }
    return String(val)
}

const ACTION_META = {
    INSERT: { label: 'TAMBAH', icon: Plus },
    UPDATE: { label: 'UBAH', icon: Pen },
    DELETE: { label: 'HAPUS', icon: Trash },
    RESTORE: { label: 'PULIH', icon: ClockCounterClockwise },
    EXECUTE: { label: 'JALAN', icon: ArrowClockwise },
    LOGIN: { label: 'MASUK', icon: ClockCounterClockwise },
    REPAIR: { label: 'PERBAIKAN', icon: Wrench },
}

const ACTION_THEME_COLORS = {
    default: {
        INSERT: 'bg-emerald-500/10 text-emerald-500',
        UPDATE: 'bg-amber-500/10 text-amber-500',
        DELETE: 'bg-rose-500/10 text-rose-500',
        RESTORE: 'bg-indigo-500/10 text-indigo-500',
        EXECUTE: 'bg-sky-500/10 text-sky-500',
        LOGIN: 'bg-emerald-500/10 text-emerald-500',
        REPAIR: 'bg-purple-500/10 text-purple-500',
    },
    purple: {
        INSERT: 'bg-purple-500/10 text-purple-500',
        UPDATE: 'bg-purple-500/10 text-purple-500',
        DELETE: 'bg-purple-500/10 text-purple-500',
        RESTORE: 'bg-purple-500/10 text-purple-500',
        EXECUTE: 'bg-purple-500/10 text-purple-500',
        LOGIN: 'bg-purple-500/10 text-purple-500',
        REPAIR: 'bg-purple-500/10 text-purple-500',
    },
    blue: {
        INSERT: 'bg-emerald-500/10 text-emerald-500',
        UPDATE: 'bg-blue-500/10 text-blue-500',
        DELETE: 'bg-rose-500/10 text-rose-500',
        RESTORE: 'bg-indigo-500/10 text-indigo-500',
        EXECUTE: 'bg-sky-500/10 text-sky-500',
        LOGIN: 'bg-emerald-500/10 text-emerald-500',
        REPAIR: 'bg-purple-500/10 text-purple-500',
    },
}

/**
 * ActionBadge — Chip kecil penanda tipe aksi (INSERT, UPDATE, DELETE, dst)
 * @param {string} action — Tipe aksi dari kolom `action` di audit_logs
 * @param {string} theme — Tema warna: 'default' | 'purple' | 'blue'
 */
export const ActionBadge = memo(function ActionBadge({ action, theme = 'default' }) {
    const base = ACTION_META[action] || { label: action, icon: ClockCounterClockwise }
    const colors = ACTION_THEME_COLORS[theme] || ACTION_THEME_COLORS.default
    const color = colors[action] || 'bg-gray-500/10 text-gray-500'
    const IconComp = base.icon

    return (
        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1 w-fit ${color}`}>
            <IconComp className="w-2 h-2" />
            {base.label}
        </span>
    )
})

/**
 * JsonVisualizer — Tampilkan objek JSON dalam format key:value berwarna
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

// Helper internal — hitung diff antara dua objek
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
 * DiffViewer — Split/Inline diff viewer dengan visualisasi top-tier mirip git
 */
export const DiffViewer = memo(function DiffViewer({ oldData, newData, changedFields, profiles = {} }) {
    const diff = _getDiff(oldData, newData, changedFields || null)
    const keys = Object.keys(diff)

    if (keys.length === 0) return (
        <EmptyState icon={Info} title="Tidak Ada Perubahan Terbaca" description="Tidak ada field yang berubah pada record ini." variant="plain" color="slate" />
    )

    const getChangeType = (oldVal, newVal) => {
        if (oldVal === null || oldVal === undefined) return 'added'
        if (newVal === null || newVal === undefined) return 'removed'
        return 'modified'
    }

    return (
        <div className="space-y-2">
            {keys.map(key => {
                const isSensitive = ['password', 'secret', 'token'].includes(key.toLowerCase())
                const valOld = diff[key].old
                const valNew = diff[key].new
                const changeType = getChangeType(valOld, valNew)

                // Render value placeholders or resolved text
                const formattedOld = isSensitive ? '••••••••' : formatAuditValue(valOld, profiles)
                const formattedNew = isSensitive ? '••••••••' : formatAuditValue(valNew, profiles)

                // Simplify length comparison for layout decisions
                const strOld = isSensitive ? '••••••••' : String(valOld || '')
                const strNew = isSensitive ? '••••••••' : String(valNew || '')
                const isShort = strOld.length + strNew.length < 32

                return (
                    <div key={key} className="rounded-xl border border-[var(--color-border)]/45 bg-[var(--color-surface)] overflow-hidden shadow-sm">
                        {/* Header field */}
                        <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--color-surface-alt)]/65 border-b border-[var(--color-border)]/30">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                                {key.replace(/_/g, ' ')}
                            </span>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${changeType === 'added' ? 'bg-emerald-500/10 text-emerald-600'
                                    : changeType === 'removed' ? 'bg-rose-500/10 text-rose-600'
                                        : 'bg-amber-500/10 text-amber-600'
                                }`}>
                                {changeType === 'added' ? 'Baru' : changeType === 'removed' ? 'Dikosongkan' : 'Diubah'}
                            </span>
                        </div>

                        {/* Detail area */}
                        <div className="p-2.5">
                            {isShort ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                    {changeType !== 'added' && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 line-through font-mono text-[10.5px]">
                                            {formattedOld}
                                        </span>
                                    )}
                                    {changeType === 'modified' && (
                                        <ArrowRight className="w-3 h-3 text-[var(--color-text-muted)]/30 shrink-0" />
                                    )}
                                    {changeType !== 'removed' && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold font-mono text-[10.5px]">
                                            {formattedNew}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {changeType !== 'added' && (
                                        <div className="flex items-start gap-2">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-rose-500/50 bg-rose-500/5 px-1 py-0.5 rounded mt-0.5 shrink-0">Lama</span>
                                            <div className="flex-1 font-mono text-[10.5px] text-[var(--color-text-muted)]/60 line-through break-all bg-rose-500/[0.02] p-2 rounded-lg border border-rose-500/5">
                                                {formattedOld}
                                            </div>
                                        </div>
                                    )}
                                    {changeType === 'modified' && (
                                        <div className="flex items-center gap-2 pl-9 pr-2">
                                            <div className="h-px flex-1 bg-[var(--color-border)]/40" />
                                            <ArrowRight className="w-3 h-3 text-[var(--color-text-muted)]/30 rotate-90 shrink-0" />
                                            <div className="h-px flex-1 bg-[var(--color-border)]/40" />
                                        </div>
                                    )}
                                    {changeType !== 'removed' && (
                                        <div className="flex items-start gap-2">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500/60 bg-emerald-500/5 px-1 py-0.5 rounded mt-0.5 shrink-0">Baru</span>
                                            <div className="flex-1 font-mono text-[10.5px] text-emerald-600 dark:text-emerald-400 font-semibold break-all bg-emerald-500/[0.02] p-2 rounded-lg border border-emerald-500/5">
                                                {formattedNew}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
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
export const DeleteTombstone = memo(function DeleteTombstone({ data, profiles = {} }) {
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
                            <span className="text-[11px] font-mono text-rose-600/80 truncate flex-1">
                                {isSensitive ? '••••••••' : formatAuditValue(val, profiles)}
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
export const InsertViewer = memo(function InsertViewer({ data, profiles = {} }) {
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
                        <span className="text-[11px] font-mono text-emerald-600 truncate flex-1">
                            {formatAuditValue(val, profiles)}
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
 * AuditTimeline — Timeline vertikal audit log untuk satu record spesifik.
 * @param {string} theme — Tema warna: 'default' | 'purple' | 'blue'
 */
export function AuditTimeline({ tableName, recordId, limit = 20, showSearch = false, stickyHeader = false, containerClassName = "", theme = "default" }) {
    const { addToast } = useToast()
    const [logs, setLogs] = useState([])
    const [profiles, setProfiles] = useState({})
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState(null)
    const [search, setSearch] = useState('')
    const [actionFilter, setActionFilter] = useState('ALL')
    const [restoringId, setRestoringId] = useState(null)
    const [confirmRestoreLog, setConfirmRestoreLog] = useState(null)
    const abortRef = useRef(null)

    const ACTION_FILTERS = [
        { id: 'ALL', label: 'Semua' },
        { id: 'INSERT', label: 'Tambah' },
        { id: 'UPDATE', label: 'Ubah' },
        { id: 'DELETE', label: 'Hapus' },
    ]

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

            // Scan all possible UUIDs from user_id, old_data, and new_data to map profiles
            const potentialIds = new Set()
                ; (data || []).forEach(r => {
                    if (r.user_id) potentialIds.add(r.user_id)

                    const scanForUUIDs = (obj) => {
                        if (!obj || typeof obj !== 'object') return
                        Object.values(obj).forEach(val => {
                            if (typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)) {
                                potentialIds.add(val)
                            }
                        })
                    }
                    scanForUUIDs(r.old_data)
                    scanForUUIDs(r.new_data)
                })

            const uids = [...potentialIds]
            let profileMap = {}
            if (uids.length) {
                const { data: pData } = await supabase
                    .from('profiles')
                    .select('id,full_name')
                    .in('id', uids)
                if (pData) pData.forEach(p => { profileMap[p.id] = p })
            }

            if (controller.signal.aborted) return
            setProfiles(profileMap)
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
        setConfirmRestoreLog(null)
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
            addToast('Data berhasil dipulihkan', 'success')
            fetchLogs()
        } catch (e) {
            console.error('[AuditTimeline] Restore failed:', e.message)
            addToast('Gagal memulihkan data: ' + e.message, 'error')
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

    // Active-filter accent class based on theme
    const activeFilterClass = theme === 'purple'
        ? 'bg-purple-500/10 text-purple-600 border-purple-500/30'
        : theme === 'blue'
            ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
            : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/30'

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-full min-h-[200px] p-6 space-y-4">
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
        <div className="flex items-center justify-center h-full min-h-[200px]">
            <EmptyState icon={ClockCounterClockwise} title="Belum Ada Jejak Audit" description="Aktivitas forensik untuk data ini tidak ditemukan." variant="plain" color="slate" />
        </div>
    )

    return (
        <div className={`flex flex-col min-h-0 h-full ${containerClassName}`}>
            {/* Sticky search + filter header */}
            {showSearch && (
                <div className={`shrink-0 px-4 pt-3 pb-2.5 ${stickyHeader
                    ? 'sticky top-0 z-[30] bg-[var(--color-surface)] border-b border-[var(--color-border)]/50'
                    : ''
                    }`}>
                    {/* Search Input */}
                    <div className="relative">
                        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] w-3.5 h-3.5 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Cari dalam riwayat..."
                            className="w-full h-9 pl-9 pr-3 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[11px] font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all placeholder:text-[var(--color-text-muted)]/40"
                        />
                    </div>
                    {/* Action Filter Pills */}
                    <div className="flex items-center gap-1.5 mt-2 overflow-x-auto scrollbar-hide">
                        {ACTION_FILTERS.map(f => (
                            <button
                                key={f.id}
                                onClick={() => setActionFilter(f.id)}
                                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${actionFilter === f.id
                                    ? activeFilterClass
                                    : 'bg-transparent text-[var(--color-text-muted)] border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Scrollable timeline body */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3" style={{ scrollbarWidth: 'thin' }}>
                {filteredLogs.length === 0 ? (
                    <div className="flex items-center justify-center min-h-[140px]">
                        <EmptyState
                            icon={MagnifyingGlass}
                            title="Tidak Ada Hasil"
                            description="Tidak ada riwayat yang cocok dengan filter atau pencarian saat ini."
                            variant="plain"
                            color="slate"
                        />
                    </div>
                ) : (
                    <div className="relative">
                        {/* Vertical timeline line */}
                        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-[var(--color-border)] opacity-50" />

                        {Object.entries(groupedLogs).map(([dateLabel, groupLogs]) => (
                            <div key={dateLabel} className="mb-3 last:mb-0">
                                {/* Date Group Label */}
                                <div className="relative flex items-center gap-3 pl-8 mb-1.5">
                                    <div className="absolute left-[11px] w-2.5 h-2.5 rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-border)]" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]/50">
                                        {dateLabel}
                                    </span>
                                </div>

                                {/* Log items */}
                                <div className="space-y-1">
                                    {groupLogs.map(log => {
                                        const isExpanded = expandedId === log.id

                                        // Dot color per action/theme
                                        const dotColor = theme === 'purple'
                                            ? 'bg-purple-400/60 border-purple-500/50'
                                            : theme === 'blue'
                                                ? log.action === 'INSERT' ? 'bg-emerald-400/60 border-emerald-500/50'
                                                    : log.action === 'DELETE' ? 'bg-rose-400/60 border-rose-500/50'
                                                        : 'bg-blue-400/60 border-blue-500/50'
                                                : log.action === 'INSERT' ? 'bg-emerald-400/60 border-emerald-500/50'
                                                    : log.action === 'UPDATE' ? 'bg-amber-400/60 border-amber-500/50'
                                                        : log.action === 'DELETE' ? 'bg-rose-400/60 border-rose-500/50'
                                                            : 'bg-indigo-400/60 border-indigo-500/50'

                                        return (
                                            <div key={log.id} className="relative pl-8">
                                                {/* Timeline dot */}
                                                <div className={`absolute left-[11px] top-3.5 w-2.5 h-2.5 rounded-full border-2 transition-transform z-10 ${dotColor} ${isExpanded ? 'scale-125' : ''}`} />

                                                <button
                                                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                                                    className={`w-full text-left group transition-all rounded-xl px-3 py-2.5 border ${isExpanded
                                                        ? 'bg-[var(--color-surface-alt)] border-[var(--color-border)]'
                                                        : 'bg-transparent border-transparent hover:bg-[var(--color-surface-alt)]/60'
                                                        }`}
                                                >
                                                    {/* Row 1: Badge + Avatar + Name | Relative time */}
                                                    <div className="flex items-center gap-2 justify-between">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <ActionBadge action={log.action} theme={theme} />
                                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black shrink-0 ${theme === 'purple' ? 'bg-purple-500/10 text-purple-600'
                                                                : theme === 'blue' ? 'bg-blue-500/10 text-blue-600'
                                                                    : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                                                }`}>
                                                                {getInitials(log.actor_name)}
                                                            </div>
                                                            <span className="text-[11px] font-bold text-[var(--color-text)] truncate">
                                                                {log.actor_name}
                                                            </span>
                                                        </div>
                                                        <span className="text-[9px] font-semibold text-[var(--color-text-muted)]/50 tabular-nums shrink-0">
                                                            {fmtRelative(log.created_at)}
                                                        </span>
                                                    </div>

                                                    {/* Row 2: Description + datetime */}
                                                    <p className="mt-0.5 text-[10px] text-[var(--color-text-muted)]/60 font-medium leading-snug">
                                                        {log.action === 'UPDATE' ? 'Melakukan perubahan data record'
                                                            : log.action === 'INSERT' ? 'Membuat record baru di sistem'
                                                                : log.action === 'DELETE' ? 'Menghapus record dari sistem'
                                                                    : 'Aktivitas sistem'}
                                                        <span className="mx-1 opacity-30">·</span>
                                                        <span className="tabular-nums">{fmtDateTime(log.created_at)}</span>
                                                    </p>

                                                    {/* Expanded detail */}
                                                    {isExpanded && (
                                                        <div className="mt-3 pt-2.5 border-t border-[var(--color-border)]/60 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                                            {log.action === 'UPDATE' && (
                                                                <DiffViewer
                                                                    oldData={log.old_data}
                                                                    newData={log.new_data}
                                                                    changedFields={log.changed_fields}
                                                                    profiles={profiles}
                                                                />
                                                            )}
                                                            {log.action === 'DELETE' && (
                                                                <DeleteTombstone data={log.old_data} profiles={profiles} />
                                                            )}
                                                            {log.action === 'INSERT' && (
                                                                <InsertViewer data={log.new_data} profiles={profiles} />
                                                            )}
                                                            {!['UPDATE', 'DELETE', 'INSERT'].includes(log.action) && (
                                                                <DiffViewer oldData={log.old_data} newData={log.new_data} profiles={profiles} />
                                                            )}

                                                            {/* Footer: metadata + revert */}
                                                            <div className="flex items-center justify-between gap-3 pt-2 border-t border-[var(--color-border)]/40">
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
                                                                {(log.action === 'DELETE' || log.action === 'UPDATE') && (
                                                                    <button
                                                                        onClick={e => { e.stopPropagation(); setConfirmRestoreLog(log) }}
                                                                        disabled={restoringId === log.id}
                                                                        className={`flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[8px] font-bold uppercase tracking-wider transition-all border ${restoringId === log.id
                                                                            ? 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] border-[var(--color-border)] animate-pulse'
                                                                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 active:scale-[0.97]'
                                                                            }`}
                                                                    >
                                                                        <ClockCounterClockwise className={`w-3 h-3 ${restoringId === log.id ? 'animate-spin' : ''}`} />
                                                                        {restoringId === log.id ? '...' : 'Revert'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Expand hint on hover */}
                                                    {!isExpanded && (
                                                        <div className="flex justify-center mt-1 opacity-0 group-hover:opacity-50 transition-opacity">
                                                            <CaretDown className="w-3 h-3 text-[var(--color-text-muted)]" />
                                                        </div>
                                                    )}
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={!!confirmRestoreLog}
                onClose={() => setConfirmRestoreLog(null)}
                onConfirm={() => confirmRestoreLog && handleRestore(confirmRestoreLog)}
                title="Pulihkan Data"
                description="Aksi ini akan menulis ulang state record saat ini dengan data dari riwayat ini."
                icon={ClockCounterClockwise}
                iconBg="bg-amber-500/10"
                iconColor="text-amber-500"
                confirmText="Pulihkan"
                confirmIcon={ClockCounterClockwise}
                confirmColor="amber"
                submitting={restoringId === confirmRestoreLog?.id}
            />
        </div>
    )
}
