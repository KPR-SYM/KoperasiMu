import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { supabase } from '@lib/supabase'
import { logAudit } from '@utils/auditLogger'
import { useAuth } from '@context/Auth'
import { useFlag } from '@context/FeatureFlags'
import { useErrorHandler } from '@hooks'
import { usePrivacyMode } from '@shared/hooks/usePrivacyMode'

const LEVELS = ['7', '8', '9', '10', '11', '12']
const PROGRAMS = ['Boarding', 'Reguler']
const LS_FILTERS = 'classes_filters'
const LS_COLS = 'classes_columns'
const LS_PAGE_SIZE = 'classes_page_size'
const LS_PINNED = 'classes_pinned'
const LS_VIEW_MODE = 'classes_view_mode'
const LS_COL_ORDER = 'classes_col_order'
const VALID_COL_KEYS = ['level', 'program', 'gender', 'teacher', 'students', 'year']
const DEFAULT_COL_ORDER = ['level', 'program', 'gender', 'teacher', 'students', 'year']

export function useClassesCore({ addToast }) {
    const { handleError } = useErrorHandler('ClassesPage')
    const { profile } = useAuth()
    const { enabled: canEdit } = useFlag('access.teacher_classes')

    // ── Core Data ──
    const [classes, setClasses] = useState([])
    const [archivedClasses, setArchivedClasses] = useState([])
    const [teachersList, setTeachersList] = useState([])
    const [periodsList, setAcademicYearsList] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingArchived, setLoadingArchived] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // ── Stats ──
    const [stats, setStats] = useState({ total: 0, boarding: 0, reguler: 0, totalStudents: 0 })

    // ── Filtering & Search ──
    const [searchQuery, setSearchQuery] = useState('')
    const [filterLevel, setFilterLevel] = useState(() => {
        try { return JSON.parse(localStorage.getItem(LS_FILTERS) || '{}').filterLevel || '' } catch { return '' }
    })
    const [filterProgram, setFilterProgram] = useState(() => {
        try { return JSON.parse(localStorage.getItem(LS_FILTERS) || '{}').filterProgram || '' } catch { return '' }
    })
    const [sortBy, setSortBy] = useState(() => {
        try { return JSON.parse(localStorage.getItem(LS_FILTERS) || '{}').sortBy || 'name' } catch { return 'name' }
    })
    const [filterNoTeacher, setFilterNoTeacher] = useState(() => {
        try { return JSON.parse(localStorage.getItem(LS_FILTERS) || '{}').filterNoTeacher ?? false } catch { return false }
    })
    const [filterCrowded, setFilterCrowded] = useState(() => {
        try { return JSON.parse(localStorage.getItem(LS_FILTERS) || '{}').filterCrowded ?? false } catch { return false }
    })
    const [isFilterOpen, setIsFilterOpen] = useState(false)

    // ── Pagination ──
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(() => {
        try { return Number(localStorage.getItem(LS_PAGE_SIZE)) || 10 } catch { return 10 }
    })
    const [jumpPage, setJumpPage] = useState('')

    // ── Selection ──
    const [selectedIds, setSelectedIds] = useState([])

    // ── View Mode ──
    const [viewMode, setViewMode] = useState(() => {
        try { return localStorage.getItem(LS_VIEW_MODE) || 'table' } catch { return 'table' }
    })

    // ── Pinned ──
    const [pinnedIds, setPinnedIds] = useState(() => {
        try { return JSON.parse(localStorage.getItem(LS_PINNED) || '[]') } catch { return [] }
    })

    // ── Undo/Redo ──
    const [undoStack, setUndoStack] = useState([])
    const [redoStack, setRedoStack] = useState([])

    // ── Inline Edit ──
    const [inlineEditCell, setInlineEditCell] = useState(null)
    const [saveStatus, setSaveStatus] = useState('idle')
    const [lastChange, setLastChange] = useState(null)

    // ── UI ──
    const [isShortcutOpen, setIsShortcutOpen] = useState(false)
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false)
    const searchInputRef = useRef(null)
    const headerMenuBtnRef = useRef(null)
    const shortcutBtnRef = useRef(null)
    const [headerMenuRect, setHeaderMenuRect] = useState(null)
    const [shortcutRect, setShortcutRect] = useState(null)
    const [headerMenuMounted, setHeaderMenuMounted] = useState(false)

    // ── Column Menu ──
    const [isColMenuOpen, setIsColMenuOpen] = useState(false)
    const [colMenuPos, setColMenuPos] = useState({ top: 0, right: 0, showUp: false })
    const colMenuRef = useRef(null)
    const colMenuPortalRef = useRef(null)

    // ── Columns ──
    const defaultCols = { level: true, program: true, gender: true, teacher: true, students: true, year: true }
    const [visibleCols, setVisibleCols] = useState(() => {
        try { const c = JSON.parse(localStorage.getItem(LS_COLS) || '{}'); return Object.keys(c).length ? c : defaultCols }
        catch { return defaultCols }
    })
    const [columnOrder, setColumnOrder] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(LS_COL_ORDER))
            if (saved) {
                const cleaned = saved.filter(k => VALID_COL_KEYS.includes(k))
                return cleaned.length === VALID_COL_KEYS.length ? cleaned : DEFAULT_COL_ORDER
            }
            return DEFAULT_COL_ORDER
        } catch { return DEFAULT_COL_ORDER }
    })

    // ── Action Context ──
    const [selectedItem, setSelectedItem] = useState(null)
    const [itemToDelete, setItemToDelete] = useState(null)

    // ── Persist ──
    useEffect(() => { try { localStorage.setItem(LS_FILTERS, JSON.stringify({ filterLevel, filterProgram, sortBy, filterNoTeacher, filterCrowded })) } catch { /* noop */ } }, [filterLevel, filterProgram, sortBy, filterNoTeacher, filterCrowded])
    useEffect(() => { try { localStorage.setItem(LS_COLS, JSON.stringify(visibleCols)) } catch { /* noop */ } }, [visibleCols])
    useEffect(() => { try { localStorage.setItem(LS_COL_ORDER, JSON.stringify(columnOrder)) } catch { /* noop */ } }, [columnOrder])
    useEffect(() => { try { localStorage.setItem(LS_PAGE_SIZE, String(pageSize)) } catch { /* noop */ } }, [pageSize])
    useEffect(() => { try { localStorage.setItem(LS_VIEW_MODE, viewMode) } catch { /* noop */ } }, [viewMode])
    useEffect(() => { try { localStorage.setItem(LS_PINNED, JSON.stringify(pinnedIds)) } catch { /* noop */ } }, [pinnedIds])

    // Reset page on search/filter change
    const prevFiltersRef = useRef({ searchQuery, filterLevel, filterProgram, sortBy, filterNoTeacher, filterCrowded })
    useEffect(() => {
        const prev = prevFiltersRef.current
        const changed = searchQuery !== prev.searchQuery || filterLevel !== prev.filterLevel || filterProgram !== prev.filterProgram || sortBy !== prev.sortBy || filterNoTeacher !== prev.filterNoTeacher || filterCrowded !== prev.filterCrowded
        if (changed) setPage(1)
        prevFiltersRef.current = { searchQuery, filterLevel, filterProgram, sortBy, filterNoTeacher, filterCrowded }
    }, [searchQuery, filterLevel, filterProgram, sortBy, filterNoTeacher, filterCrowded])

    // ── Outside Click ──
    useEffect(() => {
        if (isHeaderMenuOpen) {
            setHeaderMenuMounted(true)
        } else {
            const t = setTimeout(() => setHeaderMenuMounted(false), 200)
            return () => clearTimeout(t)
        }
    }, [isHeaderMenuOpen])

    // Sticky positioning
    useEffect(() => {
        if (!isHeaderMenuOpen && !isShortcutOpen) return
        const update = () => {
            if (isHeaderMenuOpen && headerMenuBtnRef.current) setHeaderMenuRect(headerMenuBtnRef.current.getBoundingClientRect())
            if (isShortcutOpen && shortcutBtnRef.current) setShortcutRect(shortcutBtnRef.current.getBoundingClientRect())
        }
        update()
        window.addEventListener('scroll', update, true)
        window.addEventListener('resize', update)
        return () => { window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update) }
    }, [isHeaderMenuOpen, isShortcutOpen])

    // Column menu outside click
    useEffect(() => {
        if (!isColMenuOpen) return
        const handler = (e) => {
            if (colMenuRef.current && !colMenuRef.current.contains(e.target) && colMenuPortalRef.current && !colMenuPortalRef.current.contains(e.target)) {
                setIsColMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [isColMenuOpen])

    // ── Computed ──
    const activeFilterCount = (filterLevel ? 1 : 0) + (filterProgram ? 1 : 0) + (filterNoTeacher ? 1 : 0) + (filterCrowded ? 1 : 0)
    const hasActiveFilters = !!(searchQuery || activeFilterCount)
    const resetAllFilters = () => { setSearchQuery(''); setFilterLevel(''); setFilterProgram(''); setFilterNoTeacher(false); setFilterCrowded(false); setPage(1) }

    const { isPrivacyMode, setIsPrivacyMode, togglePrivacyMode, maskValue: privacyMaskValue } = usePrivacyMode()

    const maskValue = useCallback((value, type = 'text') => {
        if (!isPrivacyMode) return value
        if (value == null) return '—'
        return privacyMaskValue(value, type)
    }, [isPrivacyMode, privacyMaskValue])

    // ── Pinned ──
    const togglePin = useCallback((id) => {
        setPinnedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }, [])

    // ── Column reorder ──
    const moveColumnLeft = useCallback((key) => {
        setColumnOrder(prev => {
            const idx = prev.indexOf(key)
            if (idx <= 0) return prev
            const next = [...prev]
            ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
            return next
        })
    }, [])
    const moveColumnRight = useCallback((key) => {
        setColumnOrder(prev => {
            const idx = prev.indexOf(key)
            if (idx === -1 || idx >= prev.length - 1) return prev
            const next = [...prev]
            ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
            return next
        })
    }, [])

    // ── Undo/Redo (snapshot-based) ──
    const pushUndo = useCallback((snapshot) => {
        setUndoStack(prev => [...prev.slice(-20), snapshot])
        setRedoStack([])
    }, [])

    const handleUndo = useCallback(() => {
        setUndoStack(prev => {
            if (prev.length === 0) return prev
            const snapshot = prev[prev.length - 1]
            setRedoStack(r => [...r, { classes: snapshot.classes, stats: snapshot.stats }])
            setClasses(snapshot.classes)
            setStats(snapshot.stats)
            return prev.slice(0, -1)
        })
    }, [])

    const handleRedo = useCallback(() => {
        setRedoStack(prev => {
            if (prev.length === 0) return prev
            const snapshot = prev[prev.length - 1]
            setUndoStack(u => [...u, { classes: snapshot.classes, stats: snapshot.stats }])
            setClasses(snapshot.classes)
            setStats(snapshot.stats)
            return prev.slice(0, -1)
        })
    }, [])

    // ── Inline Save ──
    const handleInlineSave = useCallback(async (id, field, value) => {
        setSaveStatus('saving')
        try {
            const oldItem = classes.find(c => c.id === id)
            const { error } = await supabase.from('classes').update({ [field]: value }).eq('id', id)
            if (error) throw error
            setClasses(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
            setSaveStatus('saved')
            setLastChange({ field })
            if (oldItem) pushUndo({ classes, stats })
            setTimeout(() => setSaveStatus('idle'), 2000)
        } catch (err) {
            setSaveStatus('error')
            handleError(err, { context: 'Gagal menyimpan' })
            setTimeout(() => setSaveStatus('idle'), 3000)
        }
    }, [classes, stats, pushUndo, handleError])

    // ── Data Fetching ──
    const loadMetadata = useCallback(async () => {
        if (!supabase) return { t: {}, y: {} }
        try {
            const [tRes, yRes] = await Promise.all([
                supabase.from('teachers').select('id, full_name').eq('is_active', true).order('full_name'),
                supabase.from('periods').select('id, academic_year, semester, is_active').order('academic_year', { ascending: false })
            ])
            const tList = tRes.data || []
            const yList = (yRes.data || []).map(y => ({ ...y, label: [y.academic_year, y.semester].filter(Boolean).join(' ') || '—' }))
            setTeachersList(tList); setAcademicYearsList(yList)
            return { t: Object.fromEntries(tList.map(t => [t.id, t.full_name || '—'])), y: Object.fromEntries(yList.map(y => [y.academic_year, y.label])) }
        } catch { return { t: {}, y: {} } }
    }, [])

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const { t: tMap, y: yMap } = await loadMetadata()
            let q = supabase.from('classes').select('id, uuid, name, grade_level, homeroom_teacher_id, academic_year, capacity, is_active, created_at, students(count)').is('deleted_at', null).order('name')
            const { data, error } = await q
            if (!error && data) {
                const mapped = data.map(row => ({
                    ...row,
                    teacherName: row.homeroom_teacher_id ? (tMap[row.homeroom_teacher_id] || '—') : '—',
                    periodName: row.academic_year ? (yMap[row.academic_year] || '—') : '—',
                    students: row.students?.[0]?.count ?? 0,
                }))
                setClasses(mapped)
                const s = { total: mapped.length, boarding: 0, reguler: mapped.length, totalStudents: 0 }
                mapped.forEach(c => { s.totalStudents += (c.students || 0) })
                setStats(s)
            }
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }, [loadMetadata])

    const fetchArchived = useCallback(async () => {
        setLoadingArchived(true)
        try {
            const { data, error } = await supabase.from('classes').select('id, uuid, name, grade_level, academic_year, homeroom_teacher_id, capacity, is_active, created_at, deleted_at, deleted_by').not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
            if (error) throw error
            const archiverIds = [...new Set((data || []).map(c => c.deleted_by).filter(Boolean))]
            let archiverMap = {}
            if (archiverIds.length > 0) {
                const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', archiverIds)
                archiverMap = Object.fromEntries((profiles || []).map(p => [p.id, p.full_name]))
            }
            const enriched = (data || []).map(c => ({ ...c, archivedByName: c.deleted_by ? (archiverMap[c.deleted_by] || '—') : '—' }))
            setArchivedClasses(enriched)
        } catch {
            setArchivedClasses([])
        } finally {
            setLoadingArchived(false)
        }
    }, [])

    const handleRestore = async (id) => {
        try {
            const { error } = await supabase.from('classes').update({ deleted_at: null, deleted_by: null }).eq('id', id)
            if (error) throw error
            addToast('Kelas berhasil dipulihkan', 'success'); await logAudit({ action: 'UPDATE', source: 'SYSTEM', tableName: 'classes', recordId: id, oldData: { id, restored: false }, newData: { deleted_at: null, restored: true } }); fetchArchived(); fetchData()
        } catch (err) { handleError(err, { context: 'Gagal memulihkan kelas' }) }
    }

    const handlePermanentDelete = async (id) => {
        if (!confirm('Hapus permanen kelas ini? Data tidak bisa dikembalikan.')) return
        try {
            const { error } = await supabase.from('classes').delete().eq('id', id)
            if (error) throw error
            addToast('Kelas dihapus permanen', 'success'); await logAudit({ action: 'DELETE', source: 'SYSTEM', tableName: 'classes', recordId: id, oldData: { permanent_delete: true } }); fetchArchived()
        } catch (err) { handleError(err, { context: 'Gagal menghapus permanen' }) }
    }

    const fetchDataRef = useRef(fetchData)
    useEffect(() => { fetchDataRef.current = fetchData }, [fetchData])
    useEffect(() => { fetchData() }, [fetchData])

    // Realtime
    useEffect(() => {
        const ch = supabase.channel('classes-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, () => fetchDataRef.current?.()).subscribe()
        return () => supabase.removeChannel(ch)
    }, [])

    // ── Filter & Sort ──
    const filtered = useMemo(() => {
        let result = classes.filter(c => {
            const q = searchQuery.toLowerCase()
            const matchSearch = !q || c.name.toLowerCase().includes(q) || (c.teacherName || '').toLowerCase().includes(q)
            const matchLevel = !filterLevel || c.grade_level?.toString() === filterLevel
            const matchProg = !filterProgram || true
            const matchNoTeacher = !filterNoTeacher || !c.homeroom_teacher_id
            const matchCrowded = !filterCrowded || c.students > 35
            return matchSearch && matchLevel && matchProg && matchNoTeacher && matchCrowded
        })
        if (sortBy === 'name') result.sort((a, b) => a.name.localeCompare(b.name))
        else if (sortBy === 'level') result.sort((a, b) => (a.grade_level || 0) - (b.grade_level || 0) || a.name.localeCompare(b.name))
        else if (sortBy === 'students') result.sort((a, b) => (b.students || 0) - (a.students || 0))
        return result
    }, [classes, searchQuery, filterLevel, filterProgram, filterNoTeacher, filterCrowded, sortBy])

    const totalRows = filtered.length

    // Sort pinned to top
    const sortedFiltered = useMemo(() => {
        if (pinnedIds.length === 0) return filtered
        const pinned = filtered.filter(c => pinnedIds.includes(c.id))
        const unpinned = filtered.filter(c => !pinnedIds.includes(c.id))
        return [...pinned, ...unpinned]
    }, [filtered, pinnedIds])

    const paged = sortedFiltered.slice((page - 1) * pageSize, page * pageSize)

    // ── Insights ──
    const insights = useMemo(() => {
        const results = []
        const noTeacher = classes.filter(c => !c.homeroom_teacher_id)
        if (noTeacher.length > 0) results.push({
            id: 'noTeacher',
            label: `${noTeacher.length} Kelas Tanpa Wali`,
            desc: 'Wali kelas belum ditentukan',
            active: filterNoTeacher,
            onClick: () => { setFilterNoTeacher(v => !v); setPage(1); setIsFilterOpen(true) }
        })
        const crowded = classes.filter(c => c.students > 35)
        if (crowded.length > 0) results.push({
            id: 'crowded',
            label: `${crowded.length} Kelas Padat`,
            desc: 'Populasi siswa > 35 anak',
            active: filterCrowded,
            onClick: () => { setFilterCrowded(v => !v); setPage(1); setIsFilterOpen(true) }
        })
        return results
    }, [classes, filterNoTeacher, filterCrowded])

    // ── Handlers ──
    const handleAdd = () => { setSelectedItem(null); setIsModalOpen(true) }
    const handleEdit = item => { setSelectedItem(item); setIsModalOpen(true) }

    const handleSubmit = async (formData) => {
        setSubmitting(true)
        const finalMajor = [formData.program, formData.gender_type].filter(Boolean).join(' ')
        const payload = { name: formData.name, grade_level: parseInt(formData.level) || null, homeroom_teacher_id: formData.homeroom_teacher_id || null, academic_year: formData.academic_year || null, capacity: formData.capacity ? parseInt(formData.capacity) : null }
        try {
            if (selectedItem) { const { error } = await supabase.from('classes').update(payload).eq('id', selectedItem.id); if (error) throw error; addToast('Data kelas berhasil diupdate', 'success'); await logAudit({ action: 'UPDATE', source: 'SYSTEM', tableName: 'classes', recordId: selectedItem.id, oldData: selectedItem, newData: { ...selectedItem, ...payload } }) }
            else { const { data: insData, error } = await supabase.from('classes').insert(payload).select().single(); if (error) throw error; addToast('Kelas baru berhasil ditambahkan', 'success'); await logAudit({ action: 'INSERT', source: 'SYSTEM', tableName: 'classes', recordId: insData?.id, newData: payload }) }
            setIsModalOpen(false); fetchData()
        } catch (err) { handleError(err, { context: 'Gagal menyimpan data' }) }
        finally { setSubmitting(false) }
    }

    const handleDeleteConfirm = async () => {
        if (!itemToDelete) return; setSubmitting(true)
        try {
            const { error } = await supabase.from('classes').delete().eq('id', itemToDelete.id)
            if (error) throw error
            addToast('Kelas berhasil dihapus', 'success'); await logAudit({ action: 'DELETE', source: 'SYSTEM', tableName: 'classes', recordId: itemToDelete.id, oldData: itemToDelete }); setIsDeleteModalOpen(false); fetchData()
        } catch (err) { handleError(err, { context: 'Gagal menghapus kelas' }) }
        finally { setSubmitting(false) }
    }

    const handleBulkDelete = async () => {
        setSubmitting(true)
        try {
            const { error } = await supabase.from('classes').delete().in('id', selectedIds)
            if (error) throw error
            addToast(`${selectedIds.length} kelas berhasil dihapus`, 'success'); await logAudit({ action: 'DELETE', source: 'SYSTEM', tableName: 'classes', newData: { bulk: true, count: selectedIds.length, ids: selectedIds } }); setSelectedIds([]); setIsBulkDeleteOpen(false); fetchData()
        } catch (err) { handleError(err, { context: 'Gagal menghapus kelas' }) }
        finally { setSubmitting(false) }
    }

    // ── Bulk Lock/Unlock ──
    const handleBulkLock = async () => {
        setSubmitting(true)
        try {
            const { error } = await supabase.from('classes').update({ is_locked: true }).in('id', selectedIds)
            if (error) throw error
            addToast(`${selectedIds.length} kelas dikunci`, 'success'); setSelectedIds([]); fetchData()
        } catch (err) { handleError(err, { context: 'Gagal mengunci kelas' }) }
        finally { setSubmitting(false) }
    }

    const handleBulkUnlock = async () => {
        setSubmitting(true)
        try {
            const { error } = await supabase.from('classes').update({ is_locked: false }).in('id', selectedIds)
            if (error) throw error
            addToast(`${selectedIds.length} kelas dibuka kuncinya`, 'success'); setSelectedIds([]); fetchData()
        } catch (err) { handleError(err, { context: 'Gagal membuka kunci kelas' }) }
        finally { setSubmitting(false) }
    }

    const toggleSelect = id => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    const toggleSelectAll = () => {
        const ids = paged.map(c => c.id)
        setSelectedIds(prev => ids.every(id => prev.includes(id)) ? prev.filter(id => !ids.includes(id)) : [...new Set([...prev, ...ids])])
    }
    const allSelected = paged.length > 0 && paged.every(c => selectedIds.includes(c.id))
    const someSelected = paged.length > 0 && paged.some(c => selectedIds.includes(c.id)) && !allSelected

    const selectedItems = useMemo(() =>
        selectedIds
            .map(id => {
                const item = classes.find(c => c.id === id)
                if (!item) return null
                return {
                    id: item.id,
                    label: item.name,
                    meta: `Lvl ${item.grade_level || '—'} · ${item.students || 0}/${item.capacity || '—'} Siswa`
                }
            })
            .filter(Boolean),
        [selectedIds, classes]
    )

    // ── Duplicate ──
    const handleDuplicate = async (cls) => {
        if (!cls || !canEdit) return
        setSubmitting(true)
        try {
            const { data, error } = await supabase.from('classes').insert({
                education_unit_id: cls.education_unit_id,
                academic_year: cls.academic_year,
                name: cls.name + ' (Salinan)',
                grade_level: cls.grade_level,
                homeroom_teacher_id: cls.homeroom_teacher_id,
                capacity: cls.capacity,
                is_active: cls.is_active,
            }).select().single()
            if (error) throw error
            addToast(`Kelas "${cls.name}" berhasil diduplikat`, 'success')
            await logAudit({ action: 'CREATE', source: 'SYSTEM', tableName: 'classes', recordId: data.id, oldData: null, newData: data })
            fetchData()
        } catch (err) { handleError(err, { context: 'Gagal menduplikat kelas' }) }
        finally { setSubmitting(false) }
    }

    // ── Quick Toggle Active ──
    const handleQuickToggleActive = useCallback(async (cls) => {
        if (!cls || !canEdit) return
        setSubmitting(true)
        try {
            const newActive = !cls.is_active
            const { error } = await supabase.from('classes').update({ is_active: newActive }).eq('id', cls.id)
            if (error) throw error
            addToast(`Kelas "${cls.name}" ${newActive ? 'diaktifkan' : 'dinonaktifkan'}`, 'success')
            await logAudit({ action: 'UPDATE', source: 'SYSTEM', tableName: 'classes', recordId: cls.id, oldData: cls, newData: { ...cls, is_active: newActive } })
            fetchData()
        } catch (err) { handleError(err, { context: 'Gagal mengubah status kelas' }) }
        finally { setSubmitting(false) }
    }, [canEdit, fetchData, addToast, handleError])

    // ── Archive (soft delete) ──
    const handleArchive = async (cls) => {
        if (!cls || !canEdit) return
        setSubmitting(true)
        try {
            const deletedAt = new Date().toISOString()
            const { error } = await supabase.from('classes').update({ deleted_at: deletedAt, deleted_by: profile?.id || null }).eq('id', cls.id)
            if (error) throw error
            setClasses(prev => prev.filter(c => c.id !== cls.id))
            addToast(`Kelas "${cls.name}" berhasil diarsipkan`, 'success')
            await logAudit({ action: 'UPDATE', source: 'SYSTEM', tableName: 'classes', recordId: cls.id, oldData: cls, newData: { ...cls, deleted_at: deletedAt, deleted_by: profile?.id } })
            fetchData()
        } catch (err) { handleError(err, { context: 'Gagal mengarsipkan kelas' }) }
        finally { setSubmitting(false) }
    }

    // ── Modal Visibility ──
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)

    return {
        // Core data
        classes, archivedClasses, setArchivedClasses, loading, loadingArchived, stats,
        fetchData, fetchArchived, handleRestore, handlePermanentDelete,
        teachersList, periodsList,
        submitting, isSaving: submitting, isDeleting: submitting, isMutating: submitting,
        canEdit, profile,

        // Filtering
        searchQuery, setSearchQuery, filterLevel, setFilterLevel,
        filterProgram, setFilterProgram, sortBy, setSortBy,
        filterNoTeacher, setFilterNoTeacher, filterCrowded, setFilterCrowded,
        isFilterOpen, setIsFilterOpen, activeFilterCount, hasActiveFilters, resetAllFilters,

        // Pagination
        page, setPage, jumpPage, setJumpPage, pageSize, setPageSize,
        totalRows, paged, filtered, sortedFiltered,

        // Selection
        selectedIds, setSelectedIds, selectedItems, toggleSelect, toggleSelectAll,
        allSelected, someSelected,

        // View Mode
        viewMode, setViewMode,

        // Pinned
        pinnedIds, togglePin,

        // Inline Edit
        inlineEditCell, setInlineEditCell, handleInlineSave, saveStatus, lastChange,

        // Undo/Redo
        undoStack, redoStack, handleUndo, handleRedo, pushUndo,

        // Columns
        visibleCols, setVisibleCols, columnOrder, setColumnOrder, isColMenuOpen, setIsColMenuOpen, colMenuPos, setColMenuPos,
        colMenuRef, colMenuPortalRef, moveColumnLeft, moveColumnRight,

        // UI
        isPrivacyMode, setIsPrivacyMode, togglePrivacyMode, maskValue,
        isShortcutOpen, setIsShortcutOpen, isHeaderMenuOpen, setIsHeaderMenuOpen,
        headerMenuBtnRef, shortcutBtnRef, headerMenuRect, setHeaderMenuRect,
        shortcutRect, setShortcutRect, headerMenuMounted, searchInputRef,

        // Action context
        selectedItem, setSelectedItem, itemToDelete, setItemToDelete,

        // Modal visibility
        isModalOpen, setIsModalOpen, isDeleteModalOpen, setIsDeleteModalOpen,
        isBulkDeleteOpen, setIsBulkDeleteOpen,

        // Handlers
        handleAdd, handleEdit, handleSubmit, handleDeleteConfirm, handleBulkDelete,
        handleBulkLock, handleBulkUnlock, handleDuplicate, handleArchive, handleQuickToggleActive,

        // Insights
        insights,

        // Helpers
        LEVELS, PROGRAMS,
        handleError,
    }
}
