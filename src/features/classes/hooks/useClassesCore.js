import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { supabase } from '@lib/supabase'
import { logAudit } from '@utils/auditLogger'
import { useAuth } from '@context/Auth'
import { useFlag } from '@context/FeatureFlags'
import { useErrorHandler } from '@hooks'

const LEVELS = ['7', '8', '9', '10', '11', '12']
const PROGRAMS = ['Boarding', 'Reguler']
const LS_FILTERS = 'classes_filters'
const LS_COLS = 'classes_columns'
const LS_PAGE_SIZE = 'classes_page_size'

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
    const [filterLevel, setFilterLevel] = useState('')
    const [filterProgram, setFilterProgram] = useState('')
    const [sortBy, setSortBy] = useState('name')
    const [filterNoTeacher, setFilterNoTeacher] = useState(false)
    const [filterCrowded, setFilterCrowded] = useState(false)
    const [isFilterOpen, setIsFilterOpen] = useState(false)

    // ── Pagination ──
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(() => {
        try { return Number(localStorage.getItem(LS_PAGE_SIZE)) || 10 } catch { return 10 }
    })
    const [jumpPage, setJumpPage] = useState('')

    // ── Selection ──
    const [selectedIds, setSelectedIds] = useState([])

    // ── UI ──
    const [isPrivacyMode, setIsPrivacyMode] = useState(false)
    const [isShortcutOpen, setIsShortcutOpen] = useState(false)
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false)
    const searchInputRef = useRef(null)
    const headerMenuBtnRef = useRef(null)
    const shortcutBtnRef = useRef(null)
    const [headerMenuRect, setHeaderMenuRect] = useState(null)
    const [shortcutRect, setShortcutRect] = useState(null)
    const [headerMenuMounted, setHeaderMenuMounted] = useState(false)

    // ── Columns ──
    const defaultCols = { level: true, program: true, gender: true, teacher: true, students: true, year: true }
    const [visibleCols, setVisibleCols] = useState(() => {
        try { return JSON.parse(localStorage.getItem(LS_COLS)) || defaultCols }
        catch { return defaultCols }
    })

    // ── Action Context ──
    const [selectedItem, setSelectedItem] = useState(null)
    const [itemToDelete, setItemToDelete] = useState(null)

    // ── Persist ──
    useEffect(() => {
        try { const f = JSON.parse(localStorage.getItem(LS_FILTERS) || '{}'); if (f.filterLevel) setFilterLevel(f.filterLevel); if (f.filterProgram) setFilterProgram(f.filterProgram); if (f.sortBy) setSortBy(f.sortBy); if (f.filterNoTeacher !== undefined) setFilterNoTeacher(f.filterNoTeacher); if (f.filterCrowded !== undefined) setFilterCrowded(f.filterCrowded) } catch { }
        try { const c = JSON.parse(localStorage.getItem(LS_COLS) || '{}'); if (Object.keys(c).length) setVisibleCols(c) } catch { }
    }, [])
    useEffect(() => { try { localStorage.setItem(LS_FILTERS, JSON.stringify({ filterLevel, filterProgram, sortBy, filterNoTeacher, filterCrowded })) } catch { } }, [filterLevel, filterProgram, sortBy, filterNoTeacher, filterCrowded])
    useEffect(() => { try { localStorage.setItem(LS_COLS, JSON.stringify(visibleCols)) } catch { } }, [visibleCols])
    useEffect(() => { try { localStorage.setItem(LS_PAGE_SIZE, pageSize) } catch { } }, [pageSize])

    // Reset page on search/filter change
    useEffect(() => { setPage(1) }, [searchQuery, filterLevel, filterProgram, sortBy, filterNoTeacher, filterCrowded])

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

    // ── Computed ──
    const activeFilterCount = (filterLevel ? 1 : 0) + (filterProgram ? 1 : 0) + (filterNoTeacher ? 1 : 0) + (filterCrowded ? 1 : 0)
    const hasActiveFilters = !!(searchQuery || activeFilterCount)
    const resetAllFilters = () => { setSearchQuery(''); setFilterLevel(''); setFilterProgram(''); setFilterNoTeacher(false); setFilterCrowded(false); setPage(1) }

    const togglePrivacyMode = useCallback(() => setIsPrivacyMode(v => !v), [])

    const maskValue = useCallback((str, vis = 4) => {
        if (!str) return '—'
        if (str.length <= vis) return str[0] + '*'.repeat(str.length - 1)
        return str.substring(0, vis) + '***'
    }, [])

    // ── Data Fetching ──
    const loadMetadata = useCallback(async () => {
        if (!supabase) return { t: {}, y: {} }
        try {
            const [tRes, yRes] = await Promise.all([
                supabase.from('teachers').select('id, name').order('name'),
                supabase.from('periods').select('id, academic_year, semester').order('academic_year', { ascending: false })
            ])
            const tList = tRes.data || []
            const yList = (yRes.data || []).map(y => ({ ...y, label: [y.academic_year, y.semester].filter(Boolean).join(' ') || '—' }))
            setTeachersList(tList); setAcademicYearsList(yList)
            return { t: Object.fromEntries(tList.map(t => [t.id, t.name || '—'])), y: Object.fromEntries(yList.map(y => [y.academic_year, y.label])) }
        } catch { return { t: {}, y: {} } }
    }, [])

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const { t: tMap, y: yMap } = await loadMetadata()
            let q = supabase.from('classes').select('id, name, grade_level, homeroom_teacher_id, academic_year, capacity, is_active, created_at, students(count)').order('name')
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
            const { data, error } = await supabase.from('classes').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
            if (error) throw error
            setArchivedClasses(data || [])
        } catch {
            setArchivedClasses([])
        } finally {
            setLoadingArchived(false)
        }
    }, [])

    const handleRestore = async (id) => {
        try {
            const { error } = await supabase.from('classes').update({ deleted_at: null }).eq('id', id)
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
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

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
        const payload = { name: formData.name, grade_level: parseInt(formData.level) || null, homeroom_teacher_id: formData.homeroom_teacher_id || null, academic_year: formData.academic_year || null }
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

    const toggleSelect = id => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    const toggleSelectAll = () => {
        const ids = paged.map(c => c.id)
        setSelectedIds(prev => ids.every(id => prev.includes(id)) ? prev.filter(id => !ids.includes(id)) : [...new Set([...prev, ...ids])])
    }
    const allSelected = paged.length > 0 && paged.every(c => selectedIds.includes(c.id))
    const someSelected = paged.length > 0 && paged.some(c => selectedIds.includes(c.id)) && !allSelected

    const selectedItems = useMemo(() => selectedIds.map(id => classes.find(c => c.id === id)).filter(Boolean), [selectedIds, classes])

    // ── Modal Visibility (forwarded from useClassesModals) ──
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
        totalRows, paged, filtered,

        // Selection
        selectedIds, setSelectedIds, selectedItems, toggleSelect, toggleSelectAll,
        allSelected, someSelected,

        // Columns
        visibleCols, setVisibleCols,

        // UI
        isPrivacyMode, setIsPrivacyMode, togglePrivacyMode, maskValue,
        isShortcutOpen, setIsShortcutOpen, isHeaderMenuOpen, setIsHeaderMenuOpen,
        headerMenuBtnRef, shortcutBtnRef, headerMenuRect, setHeaderMenuRect,
        shortcutRect, setShortcutRect, headerMenuMounted, searchInputRef,

        // Action context
        selectedItem, setSelectedItem, itemToDelete, setItemToDelete,

        // Modal visibility (managed here, forwarded)
        isModalOpen, setIsModalOpen, isDeleteModalOpen, setIsDeleteModalOpen,
        isBulkDeleteOpen, setIsBulkDeleteOpen,

        // Handlers
        handleAdd, handleEdit, handleSubmit, handleDeleteConfirm, handleBulkDelete,

        // Insights
        insights,

        // Helpers
        LEVELS, PROGRAMS,
        handleError,
    }
}
