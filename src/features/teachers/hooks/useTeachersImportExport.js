import { useState, useCallback, useMemo, useRef } from 'react'
import Papa from 'papaparse'
import { supabase } from '@lib/supabase'
import { logAudit } from '@utils/auditLogger'
import { STATUS_CONFIG, TYPE_LABELS } from '@features/teachers/constants/teacherConstants'
import { useErrorHandler } from '@hooks'

const SYSTEM_COLS = [
    { key: 'name', label: 'Nama Lengkap', synonyms: ['nama', 'name', 'nama lengkap', 'nama guru', 'guru'] },
    { key: 'subject', label: 'Mata Pelajaran', synonyms: ['mapel', 'mata pelajaran', 'subject', 'bidang studi'] },
    { key: 'gender', label: 'Jenis Kelamin', synonyms: ['gender', 'jk', 'jenis kelamin', 'kelamin', 'sex', 'l/p', 'jenis kelamin (l/p)'] },
    { key: 'phone', label: 'No. WhatsApp', synonyms: ['wa', 'no. hp/wa', 'phone', 'whatsapp', 'no hp', 'no telp'] },
    { key: 'status', label: 'Status', synonyms: ['status', 'aktif', 'status aktif', 'status (active/inactive/cuti)'] },
    { key: 'type', label: 'Jenis Pegawai', synonyms: ['jenis', 'type', 'jenis pegawai', 'tipe', 'peran', 'jenis pegawai (guru/karyawan)'] },
]

    const ALL_EXPORT_COLUMNS = [
    { key: 'nama', label: 'Nama', fn: t => t.full_name || t.name || '' },
    { key: 'subject', label: 'Mata Pelajaran', fn: t => t.subject || '' },
    { key: 'gender', label: 'Gender', fn: t => t.gender === 'L' ? 'Laki-laki' : t.gender === 'P' ? 'Perempuan' : '-' },
    { key: 'phone', label: 'No. HP/WA', fn: t => t.phone || '' },
    { key: 'status', label: 'Status', fn: t => t.is_active ? 'Aktif' : t.status === 'cuti' ? 'Cuti' : 'Non-Aktif' },
    { key: 'join_date', label: 'Tgl Bergabung', fn: t => t.created_at || t.join_date || '' },
    { key: 'type', label: 'Jenis Pegawai', fn: t => { const types = Array.isArray(t.type) ? t.type : t.type ? [t.type] : []; return types.map(tp => tp === 'karyawan' ? 'Karyawan' : tp === 'guru' ? 'Guru' : TYPE_LABELS[tp] || tp).join(', ') || 'Guru' } }
]

