import { useState, useMemo, useRef, useCallback } from 'react'
import { supabase } from '@lib/supabase'

export function useImportWizard(config) {
    const {
        systemCols = [],
        validateRow,
        parseRow,
        mapRowForInsert,
        dbTable,
        addToast,
        onSuccess,
        editableColumnTypes = {},
    } = config

    // ── State ──
    const [importStep, setImportStep] = useState(1)
    const [importFileName, setImportFileName] = useState('')
    const [importRawData, setImportRawData] = useState([])
    const [importFileHeaders, setImportFileHeaders] = useState([])
    const [importColumnMapping, setImportColumnMapping] = useState({})
    const [importPreview, setImportPreview] = useState([])
    const [importIssues, setImportIssues] = useState([])
    const [importDuplicates, setImportDuplicates] = useState([])
    const [importing, setImporting] = useState(false)
    const [importProgress, setImportProgress] = useState({ done: 0, total: 0 })
    const [importLoading, setImportLoading] = useState(false)
    const [importDragOver, setImportDragOver] = useState(false)
    const [importValidationOpen, setImportValidationOpen] = useState(false)
    const [importEditCell, setImportEditCell] = useState(null)
    const [importSkipDupes, setImportSkipDupes] = useState(true)
    const importFileInputRef = useRef(null)

    // ── Helpers ──
    const sanitizeText = (s) => String(s ?? '').replace(/[<>]/g, '').trim()

    const pick = (obj, keys) => {
        for (const k of keys) {
            const v = obj?.[k]
            if (v !== undefined && v !== null && String(v).trim() !== '') return v
        }
        return ''
    }

    // ── Computed ──
    const importReadyRows = useMemo(() => {
        if (!importPreview.length) return []
        const errorSet = new Set(importIssues.filter(x => x.level === 'error').map(x => x.row - 2))
        const dupeSet = new Set(importDuplicates)
        return importPreview.filter((_, i) => {
            if (errorSet.has(i)) return false
            if (importSkipDupes && dupeSet.has(i)) return false
            return true
        })
    }, [importPreview, importIssues, importDuplicates, importSkipDupes])

    const hasImportBlockingErrors = useMemo(() =>
        importIssues.some(x => x.level === 'error'),
        [importIssues]
    )

    // ── File Parsing ──
    const parseCSVFile = async (file) => {
        const Papa = (await import('papaparse')).default
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => resolve(results.data || []),
                error: (err) => reject(err)
            })
        })
    }

    const parseExcelFile = async (file) => {
        const XLSX = await import('xlsx')
        const buf = await file.arrayBuffer()
        const wb = XLSX.read(buf, { type: 'array', cellDates: true })
        const firstSheet = wb.SheetNames[0]
        const ws = wb.Sheets[firstSheet]
        return XLSX.utils.sheet_to_json(ws, { defval: '' })
    }

    // ── Auto-mapping ──
    const autoMapColumns = useCallback((headers) => {
        const mapping = {}
        const norm = (str) => (str || '').toLowerCase().replace(/[\s\xA0\n\r]+/g, ' ').trim()
        systemCols.forEach(sys => {
            const match = headers.find(h => {
                const normH = norm(h)
                const cleanH = norm(h.split(/[\(\[\{（\n\r]/)[0])
                const normL = norm(sys.label)
                const normK = norm(sys.key)
                if (normH === normL || normH === normK || cleanH === normL || cleanH === normK) return true
                if (sys.synonyms?.some(syn => {
                    const s = norm(syn)
                    return normH === s || cleanH === s || cleanH.replace(/[^a-z0-9]/g, '') === s.replace(/[^a-z0-9]/g, '')
                })) return true
                return false
            })
            if (match) mapping[sys.key] = match
        })
        return mapping
    }, [systemCols])

    // ── Process File ──
    const processImportFile = useCallback(async (file) => {
        const ext = file.name.toLowerCase()
        if (!ext.endsWith('.csv') && !ext.endsWith('.xlsx')) {
            addToast?.('Format tidak didukung. Gunakan .csv atau .xlsx', 'error')
            return
        }
        setImportFileName(file.name)
        setImportPreview([])
        setImportIssues([])
        setImportDuplicates([])
        setImportLoading(true)
        try {
            const isXlsx = ext.endsWith('.xlsx') || (file.type || '').includes('sheet')
            const rows = isXlsx ? await parseExcelFile(file) : await parseCSVFile(file)
            if (!rows.length) {
                addToast?.('File kosong atau tidak terbaca', 'error')
                return
            }
            setImportRawData(rows)
            const headers = Object.keys(rows[0])
            setImportFileHeaders(headers)
            const mapping = autoMapColumns(headers)
            setImportColumnMapping(mapping)
            setImportStep(2)
        } catch {
            addToast?.('Gagal membaca file import', 'error')
        } finally {
            setImportLoading(false)
        }
    }, [addToast, autoMapColumns])

    // ── Build Preview ──
    const buildImportPreview = useCallback(async (mapping) => {
        const getVal = (row, sysKey) => {
            if (mapping?.[sysKey]) return sanitizeText(row[mapping[sysKey]])
            const colDef = systemCols.find(c => c.key === sysKey)
            return sanitizeText(pick(row, colDef?.synonyms || [sysKey]))
        }
        const preview = importRawData.map((r, idx) => {
            const parsed = parseRow ? parseRow(r, getVal, { systemCols }) : {}
            const issues = validateRow ? validateRow(parsed, idx, {}) : []
            const hasError = issues.some(i => i.level === 'error')
            const hasWarn = issues.some(i => i.level === 'warn')
            return { ...parsed, _isDupe: false, _hasError: hasError, _hasWarn: hasWarn }
        })
        setImportPreview(preview)
        runValidation(preview)
    }, [importRawData, systemCols, parseRow, validateRow])

    // ── Validation ──
    const runValidation = useCallback((preview) => {
        const issues = []
        const dupeIndices = []
        const seenNames = new Map()
        const validated = preview.map((r, idx) => {
            const rowIssues = []
            if (validateRow) {
                const customIssues = validateRow(r, idx, { importPreview: preview, isDuplicateCheck: true })
                rowIssues.push(...customIssues)
            }
            const lowerName = (r.name || r._name || '').toLowerCase().trim()
            if (lowerName) {
                if (seenNames.has(lowerName)) {
                    rowIssues.push({ level: 'dupe', message: `Duplikat dengan baris ${seenNames.get(lowerName) + 1}` })
                    dupeIndices.push(idx)
                } else {
                    seenNames.set(lowerName, idx)
                }
            }
            if (rowIssues.length) {
                issues.push({ row: idx + 2, level: rowIssues.some(x => x.level === 'error') ? 'error' : rowIssues.some(x => x.level === 'dupe') ? 'dupe' : 'warn', messages: rowIssues.map(x => x.message) })
            }
            return { ...r, _isDupe: dupeIndices.includes(idx), _hasError: rowIssues.some(x => x.level === 'error'), _hasWarn: rowIssues.some(x => x.level === 'warn') }
        })
        setImportPreview(validated)
        setImportIssues(issues)
        setImportDuplicates(dupeIndices)
        setImportValidationOpen(issues.length > 0)
    }, [validateRow])

    // ── Cell Edit ──
    const handleImportCellEdit = useCallback((index, key, value) => {
        setImportPreview(prev => {
            const newPrev = [...prev]
            newPrev[index] = { ...newPrev[index], [key]: value }
            runValidation(newPrev)
            return newPrev
        })
    }, [runValidation])

    // ── Remove Row ──
    const handleRemoveImportRow = useCallback((idx) => {
        setImportPreview(prev => {
            const next = prev.filter((_, i) => i !== idx)
            runValidation(next)
            return next
        })
        addToast?.('Baris dihapus dari preview', 'success')
    }, [runValidation, addToast])

    // ── Bulk Fix ──
    const handleBulkFix = useCallback((sysKey, value) => {
        setImportPreview(prev => {
            const newPrev = prev.map(r => ({ ...r, [sysKey]: value }))
            runValidation(newPrev)
            return newPrev
        })
        addToast?.('Semua baris berhasil diperbarui', 'success')
    }, [runValidation, addToast])

    // ── Commit ──
    const handleCommitImport = useCallback(async () => {
        if (!importPreview.length) {
            addToast?.('Tidak ada data untuk diimport', 'error')
            return
        }
        if (hasImportBlockingErrors) {
            addToast?.('Masih ada error. Perbaiki data dulu.', 'error')
            return
        }
        if (importReadyRows.length === 0) {
            addToast?.('Tidak ada data valid untuk diimport', 'warning')
            return
        }
        setImporting(true)
        setImportProgress({ done: 0, total: importReadyRows.length })
        const CHUNK = 50
        try {
            for (let i = 0; i < importReadyRows.length; i += CHUNK) {
                const chunk = importReadyRows.slice(i, i + CHUNK).map(r => {
                    const { _isDupe, _hasError, _hasWarn, _className, _waveName, _teacherName, _studentName, _roomName, _yearName, ...clean } = r
                    return mapRowForInsert ? mapRowForInsert(clean) : clean
                })
                const { error } = await supabase.from(dbTable).insert(chunk)
                if (error) throw error
                setImportProgress({ done: Math.min(i + CHUNK, importReadyRows.length), total: importReadyRows.length })
            }
            addToast?.(`Berhasil import ${importReadyRows.length} data`, 'success')
            resetWizard()
            onSuccess?.()
        } catch {
            addToast?.('Gagal import. Cek koneksi atau constraint database.', 'error')
        } finally {
            setImporting(false)
        }
    }, [importPreview, hasImportBlockingErrors, importReadyRows, addToast, dbTable, mapRowForInsert, onSuccess])

    // ── Download Template ──
    const handleDownloadTemplate = useCallback(async () => {
        if (!config.templateData) return
        const XLSX = await import('xlsx')
        const ws = XLSX.utils.json_to_sheet(config.templateData)
        if (config.templateColWidths) ws['!cols'] = config.templateColWidths
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, config.templateSheetName || 'Template')
        const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
        const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const link = document.createElement('a')
        const blobUrl = URL.createObjectURL(blob)
        link.href = blobUrl
        link.download = config.templateFileName || 'template.xlsx'
        link.click()
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
    }, [config])

    // ── Reset ──
    const resetWizard = useCallback(() => {
        setImportStep(1)
        setImportFileName('')
        setImportRawData([])
        setImportPreview([])
        setImportIssues([])
        setImportDuplicates([])
        setImportColumnMapping({})
        setImportFileHeaders([])
        setImportLoading(false)
        setImportDragOver(false)
        setImportEditCell(null)
        setImportSkipDupes(true)
        setImportValidationOpen(false)
    }, [])

    // ── Open/Close ──
    const handleImportClick = useCallback(() => {
        resetWizard()
    }, [resetWizard])

    return {
        importStep,
        setImportStep,
        importFileName,
        setImportFileName,
        importRawData,
        setImportRawData,
        importFileHeaders,
        setImportFileHeaders,
        importColumnMapping,
        setImportColumnMapping,
        importPreview,
        setImportPreview,
        importIssues,
        setImportIssues,
        importDuplicates,
        setImportDuplicates,
        importing,
        setImporting,
        importProgress,
        setImportProgress,
        importLoading,
        setImportLoading,
        importDragOver,
        setImportDragOver,
        importValidationOpen,
        setImportValidationOpen,
        importEditCell,
        setImportEditCell,
        importSkipDupes,
        setImportSkipDupes,
        importFileInputRef,
        importReadyRows,
        hasImportBlockingErrors,
        processImportFile,
        buildImportPreview,
        handleImportCellEdit,
        handleRemoveImportRow,
        handleBulkFix,
        handleCommitImport,
        handleDownloadTemplate,
        handleImportClick,
        resetWizard,
        editableColumnTypes,
    }
}
