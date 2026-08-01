import { useState, useCallback, useRef } from 'react'
import Papa from 'papaparse'
import { supabase } from '@lib/supabase'
import { logAudit } from '@utils/auditLogger'

const SYSTEM_COLS = [
    { key: 'name', label: 'Nama Kelas', synonyms: ['nama kelas', 'kelas', 'name', 'nama', 'class'] },
    { key: 'grade', label: 'Tingkat', synonyms: ['tingkat', 'grade', 'level'] },
    { key: 'program', label: 'Program', synonyms: ['program', 'major', 'boarding', 'reguler'] },
    { key: 'gender_type', label: 'Tipe Gender', synonyms: ['tipe gender', 'gender', 'putra', 'putri', 'l/p', 'jenis kelamin'] },
    { key: 'teacher', label: 'Wali Kelas', synonyms: ['wali kelas', 'wali', 'teacher', 'guru', 'nama guru'] },
    { key: 'year', label: 'Tahun Ajaran', synonyms: ['tahun ajaran', 'tahun', 'year', 'akademik', 'academic year'] },
]

const LEVELS = ['7', '8', '9', '10', '11', '12']
const PROGRAMS = ['Boarding', 'Reguler']

export const useClassesImportExport = ({
    classes, filtered, selectedIds, canEdit, fetchData,
    addToast, handleError,
    teachersList, periodsList,
    isImportModalOpen, setIsImportModalOpen,
    isExportModalOpen, setIsExportModalOpen,
}) => {
    // ── Import State ──
    const [importStep, setImportStep] = useState(1)
    const [importFileName, setImportFileName] = useState('')
    const [importRawData, setImportRawData] = useState([])
    const [importFileHeaders, setImportFileHeaders] = useState([])
    const [importColumnMapping, setImportColumnMapping] = useState({})
    const [importPreview, setImportPreview] = useState([])
    const [importIssues, setImportIssues] = useState([])
    const [importLoading, setImportLoading] = useState(false)
    const [importValidationOpen, setImportValidationOpen] = useState(true)
    const [importDragOver, setImportDragOver] = useState(false)
    const [importing, setImporting] = useState(false)
    const [importProgress, setImportProgress] = useState({ done: 0, total: 0 })
    const [importEditCell, setImportEditCell] = useState(null)
    const [importSkipDupes, setImportSkipDupes] = useState(true)

    // ── Export State ──
    const [exportScope, setExportScope] = useState('filtered')
    const [exportColumns, setExportColumns] = useState(['nama_kelas', 'tingkat', 'program', 'wali_kelas', 'tahun_ajaran', 'jumlah_siswa'])
    const [exporting, setExporting] = useState(false)

    const importFileInputRef = useRef(null)

    const hasImportBlockingErrors = importIssues.some(x => x.level === 'error')
    const importReadyRows = importPreview.filter(r => !r._hasError && !(importSkipDupes && r._isDupe))

    // ── Export Logic ──
    const ALL_EXPORT_COLUMNS = [
        { key: 'nama_kelas', label: 'Nama Kelas', fn: c => c.name || '-' },
        { key: 'tingkat', label: 'Tingkat / Grade', fn: c => c.grade || '-' },
        { key: 'program', label: 'Program / Major', fn: c => c.major || '-' },
        { key: 'wali_kelas', label: 'Wali Kelas', fn: c => c.teacherName || '-' },
        { key: 'tahun_ajaran', label: 'Tahun Ajaran', fn: c => c.periodName || '-' },
        { key: 'jumlah_siswa', label: 'Jumlah Siswa', fn: c => c.students || 0 },
    ]

    const loadMetadata = useCallback(async () => {
        if (!supabase) return { t: {}, y: {} }
        try {
            const [tRes, yRes] = await Promise.all([
                supabase.from('teachers').select('id, name').order('name'),
                supabase.from('periods').select('id, academic_year, semester').order('academic_year', { ascending: false })
            ])
            const tList = tRes.data || []
            const yList = (yRes.data || []).map(y => ({ ...y, label: [y.academic_year, y.semester].filter(Boolean).join(' ') || '—' }))
            return { t: Object.fromEntries(tList.map(t => [t.id, t.name || '—'])), y: Object.fromEntries(yList.map(y => [y.id, y.label])) }
        } catch { return { t: {}, y: {} } }
    }, [])

    const getExportData = useCallback(async () => {
        let q = supabase.from('classes').select('name, grade, major, homeroom_teacher_id, academic_year_id, students(count)').order('name')
        if (exportScope === 'filtered') {
            // Use current filtered data IDs
            q = q.in('id', filtered.map(c => c.id))
        } else if (exportScope === 'selected') {
            q = q.in('id', selectedIds)
        }
        const { data, error } = await q; if (error) throw error
        const { t: tMap, y: yMap } = await loadMetadata()

        return (data || []).map(c => {
            const enriched = {
                ...c,
                teacherName: c.homeroom_teacher_id ? (tMap[c.homeroom_teacher_id] || '-') : '-',
                periodName: c.academic_year_id ? (yMap[c.academic_year_id] || '-') : '-',
                students: c.students?.[0]?.count || 0
            }
            const row = {}
            exportColumns.forEach(key => {
                const col = ALL_EXPORT_COLUMNS.find(x => x.key === key)
                if (col) row[col.label] = col.fn(enriched)
            })
            return row
        })
    }, [exportScope, filtered, selectedIds, exportColumns, loadMetadata])

    const handleExportCSV = useCallback(async (filename, options = {}) => {
        setExporting(true)
        try {
            const rows = await getExportData(); if (!rows.length) return addToast('Tidak ada data', 'warning')
            const headers = Object.keys(rows[0])
            const csvContent = [
                ...(options.includeHeader !== false ? [headers.join(',')] : []),
                ...rows.map(r => headers.map(h => {
                    const v = String(r[h] ?? '').replace(/"/g, '""')
                    return `"${v}"`
                }).join(','))
            ].join('\n')
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.setAttribute('download', `${filename || 'export_kelas'}.csv`); link.click()
            addToast(`Export CSV berhasil (${rows.length} kelas)`, 'success')
            await logAudit({ action: 'EXPORT', source: 'MASTER', tableName: 'classes', newData: { format: 'csv', scope: exportScope, columns: exportColumns, count: rows.length } })
            setIsExportModalOpen(false)
        } catch (err) { handleError(err, { context: 'Gagal export CSV' }) }
        finally { setExporting(false) }
    }, [getExportData, addToast, exportScope, exportColumns, setIsExportModalOpen, handleError])

    const handleExportExcel = useCallback(async (filename) => {
        setExporting(true)
        try {
            const rows = await getExportData(); if (!rows.length) return addToast('Tidak ada data', 'warning')
            const XLSX = await import('xlsx')
            const ws = XLSX.utils.json_to_sheet(rows); ws['!cols'] = Object.keys(rows[0]).map(k => ({ wch: Math.max(k.length, 14) }))
            const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Data Kelas')
            XLSX.writeFile(wb, `${filename || 'export_kelas'}.xlsx`)
            addToast(`Export Excel berhasil (${rows.length} kelas)`, 'success')
            await logAudit({ action: 'EXPORT', source: 'MASTER', tableName: 'classes', newData: { format: 'xlsx', scope: exportScope, columns: exportColumns, count: rows.length } })
            setIsExportModalOpen(false)
        } catch (err) { handleError(err, { context: 'Gagal export Excel' }) }
        finally { setExporting(false) }
    }, [getExportData, addToast, exportScope, exportColumns, setIsExportModalOpen, handleError])

    const handleExportPDF = useCallback(async (filename, options = {}) => {
        setExporting(true)
        try {
            const [{ default: jsPDF }, autoTableMod] = await Promise.all([
                import('jspdf'),
                import('jspdf-autotable'),
            ])
            const autoTable = autoTableMod.default || autoTableMod
            const allRows = await getExportData()
            if (!allRows.length) return addToast('Tidak ada data untuk diekspor', 'warning')

            const doc = new jsPDF({ orientation: options.orientation || 'landscape' })
            doc.setFontSize(13)
            doc.text('Laporan Data Kelas', 14, 12)
            doc.setFontSize(8)
            doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}  |  Total: ${allRows.length} kelas  |  Scope: ${exportScope === 'filtered' ? 'Filter Aktif' : exportScope === 'selected' ? 'Dipilih' : 'Semua'}`, 14, 18)

            const headers = Object.keys(allRows[0])
            const rows = allRows.map(r => headers.map(h => String(r[h] ?? '')))

            autoTable(doc, {
                head: options.includeHeader !== false ? [headers] : [],
                body: rows,
                startY: 22,
                theme: 'grid',
                styles: { fontSize: 7.5, cellPadding: 2 },
                headStyles: { fillColor: [79, 70, 229], textColor: 255 },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: {
                    'Tingkat': { halign: 'center' },
                    'Program': { halign: 'center' },
                    'Tipe Gender': { halign: 'center' },
                    'Tahun Ajaran': { halign: 'center' }
                }
            })

            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(7);
                doc.setTextColor(150);
                const dateStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
                doc.text(`Dicetak otomatis oleh Koperasi SenyumMu pada ${dateStr}`, 14, doc.internal.pageSize.height - 8);
                doc.text(`Halaman ${i} dari ${pageCount}`, doc.internal.pageSize.width - 35, doc.internal.pageSize.height - 8);
            }

            doc.save(`${filename || 'export_kelas'}.pdf`)
            addToast(`Export PDF berhasil (${allRows.length} kelas)`, 'success')
            await logAudit({ action: 'EXPORT', source: 'MASTER', tableName: 'classes', newData: { format: 'pdf', scope: exportScope, columns: exportColumns, count: allRows.length } })
            setIsExportModalOpen(false)
        } catch (e) {
            console.error(e)
            addToast('Gagal export PDF', 'error')
        } finally {
            setExporting(false)
        }
    }, [getExportData, addToast, exportScope, exportColumns, setIsExportModalOpen])

    // ── Import Logic ──
    const handleDownloadTemplate = useCallback(async () => {
        const templateData = [
            { 'Nama Kelas': 'VII A', 'Tingkat': '7', 'Program': 'Reguler', 'Tipe Gender': 'Putra', 'Wali Kelas': '', 'Tahun Ajaran': '' },
            { 'Nama Kelas': 'VIII Boarding A', 'Tingkat': '8', 'Program': 'Boarding', 'Tipe Gender': 'Putri', 'Wali Kelas': '', 'Tahun Ajaran': '' },
        ]
        const XLSX = await import('xlsx')
        const ws = XLSX.utils.json_to_sheet(templateData)
        ws['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 25 }, { wch: 20 }]
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Template Import Kelas')
        XLSX.writeFile(wb, 'Template_Import_Kelas.xlsx')
    }, [])

    const processImportFile = useCallback(async file => {
        if (!file) return
        const ext = file.name.toLowerCase()
        if (!ext.endsWith('.csv') && !ext.endsWith('.xlsx')) { addToast('Format tidak didukung. Gunakan .csv atau .xlsx', 'error'); return }
        setImportFileName(file.name)
        setImportLoading(true)
        try {
            let rows = []
            if (ext.endsWith('.csv')) rows = await new Promise(res => Papa.parse(file, { header: true, skipEmptyLines: true, complete: r => res(r.data) }))
            else {
                const XLSX = await import('xlsx')
                rows = await new Promise(res => { const reader = new FileReader(); reader.onload = e => { const wb = XLSX.read(e.target.result, { type: 'array' }); res(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' })) }; reader.readAsArrayBuffer(file) })
            }

            if (!rows.length) { addToast('File kosong or tidak terbaca', 'error'); return }

            const headers = Object.keys(rows[0])
            setImportRawData(rows)
            setImportFileHeaders(headers)

            const mapping = {}
            const norm = (str) => (str || '').toLowerCase().replace(/[\s\xA0\n\r]+/g, ' ').trim()
            SYSTEM_COLS.forEach(sys => {
                const match = headers.find(h => {
                    const normH = norm(h)
                    const cleanH = norm(h.split(/[\(\[\{（\n\r]/)[0])
                    const normL = norm(sys.label)
                    const normK = norm(sys.key)
                    if (normH === normL || normH === normK || cleanH === normL || cleanH === normK) return true
                    if (sys.synonyms && sys.synonyms.some(syn => {
                        const s = norm(syn)
                        return normH === s || cleanH === s || cleanH.replace(/[^a-z0-9]/g, '') === s.replace(/[^a-z0-9]/g, '')
                    })) return true
                    return false
                })
                if (match) mapping[sys.key] = match
            })
            setImportColumnMapping(mapping)
            setImportStep(2)
        } catch (err) { handleError(err, { context: 'Gagal membaca file import' }) }
        finally { setImportLoading(false) }
    }, [addToast, handleError])

    const buildImportPreview = useCallback(async (raw, mapping) => {
        setImportLoading(true)
        try {
            const teacherByName = Object.fromEntries((teachersList || []).map(t => [t.name.toLowerCase().trim(), t.id]))
            const yearByLabel = Object.fromEntries((periodsList || []).map(y => [y.label.toLowerCase().trim(), y.id]))

            const preview = raw.map((row, i) => {
                const data = {}
                SYSTEM_COLS.forEach(sys => {
                    const fileCol = mapping[sys.key]
                    data[sys.key] = fileCol ? (row[fileCol] || '').toString().trim() : ''
                })

                let { name, grade, program, gender_type, teacher, year } = data
                grade = grade.toString()

                let homeroom_teacher_id = null
                if (teacher) homeroom_teacher_id = teacherByName[teacher.toLowerCase()] || null

                let academic_year_id = null
                if (year) academic_year_id = yearByLabel[year.toLowerCase()] || null

                let gType = gender_type.toUpperCase().trim()
                if (['L', 'LAKI-LAKI', 'LAKI LAKI', 'MALE', 'PUTRA'].includes(gType)) gType = 'Putra'
                else if (['P', 'PEREMPUAN', 'FEMALE', 'PUTRI'].includes(gType)) gType = 'Putri'
                else gType = gender_type

                const major = [program, gType].filter(Boolean).join(' ') || null

                return { ...data, _row: i, major, homeroom_teacher_id, academic_year_id }
            })

            const issues = []
            preview.forEach((row, i) => {
                const rowIssues = []
                if (!row.name) rowIssues.push('Nama Kelas tidak boleh kosong')
                if (!row.grade) rowIssues.push('Tingkat tidak boleh kosong')
                else if (!LEVELS.includes(row.grade)) rowIssues.push(`Tingkat "${row.grade}" tidak valid. (Gunakan: ${LEVELS.join(', ')})`)
                if (row.program && !PROGRAMS.includes(row.program)) rowIssues.push(`Program "${row.program}" tidak dikenali (Gunakan: Boarding/Reguler)`)
                if (row.teacher && !row.homeroom_teacher_id) rowIssues.push(`Wali Kelas "${row.teacher}" tidak ditemukan, akan dikosongkan`)
                if (row.year && !row.academic_year_id) rowIssues.push(`Tahun Ajaran "${row.year}" tidak ditemukan, akan dikosongkan`)

                if (row.name && preview.slice(0, i).some(p => p.name.toLowerCase() === row.name.toLowerCase())) {
                    rowIssues.push(`Nama Kelas "${row.name}" duplikat dalam file`)
                    row._isDupe = true
                }

                if (rowIssues.length) {
                    const isError = rowIssues.some(msg => msg.includes('tidak boleh kosong') || msg.includes('tidak valid'))
                    issues.push({ row: i + 2, level: row._isDupe ? 'dupe' : (isError ? 'error' : 'warn'), messages: rowIssues })
                    if (isError) row._hasError = true
                    else if (row._isDupe) row._hasError = false
                    else row._hasWarn = true
                }
            })

            setImportPreview(preview)
            setImportIssues(issues)
        } finally {
            setImportLoading(false)
        }
    }, [teachersList, periodsList])

    const handleImportCellEdit = useCallback((rowIdx, colKey, newValue) => {
        setImportPreview(prev => {
            const next = [...prev]
            next[rowIdx] = { ...next[rowIdx], [colKey]: newValue }
            const r = next[rowIdx]

            if (colKey === 'program' || colKey === 'gender_type') {
                let gType = (r.gender_type || '').toUpperCase().trim()
                if (['L', 'LAKI-LAKI', 'LAKI LAKI', 'MALE', 'PUTRA'].includes(gType)) gType = 'Putra'
                else if (['P', 'PEREMPUAN', 'FEMALE', 'PUTRI'].includes(gType)) gType = 'Putri'
                else gType = r.gender_type
                r.major = [r.program, gType].filter(Boolean).join(' ') || null
            }

            r._hasError = !r.name || !r.grade || !LEVELS.includes(r.grade)
            return next
        })
    }, [])

    const handleRemoveImportRow = useCallback(idx => {
        setImportPreview(prev => prev.filter((_, i) => i !== idx))
        setImportIssues(prev => prev.filter(iss => iss.row !== idx + 2).map(iss => iss.row > idx + 2 ? { ...iss, row: iss.row - 1 } : iss))
    }, [])

    const handleImportClick = useCallback(() => importFileInputRef.current?.click(), [])

    const handleCommitImport = useCallback(async () => {
        if (!importPreview.length) { addToast('Tidak ada data untuk diimport', 'error'); return }
        if (hasImportBlockingErrors) { addToast('Masih ada ERROR. Perbaiki file dulu.', 'error'); return }
        if (!importReadyRows.length) { addToast('Tidak ada baris valid untuk diimport', 'warning'); return }

        setImporting(true)
        setImportProgress({ done: 0, total: importReadyRows.length })

        try {
            const CHUNK = 50
            for (let i = 0; i < importReadyRows.length; i += CHUNK) {
                const chunk = importReadyRows.slice(i, i + CHUNK).map(r => ({
                    name: r.name,
                    grade: r.grade,
                    major: r.major || null,
                    homeroom_teacher_id: r.homeroom_teacher_id || null,
                    academic_year_id: r.academic_year_id || null,
                }))
                const { error } = await supabase.from('classes').insert(chunk)
                if (error) throw error
                setImportProgress({ done: Math.min(i + CHUNK, importReadyRows.length), total: importReadyRows.length })
            }

            addToast(`Berhasil import ${importReadyRows.length} kelas`, 'success')
            await logAudit({ action: 'INSERT', source: 'SYSTEM', tableName: 'classes', newData: { bulk_import: true, count: importReadyRows.length } })

            setIsImportModalOpen(false)
            setImportStep(1)
            setImportPreview([])
            setImportIssues([])
            setImportFileName('')
            setImportRawData([])
            setImportFileHeaders([])
            setImportColumnMapping({})
            fetchData()
        } catch (err) { handleError(err, { context: 'Gagal import (cek constraint DB)' }) }
        finally { setImporting(false) }
    }, [importPreview, hasImportBlockingErrors, importReadyRows, addToast, setIsImportModalOpen, fetchData, handleError])

    return {
        // Import state
        importStep, setImportStep,
        importFileName, setImportFileName,
        importRawData, setImportRawData,
        importFileHeaders, setImportFileHeaders,
        importColumnMapping, setImportColumnMapping,
        importPreview, setImportPreview,
        importIssues, setImportIssues,
        importLoading, setImportLoading,
        importValidationOpen, setImportValidationOpen,
        importDragOver, setImportDragOver,
        importing, setImporting,
        importProgress, setImportProgress,
        importEditCell, setImportEditCell,
        importSkipDupes, setImportSkipDupes,

        // Export state
        exportScope, setExportScope,
        exportColumns, setExportColumns,
        exporting, setExporting,

        // Computed
        importReadyRows,
        hasImportBlockingErrors,

        // Refs
        importFileInputRef,

        // Import actions
        handleImportClick, processImportFile,
        buildImportPreview, handleImportCellEdit, handleRemoveImportRow,
        handleDownloadTemplate, handleCommitImport,

        // Export actions
        getExportData, handleExportCSV, handleExportExcel, handleExportPDF,

        // Constants
        SYSTEM_COLS,
    }
}