export function useTeachersImportExport({
    selectedIds,
    filterStatus,
    filterGender,
    filterSubject,
    filterType,
    fetchData,
    fetchStats,
    addToast,
    setIsImportModalOpen,
    setIsExportModalOpen
}) {
    const { handleError } = useErrorHandler('TeachersImportExport')
    const importFileInputRef = useRef(null)
    // import
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

    // export
    const [exportScope, setExportScope] = useState('filtered')
    const [exportColumns, setExportColumns] = useState(['nama', 'subject', 'gender', 'phone', 'status', 'join_date'])
    const [exporting, setExporting] = useState(false)

    // ── import processing ─────────────────────────────────────────────────────
    const handleImportClick = useCallback(() => importFileInputRef.current?.click(), [])

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

            if (!rows.length) { addToast('File kosong atau tidak terbaca', 'error'); return }

            const headers = Object.keys(rows[0])
            setImportRawData(rows)
            setImportFileHeaders(headers)

            // Auto-mapping
            const mapping = {}
            SYSTEM_COLS.forEach(sys => {
                const match = headers.find(h => {
                    const lowH = h.toLowerCase().trim()
                    const cleanH = h.split('(')[0].toLowerCase().trim().replace(/\s+/g, ' ')
                    const lowL = sys.label.toLowerCase().trim()
                    const lowK = sys.key.toLowerCase().trim()

                    if (lowH === lowL || lowH === lowK || cleanH === lowL || cleanH === lowK) return true
                    if (sys.synonyms && sys.synonyms.some(syn => {
                        const s = syn.toLowerCase().trim()
                        return lowH === s || cleanH === s || cleanH.replace(/[^a-z0-9]/g, '') === s.replace(/[^a-z0-9]/g, '')
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
            const preview = raw.map((row, i) => {
                const data = {}
                SYSTEM_COLS.forEach(sys => {
                    const fileCol = mapping[sys.key]
                    data[sys.key] = fileCol ? (row[fileCol] || '').toString().trim() : ''
                })

                // Normalization
                if (data.gender) {
                    const g = data.gender.toUpperCase().trim()
                    data.gender = ['L', 'LAKI-LAKI', 'LAKI LAKI', 'MALE', 'PUTRA'].includes(g) ? 'L' : ['P', 'PEREMPUAN', 'FEMALE', 'PUTRI'].includes(g) ? 'P' : ''
                }
                if (data.status) {
                    const s = data.status.toLowerCase().trim()
                    data.status = ['active', 'aktif'].includes(s) ? 'active' : ['inactive', 'nonaktif'].includes(s) ? 'inactive' : ['leave', 'cuti'].includes(s) ? 'cuti' : 'active'
                }
                if (data.type) {
                    const t = data.type.toLowerCase().trim()
                    data.type = ['karyawan', 'staf', 'staff', 'non-guru', 'kary'].includes(t) ? 'karyawan' : 'guru'
                }
                if (data.phone) {
                    data.phone = data.phone.toString().replace(/[\s-]/g, '')
                    if (data.phone.startsWith('62')) data.phone = '0' + data.phone.slice(2)
                }
                if (data.subject) {
                    data.subject = data.subject.replace(/^-\s*/, '').trim()
                }

                return { ...data, _row: i }
            })

            // Validation
            const issues = []
            preview.forEach((row, i) => {
                const rowIssues = []
                if (!row.name) rowIssues.push('Nama tidak boleh kosong')

                if (rowIssues.length) {
                    issues.push({ row: i + 2, level: 'error', messages: rowIssues })
                    row._hasError = true
                }
            })

            setImportPreview(preview)
            setImportIssues(issues)
        } finally {
            setImportLoading(false)
        }
    }, [])

    const handleImportCellEdit = useCallback((rowIdx, colKey, newValue) => {
        setImportPreview(prev => {
            const next = [...prev]
            next[rowIdx] = { ...next[rowIdx], [colKey]: newValue }

            // Re-validate row
            const rowIssues = []
            if (!next[rowIdx].name) rowIssues.push('Nama tidak boleh kosong')

            next[rowIdx]._hasError = rowIssues.length > 0

            // Re-build all issues
            setImportIssues(prevIssues => {
                const newIssues = prevIssues.filter(iss => iss.row !== rowIdx + 2)
                if (rowIssues.length) {
                    newIssues.push({ row: rowIdx + 2, level: 'error', messages: rowIssues })
                }
                return newIssues.sort((a, b) => a.row - b.row)
            })

            return next
        })
    }, [])

    const handleRemoveImportRow = useCallback(idx => {
        setImportPreview(prev => prev.filter((_, i) => i !== idx))
        setImportIssues(prev => prev.filter(iss => iss.row !== idx + 2).map(iss => iss.row > idx + 2 ? { ...iss, row: iss.row - 1 } : iss))
    }, [])

    const handleBulkFix = useCallback((colKey, value) => {
        setImportPreview(prev => prev.map(r => ({ ...r, [colKey]: value, _hasError: colKey === 'name' ? !value : r._hasError })))
        if (colKey === 'name' && value) setImportIssues(prev => prev.filter(iss => !iss.messages.includes('Nama tidak boleh kosong')))
        addToast(`Berhasil merubah semua baris ke ${value}`, 'success')
    }, [addToast])

    const handleDownloadTemplate = useCallback(async () => {
        const headers = [
            'Nama Lengkap', 'Mata Pelajaran', 'Jenis Kelamin', 'No. WhatsApp',
            'Status', 'Jenis Pegawai'
        ]
        const data = [
            [
                'Ahmad Fauzi, S.Pd', 'Bahasa Indonesia', 'L', '081234567890',
                'active', 'guru'
            ],
            [
                'Siti Aminah, M.Pd', 'Matematika', 'P', '089876543210',
                'active', 'guru'
            ],
            [
                'Budi Hartono', '', 'L', '085678901234',
                'active', 'karyawan'
            ]
        ]
        const XLSX = await import('xlsx')
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data])

        // Auto column width (perfectly padded like in Student template!)
        ws['!cols'] = [
            { wch: 25 }, // Nama Lengkap
            { wch: 20 }, // Mata Pelajaran
            { wch: 15 }, // Jenis Kelamin (L/P)
            { wch: 18 }, // No. WhatsApp
            { wch: 12 }, // Status (active)
            { wch: 15 }, // Jenis Pegawai (guru/karyawan)
        ]

        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Template Import Guru')
        XLSX.writeFile(wb, 'Template Import Guru.xlsx')
    }, [])

    const importReadyRows = useMemo(() => importPreview.filter(r => !r._hasError), [importPreview])
    const hasImportBlockingErrors = useMemo(() => importIssues.some(x => x.level === 'error'), [importIssues])

    const handleCommitImport = useCallback(async () => {
        if (!importPreview.length) { addToast('Tidak ada data untuk diimport', 'error'); return }
        if (hasImportBlockingErrors) { addToast('Masih ada ERROR. Perbaiki file dulu.', 'error'); return }

        const validRows = importPreview.filter(r => !r._hasError)

        if (!validRows.length) { addToast('Tidak ada baris valid', 'warning'); return }
        setImporting(true)
        setImportProgress({ done: 0, total: validRows.length })
        try {
            const CHUNK = 50
            for (let i = 0; i < validRows.length; i += CHUNK) {
                const chunk = validRows.slice(i, i + CHUNK).map(r => ({
                    full_name: r.name,
                    subject: r.subject || null,
                    gender: r.gender || null,
                    phone: r.phone || null,
                    is_active: r.status === 'active',
                    type: r.type ? [r.type] : ['guru'],
                }))
                const { error } = await supabase.from('teachers').insert(chunk)
                if (error) throw error
                setImportProgress({ done: Math.min(i + CHUNK, validRows.length), total: validRows.length })
            }
            addToast(`Berhasil import ${validRows.length} guru`, 'success')
            await logAudit({ action: 'INSERT', source: 'OPERATIONAL', tableName: 'teachers', newData: { bulk_import: true, count: validRows.length, data: validRows } })
            setIsImportModalOpen(false)
            setImportPreview([])
            setImportIssues([])
            setImportFileName('')
            setImportStep(1)
            fetchData()
            fetchStats()
        } catch (err) { handleError(err, { context: 'Gagal import (cek constraint DB / duplikat)' }) }
        finally { setImporting(false) }
    }, [importPreview, hasImportBlockingErrors, fetchData, fetchStats, addToast, setIsImportModalOpen, handleError])

    // ── export data ───────────────────────────────────────────────────────────
    const getExportData = useCallback(async () => {
        let q = supabase.from('teachers').select('full_name,subject,gender,phone,is_active,type,is_pinned,created_at').is('deleted_at', null)

        if (exportScope === 'selected' && selectedIds.length > 0) {
            q = q.in('id', selectedIds)
        } else if (exportScope === 'filtered') {
            if (filterStatus) q = q.eq('is_active', filterStatus === 'active')
            if (filterGender) q = q.eq('gender', filterGender)
            if (filterSubject) q = q.eq('subject', filterSubject)
            if (filterType) q = q.contains('type', [filterType])
        }

        q = q.order('full_name')
        const { data, error } = await q
        if (error) throw error

        return (data || []).map(t => {
            const row = {}
            exportColumns.forEach(key => {
                const col = ALL_EXPORT_COLUMNS.find(c => c.key === key)
                if (col) row[col.label] = col.fn(t)
            })
            return row
        })
    }, [exportScope, selectedIds, filterStatus, filterGender, filterSubject, filterType, exportColumns])

    const handleExportCSV = useCallback(async (filename, options = {}) => {
        setExporting(true)
        try {
            const rows = await getExportData()
            if (!rows.length) return addToast('Tidak ada data', 'warning')

            const headers = Object.keys(rows[0])
            const csvContent = [
                ...(options.includeHeader !== false ? [headers.join(',')] : []),
                ...rows.map(r => headers.map(h => {
                    const v = String(r[h] ?? '').replace(/"/g, '""')
                    return `"${v}"`
                }).join(','))
            ].join('\n')

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `${filename || 'export_guru'}.csv`
            a.click()

            await logAudit({
                action: 'EXPORT',
                source: 'OPERATIONAL',
                tableName: 'teachers',
                newData: {
                    format: 'csv',
                    scope: exportScope,
                    columns: exportColumns,
                    count: rows.length
                }
            })

            addToast(`Export CSV berhasil (${rows.length} guru)`, 'success')
            setIsExportModalOpen(false)
        } catch (err) { handleError(err, { context: 'Gagal export CSV' }) }
        finally { setExporting(false) }
    }, [getExportData, exportScope, exportColumns, addToast, setIsExportModalOpen, handleError])

    const handleExportExcel = useCallback(async (filename) => {
        setExporting(true)
        try {
            const rows = await getExportData()
            if (!rows.length) return addToast('Tidak ada data', 'warning')
            const XLSX = await import('xlsx')
            const ws = XLSX.utils.json_to_sheet(rows)
            ws['!cols'] = Object.keys(rows[0]).map(k => ({ wch: Math.max(k.length, 14) }))
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Data Guru')
            XLSX.writeFile(wb, `${filename || 'export_guru'}.xlsx`)

            await logAudit({
                action: 'EXPORT',
                source: 'OPERATIONAL',
                tableName: 'teachers',
                newData: {
                    format: 'xlsx',
                    scope: exportScope,
                    columns: exportColumns,
                    count: rows.length
                }
            })

            addToast(`Export Excel berhasil (${rows.length} guru)`, 'success')
            setIsExportModalOpen(false)
        } catch (err) { handleError(err, { context: 'Gagal export Excel' }) }
        finally { setExporting(false) }
    }, [getExportData, exportScope, exportColumns, addToast, setIsExportModalOpen, handleError])

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
            doc.text('Laporan Data Guru', 14, 12)
            doc.setFontSize(8)
            doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}  |  Total: ${allRows.length} guru  |  Scope: ${exportScope === 'filtered' ? 'Filter Aktif' : exportScope === 'selected' ? 'Dipilih' : 'Semua'}`, 14, 18)

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
                    'Gender': { halign: 'center' },
                    'Status': { halign: 'center' },
                    'Tgl Bergabung': { halign: 'center' },
                    'No. HP/WA': { halign: 'center' },
                }
            })

            // Add enterprise footer with pagination and metadata
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(7);
                doc.setTextColor(150);
                const dateStr = new Date().toLocaleString('id-ID', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                });
                doc.text(`Dicetak otomatis oleh Koperasi SenyumMu pada ${dateStr}`, 14, doc.internal.pageSize.height - 8);
                doc.text(`Halaman ${i} dari ${pageCount}`, doc.internal.pageSize.width - 35, doc.internal.pageSize.height - 8);
            }

            doc.save(`${filename || 'export_guru'}.pdf`)
            addToast(`Export PDF berhasil (${allRows.length} guru)`, 'success')

            await logAudit({
                action: 'EXPORT',
                source: 'OPERATIONAL',
                tableName: 'teachers',
                newData: {
                    format: 'pdf',
                    scope: exportScope,
                    columns: exportColumns,
                    count: allRows.length
                }
            })
            setIsExportModalOpen(false)
        } catch (e) {
            console.error(e)
            addToast('Gagal export PDF', 'error')
        } finally {
            setExporting(false)
        }
    }, [getExportData, exportScope, exportColumns, addToast, setIsExportModalOpen])

    return {
        importStep, setImportStep, importFileName, setImportFileName, importRawData, setImportRawData,
        importFileHeaders, setImportFileHeaders, importColumnMapping, setImportColumnMapping,
        importPreview, setImportPreview, importIssues, setImportIssues, importLoading, setImportLoading,
        importValidationOpen, setImportValidationOpen, importDragOver, setImportDragOver, importing, setImporting,
        importProgress, setImportProgress, importEditCell, setImportEditCell, importSkipDupes, setImportSkipDupes,
        exportScope, setExportScope, exportColumns, setExportColumns, exporting, setExporting,
        importReadyRows, hasImportBlockingErrors, SYSTEM_COLS, ALL_EXPORT_COLUMNS,
        importFileInputRef, handleImportClick,
        processImportFile, buildImportPreview, handleImportCellEdit, handleRemoveImportRow,
        handleBulkFix, handleDownloadTemplate, handleCommitImport, getExportData,
        handleExportCSV, handleExportExcel, handleExportPDF
    }
}
