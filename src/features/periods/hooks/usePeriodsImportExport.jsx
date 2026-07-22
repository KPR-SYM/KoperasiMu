import { useState, useMemo, useCallback, useRef } from "react";

import { supabase } from "@lib/supabase";
import { logAudit } from "@utils/auditLogger";

const LS_IMPORT_MAPPING = "periods_import_mapping";

export const SYSTEM_COLS = [
    { key: "academic_year", label: "Tahun Pelajaran (e.g. 2024/2025)" },
    { key: "semester", label: "Semester (Ganjil / Genap)" },
    { key: "start_date", label: "Tanggal Mulai (YYYY-MM-DD)" },
    { key: "end_date", label: "Tanggal Selesai (YYYY-MM-DD)" },
];

const DATE_FORMATS = [
    { regex: /^\d{4}-\d{2}-\d{2}$/, label: "YYYY-MM-DD", parts: (s) => ({ y: s.slice(0, 4), m: s.slice(5, 7), d: s.slice(8, 10) }) },
    { regex: /^\d{2}-\d{2}-\d{4}$/, label: "DD-MM-YYYY", parts: (s) => ({ d: s.slice(0, 2), m: s.slice(3, 5), y: s.slice(6, 10) }) },
    { regex: /^\d{2}\/\d{2}\/\d{4}$/, label: "DD/MM/YYYY", parts: (s) => ({ d: s.slice(0, 2), m: s.slice(3, 5), y: s.slice(6, 10) }) },
    { regex: /^\d{4}\/\d{2}\/\d{2}$/, label: "YYYY/MM/DD", parts: (s) => ({ y: s.slice(0, 4), m: s.slice(5, 7), d: s.slice(8, 10) }) },
    { regex: /^\d{2}\.\d{2}\.\d{4}$/, label: "DD.MM.YYYY", parts: (s) => ({ d: s.slice(0, 2), m: s.slice(3, 5), y: s.slice(6, 10) }) },
];

const CONFLICT_STRATEGIES = [
    { id: "skip", label: "Lewati Duplikat", desc: "Abaikan data yang sudah ada" },
    { id: "replace", label: "Timpa Data Lama", desc: "Update data yang sudah ada" },
    { id: "keep", label: "Biarkan Duplikat", desc: "Masukkan semua data apa adanya" },
];

function normalizeSemester(value) {
    const trimmed = String(value || "").trim();
    const map = { ganjil: "Ganjil", genap: "Genap" };
    return map[trimmed.toLowerCase()] || trimmed;
}

