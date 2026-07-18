import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { supabase } from "@lib/supabase";
import { logAudit } from "@utils/auditLogger";
import { useAuth } from "@context/Auth";
import { useFlag } from "@context/FeatureFlags";
import { useErrorHandler } from "@hooks";
import { findOverlappingPeriod } from "@features/periods/utils/periodValidation";

const LS_COLS = "periods_columns";
const LS_PAGE_SIZE = "periods_page_size";
const LS_COL_ORDER = "periods_column_order";

function normalizeSemester(value) {
    const trimmed = String(value || "").trim();
    const map = { ganjil: "Ganjil", genap: "Genap" };
    return map[trimmed.toLowerCase()] || trimmed;
}

function generateNextAcademicYears(latestYear) {
    const match = latestYear.match(/(\d{4})\/(\d{4})/);
    if (!match) return null;
    const nextStart = parseInt(match[1]) + 1;
    const nextEnd = parseInt(match[2]) + 1;
    const nextYear = `${nextStart}/${nextEnd}`;
    return {
        ganjil: { academic_year: nextYear, semester: "Ganjil" },
        genap: { academic_year: nextYear, semester: "Genap" },
    };
}

export function usePeriodsCore({ addToast, addUndoToast }) {
    const { handleError } = useErrorHandler("PeriodsCore");
    const { enabled: canEdit } = useFlag("access.teacher_academic");
    const { enabled: moduleEnabled } = useFlag("module.periods");
    const { profile } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    // ── URL Sync: Initialize state from URL ──────────────────────────────────
    const initSearchQuery = searchParams.get("q") || "";
    const initFilterSemester = searchParams.get("semester") || "";
    const initFilterStatus = searchParams.get("status") || "";
    const initFilterLock = searchParams.get("lock") || "";
    const initFilterTimeStatus = searchParams.get("timeStatus") || "";
    const initSortBy = searchParams.get("sort") || "name_desc";
    const initPage = parseInt(searchParams.get("page")) || 1;
    const initPageSize = parseInt(searchParams.get("pageSize")) || 10;

    // ── CORE DATA STATE ──────────────────────────────────────────────────────
    const [years, setYears] = useState([]);
    const [archivedYears, setArchivedYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [stats, setStats] = useState({ total: 0, active: 0, ganjil: 0, genap: 0 });

    // ── FILTERING & SEARCH ───────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState(initSearchQuery);
    const [filterSemester, setFilterSemester] = useState(initFilterSemester);
    const [filterStatus, setFilterStatus] = useState(initFilterStatus);
    const [filterLock, setFilterLock] = useState(initFilterLock);
    const [filterTimeStatus, setFilterTimeStatus] = useState(initFilterTimeStatus);
    const [sortBy, setSortBy] = useState(initSortBy);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // ── PAGINATION ───────────────────────────────────────────────────────────
    const [page, setPage] = useState(initPage);
    const [jumpPage, setJumpPage] = useState("");
    const [pageSize, setPageSize] = useState(initPageSize);

    // ── SELECTION ────────────────────────────────────────────────────────────
    const [selectedIds, setSelectedIds] = useState([]);

    // ── COLUMNS ──────────────────────────────────────────────────────────────
    const defaultCols = {
        period: true,
        semester: true,
        duration: true,
        registration: false,
        status: true,
    };
    const [visibleCols, setVisibleCols] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(LS_COLS)) || defaultCols;
        } catch {
            return defaultCols;
        }
    });
    const defaultColOrder = ["period", "semester", "duration", "registration", "status"];
    const [columnOrder, setColumnOrder] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(LS_COL_ORDER)) || defaultColOrder;
        } catch {
            return defaultColOrder;
        }
    });
    useEffect(() => { localStorage.setItem(LS_COL_ORDER, JSON.stringify(columnOrder)); }, [columnOrder]);

    const moveColumnLeft = useCallback((key) => {
        setColumnOrder(prev => {
            const idx = prev.indexOf(key);
            if (idx <= 0) return prev;
            const next = [...prev];
            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
            return next;
        });
    }, []);

    const moveColumnRight = useCallback((key) => {
        setColumnOrder(prev => {
            const idx = prev.indexOf(key);
            if (idx === -1 || idx >= prev.length - 1) return prev;
            const next = [...prev];
            [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
            return next;
        });
    }, []);

    const [isColMenuOpen, setIsColMenuOpen] = useState(false);
    const [colMenuPos, setColMenuPos] = useState({ top: 0, right: 0, showUp: false });
    const colMenuRef = useRef(null);
    const colMenuPortalRef = useRef(null);

    // ── UI STATE ─────────────────────────────────────────────────────────────
    const [isPrivacyMode, setIsPrivacyMode] = useState(false);
    const [isShortcutOpen, setIsShortcutOpen] = useState(false);
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
    const headerMenuBtnRef = useRef(null);
    const shortcutBtnRef = useRef(null);
    const [headerMenuRect, setHeaderMenuRect] = useState(null);
    const [shortcutRect, setShortcutRect] = useState(null);
    const [headerMenuMounted, setHeaderMenuMounted] = useState(false);
    const searchInputRef = useRef(null);
    const tableRef = useRef(null);

    const [viewMode, setViewMode] = useState(() => {
        try {
            return localStorage.getItem("periods_view_mode") || "table";
        } catch {
            return "table";
        }
    });

    // ── ACTION CONTEXT ───────────────────────────────────────────────────────
    const [selectedItem, setSelectedItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [readOnlyDetailItem, setReadOnlyDetailItem] = useState(null);
    const [historyItem, setHistoryItem] = useState(null);

    // ── MODAL VISIBILITY ─────────────────────────────────────────────────────
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isArchivedOpen, setIsArchivedOpen] = useState(false);
    const [loadingArchived, setLoadingArchived] = useState(false);
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
    const [isReadOnlyDetailOpen, setIsReadOnlyDetailOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isGenerateConfirmOpen, setIsGenerateConfirmOpen] = useState(false);

    // ── INLINE EDIT ──────────────────────────────────────────────────────────
    const [inlineEditCell, setInlineEditCell] = useState(null);
    const [saveStatus, setSaveStatus] = useState("idle");
    const [lastChange, setLastChange] = useState(null);

    // ── URL SYNC ─────────────────────────────────────────────────────────────
    const syncUrl = useCallback(() => {
        const params = new URLSearchParams();
        if (searchQuery) params.set("q", searchQuery);
        if (filterSemester) params.set("semester", filterSemester);
        if (filterStatus) params.set("status", filterStatus);
        if (filterLock) params.set("lock", filterLock);
        if (filterTimeStatus) params.set("timeStatus", filterTimeStatus);
        if (sortBy !== "name_desc") params.set("sort", sortBy);
        if (page !== 1) params.set("page", page.toString());
        if (pageSize !== 10) params.set("pageSize", pageSize.toString());
        setSearchParams(params, { replace: true });
    }, [searchQuery, filterSemester, filterStatus, filterLock, filterTimeStatus, sortBy, page, pageSize, setSearchParams]);

    useEffect(() => { syncUrl(); }, [syncUrl]);

    // Reset page to 1 when any filter/search/sort changes
    const filtersChangedRef = useRef(false);
    useEffect(() => {
        if (!filtersChangedRef.current) {
            filtersChangedRef.current = true;
            return;
        }
        setPage(1);
    }, [searchQuery, filterSemester, filterStatus, filterLock, filterTimeStatus, sortBy]);

    // ── PERSISTENCE ──────────────────────────────────────────────────────────
    useEffect(() => { localStorage.setItem(LS_COLS, JSON.stringify(visibleCols)); }, [visibleCols]);
    useEffect(() => { localStorage.setItem(LS_PAGE_SIZE, pageSize); }, [pageSize]);
    useEffect(() => { localStorage.setItem("periods_view_mode", viewMode); }, [viewMode]);

    // ── PRIVACY MODE ─────────────────────────────────────────────────────────
    const maskValue = useCallback((value, type) => {
        if (!isPrivacyMode) return value;
        switch (type) {
            case "year": return "????/????";
            case "semester": return "***";
            case "id": return "ID: ****";
            default: return "****";
        }
    }, [isPrivacyMode]);

    const togglePrivacyMode = useCallback(() => setIsPrivacyMode(p => !p), []);

    // ── HELPER: Time Status ──────────────────────────────────────────────────
    const getTimeStatus = useCallback((start, end) => {
        if (!start || !end) return null;
        const now = new Date();
        const s = new Date(start);
        const e = new Date(end);
        if (now < s) return { label: "Akan Datang", cls: "bg-blue-500/10 text-blue-600 border-blue-500/20" };
        if (now > e) return { label: "Sudah Selesai", cls: "bg-gray-500/10 text-gray-500 border-gray-500/20" };
        return { label: "Sedang Berjalan", cls: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
    }, []);

    // ── HELPER: Formatting ───────────────────────────────────────────────────
    const formatDate = useCallback((d) =>
        d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"
    , []);

    const getDuration = useCallback((s, e) => {
        if (!s || !e) return "-";
        const diff = Math.ceil(Math.abs(new Date(e) - new Date(s)) / (1000 * 60 * 60 * 24 * 30));
        return `${diff} Bulan`;
    }, []);

    // ── FETCH DATA ───────────────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("periods")
                .select("id,academic_year,semester,start_date,end_date,registration_start,registration_end,is_active,created_at,is_locked,locked_at,locked_by,deleted_at")
                .is("deleted_at", null)
                .order("academic_year", { ascending: false });
            if (error) throw error;
            const rows = data || [];
            setYears(rows);
            setStats({
                total: rows.length,
                active: rows.filter((y) => y.is_active).length,
                ganjil: rows.filter((y) => y.semester.toLowerCase() === "ganjil").length,
                genap: rows.filter((y) => y.semester.toLowerCase() === "genap").length,
            });
        } catch (err) {
            console.error("[PeriodsCore] fetchData error:", err);
            addToast("Gagal memuat data tahun pelajaran", "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    const fetchArchived = useCallback(async () => {
        if (!supabase) return;
        setLoadingArchived(true);
        try {
            const { data } = await supabase
                .from("periods")
                .select("id,academic_year,semester,start_date,end_date,is_active,created_at,updated_at,is_locked,deleted_at")
                .not("deleted_at", "is", null)
                .order("deleted_at", { ascending: false });
            setArchivedYears(data || []);
        } catch (err) {
            console.warn("[PeriodsCore] fetchArchived failed:", err);
            addToast("Gagal memuat data arsip", "error");
        } finally {
            setLoadingArchived(false);
        }
    }, [addToast]);

    const fetchDataOnce = useRef(false);
    useEffect(() => {
        if (fetchDataOnce.current) return;
        fetchDataOnce.current = true;
        fetchData();
    }, [fetchData]);

    // ── CLOSE ON OUTSIDE CLICK (col menu) ────────────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (!isColMenuOpen) return;
            const inBtn = colMenuRef.current?.contains(e.target);
            const inMenu = colMenuPortalRef.current?.contains(e.target);
            if (!inBtn && !inMenu) setIsColMenuOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [isColMenuOpen]);

    // ── DEFERRED UNMOUNT (header menu portal exit animation) ─────────────────
    useEffect(() => {
        if (isHeaderMenuOpen) {
            setHeaderMenuMounted(true);
        } else {
            const t = setTimeout(() => setHeaderMenuMounted(false), 200);
            return () => clearTimeout(t);
        }
    }, [isHeaderMenuOpen]);

    // ── STICKY POSITIONING (portaled dropdowns) ──────────────────────────────
    useEffect(() => {
        if (!isHeaderMenuOpen && !isShortcutOpen) return;
        const update = () => {
            if (isHeaderMenuOpen && headerMenuBtnRef.current)
                setHeaderMenuRect(headerMenuBtnRef.current.getBoundingClientRect());
            if (isShortcutOpen && shortcutBtnRef.current)
                setShortcutRect(shortcutBtnRef.current.getBoundingClientRect());
        };
        update();
        window.addEventListener("scroll", update, true);
        window.addEventListener("resize", update);
        return () => {
            window.removeEventListener("scroll", update, true);
            window.removeEventListener("resize", update);
        };
    }, [isHeaderMenuOpen, isShortcutOpen]);

    // ── CRUD HANDLERS ────────────────────────────────────────────────────────
    const handleAdd = useCallback(() => {
        let nextSuggested = null;
        if (years.length > 0) {
            const latest = [...years].sort((a, b) => {
                if (a.academic_year !== b.academic_year) return b.academic_year.localeCompare(a.academic_year);
                return b.semester === "Genap" ? 1 : -1;
            })[0];

            if (latest.semester === "Ganjil") {
                const genapStart = latest.end_date
                    ? new Date(new Date(latest.end_date).getTime() + 86400000).toISOString().split("T")[0]
                    : `${parseInt(latest.academic_year.split("/")[1])}-01-01`;
                nextSuggested = {
                    id: undefined,
                    academic_year: latest.academic_year,
                    semester: "Genap",
                    is_active: false,
                    start_date: genapStart,
                    end_date: `${parseInt(latest.academic_year.split("/")[1])}-06-30`,
                };
            } else {
                const match = latest.academic_year.match(/(\d{4})\/(\d{4})/);
                if (match) {
                    const nextStart = parseInt(match[1]) + 1;
                    const nextEnd = parseInt(match[2]) + 1;
                    nextSuggested = {
                        id: undefined,
                        academic_year: `${nextStart}/${nextEnd}`,
                        semester: "Ganjil",
                        is_active: false,
                        start_date: `${nextStart}-07-01`,
                        end_date: `${nextStart}-12-31`,
                    };
                }
            }
        }
        setSelectedItem(nextSuggested);
        setIsModalOpen(true);
    }, [years]);

    const handleEdit = useCallback((item) => {
        if (item?.is_locked) {
            addToast("Periode terkunci — buka kunci terlebih dahulu untuk mengedit.", "warning");
            return;
        }
        setSelectedItem(item);
        setIsModalOpen(true);
    }, [addToast]);

    const handleDuplicate = useCallback((item) => {
        setSelectedItem({
            ...item,
            id: undefined,
            academic_year: `${item.academic_year} (Salinan)`,
        });
        setIsModalOpen(true);
    }, []);

    const handleOpenReadOnlyDetail = useCallback((item) => {
        setReadOnlyDetailItem(item);
        setIsReadOnlyDetailOpen(true);
    }, []);

    const handleOpenHistory = useCallback((item) => {
        setHistoryItem(item);
        setIsHistoryOpen(true);
    }, []);

    const handleSubmit = useCallback(async (formData, setFormErrors) => {
        if (!supabase || isSaving) return;
        setIsSaving(true);

        const errors = {};
        if (!formData.name.trim()) errors.name = "Nama tahun pelajaran wajib diisi";
        if (!formData.startDate) errors.startDate = "Tanggal mulai wajib diisi";
        if (!formData.endDate) errors.endDate = "Tanggal selesai wajib diisi";
        if (formData.startDate && formData.endDate && formData.endDate <= formData.startDate)
            errors.endDate = "Tanggal selesai harus setelah tanggal mulai";

        const rs = formData.registrationStart;
        const re = formData.registrationEnd;
        if (rs || re) {
            if (!rs || !re) {
                if (!rs) errors.registrationStart = "Tanggal mulai & selesai pendaftaran wajib diisi bersama";
                if (!re) errors.registrationEnd = "Tanggal mulai & selesai pendaftaran wajib diisi bersama";
            } else if (re <= rs) {
                errors.registrationEnd = "Selesai pendaftaran harus setelah mulai pendaftaran";
            } else if (formData.startDate && formData.endDate) {
                if (rs < formData.startDate || re > formData.endDate) {
                    errors.registrationEnd = "Periode pendaftaran harus berada dalam rentang periode akademik";
                }
            }
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            setIsSaving(false);
            return;
        }

        try {
            const clash = findOverlappingPeriod({
                semester: formData.semester,
                startDate: formData.startDate,
                endDate: formData.endDate,
                excludeId: selectedItem?.id || null,
                periods: years,
            });

            if (clash) {
                setFormErrors({ endDate: `Periode tumpang tindih dengan ${clash.academic_year} ${clash.semester}` });
                setIsSaving(false);
                return;
            }

            const payload = {
                academic_year: formData.name.trim(),
                semester: String(formData.semester || "").trim(),
                start_date: formData.startDate,
                end_date: formData.endDate,
                registration_start: formData.registrationStart || null,
                registration_end: formData.registrationEnd || null,
            };

            if (selectedItem?.id) {
                const { data, error } = await supabase
                    .from("periods")
                    .update(payload)
                    .eq("id", selectedItem.id)
                    .select();
                if (error) throw error;
                if (!data || data.length === 0) throw new Error("Gagal mengupdate data");

                if (formData.makeActive && !selectedItem.is_active) {
                    await supabase.from("periods").update({ is_active: false }).neq("id", selectedItem.id);
                    await supabase.from("periods").update({ is_active: true }).eq("id", selectedItem.id);
                } else if (!formData.makeActive && selectedItem.is_active) {
                    await supabase.from("periods").update({ is_active: false }).eq("id", selectedItem.id);
                }

                addToast("Tahun pelajaran berhasil diupdate", "success");
                try {
                    await logAudit({
                        action: "UPDATE", source: "MASTER", tableName: "periods",
                        recordId: selectedItem.id, oldData: selectedItem,
                        newData: { ...selectedItem, ...payload },
                    });
                } catch (e) { console.warn("[PeriodsCore] logAudit skip:", e.message); }
            } else {
                const makeActive = Boolean(formData.makeActive);
                if (makeActive) {
                    await supabase.from("periods").update({ is_active: false });
                }
                const { data, error } = await supabase
                    .from("periods")
                    .insert({ ...payload, is_active: makeActive })
                    .select();
                if (error) throw error;
                if (!data || data.length === 0) throw new Error("Gagal menambahkan data");

                addToast("Tahun pelajaran berhasil ditambahkan", "success");
                try {
                    await logAudit({
                        action: "INSERT", source: "MASTER", tableName: "periods",
                        recordId: data?.[0]?.id, newData: { ...payload, is_active: makeActive },
                    });
                } catch (e) { console.warn("[PeriodsCore] logAudit skip:", e.message); }
            }
            setIsModalOpen(false);
            setSelectedItem(null);
            fetchData();
        } catch (err) {
            console.error("[PeriodsCore] handleSubmit error:", err);
            if (err?.code === "23505") {
                addToast("Tidak bisa menyimpan: sudah ada tahun pelajaran lain yang aktif.", "error");
            } else if (err?.code === "23514") {
                addToast(`Tidak bisa menyimpan: ${err?.message || "data melanggar aturan database"}`, "error");
            } else {
                addToast(err?.message || "Gagal menyimpan data", "error");
            }
        } finally {
            setIsSaving(false);
        }
    }, [isSaving, selectedItem, years, fetchData, addToast]);

    const handleSetActive = useCallback(async (item) => {
        if (isSaving) return;
        if (item?.is_locked) {
            addToast("Periode terkunci — tidak dapat diaktifkan.", "warning");
            return;
        }
        setIsSaving(true);
        try {
            const { error: e1 } = await supabase
                .from("periods")
                .update({ is_active: false })
                .neq("id", item.id)
                .select();
            if (e1) throw e1;
            const { error: e2 } = await supabase
                .from("periods")
                .update({ is_active: true })
                .eq("id", item.id)
                .select();
            if (e2) throw e2;
            addToast(`${item.academic_year} ${item.semester} diaktifkan`, "success");
            try {
                await logAudit({
                    action: "UPDATE", source: "MASTER", tableName: "periods",
                    recordId: item.id, oldData: item, newData: { ...item, is_active: true },
                });
            } catch (e) { console.warn("[PeriodsCore] logAudit skip:", e.message); }
            fetchData();
        } catch (err) {
            addToast(err?.message || "Gagal mengaktifkan", "error");
        } finally {
            setIsSaving(false);
        }
    }, [isSaving, fetchData, addToast]);

    const handleInlineSave = useCallback(async (id, field, value) => {
        const target = years.find((y) => y.id === id);
        if (target?.is_locked) {
            addToast("Periode terkunci — tidak dapat mengedit langsung.", "warning");
            return;
        }
        const oldValue = target?.[field];
        setSaveStatus("saving");
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from("periods")
                .update({ [field]: value })
                .eq("id", id);
            if (error) throw error;
            setInlineEditCell(null);
            fetchData();
            setSaveStatus("saved");
            setLastChange({ field, oldValue, newValue: value, timestamp: new Date().toISOString() });
            setTimeout(() => setSaveStatus("idle"), 2000);
        } catch (err) {
            setSaveStatus("error");
            setTimeout(() => setSaveStatus("idle"), 2000);
            addToast(err?.message || "Gagal menyimpan perubahan", "error");
        } finally {
            setIsSaving(false);
        }
    }, [years, fetchData, addToast]);

    const handleToggleLock = useCallback(async (item) => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const newStatus = !item.is_locked;
            const updatePayload = newStatus
                ? { is_locked: true, locked_at: new Date().toISOString(), locked_by: profile?.id ?? null }
                : { is_locked: false, locked_at: null, locked_by: null };
            const { error } = await supabase
                .from("periods")
                .update(updatePayload)
                .eq("id", item.id);
            if (error) throw error;
            addToast(`Tahun pelajaran berhasil di${newStatus ? "tutup" : "buka"}`, "success");
            try {
                await logAudit({
                    action: "UPDATE", source: "MASTER", tableName: "periods",
                    recordId: item.id, oldData: item, newData: { ...item, ...updatePayload },
                });
            } catch (e) { console.warn("[PeriodsCore] logAudit skip:", e.message); }
            fetchData();
        } catch (err) {
            addToast(err?.message || "Gagal mengubah status", "error");
        } finally {
            setIsSaving(false);
        }
    }, [isSaving, profile, fetchData, addToast]);

    const handleDeleteConfirm = useCallback(async () => {
        if (!itemToDelete) return;
        if (!canEdit) {
            addToast("Mode read-only — aksi tidak diizinkan.", "warning");
            return;
        }
        setIsDeleting(true);
        const archived = itemToDelete;
        const now = new Date().toISOString();
        try {
            await supabase.from("periods").update({ deleted_at: now }).eq("id", archived.id);
            try {
                await logAudit({
                    action: "UPDATE", source: "MASTER", tableName: "periods",
                    recordId: archived.id, newData: { deleted_at: now },
                });
            } catch (e) { console.warn("[PeriodsCore] logAudit skip:", e.message); }
            setIsDeleteModalOpen(false);
            fetchData();
            addUndoToast(
                `${archived.academic_year} diarsipkan.`,
                async () => {
                    await supabase.from("periods").update({ deleted_at: null }).eq("id", archived.id);
                    fetchData();
                },
                6000,
            );
        } catch (err) {
            handleError(err, { context: "Gagal mengarsipkan" });
        } finally {
            setIsDeleting(false);
        }
    }, [itemToDelete, canEdit, fetchData, addToast, addUndoToast, handleError]);

    const handleBulkEdit = useCallback(async (fields) => {
        if (!canEdit || isSaving || selectedIds.length === 0) return;
        setIsSaving(true);
        const ids = [...selectedIds];
        const payload = {};
        if (fields.semester !== undefined) payload.semester = fields.semester;
        if (fields.start_date !== undefined) payload.start_date = fields.start_date;
        if (fields.end_date !== undefined) payload.end_date = fields.end_date;
        if (fields.registration_start !== undefined) payload.registration_start = fields.registration_start;
        if (fields.registration_end !== undefined) payload.registration_end = fields.registration_end;
        if (Object.keys(payload).length === 0) {
            addToast("Tidak ada perubahan yang dipilih", "warning");
            setIsSaving(false);
            return;
        }
        try {
            const { error } = await supabase.from("periods").update(payload).in("id", ids);
            if (error) throw error;
            addToast(`${ids.length} periode berhasil diperbarui`, "success");
            setSelectedIds([]);
            fetchData();
        } catch (err) {
            handleError(err, { context: "Gagal mengedit massal" });
        } finally {
            setIsSaving(false);
        }
    }, [canEdit, isSaving, selectedIds, fetchData, addToast, handleError]);

    const handleBulkDelete = useCallback(async () => {
        if (!canEdit) {
            addToast("Mode read-only — aksi tidak diizinkan.", "warning");
            return;
        }
        setIsDeleting(true);
        const now = new Date().toISOString();
        try {
            await supabase.from("periods").update({ deleted_at: now }).in("id", selectedIds);
            addToast(`${selectedIds.length} data diarsipkan`, "success");
            setSelectedIds([]);
            setIsBulkDeleteOpen(false);
            fetchData();
        } catch (err) {
            handleError(err, { context: "Gagal menghapus massal" });
        } finally {
            setIsDeleting(false);
        }
    }, [canEdit, selectedIds, fetchData, addToast, handleError]);

    const handleBulkSetActive = useCallback(async () => {
        if (isSaving || selectedIds.length !== 1) return;
        const target = years.find((y) => y.id === selectedIds[0]);
        if (target?.is_locked) {
            addToast("Periode terkunci — tidak dapat diaktifkan.", "warning");
            return;
        }
        setIsSaving(true);
        try {
            const targetId = selectedIds[0];
            await supabase.from("periods").update({ is_active: false });
            await supabase.from("periods").update({ is_active: true }).eq("id", targetId);
            addToast("Periode diaktifkan", "success");
            setSelectedIds([]);
            fetchData();
        } catch (err) {
            handleError(err, { context: "Gagal mengaktifkan massal" });
        } finally {
            setIsSaving(false);
        }
    }, [isSaving, selectedIds, years, fetchData, addToast, handleError]);

    const setLockStatus = useCallback(async (ids, locked) => {
        if (!supabase) return;
        const updatePayload = locked
            ? { is_locked: true, locked_at: new Date().toISOString(), locked_by: profile?.id ?? null }
            : { is_locked: false, locked_at: null, locked_by: null };
        await supabase.from("periods").update(updatePayload).in("id", ids);
    }, [profile]);

    const handleBulkLock = useCallback(async () => {
        if (!canEdit || isSaving || selectedIds.length === 0) return;
        const ids = [...selectedIds];
        setIsSaving(true);
        try {
            await setLockStatus(ids, true);
            addToast(`${ids.length} periode dikunci`, "success");
            setSelectedIds([]);
            fetchData();
            addUndoToast(
                `Dikunci (${ids.length} periode)`,
                async () => {
                    await setLockStatus(ids, false);
                    fetchData();
                },
                6000,
            );
        } catch (err) {
            handleError(err, { context: "Gagal mengunci massal" });
        } finally {
            setIsSaving(false);
        }
    }, [canEdit, isSaving, selectedIds, setLockStatus, fetchData, addToast, addUndoToast, handleError]);

    const handleBulkUnlock = useCallback(async () => {
        if (!canEdit || isSaving || selectedIds.length === 0) return;
        const ids = [...selectedIds];
        setIsSaving(true);
        try {
            await setLockStatus(ids, false);
            addToast(`${ids.length} periode dibuka`, "success");
            setSelectedIds([]);
            fetchData();
            addUndoToast(
                `Dibuka (${ids.length} periode)`,
                async () => {
                    await setLockStatus(ids, true);
                    fetchData();
                },
                6000,
            );
        } catch (err) {
            handleError(err, { context: "Gagal membuka massal" });
        } finally {
            setIsSaving(false);
        }
    }, [canEdit, isSaving, selectedIds, setLockStatus, fetchData, addToast, addUndoToast, handleError]);

    const handleGenerateNextYear = useCallback(async (count = 1) => {
        if (isSaving || years.length === 0) return;
        setIsSaving(true);
        try {
            const allYears = [...years];
            let latest = allYears.sort((a, b) => {
                if (a.academic_year !== b.academic_year) return b.academic_year.localeCompare(a.academic_year);
                return b.semester === "Genap" ? 1 : -1;
            })[0];

            let totalCreated = 0;
            for (let c = 0; c < count; c++) {
                const nextYear = generateNextAcademicYears(latest.academic_year);
                if (!nextYear) throw new Error("Format tahun pelajaran tidak valid");

                const existing = years.filter((y) => y.academic_year === nextYear.ganjil.academic_year);
                if (existing.length > 0) {
                    if (count === 1) {
                        addToast(`Tahun pelajaran ${nextYear.ganjil.academic_year} sudah ada`, "warning");
                        setIsSaving(false);
                        return;
                    }
                    latest = allYears.sort((a, b) => {
                        if (a.academic_year !== b.academic_year) return b.academic_year.localeCompare(a.academic_year);
                        return b.semester === "Genap" ? 1 : -1;
                    })[0];
                    continue;
                }

                const startYear = parseInt(nextYear.ganjil.academic_year.split("/")[0]);
                const payload = [
                    { ...nextYear.ganjil, start_date: `${startYear}-07-01`, end_date: `${startYear}-12-31`, is_active: false },
                    { ...nextYear.genap, start_date: `${startYear + 1}-01-01`, end_date: `${startYear + 1}-06-30`, is_active: false },
                ];

                const { error } = await supabase.from("periods").insert(payload);
                if (error) throw error;
                totalCreated += 2;

                const createdGanjil = { ...nextYear.ganjil, academic_year: nextYear.ganjil.academic_year, semester: "Ganjil" };
                const createdGenap = { ...nextYear.genap, academic_year: nextYear.genap.academic_year, semester: "Genap" };
                allYears.push(createdGanjil, createdGenap);
                latest = createdGenap;
            }

            if (count > 1) {
                addToast(`Berhasil buat ${count} tahun pelajaran baru (${totalCreated} periode)`, "success");
            } else {
                const nextYear = generateNextAcademicYears(latest.academic_year);
                if (nextYear) {
                    addToast(`Berhasil buat Tahun Pelajaran ${nextYear.ganjil.academic_year} (Ganjil + Genap)`, "success");
                }
            }
            try {
                await logAudit({
                    action: "INSERT", source: "MASTER", tableName: "periods",
                    newData: { bulk_create: true, count, data: `created ${totalCreated} periods` },
                });
            } catch (e) { console.warn("[PeriodsCore] logAudit skip:", e.message); }
            fetchData();
        } catch (err) {
            handleError(err, { context: "Gagal generate tahun baru" });
        } finally {
            setIsSaving(false);
        }
    }, [isSaving, years, fetchData, addToast, handleError]);

    // ── SELECTION ────────────────────────────────────────────────────────────
    const toggleSelect = useCallback((id) =>
        setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
    , []);

    // ── FILTERING (memoized) ─────────────────────────────────────────────────
    const filtered = useMemo(() => {
        return years
            .filter((y) => {
                const matchesSearch = !searchQuery || y.academic_year.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesSemester = !filterSemester || y.semester === filterSemester;
                const matchesStatus = !filterStatus || (filterStatus === "active" ? y.is_active : !y.is_active);
                const matchesLock = !filterLock || (filterLock === "locked" ? y.is_locked : !y.is_locked);
                if (filterTimeStatus) {
                    const ts = getTimeStatus(y.start_date, y.end_date);
                    if (ts?.label !== filterTimeStatus) return false;
                }
                return matchesSearch && matchesSemester && matchesStatus && matchesLock;
            })
            .sort((a, b) => {
                if (a.is_active && !b.is_active) return -1;
                if (!a.is_active && b.is_active) return 1;
                if (sortBy === "name_asc") return a.academic_year.localeCompare(b.academic_year);
                if (sortBy === "name_desc") return b.academic_year.localeCompare(a.academic_year);
                if (sortBy === "start_asc") return new Date(a.start_date) - new Date(b.start_date);
                return new Date(b.start_date) - new Date(a.start_date);
            });
    }, [years, searchQuery, filterSemester, filterStatus, filterLock, filterTimeStatus, sortBy, getTimeStatus]);

    const totalRows = filtered.length;
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
    const isEmpty = filtered.length === 0;

    const toggleSelectAll = useCallback(() =>
        setSelectedIds((prev) => prev.length === paged.length ? [] : paged.map((y) => y.id))
    , [paged]);

    const activeFilterCount = useMemo(() =>
        (filterSemester ? 1 : 0) + (filterStatus ? 1 : 0) + (filterLock ? 1 : 0) + (filterTimeStatus ? 1 : 0) + (searchQuery ? 1 : 0),
        [filterSemester, filterStatus, filterLock, filterTimeStatus, searchQuery]
    );

    const resetAllFilters = useCallback(() => {
        setSearchQuery("");
        setFilterSemester("");
        setFilterStatus("");
        setFilterLock("");
        setFilterTimeStatus("");
        setPage(1);
        setSelectedIds([]);
    }, []);

    // ── SELECTED ITEMS (for BulkActionsBar preview) ──────────────────────────
    const selectedItems = useMemo(() =>
        selectedIds
            .map((id) => {
                const item = years.find((y) => y.id === id);
                if (!item) return null;
                return {
                    id: item.id,
                    label: item.academic_year,
                    meta: `${item.semester} · ${formatDate(item.start_date)}–${formatDate(item.end_date)}`,
                };
            })
            .filter(Boolean),
        [selectedIds, years, formatDate]
    );

    const isMutating = isSaving || isDeleting;

    return {
        // Core data
        years, archivedYears, setArchivedYears, loading, stats, fetchData, fetchArchived,
        isSaving, isDeleting, isMutating, canEdit, moduleEnabled, profile,

        // Filtering
        searchQuery, setSearchQuery, filterSemester, setFilterSemester,
        filterStatus, setFilterStatus, filterLock, setFilterLock,
        filterTimeStatus, setFilterTimeStatus, sortBy, setSortBy,
        isFilterOpen, setIsFilterOpen, activeFilterCount, resetAllFilters,

        // Pagination
        page, setPage, jumpPage, setJumpPage, pageSize, setPageSize,
        totalRows, paged, isEmpty, filtered,

        // Selection
        selectedIds, setSelectedIds, selectedItems, toggleSelect, toggleSelectAll,

        // Columns
        visibleCols, setVisibleCols, isColMenuOpen, setIsColMenuOpen,
        colMenuPos, setColMenuPos, colMenuRef, colMenuPortalRef,
        columnOrder, setColumnOrder, moveColumnLeft, moveColumnRight,

        // UI
        isPrivacyMode, setIsPrivacyMode, togglePrivacyMode, maskValue,
        isShortcutOpen, setIsShortcutOpen, isHeaderMenuOpen, setIsHeaderMenuOpen,
        headerMenuBtnRef, shortcutBtnRef, headerMenuRect, setHeaderMenuRect,
        shortcutRect, setShortcutRect,
        headerMenuMounted, searchInputRef, tableRef, viewMode, setViewMode,

        // Action context
        selectedItem, setSelectedItem, itemToDelete, setItemToDelete,
        readOnlyDetailItem, setReadOnlyDetailItem, historyItem, setHistoryItem,

        // Modal visibility
        isModalOpen, setIsModalOpen, isDeleteModalOpen, setIsDeleteModalOpen,
        isArchivedOpen, setIsArchivedOpen, loadingArchived, setLoadingArchived,
        isBulkDeleteOpen, setIsBulkDeleteOpen, isReadOnlyDetailOpen, setIsReadOnlyDetailOpen,
        isHistoryOpen, setIsHistoryOpen, isGenerateConfirmOpen, setIsGenerateConfirmOpen,

        // Inline edit
        inlineEditCell, setInlineEditCell, saveStatus, lastChange, setLastChange,

        // Functions
        handleAdd, handleEdit, handleDuplicate, handleSubmit,
        handleSetActive, handleInlineSave, handleToggleLock,
        handleDeleteConfirm, handleBulkEdit, handleBulkDelete, handleBulkSetActive,
        handleBulkLock, handleBulkUnlock, handleGenerateNextYear,
        handleOpenReadOnlyDetail, handleOpenHistory,

        // Helpers
        formatDate, getDuration, getTimeStatus, handleError,
    };
}