export function usePeriodsImportExport({
    years,
    filtered,
    selectedIds,
    canEdit,
    fetchData,
    addToast,
    handleError,
    isImportModalOpen,
    setIsImportModalOpen,
    isExportModalOpen,
    setIsExportModalOpen,
}) {
    const importFileInputRef = useRef(null);

    // ── DATE FORMAT DETECT ────────────────────────────────────────────────────
    const detectDateFormat = useCallback((rows) => {
        const dateCandidates = [];
        rows.forEach((r) => {
            Object.values(r).forEach((v) => {
                const s = String(v || "").trim();
                if (s.length >= 8 && /[\d-/\\.]/.test(s)) dateCandidates.push(s);
            });
        });
        const scores = DATE_FORMATS.map((fmt) => ({
            ...fmt,
            score: dateCandidates.filter((s) => fmt.regex.test(s)).length,
        }));
        const best = scores.sort((a, b) => b.score - a.score)[0];
        setImportDetectedDateFormat(best?.score > 0 ? best.label : null);
        return best?.score > 0 ? best : null;
    }, []);

    // ── IMPORT STATE ─────────────────────────────────────────────────────────
    const [importStep, setImportStep] = useState(1);
    const [importFileName, setImportFileName] = useState("");
    const [importRawData, setImportRawData] = useState([]);
    const [importFileHeaders, setImportFileHeaders] = useState([]);
    const [importColumnMapping, setImportColumnMapping] = useState({});
    const [importPreview, setImportPreview] = useState([]);
    const [importIssues, setImportIssues] = useState([]);
    const [importLoading, setImportLoading] = useState(false);
    const [importValidationOpen, setImportValidationOpen] = useState(true);
    const [importDragOver, setImportDragOver] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
    const [importEditCell, setImportEditCell] = useState(null);
    const [importSkipDupes, setImportSkipDupes] = useState(true);
    const [importConflictStrategy, setImportConflictStrategy] = useState("skip");
    const [importDetectedDateFormat, setImportDetectedDateFormat] = useState(null);
    const [importColumnAliases, setImportColumnAliases] = useState({});
    const [importAliasEditorOpen, setImportAliasEditorOpen] = useState(false);
    const [importDiffPreview, setImportDiffPreview] = useState([]);
    const [lastImportedIds, setLastImportedIds] = useState([]);

    // ── EXPORT STATE ─────────────────────────────────────────────────────────
    const [exportScope, setExportScope] = useState("filtered");
    const [exportColumns, setExportColumns] = useState([
        "academic_year",
        "semester",
        "start_date",
        "end_date",
        "is_active",
        "is_locked",
    ]);
    const [exporting, setExporting] = useState(false);

    // ── COMPUTED ─────────────────────────────────────────────────────────────
    const importReadyRows = useMemo(
        () => importPreview.filter((r) => !r._hasError),
        [importPreview],
    );
    const hasImportBlockingErrors = useMemo(
        () => importIssues.some((x) => x.level === "error"),
        [importIssues],
    );

    // ── IMPORT LOGIC ─────────────────────────────────────────────────────────
    const handleImportClick = useCallback(() => {
        if (!isImportModalOpen) {
            setImportFileName("");
            setImportRawData([]);
            setImportPreview([]);
            setImportIssues([]);
            setImportStep(1);
            setIsImportModalOpen(true);
        } else {
            importFileInputRef.current?.click();
        }
    }, [isImportModalOpen, setIsImportModalOpen]);

    const handleFileChange = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await processImportFile(file);
        e.target.value = "";
    }, []);

    const processImportFile = useCallback(async (file) => {
        if (!file) return;
        setImportFileName(file.name);
        setImportLoading(true);
        try {
            const data = await file.arrayBuffer();
            const XLSX = await import("xlsx");
            const wb = XLSX.read(data, { type: "array" });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const rawJson = XLSX.utils.sheet_to_json(ws, { header: 1 });

            if (!rawJson || rawJson.length < 2) {
                addToast("File kosong atau tidak memiliki baris data", "error");
                return;
            }

            const headers = (rawJson[0] || [])
                .map((h) => String(h || "").trim())
                .filter(Boolean);
            setImportFileHeaders(headers);

            const rows = rawJson
                .slice(1)
                .filter((r) => r.some((c) => c !== undefined && c !== null && c !== ""));
            setImportRawData(rows);

            // Auto detect date format from data
            detectDateFormat(rows);

            // Auto mapping
            const map = {};
            SYSTEM_COLS.forEach((sys) => {
                const best = headers.find(
                    (h) =>
                        h.toLowerCase().includes(sys.key.toLowerCase()) ||
                        sys.label.toLowerCase().includes(h.toLowerCase()),
                );
                if (best) map[sys.key] = best;
            });

            // Load saved mapping template
            try {
                const saved = JSON.parse(localStorage.getItem(LS_IMPORT_MAPPING) || "{}");
                if (Object.keys(saved).length > 0) {
                    Object.keys(saved).forEach((k) => {
                        if (headers.includes(saved[k])) map[k] = saved[k];
                    });
                }
            } catch (e) {
                console.warn("[usePeriodsImportExport] Failed to load import mapping template", e);
            }

            setImportColumnMapping(map);
            setImportStep(2);
        } catch (err) {
            handleError(err, { context: "Gagal membaca file Excel/CSV" });
        } finally {
            setImportLoading(false);
        }
    }, [addToast, handleError]);

    const buildImportPreview = useCallback(async (rawRows, mapping) => {
        // Save mapping template
        try {
            localStorage.setItem(LS_IMPORT_MAPPING, JSON.stringify(mapping));
        } catch (e) {
            console.warn("[usePeriodsImportExport] Failed to save import mapping template", e);
        }

        setImportLoading(true);
        try {
            // Resolve aliases: if file header doesn't match, check alias mapping
            const resolveHeader = (sysKey) => {
                const mapped = mapping[sysKey];
                if (mapped && importFileHeaders.includes(mapped)) return mapped;
                const alias = importColumnAliases[sysKey];
                if (alias && importFileHeaders.includes(alias)) {
                    mapping[sysKey] = alias;
                    return alias;
                }
                return mapped;
            };

            const nameCol = importFileHeaders.indexOf(resolveHeader("academic_year"));
            const semCol = importFileHeaders.indexOf(resolveHeader("semester"));
            const startCol = importFileHeaders.indexOf(resolveHeader("start_date"));
            const endCol = importFileHeaders.indexOf(resolveHeader("end_date"));

            const preview = rawRows.map((row, i) => {
                const data = {
                    academic_year: row[nameCol] !== undefined ? String(row[nameCol]).trim() : "",
                    semester: row[semCol] !== undefined ? normalizeSemester(row[semCol]) : "",
                    start_date: row[startCol] !== undefined ? String(row[startCol]).trim() : "",
                    end_date: row[endCol] !== undefined ? String(row[endCol]).trim() : "",
                };
                return { ...data, _row: i };
            });

            // Build diff preview: compare each new row against existing data
            const diffMap = [];
            preview.forEach((row) => {
                const existing = row.academic_year && row.semester
                    ? years.find(
                        (y) => y.academic_year === row.academic_year && y.semester === row.semester,
                    )
                    : null;
                diffMap.push({
                    academic_year: row.academic_year,
                    semester: row.semester,
                    existing: existing ? { start_date: existing.start_date, end_date: existing.end_date, is_active: existing.is_active } : null,
                    incoming: { start_date: row.start_date, end_date: row.end_date },
                    status: existing ? "update" : "new",
                });
            });
            setImportDiffPreview(diffMap);
            setImportAliasEditorOpen(false);

            // Validation
            const issues = [];
            preview.forEach((row, i) => {
                const rowIssues = [];
                if (!row.academic_year) rowIssues.push("Tahun Pelajaran tidak boleh kosong");
                if (!row.semester) rowIssues.push("Semester tidak boleh kosong");
                if (!row.start_date) rowIssues.push("Tanggal mulai tidak boleh kosong");
                if (!row.end_date) rowIssues.push("Tanggal selesai tidak boleh kosong");

                if (row.semester && !["Ganjil", "Genap"].includes(row.semester)) {
                    rowIssues.push("Semester harus Ganjil atau Genap");
                }

                if (
                    row.academic_year &&
                    row.semester &&
                    years.some(
                        (y) => y.academic_year === row.academic_year && y.semester === row.semester,
                    )
                ) {
                    if (importConflictStrategy === "skip") {
                        rowIssues.push(`Periode "${row.academic_year} (${row.semester})" sudah ada di database`);
                        row._isDupe = true;
                    }
                }
                if (importConflictStrategy === "replace") {
                    delete row._isDupe;
                }

                if (rowIssues.length) {
                    issues.push({ row: i + 2, level: "error", messages: rowIssues });
                    row._hasError = true;
                }
            });

            setImportPreview(preview);
            setImportIssues(issues);
        } finally {
            setImportLoading(false);
        }
    }, [importFileHeaders, years, importColumnAliases, importConflictStrategy]);

    const handleImportCellEdit = useCallback((rowIdx, colKey, newValue) => {
        setImportPreview((prev) => {
            const next = [...prev];
            next[rowIdx] = {
                ...next[rowIdx],
                [colKey]: colKey === "semester" ? normalizeSemester(newValue) : newValue,
            };

            const rowIssues = [];
            if (!next[rowIdx].academic_year) rowIssues.push("Tahun Pelajaran tidak boleh kosong");
            if (!next[rowIdx].semester) rowIssues.push("Semester tidak boleh kosong");
            if (!next[rowIdx].start_date) rowIssues.push("Tanggal mulai tidak boleh kosong");
            if (!next[rowIdx].end_date) rowIssues.push("Tanggal selesai tidak boleh kosong");

            if (next[rowIdx].semester && !["Ganjil", "Genap"].includes(next[rowIdx].semester)) {
                rowIssues.push("Semester harus Ganjil atau Genap");
            }

            next[rowIdx]._hasError = rowIssues.length > 0;

            setImportIssues((prevIssues) => {
                const newIssues = prevIssues.filter((iss) => iss.row !== rowIdx + 2);
                if (rowIssues.length) {
                    newIssues.push({ row: rowIdx + 2, level: "error", messages: rowIssues });
                }
                return newIssues.sort((a, b) => a.row - b.row);
            });

            return next;
        });
    }, []);

    const handleRemoveImportRow = useCallback((idx) => {
        setImportPreview((prev) => prev.filter((_, i) => i !== idx));
        setImportIssues((prev) =>
            prev
                .filter((iss) => iss.row !== idx + 2)
                .map((iss) => (iss.row > idx + 2 ? { ...iss, row: iss.row - 1 } : iss)),
        );
    }, []);

    const handleDownloadTemplate = useCallback(async () => {
        const XLSX = await import("xlsx");

        const rows = [
            ["KoperasiMu — Template Import Tahun Pelajaran"],
            [""],
            ["Petunjuk:"],
            ["1. Isi data mulai dari baris ke-10 (baris 1-9 adalah template, jangan dihapus)"],
            ["2. Format tanggal: YYYY-MM-DD (contoh: 2024-07-01)"],
            ["3. Semester hanya boleh: Ganjil atau Genap"],
            ["4. Kolom wajib diisi: Tahun Pelajaran, Semester, Tanggal Mulai, Tanggal Selesai"],
            [""],
            ["Tahun Pelajaran", "Semester", "Tanggal Mulai (YYYY-MM-DD)", "Tanggal Selesai (YYYY-MM-DD)"],
            ["2024/2025", "Ganjil", "2024-07-01", "2024-12-31"],
            ["2024/2025", "Genap", "2025-01-01", "2025-06-30"],
        ];

        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws["!cols"] = [{ wch: 22 }, { wch: 12 }, { wch: 28 }, { wch: 28 }];
        ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template Import");
        XLSX.writeFile(wb, "Template Import Periode — KoperasiMu.xlsx");
    }, []);

    const handleCommitImport = useCallback(async () => {
        if (!canEdit) {
            addToast("Mode read-only — import tidak diizinkan.", "warning");
            return;
        }
        if (!importPreview.length) {
            addToast("Tidak ada data untuk diimport", "error");
            return;
        }
        if (hasImportBlockingErrors && importConflictStrategy !== "keep") {
            addToast("Masih ada ERROR. Perbaiki file dulu atau gunakan strategi 'Biarkan Duplikat'.", "error");
            return;
        }

        const validRows = importPreview.filter((r) => !r._hasError);
        const skipDupes = importConflictStrategy === "skip";
        const replaceDupes = importConflictStrategy === "replace";
        const rowsToProcess = skipDupes ? validRows.filter((r) => !r._isDupe) : validRows;
        if (!rowsToProcess.length) {
            addToast("Tidak ada baris valid yang baru", "warning");
            return;
        }

        setImporting(true);
        setImportProgress({ done: 0, total: rowsToProcess.length });
        let insertedCount = 0;
        const allInsertedIds = [];
        try {
            const CHUNK = 50;
            for (let i = 0; i < rowsToProcess.length; i += CHUNK) {
                const chunk = rowsToProcess.slice(i, i + CHUNK).map((r) => ({
                    academic_year: r.academic_year,
                    semester: normalizeSemester(r.semester),
                    start_date: r.start_date,
                    end_date: r.end_date,
                    is_active: false,
                }));
                if (replaceDupes) {
                    for (const row of chunk) {
                        const { data: existing } = await supabase
                            .from("periods")
                            .select("id")
                            .eq("academic_year", row.academic_year)
                            .eq("semester", row.semester)
                            .maybeSingle();
                        if (existing) {
                            const { error } = await supabase
                                .from("periods")
                                .update(row)
                                .eq("id", existing.id);
                            if (error) throw error;
                            allInsertedIds.push(existing.id);
                        } else {
                            const { data: inserted, error } = await supabase
                                .from("periods").insert(row).select("id");
                            if (error) throw error;
                            if (inserted) allInsertedIds.push(...inserted.map(r => r.id));
                        }
                        insertedCount++;
                        setImportProgress({ done: insertedCount, total: rowsToProcess.length });
                    }
                } else {
                    const { data: inserted, error } = await supabase.from("periods").insert(chunk).select("id");
                    if (error) throw error;
                    if (inserted) allInsertedIds.push(...inserted.map(r => r.id));
                    insertedCount += chunk.length;
                    setImportProgress({
                        done: Math.min(i + CHUNK, rowsToProcess.length),
                        total: rowsToProcess.length,
                    });
                }
            }
            setLastImportedIds(allInsertedIds);
            addToast(`Berhasil import ${rowsToProcess.length} periode`, "success");
            try {
                await logAudit({
                    action: "INSERT", source: "MASTER", tableName: "periods",
                    newData: { bulk_import: true, count: validRows.length, ids: allInsertedIds, data: validRows },
                });
            } catch (e) {
                console.warn("[usePeriodsImportExport] logAudit skip:", e.message);
            }
            setImportPreview([]);
            setImportIssues([]);
            setImportFileName("");
            setImportStep(1);
            fetchData();
        } catch (err) {
            const msg = insertedCount > 0
                ? `Gagal import: ${insertedCount} dari ${validRows.length} baris berhasil masuk. Error: ${err.message}`
                : "Gagal import (cek constraint DB / duplikat)";
            handleError(err, { context: msg });
        } finally {
            setImporting(false);
        }
    }, [canEdit, importPreview, importSkipDupes, hasImportBlockingErrors, fetchData, addToast, handleError]);

    const handleUndoImport = useCallback(async () => {
        if (!lastImportedIds.length) return;
        try {
            const { error } = await supabase.from("periods").delete().in("id", lastImportedIds);
            if (error) throw error;
            addToast(`Berhasil membatalkan ${lastImportedIds.length} periode yang diimport`, "success");
            try {
                await logAudit({
                    action: "DELETE", source: "MASTER", tableName: "periods",
                    newData: { undo_import: true, count: lastImportedIds.length, ids: lastImportedIds },
                });
            } catch (e) {
                console.warn("[usePeriodsImportExport] logAudit skip:", e.message);
            }
            setLastImportedIds([]);
            setIsImportModalOpen(false);
            fetchData();
        } catch (err) {
            handleError(err, { context: "Gagal membatalkan import" });
        }
    }, [lastImportedIds, fetchData, addToast, handleError, setIsImportModalOpen]);

    // ── EXPORT LOGIC ─────────────────────────────────────────────────────────
    const getExportData = useCallback(() => {
        let sourceData = [];
        if (exportScope === "filtered") {
            sourceData = filtered;
        } else if (exportScope === "selected" && selectedIds.length > 0) {
            sourceData = years.filter((y) => selectedIds.includes(y.id));
        } else {
            sourceData = years;
        }

        return sourceData.map((y) => {
            const row = {};
            exportColumns.forEach((colKey) => {
                if (colKey === "academic_year") row["Tahun Pelajaran"] = y.academic_year;
                if (colKey === "semester") row["Semester"] = y.semester;
                if (colKey === "start_date") row["Mulai"] = y.start_date;
                if (colKey === "end_date") row["Selesai"] = y.end_date;
                if (colKey === "is_active") row["Status Aktif"] = y.is_active ? "Aktif" : "Nonaktif";
                if (colKey === "is_locked") row["Status Kunci"] = y.is_locked ? "Terkunci" : "Terbuka";
            });
            return row;
        });
    }, [exportScope, filtered, selectedIds, years, exportColumns]);

    const handleExportCSV = useCallback(async (filename, options = {}) => {
        setExporting(true);
        try {
            const rows = getExportData();
            if (!rows.length) return addToast("Tidak ada data untuk diekspor", "warning");

            const headers = Object.keys(rows[0]);
            const csvContent = [
                ...(options.includeHeader !== false ? [headers.join(",")] : []),
                ...rows.map((r) =>
                    headers.map((h) => {
                        const v = String(r[h] ?? "").replace(/"/g, '""');
                        return `"${v}"`;
                    }).join(","),
                ),
            ].join("\n");

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `${filename || "export_tahun_pelajaran"}.csv`;
            a.click();

            try {
                await logAudit({
                    action: "EXPORT", source: "MASTER", tableName: "periods",
                    newData: { format: "csv", scope: exportScope, columns: exportColumns, count: rows.length },
                });
            } catch (e) {
                console.warn("[usePeriodsImportExport] logAudit skip:", e.message);
            }

            addToast(`Export CSV berhasil (${rows.length} periode)`, "success");
        } catch (err) {
            handleError(err, { context: "Gagal export CSV" });
        } finally {
            setExporting(false);
        }
    }, [getExportData, exportScope, exportColumns, addToast, handleError]);

    const handleExportExcel = useCallback(async (filename, options = {}) => {
        setExporting(true);
        try {
            const rows = getExportData();
            if (!rows.length) return addToast("Tidak ada data untuk diekspor", "warning");
            const XLSX = await import("xlsx");
            const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: options.includeHeader === false });
            ws["!cols"] = Object.keys(rows[0]).map((k) => ({ wch: Math.max(k.length, 18) }));
            ws["!pageSetup"] = { orientation: options.orientation || "landscape" };
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Data Periode");
            XLSX.writeFile(wb, `${filename || "export_tahun_pelajaran"}.xlsx`);

            try {
                await logAudit({
                    action: "EXPORT", source: "MASTER", tableName: "periods",
                    newData: { format: "xlsx", scope: exportScope, columns: exportColumns, count: rows.length },
                });
            } catch (e) {
                console.warn("[usePeriodsImportExport] logAudit skip:", e.message);
            }

            addToast(`Export Excel berhasil (${rows.length} periode)`, "success");
        } catch (err) {
            handleError(err, { context: "Gagal export Excel" });
        } finally {
            setExporting(false);
        }
    }, [getExportData, exportScope, exportColumns, addToast, handleError]);

    const handleExportPDF = useCallback(async (filename, options = {}) => {
        setExporting(true);
        try {
            const { buildPrintHTML, openPrintWindow } = await import("@shared/utils/printTemplate");
            const allRows = getExportData();
            if (!allRows.length) return addToast("Tidak ada data untuk diekspor", "warning");

            const scopeLabel = exportScope === "filtered" ? "Filter Aktif" : exportScope === "selected" ? "Dipilih" : "Semua";
            const tableHeaders = Object.keys(allRows[0]);
            const template = options.template || "ringkas";

            let tableRowsHTML;
            if (template === "kartu") {
                tableRowsHTML = allRows.map((row, i) => {
                    const fields = tableHeaders.map((h) => `<div class="kartu-row"><span class="kartu-lbl">${h}</span><span class="kartu-val">${row[h] ?? ''}</span></div>`).join('');
                    return `<div class="kartu-wrap"><div class="kartu"><div class="kartu-head"><span class="kartu-num">${i + 1}</span> ${row[tableHeaders[0]] || `Record ${i + 1}`}</div><div class="kartu-body">${fields}</div></div></div>`;
                }).join('');
                tableHeaders.length = 0;
            } else if (template === "lengkap") {
                const regCols = tableHeaders.filter(h => h.includes("Pendaftaran") || h.includes("Daftar"));
                tableRowsHTML = allRows.map((row, i) => {
                    const cells = tableHeaders.map((h, ci) => {
                        const isReg = h.includes("Pendaftaran") || h.includes("Daftar");
                        const style = ci === 0 ? 'text-align:center;color:#aaa;font-size:10px' : isReg ? 'font-size:10px;color:#6366f1' : '';
                        return `<td style="${style}">${row[h] ?? ''}</td>`;
                    }).join('');
                    return `<tr>${cells}</tr>`;
                }).join('');
            } else {
                tableRowsHTML = allRows.map((row, i) => {
                    const cells = tableHeaders.map((h, ci) => `<td${ci === 0 ? ' style="text-align:center;color:#aaa;font-size:10px"' : ''}>${row[h] ?? ''}</td>`).join('');
                    return `<tr>${cells}</tr>`;
                }).join('');
            }

            const activeCount = allRows.filter(r => r["Status Aktif"] === "Aktif").length;
            const lockedCount = allRows.filter(r => r["Status Kunci"] === "Terkunci").length;

            const html = buildPrintHTML({
                docBadge: "LAPORAN",
                title: "Data Tahun Pelajaran",
                subtitle: `Dicetak pada ${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })} — Scope: ${scopeLabel} — Template: ${template}`,
                totalCount: allRows.length,
                totalLabel: "Total Periode",
                stats: [
                    { label: "Total Periode", value: allRows.length, type: "total" },
                    { label: "Periode Aktif", value: activeCount, type: "prestasi" },
                    { label: "Terkunci", value: lockedCount, type: "pelanggaran" },
                    { label: "Tidak Aktif", value: allRows.length - activeCount, type: "avg" },
                ],
                infoStrip: [
                    { label: "Scope", value: scopeLabel },
                    { label: "Kolom", value: tableHeaders.join(", ") },
                    { label: "Template", value: template },
                ],
                showLetterhead: options.includeHeader !== false,
                tableHeaders,
                tableRowsHTML,
                showSignature: false,
                paperSize: options.orientation === "portrait" ? "A4 portrait" : "A4 landscape",
                footerAppTitle: "KoperasiSenyumMu",
                footerAppSubtitle: "Data Tahun Pelajaran",
            });

            const opened = openPrintWindow(html);
            if (!opened) addToast("Popup diblokir browser — izinkan popup untuk cetak PDF", "warning");

            try {
                await logAudit({
                    action: "EXPORT", source: "MASTER", tableName: "periods",
                    newData: { format: "pdf", scope: exportScope, columns: exportColumns, count: allRows.length, template },
                });
            } catch (e) {
                console.warn("[usePeriodsImportExport] logAudit skip:", e.message);
            }

            addToast(`Export PDF berhasil (${allRows.length} periode) — gunakan "Save as PDF" di dialog cetak`, "success");
        } catch (err) {
            handleError(err, { context: "Gagal export PDF" });
        } finally {
            setExporting(false);
        }
    }, [getExportData, exportScope, exportColumns, addToast, handleError]);

    const handleExportICS = useCallback(async (filename, options = {}) => {
        setExporting(true);
        try {
            const rows = getExportData();
            if (!rows.length) return addToast("Tidak ada data untuk diekspor", "warning");
            const icsLines = [
                "BEGIN:VCALENDAR",
                "VERSION:2.0",
                "PRODID:-//KoperasiMu//Periods//EN",
                "CALSCALE:GREGORIAN",
                "METHOD:PUBLISH",
            ];
            for (const row of rows) {
                const ds = (row["Mulai"] || "").replace(/-/g, "");
                const de = (row["Selesai"] || "").replace(/-/g, "");
                if (!ds || !de) continue;
                const yearKey = row["Tahun Pelajaran"] || "";
                const semKey = row["Semester"] || "";
                const uid = `period-${yearKey.replace("/", "")}-${semKey.toLowerCase()}@koperasimu`;
                icsLines.push("BEGIN:VEVENT");
                icsLines.push(`DTSTART;VALUE=DATE:${ds}`);
                icsLines.push(`DTEND;VALUE=DATE:${de}`);
                icsLines.push(`UID:${uid}`);
                icsLines.push(`SUMMARY:${yearKey} ${semKey}`);
                icsLines.push("END:VEVENT");
            }
            icsLines.push("END:VCALENDAR");
            const blob = new Blob([icsLines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${filename || "periods"}.ics`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            try {
                await logAudit({
                    action: "EXPORT", source: "MASTER", tableName: "periods",
                    newData: { format: "ics", count: rows.length, scope: exportScope },
                });
            } catch (e) { console.warn("[usePeriodsImportExport] logAudit skip:", e.message); }
            addToast(`Export iCal berhasil (${rows.length} periode)`, "success");
        } catch (err) {
            handleError(err, { context: "Gagal export iCal" });
        } finally {
            setExporting(false);
        }
    }, [getExportData, exportScope, addToast, handleError]);

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
        lastImportedIds, setLastImportedIds,
        importConflictStrategy, setImportConflictStrategy,
        importDetectedDateFormat, setImportDetectedDateFormat,
        importColumnAliases, setImportColumnAliases,
        importAliasEditorOpen, setImportAliasEditorOpen,
        importDiffPreview, setImportDiffPreview,

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
        handleImportClick,
        handleFileChange,
        processImportFile,
        buildImportPreview,
        handleImportCellEdit,
        handleRemoveImportRow,
        handleDownloadTemplate,
        handleCommitImport,
        handleUndoImport,
        detectDateFormat,

        // Export actions
        getExportData,
        handleExportCSV,
        handleExportExcel,
        handleExportPDF,
        handleExportICS,
    };
}
