import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import {
    Archive,
    Calendar,
    Check,
    CheckCircle,
    CheckSquare,
    Checks,
    CaretLeft,
    CaretRight,
    CircleDashed,
    Clock,
    Copy,
    Eye,
    EyeSlash,
    FileArrowDown,
    FileArrowUp,
    Fingerprint,
    GraduationCap,
    ClockCounterClockwise,
    Keyboard,
    StackSimple,
    List,
    Spinner,
    Pencil,
    Plus,
    MagnifyingGlass,
    SlidersHorizontal,
    ClockClockwise,
    Trash,
    X,
    ArrowCounterClockwise,
    Lock,
    LockOpen,
    ArrowClockwise,
    Warning,
} from "@phosphor-icons/react";
import { createPortal } from "react-dom";

import DashboardLayout from "@core/layouts/DashboardLayout";
import { useToast } from "@context/Toast";
import { PrivacyValue } from "@hooks/usePrivacyMode";
import { findOverlappingPeriods } from "@features/periods/utils/periodValidation";
import {
    PageHeader,
    Modal,
    Pagination,
    RichSelect,
    AuditTimeline,
    StatsCarousel,
    StatCard,
    EmptyState,
    BulkActionsBar,
    ConfirmDialog,
} from "@shared/components";
import PeriodFormModal from "@features/periods/components/PeriodFormModal";
import { ArchiveModal } from "@features/periods/components/PeriodConfirmModals";
import PeriodArchiveModal from "@features/periods/components/PeriodArchiveModal";
import { usePeriodsCore } from "@features/periods/hooks/usePeriodsCore";
import { usePeriodsImportExport, SYSTEM_COLS } from "@features/periods/hooks/usePeriodsImportExport";

const LazyPeriodExportModal = React.lazy(
    () => import("@features/periods/components/PeriodExportModal"),
);
const LazyPeriodImportModal = React.lazy(
    () => import("@features/periods/components/PeriodImportModal"),
);

// Singleton portal manager — same pattern as StudentsPage
const _portalContainers = {};
function getPortalContainer(id) {
    if (typeof document === "undefined") return null;
    if (!_portalContainers[id]) {
        let el = document.getElementById(id);
        if (!el) {
            el = document.createElement("div");
            el.id = id;
            document.body.appendChild(el);
        }
        _portalContainers[id] = el;
    }
    return _portalContainers[id];
}

// ── Isolated MagnifyingGlass Input ────────────────────────────────────────────────────
const DebouncedSearchInput = memo(
    ({ searchQuery, onSearch, inputRef, isLoading }) => {
        const [value, setValue] = useState(searchQuery);
        const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);

        if (searchQuery !== prevSearchQuery) {
            setPrevSearchQuery(searchQuery);
            if (searchQuery === "") {
                setValue("");
            }
        }

        // Debounce: propagate ke parent setelah 350ms berhenti mengetik
        useEffect(() => {
            const t = setTimeout(() => onSearch(value), 350);
            return () => clearTimeout(t);
        }, [value, onSearch]);

        return (
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)] w-4 h-4 group-focus-within:text-[var(--color-primary)] transition-colors">
                    {isLoading ? (
                        <Spinner className="animate-spin w-3 h-3 text-[var(--color-primary)]" />
                    ) : (
                        <MagnifyingGlass />
                    )}
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Cari nama tahun pelajaran (contoh: 2024/2025)... (Ctrl+K)"
                    className="input-field pl-10 w-full h-9 text-xs sm:text-sm bg-[var(--color-surface-alt)]/50 border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all rounded-xl font-bold placeholder:font-normal placeholder:opacity-40"
                />
            </div>
        );
    },
);
DebouncedSearchInput.displayName = "DebouncedSearchInput";

const PeriodSkeletonRow = () => (
    <tr className="animate-pulse border-b border-[var(--color-border)]/50">
        <td className="py-4 px-4 w-12 text-center">
            <div className="w-5 h-5 bg-[var(--color-surface-alt)] rounded-lg mx-auto" />
        </td>
        <td className="py-4 px-4">
            <div className="w-32 h-4 bg-[var(--color-surface-alt)] rounded-md" />
        </td>
        <td className="py-4 px-4">
            <div className="w-16 h-5 bg-[var(--color-surface-alt)] rounded-full" />
        </td>
        <td className="py-4 px-4">
            <div className="w-24 h-4 bg-[var(--color-surface-alt)] rounded-md" />
        </td>
        <td className="py-4 px-4">
            <div className="w-20 h-5 bg-[var(--color-surface-alt)] rounded-full" />
        </td>
        <td className="py-4 px-4 text-center w-32">
            <div className="flex gap-1.5 justify-center">
                <div className="w-7 h-7 bg-[var(--color-surface-alt)] rounded-lg" />
                <div className="w-7 h-7 bg-[var(--color-surface-alt)] rounded-lg" />
                <div className="w-7 h-7 bg-[var(--color-surface-alt)] rounded-lg" />
            </div>
        </td>
    </tr>
);

const PeriodSkeletonCard = () => (
    <div className="animate-pulse rounded-2xl border border-[var(--color-border)]/50 p-4 bg-[var(--color-surface)]">
        <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-alt)]" />
            <div className="flex-1 space-y-2">
                <div className="w-3/4 h-4 bg-[var(--color-surface-alt)] rounded-md" />
                <div className="w-1/2 h-3 bg-[var(--color-surface-alt)]/60 rounded-md" />
            </div>
        </div>
        <div className="flex gap-2 mb-3">
            <div className="w-16 h-5 bg-[var(--color-surface-alt)] rounded-full" />
            <div className="w-12 h-5 bg-[var(--color-surface-alt)] rounded-full" />
        </div>
        <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
                <div className="w-7 h-7 bg-[var(--color-surface-alt)] rounded-lg" />
                <div className="w-7 h-7 bg-[var(--color-surface-alt)] rounded-lg" />
                <div className="w-7 h-7 bg-[var(--color-surface-alt)] rounded-lg" />
            </div>
        </div>
    </div>
);

function TimelineView({
    years,
    onEdit,
    onHistory,
    onSetActive,
    onDuplicate,
    onDelete,
    onToggleLock,
    canEdit,
    isPrivacyMode,
    maskValue,
}) {
    if (years.length === 0) {
        return (
            <EmptyState
                icon={MagnifyingGlass}
                title="Tidak Ada Data Ditemukan"
                description="Sesuaikan filter atau kata kunci pencarian Anda"
                color="slate"
                variant="plain"
            />
        );
    }

    const sorted = [...years].sort(
        (a, b) => new Date(a.start_date) - new Date(b.start_date),
    );

    const getTimeStatus = (start, end) => {
        if (!start || !end) return null;
        const now = new Date();
        const s = new Date(start);
        const e = new Date(end);
        if (now < s)
            return {
                label: "Akan Datang",
                cls: "bg-blue-500/10 text-blue-600 border-blue-500/20",
            };
        if (now > e)
            return {
                label: "Selesai",
                cls: "bg-gray-500/10 text-gray-500 border-gray-500/20",
            };
        return {
            label: "Berjalan",
            cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        };
    };

    const getDuration = (start, end) => {
        if (!start || !end) return null;
        const months = Math.round(
            (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24 * 30),
        );
        return months > 0 ? `${months} bulan` : null;
    };

    return (
        <div className="relative w-full">
            <div
                className="relative overflow-x-auto pb-6 pt-6 no-scrollbar select-none flex justify-start lg:justify-center"
                style={{ minHeight: "280px" }}
            >
                <div
                    className="flex items-start px-6 md:px-16 relative mx-auto z-10"
                    style={{ minWidth: "max-content" }}
                >
                    {/* Horizontal timeline line */}
                    <div className="absolute top-5 left-0 right-0 h-[2px] bg-[var(--color-border)] opacity-50" />

                    {sorted.map((year) => {
                        const isActive = year.is_active;
                        const isGanjil = year.semester === "Ganjil";
                        const ts = getTimeStatus(year.start_date, year.end_date);
                        const dur = getDuration(year.start_date, year.end_date);

                        return (
                            <div
                                key={year.id}
                                className="relative flex flex-col items-center group/item shrink-0"
                                style={{ width: "220px" }}
                            >
                                {/* Node */}
                                <div className="relative z-10 flex items-center justify-center w-10 h-10 mb-4">
                                    {isActive && (
                                        <div className="absolute inset-0 rounded-full bg-[var(--color-primary)]/15 animate-pulse" />
                                    )}
                                    <div
                                        className={`relative flex items-center justify-center w-7 h-7 rounded-full border-[3px] border-[var(--color-surface)] transition-all duration-300 group-hover/item:scale-125 shadow-md ${isActive ? "bg-[var(--color-primary)] shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.35)]" : "bg-[var(--color-surface-alt)] border-[var(--color-border)] group-hover/item:border-[var(--color-primary)]"}`}
                                    >
                                        <div
                                            className={`w-2 h-2 rounded-full transition-all duration-300 ${isActive ? "bg-white" : "bg-[var(--color-border)] group-hover/item:bg-[var(--color-primary)]"}`}
                                        />
                                    </div>
                                </div>

                                {/* Stalk */}
                                <div
                                    className={`w-[2px] h-6 -mt-3 mb-2 rounded-full transition-colors duration-300 ${isActive ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"}`}
                                />

                                {/* Card */}
                                <div
                                    className={`px-3 w-full transition-all duration-300 ${isActive ? "opacity-100" : "opacity-70 group-hover/item:opacity-100"}`}
                                >
                                    <div
                                        className={`relative rounded-2xl p-4 border transition-all duration-300 hover:-translate-y-1 ${isActive ? "bg-[var(--color-surface)] border-[var(--color-primary)]/40 shadow-lg shadow-[var(--color-primary)]/5" : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-primary)]/30 shadow-sm"}`}
                                    >
                                        {/* Badges */}
                                        <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                                            <div
                                                className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${isGanjil ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]" : "bg-purple-500/10 text-purple-600"}`}
                                            >
                                                {maskValue(year.semester, "semester")}
                                            </div>
                                            {isActive && (
                                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[7px] font-black">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                                    AKTIF
                                                </div>
                                            )}
                                            {ts && (
                                                <div
                                                    className={`px-1.5 py-0.5 rounded-full text-[7px] font-bold ${ts.cls}`}
                                                >
                                                    {ts.label}
                                                </div>
                                            )}
                                            {year.is_locked && (
                                                <div className="px-1.5 py-0.5 rounded-full text-[7px] font-black bg-rose-500/10 text-rose-600">
                                                    TUTUP
                                                </div>
                                            )}
                                        </div>

                                        {/* Year */}
                                        <h4 className="text-lg font-black font-heading tracking-tight text-[var(--color-text)] leading-none mb-1.5 group-hover/item:text-[var(--color-primary)] transition-colors">
                                            {maskValue(year.academic_year, "year")}
                                        </h4>

                                        {/* Dates */}
                                        <div className="flex items-center gap-1.5 text-[9px] text-[var(--color-text-muted)] font-medium">
                                            <Calendar className="w-3 h-3 opacity-50 shrink-0" />
                                            <span
                                                className={
                                                    isPrivacyMode
                                                        ? "blur-sm select-none transition-all duration-200"
                                                        : ""
                                                }
                                            >
                                                {new Date(year.start_date).toLocaleDateString("id-ID", {
                                                    day: "numeric",
                                                    month: "short",
                                                })}
                                                {" \u2013 "}
                                                {new Date(year.end_date).toLocaleDateString("id-ID", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "2-digit",
                                                })}
                                            </span>
                                        </div>
                                        {dur && (
                                            <div
                                                className={`mt-1 text-[8px] font-bold text-[var(--color-text-muted)] opacity-60 ${isPrivacyMode ? "blur-sm select-none" : ""}`}
                                            >
                                                {dur}
                                            </div>
                                        )}

                                        {/* Actions — always visible */}
                                        <div className="mt-3 pt-2.5 border-t border-[var(--color-border)]/50 flex items-center justify-between gap-1">
                                            <div className="flex items-center gap-1 min-w-0 flex-1">
                                                {canEdit && !isActive && !year.is_locked && (
                                                    <button
                                                        onClick={() => onSetActive(year)}
                                                        className="w-6 h-6 rounded-lg bg-[var(--color-primary)] text-white transition-all flex items-center justify-center shrink-0 hover:brightness-110"
                                                        title="Aktifkan"
                                                    >
                                                        <Check className="w-2.5 h-2.5" />
                                                    </button>
                                                )}
                                                {isActive && (
                                                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-wider">
                                                        Aktif
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-0.5 shrink-0">
                                                {canEdit && !year.is_locked && (
                                                    <button
                                                        onClick={() => onEdit(year)}
                                                        className="w-6 h-6 rounded-lg bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-all flex items-center justify-center"
                                                    >
                                                        <Pencil className="w-2.5 h-2.5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => onHistory(year)}
                                                    className="w-6 h-6 rounded-lg bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-all flex items-center justify-center"
                                                >
                                                    <ClockCounterClockwise className="w-2.5 h-2.5" />
                                                </button>
                                                {canEdit && (
                                                    <button
                                                        onClick={() => onDuplicate(year)}
                                                        title="Duplikat"
                                                        className="w-6 h-6 rounded-lg bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-emerald-500 transition-all flex items-center justify-center"
                                                    >
                                                        <Copy className="w-2.5 h-2.5" />
                                                    </button>
                                                )}
                                                {canEdit && !isActive && (
                                                    <button
                                                        onClick={() => onToggleLock(year)}
                                                        title={year.is_locked ? "Buka Buku" : "Tutup Buku"}
                                                        className={`w-6 h-6 rounded-lg transition-all flex items-center justify-center ${year.is_locked ? "bg-rose-500/10 text-rose-500" : "bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-rose-500"}`}
                                                    >
                                                        {year.is_locked ? (
                                                            <ArrowCounterClockwise className="w-2.5 h-2.5" />
                                                        ) : (
                                                            <Archive className="w-2.5 h-2.5" />
                                                        )}
                                                    </button>
                                                )}
                                                {canEdit && !year.is_locked && !isActive && (
                                                    <button
                                                        onClick={() => onDelete(year)}
                                                        className="w-6 h-6 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                                    >
                                                        <Trash className="w-2.5 h-2.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default function PeriodsPage() {
    const { addToast, addUndoToast } = useToast();

    // ── Core Hook ──
    const {
        years, archivedYears, setArchivedYears, loading, stats, fetchData, fetchArchived,
        isSaving, isDeleting, isMutating, canEdit, moduleEnabled, profile,
        searchQuery, setSearchQuery, filterSemester, setFilterSemester,
        filterStatus, setFilterStatus, filterLock, setFilterLock,
        filterTimeStatus, setFilterTimeStatus, sortBy, setSortBy,
        isFilterOpen, setIsFilterOpen, activeFilterCount, resetAllFilters,
        page, setPage, jumpPage, setJumpPage, pageSize, setPageSize,
        totalRows, paged, isEmpty, filtered,
        selectedIds, setSelectedIds, selectedItems, toggleSelect, toggleSelectAll,
        visibleCols, setVisibleCols, isColMenuOpen, setIsColMenuOpen,
        colMenuPos, setColMenuPos, colMenuRef, colMenuPortalRef,
        isPrivacyMode, setIsPrivacyMode, togglePrivacyMode, maskValue,
        isShortcutOpen, setIsShortcutOpen, isHeaderMenuOpen, setIsHeaderMenuOpen,
        headerMenuBtnRef, shortcutBtnRef, headerMenuRect, setHeaderMenuRect,
        shortcutRect, setShortcutRect,
        headerMenuMounted, searchInputRef, tableRef, viewMode, setViewMode,
        selectedItem, setSelectedItem, itemToDelete, setItemToDelete,
        readOnlyDetailItem, setReadOnlyDetailItem, historyItem, setHistoryItem,
        isModalOpen, setIsModalOpen, isDeleteModalOpen, setIsDeleteModalOpen,
        isArchivedOpen, setIsArchivedOpen, loadingArchived, setLoadingArchived,
        isBulkDeleteOpen, setIsBulkDeleteOpen, isReadOnlyDetailOpen, setIsReadOnlyDetailOpen,
        isHistoryOpen, setIsHistoryOpen, isGenerateConfirmOpen, setIsGenerateConfirmOpen,
        inlineEditCell, setInlineEditCell,
        handleAdd, handleEdit, handleDuplicate, handleSubmit,
        handleSetActive, handleInlineSave, handleToggleLock,
        handleDeleteConfirm, handleBulkDelete, handleBulkSetActive,
        handleBulkLock, handleBulkUnlock, handleGenerateNextYear,
        handleOpenReadOnlyDetail, handleOpenHistory,
        formatDate, getDuration, getTimeStatus, handleError,
    } = usePeriodsCore({ addToast, addUndoToast });

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    // ── Import/Export Hook ──
    const {
        importStep, setImportStep, importFileName, setImportFileName,
        importRawData, setImportRawData, importFileHeaders, setImportFileHeaders,
        importColumnMapping, setImportColumnMapping, importPreview, setImportPreview,
        importIssues, setImportIssues, importLoading, setImportLoading,
        importValidationOpen, setImportValidationOpen, importDragOver, setImportDragOver,
        importing, setImporting, importProgress, setImportProgress,
        importEditCell, setImportEditCell, importSkipDupes, setImportSkipDupes,
        exportScope, setExportScope, exportColumns, setExportColumns, exporting, setExporting,
        importReadyRows, hasImportBlockingErrors, importFileInputRef,
        handleImportClick, handleFileChange, processImportFile, buildImportPreview,
        handleImportCellEdit, handleRemoveImportRow, handleDownloadTemplate, handleCommitImport,
        getExportData, handleExportCSV, handleExportExcel, handleExportPDF,
    } = usePeriodsImportExport({
        years, filtered, selectedIds, canEdit, fetchData, addToast,
        handleError,
        isImportModalOpen, setIsImportModalOpen,
        isExportModalOpen, setIsExportModalOpen,
    });

    const STAT_CARD_COUNT = 4;

    // ── Inline Cell Editor ──────────────────────────────────────────────────
    const InlineCell = ({ id, field, value, displayValue, type = "text", options, className = "", canEdit: cellEditable = true }) => {
        const isEditing = inlineEditCell?.id === id && inlineEditCell?.field === field;

        if (!cellEditable || !canEdit) {
            return <span className={className}>{displayValue ?? value ?? "-"}</span>;
        }

        if (isEditing) {
            if (type === "select" && options) {
                return (
                    <div className="relative inline-flex">
                        <select
                            autoFocus
                            defaultValue={value || ""}
                            className="bg-[var(--color-surface)] border-2 border-[var(--color-primary)] rounded-lg px-2 py-1 text-[11px] font-bold outline-none min-w-[80px]"
                            onChange={(e) => {
                                const newVal = e.target.value;
                                if (newVal && newVal !== value) {
                                    handleInlineSave(id, field, newVal);
                                } else {
                                    setInlineEditCell(null);
                                }
                            }}
                            onBlur={(e) => {
                                if (e.target.value && e.target.value !== value) {
                                    handleInlineSave(id, field, e.target.value);
                                } else {
                                    setInlineEditCell(null);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Escape") setInlineEditCell(null);
                            }}
                        >
                            {options.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                );
            }
            if (type === "date") {
                return (
                    <input
                        autoFocus
                        type="date"
                        defaultValue={value || ""}
                        className="bg-[var(--color-surface)] border-2 border-[var(--color-primary)] rounded-lg px-2 py-1 text-[11px] font-bold outline-none min-w-[130px]"
                        onBlur={(e) => {
                            if (e.target.value && e.target.value !== value) {
                                handleInlineSave(id, field, e.target.value);
                            } else {
                                setInlineEditCell(null);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                if (e.target.value && e.target.value !== value) {
                                    handleInlineSave(id, field, e.target.value);
                                } else {
                                    setInlineEditCell(null);
                                }
                            }
                            if (e.key === "Escape") setInlineEditCell(null);
                        }}
                    />
                );
            }
            return (
                <input
                    autoFocus
                    type="text"
                    defaultValue={value || ""}
                    className="bg-[var(--color-surface)] border-2 border-[var(--color-primary)] rounded-lg px-2 py-1 text-[11px] font-bold outline-none min-w-[80px]"
                    onBlur={(e) => {
                        const trimmed = e.target.value.trim();
                        if (trimmed && trimmed !== value) {
                            handleInlineSave(id, field, trimmed);
                        } else {
                            setInlineEditCell(null);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            const trimmed = e.target.value.trim();
                            if (trimmed && trimmed !== value) {
                                handleInlineSave(id, field, trimmed);
                            } else {
                                setInlineEditCell(null);
                            }
                        }
                        if (e.key === "Escape") setInlineEditCell(null);
                    }}
                />
            );
        }

        return (
            <span
                className={`cursor-pointer hover:bg-[var(--color-primary)]/10 rounded px-1 -mx-1 transition-all ${className}`}
                onClick={() => setInlineEditCell({ id, field, value })}
                title="Klik untuk edit"
            >
                {displayValue ?? value ?? "-"}
            </span>
        );
    };

    if (!moduleEnabled) {
        return (
            <DashboardLayout title="Tahun Pelajaran">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center max-w-md p-8">
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-8 h-8 text-amber-500" />
                        </div>
                        <h2 className="text-lg font-black text-[var(--color-text)] mb-2">Modul Tidak Aktif</h2>
                        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                            Modul Periode Akademik saat ini dinonaktifkan oleh administrator.
                            Hubungi admin untuk mengaktifkannya kembali.
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Tahun Pelajaran">
            <div className="space-y-4 max-w-[1800px] mx-auto min-h-screen relative">
                {(() => {
                    const selectedItemsData = selectedIds.map(id => years.find(y => y.id === id)).filter(Boolean);
                    const allLocked = selectedItemsData.length > 0 && selectedItemsData.every(y => y.is_locked);
                    const allUnlocked = selectedItemsData.length > 0 && selectedItemsData.every(y => !y.is_locked);
                    const hasLocked = selectedItemsData.some(y => y.is_locked);
                    const hasUnlocked = selectedItemsData.some(y => !y.is_locked);
                    const singleItem = selectedIds.length === 1 ? years.find(y => y.id === selectedIds[0]) : null;

                    return (
                        <BulkActionsBar
                    selectedCount={selectedIds.length}
                    onClear={() => setSelectedIds([])}
                    title="Data Terpilih"
                    subtitle="Aksi Massal"
                    selectedItems={selectedItems}
                    onRemoveItem={(id) =>
                        setSelectedIds((prev) => prev.filter((x) => x !== id))
                    }
                    primaryAction={{
                        label: "Arsipkan",
                        icon: <Archive className="w-3 h-3" />,
                        variant: "destructive",
                        onClick: () => setIsBulkDeleteOpen(true),
                        disabled: !canEdit || isMutating,
                    }}
                    secondaryActions={[
                        {
                            label: "Aktifkan",
                            icon: <CheckCircle className="w-3 h-3" />,
                            variant: "primary",
                            onClick: handleBulkSetActive,
                            disabled: !canEdit || isMutating || selectedIds.length !== 1 || (singleItem?.is_locked),
                            title:
                                !canEdit
                                    ? "Mode read-only — aksi tidak diizinkan"
                                    : singleItem?.is_locked
                                      ? "Periode terkunci — tidak dapat diaktifkan"
                                      : selectedIds.length > 1
                                        ? "Hanya satu periode yang boleh diaktifkan sekaligus"
                                        : selectedIds.length === 0
                                          ? "Pilih satu periode untuk diaktifkan"
                                          : undefined,
                        },
                        {
                            label: "Kunci",
                            icon: <Lock className="w-3 h-3" />,
                            variant: "default",
                            onClick: handleBulkLock,
                            disabled: !canEdit || isMutating || selectedIds.length === 0 || allLocked,
                            title: allLocked ? "Semua sudah terkunci" : undefined,
                        },
                        {
                            label: "Buka",
                            icon: <LockOpen className="w-3 h-3" />,
                            variant: "default",
                            onClick: handleBulkUnlock,
                            disabled: !canEdit || isMutating || selectedIds.length === 0 || allUnlocked,
                            title: allUnlocked ? "Semua sudah terbuka" : undefined,
                        },
                    ]}
                />
                    );
                })()}

                {!canEdit && (
                    <div className="px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2">
                        <CheckCircle className="text-rose-500 shrink-0 w-3 h-3" />
                        <p className="text-[11px] font-bold text-rose-600">
                            Mode Read-only — Pen tahun pelajaran dinonaktifkan oleh
                            administrator.
                        </p>
                    </div>
                )}

                {/* ── Header Row ── */}
                <PageHeader
                    title="Tahun Pelajaran"
                    subtitle={`Kelola ${stats.total} periode akademik dalam ekosistem.`}
                    actions={
                        <>
                            {/* Header List Button */}
                            <button
                                ref={headerMenuBtnRef}
                                onClick={() => {
                                    if (!isHeaderMenuOpen)
                                        setHeaderMenuRect(
                                            headerMenuBtnRef.current?.getBoundingClientRect(),
                                        );
                                    setIsHeaderMenuOpen((v) => !v);
                                }}
                                className={`h-9 w-9 rounded-lg border flex items-center justify-center text-sm transition-all active:scale-95 ${isHeaderMenuOpen ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30 text-[var(--color-primary)]" : "bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]"}`}
                                title="Aksi lainnya"
                            >
                                <SlidersHorizontal />
                            </button>

                            {/* Portaled Header List Dropdown */}
                            {headerMenuMounted &&
                                headerMenuRect &&
                                createPortal(
                                    <>
                                        <div
                                            className={`fixed inset-0 z-[9990] bg-black/5 backdrop-blur-[1px] transition-opacity duration-200 ${isHeaderMenuOpen ? "opacity-100" : "opacity-0"}`}
                                            onClick={() => setIsHeaderMenuOpen(false)}
                                        />
                                        <div
                                            className={`fixed z-[9991] w-56 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl p-2 transition-all duration-200 ease-out origin-top-right
                                        ${isHeaderMenuOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2"}`}
                                            style={{
                                                top: headerMenuRect.bottom + 8,
                                                left: Math.max(10, headerMenuRect.right - 224),
                                            }}
                                        >
                                            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] px-3 py-2">
                                                Data
                                            </p>
                                            <button
                                                onClick={() => {
                                                    if (!canEdit) return;
                                                    setIsHeaderMenuOpen(false);
                                                    handleImportClick();
                                                }}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${canEdit ? 'hover:bg-[var(--color-surface-alt)] text-[var(--color-text)]' : 'opacity-40 cursor-not-allowed text-[var(--color-text-muted)]'}`}
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <FileArrowDown className="w-3 h-3" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[11px] font-black leading-tight">
                                                        Import CSV / Excel
                                                    </p>
                                                    <p className="text-[9px] opacity-60 font-medium leading-tight mt-0.5">
                                                        Unggah data periode masal dari file Excel/CSV
                                                    </p>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsHeaderMenuOpen(false);
                                                    setIsExportModalOpen(true);
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-surface-alt)] text-[var(--color-text)] transition-all group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <FileArrowUp className="w-3 h-3" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[11px] font-black leading-tight">
                                                        Export Data
                                                    </p>
                                                    <p className="text-[9px] opacity-60 font-medium leading-tight mt-0.5">
                                                        Cadangkan seluruh database ke format Excel
                                                    </p>
                                                </div>
                                            </button>
                                            <div className="h-px bg-[var(--color-border)] my-1 mx-2" />
                                            <p className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                                                Manajemen
                                            </p>
                                            <button
                                                onClick={() => {
                                                    setIsHeaderMenuOpen(false);
                                                    setIsGenerateConfirmOpen(true);
                                                }}
                                                disabled={!canEdit || isMutating || years.length === 0}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-surface-alt)] text-[var(--color-text)] transition-all group disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <ArrowClockwise className="w-3 h-3" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[11px] font-black leading-tight">
                                                        Generate Tahun Baru
                                                    </p>
                                                    <p className="text-[9px] opacity-60 font-medium leading-tight mt-0.5">
                                                        Buat Ganjil + Genap tahun depan otomatis
                                                    </p>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsHeaderMenuOpen(false);
                                                    fetchArchived();
                                                    setIsArchivedOpen(true);
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-surface-alt)] text-[var(--color-text)] transition-all group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <Archive className="w-3 h-3" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[11px] font-black leading-tight">
                                                        Arsip Periode
                                                    </p>
                                                    <p className="text-[9px] opacity-60 font-medium leading-tight mt-0.5">
                                                        Lihat & pulihkan data periode tidak aktif
                                                    </p>
                                                </div>
                                            </button>
                                        </div>
                                    </>,
                                    getPortalContainer("portal-periods-header-menu"),
                                )}

                            <input
                                type="file"
                                ref={importFileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept=".csv,.xlsx"
                            />

                            {/* Keyboard Shortcuts Button - hidden on mobile */}
                            <button
                                onClick={() => {
                                    if (!isShortcutOpen)
                                        setShortcutRect(
                                            shortcutBtnRef.current?.getBoundingClientRect(),
                                        );
                                    setIsShortcutOpen((v) => !v);
                                }}
                                ref={shortcutBtnRef}
                                className={`hidden sm:flex h-9 w-9 rounded-lg border items-center justify-center transition-all active:scale-95
                                ${isShortcutOpen
                                        ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30 text-[var(--color-primary)]"
                                        : "bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                                    }`}
                                title="Keyboard Shortcuts (?)"
                            >
                                <Keyboard className="w-4 h-4" />
                            </button>

                            {/* Portaled Keyboard Shortcuts Dropdown */}
                            {isShortcutOpen &&
                                shortcutRect &&
                                createPortal(
                                    <>
                                        <div
                                            className="fixed inset-0 z-[9990] bg-black/5 backdrop-blur-[1px]"
                                            onClick={() => setIsShortcutOpen(false)}
                                        />
                                        <div
                                            className="fixed z-[9991] w-72 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl shadow-black/10 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200"
                                            style={{
                                                top: shortcutRect.bottom + 8,
                                                left: Math.max(10, shortcutRect.right - 288),
                                            }}
                                        >
                                            <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface-alt)]/50">
                                                <p className="text-[11px] font-black uppercase tracking-widest text-[var(--color-text)]">
                                                    Keyboard Shortcuts
                                                </p>
                                                <span className="text-[9px] text-[var(--color-text-muted)] font-bold">
                                                    Tekan ? untuk toggle
                                                </span>
                                            </div>
                                            <div className="p-3 space-y-0.5">
                                                {[
                                                    { section: "Navigasi" },
                                                    { keys: ["Ctrl", "K"], label: "Fokus ke search" },
                                                    { section: "Aksi" },
                                                    { keys: ["N"], label: "Tambah periode baru" },
                                                    { keys: ["X"], label: "Reset semua filter" },
                                                    { keys: ["?"], label: "Tampilkan shortcut ini" },
                                                ].map((item, i) =>
                                                    item.section ? (
                                                        <p
                                                            key={i}
                                                            className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] pt-2 pb-1 px-1"
                                                        >
                                                            {item.section}
                                                        </p>
                                                    ) : (
                                                        <div
                                                            key={i}
                                                            className="flex items-center justify-between px-1 py-1 rounded-lg hover:bg-[var(--color-surface-alt)] transition-all"
                                                        >
                                                            <span className="text-[11px] font-semibold text-[var(--color-text)]">
                                                                {item.label}
                                                            </span>
                                                            <div className="flex items-center gap-1">
                                                                {item.keys.map((k, ki) => (
                                                                    <span
                                                                        key={ki}
                                                                        className="px-1.5 py-0.5 rounded-md bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[9px] font-black text-[var(--color-text-muted)] font-mono"
                                                                    >
                                                                        {k}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    </>,
                                    getPortalContainer("portal-periods-shortcut-menu"),
                                )}

                            {/* Privasi toggle */}
                            <button
                                onClick={togglePrivacyMode}
                                className={`h-9 w-9 sm:w-auto sm:px-3 rounded-lg border flex items-center justify-center sm:justify-start gap-2 transition-all active:scale-95 ${isPrivacyMode ? "bg-amber-500/10 border-amber-500/30 text-amber-600" : "bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"} `}
                                title={
                                    isPrivacyMode
                                        ? "Matikan Mode Privasi"
                                        : "Aktifkan Mode Privasi"
                                }
                            >
                                {isPrivacyMode ? (
                                    <EyeSlash className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                                <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">
                                    Privasi
                                </span>
                            </button>

                            {/* Add button */}
                            {canEdit && (
                                <button
                                    onClick={handleAdd}
                                    className="h-9 px-4 sm:px-5 rounded-xl bg-[var(--color-primary)] text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-[var(--color-primary)]/20 disabled:opacity-40 disabled:cursor-not-allowed border border-white/10"
                                >
                                    <Plus className="w-3 h-3" />
                                    <span>Tambah Periode</span>
                                </button>
                            )}
                        </>
                    }
                />

                {/* ── Stats ── */}
                <StatsCarousel count={STAT_CARD_COUNT} cols={4}>
                    {[
                        {
                            icon: StackSimple,
                            label: "Total Periode",
                            value: stats.total,
                            borderColor: "border-t-blue-500",
                            iconBg: "bg-blue-500/10 text-blue-500",
                        },
                        {
                            icon: CheckCircle,
                            label: "Status Aktif",
                            value: stats.active,
                            borderColor: "border-t-emerald-500",
                            iconBg: "bg-emerald-500/10 text-emerald-500",
                        },
                        {
                            icon: GraduationCap,
                            label: "Smt. Ganjil",
                            value: stats.ganjil,
                            borderColor: "border-t-indigo-500",
                            iconBg: "bg-indigo-500/10 text-indigo-500",
                        },
                        {
                            icon: GraduationCap,
                            label: "Smt. Genap",
                            value: stats.genap,
                            borderColor: "border-t-purple-500",
                            iconBg: "bg-purple-500/10 text-purple-500",
                        },
                    ].map((s, i) => (
                        <StatCard
                            key={i}
                            icon={s.icon}
                            label={s.label}
                            value={s.value}
                            borderColor={s.borderColor}
                            iconBg={s.iconBg}
                        />
                    ))}
                </StatsCarousel>

                {/* ── Conflict Detection Badge ── */}
                {(() => {
                    const overlaps = findOverlappingPeriods(years.filter((y) => y.is_active));
                    if (overlaps.length === 0) return null;
                    return (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 mb-4 animate-in fade-in slide-in-from-top-2">
                            <Warning className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <span className="text-[11px] font-black text-red-600">
                                ⚠ {overlaps.length} periode tumpang tindih (overlap) terdeteksi
                            </span>
                            <button
                                onClick={() => setFilterTimeStatus("Sedang Berjalan")}
                                className="ml-auto px-2 py-1 text-[9px] font-black uppercase tracking-wider bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                                Filter
                            </button>
                        </div>
                    );
                })()}

                {/* ── Filter Bar ── */}
                <div className="glass rounded-[1.5rem] mb-4 border border-[var(--color-border)] overflow-hidden">
                    <div className="flex items-center gap-2 p-2.5 lg:p-3">
                        <div className="flex-1 min-w-[120px] transition-all duration-300">
                            <DebouncedSearchInput
                                searchQuery={searchQuery}
                                onSearch={setSearchQuery}
                                inputRef={searchInputRef}
                                isLoading={loading}
                            />
                        </div>

                        {/* Quick Funnel Chips */}
                        <div className="hidden lg:flex flex-none items-center gap-2 overflow-x-auto scrollbar-hide py-0.5 max-w-full">
                            <div className="h-4 w-px bg-[var(--color-border)] mx-1 shrink-0" />

                            <div className="flex items-center gap-1.5 shrink-0">
                                {[
                                    { id: "Ganjil", label: "Ganjil", icon: CaretLeft },
                                    { id: "Genap", label: "Genap", icon: CaretRight },
                                ].map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() =>
                                            setFilterSemester(filterSemester === s.id ? "" : s.id)
                                        }
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${filterSemester === s.id
                                            ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                                            : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)]"
                                            }`}
                                    >
                                        <s.icon
                                            className={`w-3 h-3 ${filterSemester === s.id ? "opacity-100" : "opacity-30"}`}
                                        />
                                        {s.label}
                                    </button>
                                ))}
                            </div>

                            <div className="h-4 w-px bg-[var(--color-border)] mx-1 shrink-0" />

                            <div className="flex items-center gap-1.5 shrink-0">
                                {[
                                    { id: "active", label: "Aktif", icon: CheckCircle },
                                    { id: "inactive", label: "Nonaktif", icon: CircleDashed },
                                ].map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() =>
                                            setFilterStatus(filterStatus === s.id ? "" : s.id)
                                        }
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${filterStatus === s.id
                                            ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                                            : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)]"
                                            }`}
                                    >
                                        <s.icon
                                            className={`w-3 h-3 ${filterStatus === s.id ? "opacity-100" : "opacity-30"}`}
                                        />
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="hidden lg:block w-px h-4 bg-[var(--color-border)] mx-2 shrink-0" />

                        <div className="flex items-center justify-end gap-2 shrink-0 lg:ml-auto">
                            <div className="hidden md:flex items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/20 p-1 shadow-none">
                                <button
                                    onClick={() => setViewMode("table")}
                                    className={`h-7 px-3 rounded-lg flex items-center gap-2 text-[9px] font-black uppercase tracking-wider transition-all ${viewMode === "table" ? "bg-[var(--color-primary)] text-white shadow-md" : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]"}`}
                                >
                                    <List className="w-3 h-3" />
                                    <span>Tabel</span>
                                </button>
                                <button
                                    onClick={() => setViewMode("timeline")}
                                    className={`h-7 px-3 rounded-lg flex items-center gap-2 text-[9px] font-black uppercase tracking-wider transition-all ${viewMode === "timeline" ? "bg-[var(--color-primary)] text-white shadow-md" : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]"}`}
                                >
                                    <ClockClockwise className="w-3 h-3" />
                                    <span>Linimasa</span>
                                </button>
                            </div>

                            <button
                                onClick={toggleSelectAll}
                                className={`h-8 px-2.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 ${selectedIds.length > 0 ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white" : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]"} `}
                                title="Pilih Semua / Batal"
                            >
                                {selectedIds.length > 0 ? (
                                    <Checks className="w-3 h-3" />
                                ) : (
                                    <CheckSquare className="w-3 h-3" />
                                )}
                                <span className="hidden xs:inline">
                                    {selectedIds.length > 0 ? "Terpilih" : "Pilih"}
                                </span>
                                {selectedIds.length > 0 && (
                                    <span className="w-4 h-4 rounded-full bg-white/20 text-white text-[9px] font-black flex items-center justify-center">
                                        {selectedIds.length}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`h-8 px-2.5 sm:px-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 ${isFilterOpen || activeFilterCount > 0 ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/30" : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]"} `}
                            >
                                <SlidersHorizontal className="w-3 h-3" />
                                <span className="hidden xs:inline">Lainnya</span>
                                {activeFilterCount > 0 && (
                                    <span className="w-4 h-4 rounded-full bg-white/30 text-white text-[9px] font-black flex items-center justify-center">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Active Chips */}
                    {(searchQuery ||
                        filterSemester ||
                        filterStatus ||
                        filterLock ||
                        filterTimeStatus ||
                        sortBy !== "name_desc") && (
                            <div className="px-3 pb-3 -mt-1">
                                <div className="flex flex-wrap gap-2">
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery("")}
                                            className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/40 text-[10px] font-black text-[var(--color-text)]"
                                            title="Hapus pencarian"
                                        >
                                            <MagnifyingGlass className="w-3 h-3 opacity-60" />
                                            <span className="max-w-[180px] truncate">
                                                "{searchQuery}"
                                            </span>
                                            <span className="w-5 h-5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] group-hover:text-red-500 transition-colors">
                                                <X className="w-3 h-3" />
                                            </span>
                                        </button>
                                    )}
                                    {filterSemester && (
                                        <button
                                            type="button"
                                            onClick={() => setFilterSemester("")}
                                            className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 text-[10px] font-black text-[var(--color-primary)]"
                                            title="Hapus filter semester"
                                        >
                                            <StackSimple className="w-3 h-3 opacity-70" />
                                            {filterSemester}
                                            <span className="w-5 h-5 rounded-lg bg-white/70 dark:bg-[var(--color-surface)] border border-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)] opacity-70 group-hover:opacity-100 transition-opacity">
                                                <X className="w-3 h-3" />
                                            </span>
                                        </button>
                                    )}
                                    {filterStatus && (
                                        <button
                                            type="button"
                                            onClick={() => setFilterStatus("")}
                                            className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-[10px] font-black text-emerald-600"
                                            title="Hapus filter status"
                                        >
                                            {filterStatus === "active" ? (
                                                <CheckCircle className="w-3 h-3 opacity-70" />
                                            ) : (
                                                <CircleDashed className="w-3 h-3 opacity-70" />
                                            )}
                                            {filterStatus === "active" ? "Aktif" : "Nonaktif"}
                                            <span className="w-5 h-5 rounded-lg bg-white/70 dark:bg-[var(--color-surface)] border border-emerald-500/20 flex items-center justify-center text-emerald-600 opacity-70 group-hover:opacity-100 transition-opacity">
                                                <X className="w-3 h-3" />
                                            </span>
                                        </button>
                                    )}
                                    {filterLock && (
                                        <button
                                            type="button"
                                            onClick={() => setFilterLock("")}
                                            className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-[10px] font-black text-amber-600"
                                            title="Hapus filter kunci"
                                        >
                                            {filterLock === "open" ? (
                                                <Fingerprint className="w-3 h-3 opacity-70" />
                                            ) : (
                                                <EyeSlash className="w-3 h-3 opacity-70" />
                                            )}
                                            {filterLock === "open" ? "Bisa Diedit" : "Terkunci"}
                                            <span className="w-5 h-5 rounded-lg bg-white/70 dark:bg-[var(--color-surface)] border border-amber-500/20 flex items-center justify-center text-amber-600 opacity-70 group-hover:opacity-100 transition-opacity">
                                                <X className="w-3 h-3" />
                                            </span>
                                        </button>
                                    )}
                                    {filterTimeStatus && (
                                        <button
                                            type="button"
                                            onClick={() => setFilterTimeStatus("")}
                                            className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-[10px] font-black text-cyan-600"
                                            title="Hapus filter waktu"
                                        >
                                            <ClockClockwise className="w-3 h-3 opacity-70" />
                                            {filterTimeStatus}
                                            <span className="w-5 h-5 rounded-lg bg-white/70 dark:bg-[var(--color-surface)] border border-cyan-500/20 flex items-center justify-center text-cyan-600 opacity-70 group-hover:opacity-100 transition-opacity">
                                                <X className="w-3 h-3" />
                                            </span>
                                        </button>
                                    )}
                                    {sortBy !== "name_desc" && (
                                        <button
                                            type="button"
                                            onClick={() => setSortBy("name_desc")}
                                            className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-[10px] font-black text-amber-600"
                                            title="Hapus filter urutan"
                                        >
                                            <ArrowCounterClockwise className="w-3 h-3 opacity-70" />
                                            {sortBy === "name_asc" ? "Terlama" : "Terdekat"}
                                            <span className="w-5 h-5 rounded-lg bg-white/70 dark:bg-[var(--color-surface)] border border-amber-500/20 flex items-center justify-center text-amber-600 opacity-70 group-hover:opacity-100 transition-opacity">
                                                <X className="w-3 h-3" />
                                            </span>
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={resetAllFilters}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-red-500/20 bg-red-500/5 text-[10px] font-black text-red-600"
                                        title="Hapus semua filter"
                                    >
                                        <ArrowCounterClockwise className="w-3 h-3" />
                                        Hapus semua
                                    </button>
                                </div>
                            </div>
                        )}

                    {isFilterOpen && (
                        <div className="border-t border-[var(--color-border)] p-3.5 bg-[var(--color-surface-alt)]/60 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-1 h-3.5 bg-[var(--color-primary)] rounded-full" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] flex items-center gap-2">
                                        <SlidersHorizontal className="w-3 h-3 opacity-60" />
                                        Filter Lanjutan
                                    </span>
                                </div>
                                <button
                                    onClick={resetAllFilters}
                                    className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 border border-transparent hover:border-red-100"
                                >
                                    <ArrowCounterClockwise className="w-3 h-3" />
                                    Reset Semua
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-3 mb-3">
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1">
                                        Semester
                                    </label>
                                    <RichSelect
                                        value={filterSemester}
                                        onChange={(val) => {
                                            setFilterSemester(val);
                                            setPage(1);
                                        }}
                                        options={[
                                            { id: "", name: "Semua Semester" },
                                            { id: "Ganjil", name: "Ganjil" },
                                            { id: "Genap", name: "Genap" },
                                        ]}
                                        placeholder="Semua Semester"
                                        small
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1">
                                        Status Aktif
                                    </label>
                                    <RichSelect
                                        value={filterStatus}
                                        onChange={(val) => {
                                            setFilterStatus(val);
                                            setPage(1);
                                        }}
                                        options={[
                                            { id: "", name: "Semua Status" },
                                            { id: "active", name: "Aktif" },
                                            { id: "inactive", name: "Tidak Aktif" },
                                        ]}
                                        placeholder="Semua Status"
                                        small
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1">
                                        Kunci Data
                                    </label>
                                    <RichSelect
                                        value={filterLock}
                                        onChange={(val) => {
                                            setFilterLock(val);
                                            setPage(1);
                                        }}
                                        options={[
                                            { id: "", name: "Semua" },
                                            { id: "open", name: "Bisa Diedit" },
                                            { id: "locked", name: "Terkunci (Read-only)" },
                                        ]}
                                        placeholder="Semua"
                                        small
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1">
                                        Urutkan
                                    </label>
                                    <RichSelect
                                        value={sortBy}
                                        onChange={(val) => setSortBy(val)}
                                        options={[
                                            { id: "name_desc", name: "Terupdate" },
                                            { id: "name_asc", name: "Terlama" },
                                            { id: "start_asc", name: "Terdekat" },
                                        ]}
                                        placeholder="Urutkan"
                                        small
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]/30">
                                <button
                                    onClick={() => setIsFilterOpen(false)}
                                    className="h-8 px-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[9px] font-black uppercase tracking-widest text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-all"
                                >
                                    Tutup Panel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Main Data View ── */}
                <div className="glass rounded-[1.5rem] border border-[var(--color-border)] overflow-hidden">
                    {loading ? (
                        viewMode === "timeline" ? (
                            <div className="p-6 space-y-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <PeriodSkeletonCard key={i} />
                                ))}
                            </div>
                        ) : (
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-[var(--color-surface-alt)] sticky top-0 z-10">
                                        <tr className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                                            <th className="px-6 py-4 text-center w-12">
                                                <div className="w-5 h-5 bg-[var(--color-border)] rounded-lg mx-auto animate-pulse" />
                                            </th>
                                            <th className="px-6 py-4 text-left">
                                                <div className="w-24 h-3 bg-[var(--color-border)] rounded animate-pulse" />
                                            </th>
                                            <th className="px-6 py-4 text-left">
                                                <div className="w-16 h-3 bg-[var(--color-border)] rounded animate-pulse" />
                                            </th>
                                            <th className="px-6 py-4 text-left">
                                                <div className="w-20 h-3 bg-[var(--color-border)] rounded animate-pulse" />
                                            </th>
                                            <th className="px-6 py-4 text-left">
                                                <div className="w-14 h-3 bg-[var(--color-border)] rounded animate-pulse" />
                                            </th>
                                            <th className="px-6 py-4 text-center w-32">
                                                <div className="w-12 h-3 bg-[var(--color-border)] rounded animate-pulse mx-auto" />
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--color-border)]/50">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <PeriodSkeletonRow key={i} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : (
                        <>
                            {viewMode === "timeline" ? (
                                <TimelineView
                                    years={filtered}
                                    onEdit={handleEdit}
                                    onSetActive={handleSetActive}
                                    onDuplicate={handleDuplicate}
                                    onDelete={(y) => {
                                        setItemToDelete(y);
                                        setIsDeleteModalOpen(true);
                                    }}
                                    onToggleLock={handleToggleLock}
                                    onHistory={handleOpenHistory}
                                    canEdit={canEdit}
                                    submitting={isSaving}
                                    isPrivacyMode={isPrivacyMode}
                                    maskValue={maskValue}
                                />
                            ) : (
                                <>
                                    <div className="hidden md:block overflow-x-auto">
                                        <table ref={tableRef} className="w-full text-sm">
                                            <thead className="bg-[var(--color-surface-alt)] sticky top-0 z-10">
                                                <tr className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                                                    <th className="px-6 py-4 text-center w-12">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                selectedIds.length === paged.length &&
                                                                paged.length > 0
                                                            }
                                                            onChange={toggleSelectAll}
                                                            className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] accent-[var(--color-primary)] cursor-pointer"
                                                        />
                                                    </th>
                                                    {visibleCols.period && (
                                                        <th className="px-6 py-4 text-left">
                                                            Tahun Pelajaran
                                                        </th>
                                                    )}
                                                    {visibleCols.semester && (
                                                        <th className="px-6 py-4 text-left">Semester</th>
                                                    )}
                                                    {visibleCols.duration && (
                                                        <th className="px-6 py-4 text-left">Pelaksanaan</th>
                                                    )}
                                                    {visibleCols.registration && (
                                                        <th className="px-6 py-4 text-left">Pendaftaran</th>
                                                    )}
                                                    {visibleCols.status && (
                                                        <th className="px-6 py-4 text-left">Status</th>
                                                    )}
                                                    <th className="px-6 py-4 text-center pr-6 w-32 relative">
                                                        <div className="flex items-center justify-center">
                                                            <span>Aksi</span>
                                                        </div>
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                            <button
                                                                ref={colMenuRef}
                                                                onClick={(e) => {
                                                                    const rect =
                                                                        e.currentTarget.getBoundingClientRect();
                                                                    const menuHeight = 220;
                                                                    const spaceBelow =
                                                                        window.innerHeight - rect.bottom;
                                                                    const showUp =
                                                                        spaceBelow < menuHeight &&
                                                                        rect.top > menuHeight;
                                                                    setColMenuPos({
                                                                        top: showUp
                                                                            ? rect.top +
                                                                            window.scrollY -
                                                                            menuHeight -
                                                                            8
                                                                            : rect.bottom + window.scrollY + 8,
                                                                        right:
                                                                            window.innerWidth -
                                                                            rect.right -
                                                                            window.scrollX,
                                                                        showUp,
                                                                    });
                                                                    setIsColMenuOpen((p) => !p);
                                                                }}
                                                                title="Atur tampilan kolom"
                                                                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${isColMenuOpen ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"}`}
                                                            >
                                                                <svg
                                                                    width="11"
                                                                    height="11"
                                                                    viewBox="0 0 12 12"
                                                                    fill="currentColor"
                                                                >
                                                                    <rect
                                                                        x="0"
                                                                        y="0"
                                                                        width="5"
                                                                        height="5"
                                                                        rx="1"
                                                                    />
                                                                    <rect
                                                                        x="7"
                                                                        y="0"
                                                                        width="5"
                                                                        height="5"
                                                                        rx="1"
                                                                    />
                                                                    <rect
                                                                        x="0"
                                                                        y="7"
                                                                        width="5"
                                                                        height="5"
                                                                        rx="1"
                                                                    />
                                                                    <rect
                                                                        x="7"
                                                                        y="7"
                                                                        width="5"
                                                                        height="5"
                                                                        rx="1"
                                                                    />
                                                                </svg>
                                                            </button>
                                                            {isColMenuOpen &&
                                                                createPortal(
                                                                    <div
                                                                        ref={colMenuPortalRef}
                                                                        className={`absolute z-[9999] w-48 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl shadow-black/10 p-2 space-y-0.5 animate-in fade-in zoom-in-95 ${colMenuPos.showUp ? "slide-in-from-bottom-2" : "slide-in-from-top-2"}`}
                                                                        style={{
                                                                            top: colMenuPos.top,
                                                                            right: colMenuPos.right,
                                                                        }}
                                                                    >
                                                                        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] px-3 py-2">
                                                                            Atur Kolom
                                                                        </p>
                                                                        {[
                                                                            {
                                                                                key: "period",
                                                                                label: "Tahun Pelajaran",
                                                                            },
                                                                            { key: "semester", label: "Semester" },
                                                                             { key: "duration", label: "Pelaksanaan" },
                                                                             { key: "registration", label: "Pendaftaran" },
                                                                             { key: "status", label: "Status" },
                                                                         ].map(({ key, label }) => (
                                                                            <button
                                                                                key={key}
                                                                                onClick={() =>
                                                                                    setVisibleCols((p) => ({
                                                                                        ...p,
                                                                                        [key]: !p[key],
                                                                                    }))
                                                                                }
                                                                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[var(--color-surface-alt)] transition-all group text-left"
                                                                            >
                                                                                <span className="text-[11px] font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                                                                                    {label}
                                                                                </span>
                                                                                <div
                                                                                    className={`w-8 h-4.5 rounded-full transition-all flex items-center px-0.5 ${visibleCols[key] ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"}`}
                                                                                >
                                                                                    <div
                                                                                        className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all ${visibleCols[key] ? "translate-x-[14px]" : "translate-x-0"}`}
                                                                                    />
                                                                                </div>
                                                                            </button>
                                                                        ))}
                                                                    </div>,
                                                                    document.body,
                                                                )}
                                                        </div>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {isEmpty ? (
                                                    <tr>
                                                        <td colSpan={1 + Object.values(visibleCols).filter(Boolean).length + 1} className="py-24 text-center">
                                                            <EmptyState
                                                                icon={MagnifyingGlass}
                                                                title="Tidak ada data ditemukan"
                                                                description="Sesuaikan filter atau kata kunci pencarian Anda"
                                                                color="slate"
                                                                variant="plain"
                                                            />
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    paged.map((year) => {
                                                        const isSelected = selectedIds.includes(year.id);
                                                        return (
                                                            <tr
                                                                key={year.id}
                                                                data-row-id={year.id}
                                                                className={`border-t border-[var(--color-border)] transition-colors group/row ${isSelected ? "bg-[var(--color-primary)]/5" : "hover:bg-[var(--color-surface-alt)]/40"}`}
                                                            >
                                                                <td className="px-6 py-4">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedIds.includes(year.id)}
                                                                        onChange={() => toggleSelect(year.id)}
                                                                        className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] accent-[var(--color-primary)] cursor-pointer"
                                                                    />
                                                                </td>
                                                                {visibleCols.period && (
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex items-start gap-3">
                                                                            <div
                                                                                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shadow-sm relative transition-transform hover:scale-110 shrink-0 ${year.is_active ? "bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 text-[var(--color-primary)]" : "bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]"}`}
                                                                            >
                                                                                <span className="relative z-10">
                                                                                    {isPrivacyMode
                                                                                        ? "??"
                                                                                        : year.academic_year?.slice(2, 4) ||
                                                                                        "??"}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex flex-col min-w-0 flex-1">
                                                                                <span className="font-extrabold text-[var(--color-text)] leading-snug truncate">
                                                                                    <PrivacyValue active={isPrivacyMode}>
                                                                                        {year.academic_year}
                                                                                    </PrivacyValue>
                                                                                </span>
                                                                                <p className="text-[10px] text-[var(--color-text-muted)] font-mono opacity-60 uppercase tracking-wider mt-1">
                                                                                    <span className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded-md mr-1 ${year.semester === "Ganjil" ? "bg-indigo-500/10 text-indigo-600" : "bg-purple-500/10 text-purple-600"}`}>
                                                                                        {maskValue(year.semester, "semester")}
                                                                                    </span>
                                                                                    {maskValue(`ID: ${year.id}`, "id")}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                )}
                                                                {visibleCols.semester && (
                                                                    <td className="px-6 py-4">
                                                                        <InlineCell
                                                                            id={year.id}
                                                                            field="semester"
                                                                            value={year.semester}
                                                                            displayValue={year.semester}
                                                                            type="select"
                                                                            options={[
                                                                                { value: "Ganjil", label: "Ganjil" },
                                                                                { value: "Genap", label: "Genap" },
                                                                            ]}
                                                                            canEdit={!year.is_locked}
                                                                            className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border ${year.semester === "Ganjil" ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" : "bg-purple-500/10 text-purple-600 border-purple-500/20"}`}
                                                                        />
                                                                    </td>
                                                                )}
                                                                {visibleCols.duration && (
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex flex-col">
                                                                            <span
                                                                                className={`text-[11px] font-bold text-[var(--color-text)] whitespace-nowrap ${isPrivacyMode ? "blur-sm select-none" : ""}`}
                                                                            >
                                                                                <InlineCell
                                                                                    id={year.id}
                                                                                    field="start_date"
                                                                                    value={year.start_date}
                                                                                    displayValue={formatDate(year.start_date)}
                                                                                    type="date"
                                                                                    canEdit={!year.is_locked}
                                                                                />
                                                                                {" — "}
                                                                                <InlineCell
                                                                                    id={year.id}
                                                                                    field="end_date"
                                                                                    value={year.end_date}
                                                                                    displayValue={formatDate(year.end_date)}
                                                                                    type="date"
                                                                                    canEdit={!year.is_locked}
                                                                                />
                                                                            </span>
                                                                            <span
                                                                                className={`text-[10px] text-[var(--color-text-muted)] mt-0.5 ${isPrivacyMode ? "blur-sm select-none" : ""}`}
                                                                            >
                                                                                {getDuration(
                                                                                    year.start_date,
                                                                                    year.end_date,
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                )}
                                                                {visibleCols.registration && (
                                                                    <td className="px-6 py-4">
                                                                        <span className={`text-[11px] font-bold text-[var(--color-text)] whitespace-nowrap ${isPrivacyMode ? "blur-sm select-none" : ""}`}>
                                                                            {year.registration_start
                                                                                ? `${formatDate(year.registration_start)} — ${formatDate(year.registration_end)}`
                                                                                : "—"}
                                                                        </span>
                                                                    </td>
                                                                )}
                                                                {visibleCols.status && (
                                                                    <td className="px-6 py-4 text-left">
                                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                                            {year.is_active ? (
                                                                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg">
                                                                                    Aktif
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] border border-[var(--color-border)] rounded-lg">
                                                                                    Tidak Aktif
                                                                                </span>
                                                                            )}
                                                                            {year.is_locked && (
                                                                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg flex items-center gap-1">
                                                                                    <Lock className="w-2 h-2" /> Terkunci
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                )}
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        {canEdit && !year.is_locked && (
                                                                            <button
                                                                                onClick={() => handleEdit(year)}
                                                                                title="Edit"
                                                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-blue-500 hover:bg-blue-500/10 transition-all text-sm"
                                                                            >
                                                                                <Pencil />
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            onClick={() => handleOpenHistory(year)}
                                                                            title="Riwayat"
                                                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-purple-500 hover:bg-purple-500/10 transition-all text-sm"
                                                                        >
                                                                            <ClockCounterClockwise />
                                                                        </button>
                                                                        {canEdit && (
                                                                            <button
                                                                                onClick={() => handleToggleLock(year)}
                                                                                title={year.is_locked ? "Buka Kunci" : "Kunci"}
                                                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all text-sm ${year.is_locked ? "text-emerald-500 hover:bg-emerald-500/10" : "text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-rose-500/10"}`}
                                                                            >
                                                                                {year.is_locked ? <LockOpen /> : <Lock />}
                                                                            </button>
                                                                        )}
                                                                        {canEdit && !year.is_locked && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    setItemToDelete(year);
                                                                                    setIsDeleteModalOpen(true);
                                                                                }}
                                                                                title="Hapus"
                                                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all text-sm"
                                                                            >
                                                                                <Trash />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="md:hidden divide-y divide-[var(--color-border)]">
                                        {paged.map((year) => {
                                            const isSelected = selectedIds.includes(year.id);
                                            return (
                                                <div
                                                    key={year.id}
                                                    className={`p-4 transition-colors group/mob ${isSelected ? "bg-[var(--color-primary)]/5" : ""}`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex flex-col items-center gap-3 pt-1">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedIds.includes(year.id)}
                                                                onChange={() => toggleSelect(year.id)}
                                                                className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] accent-[var(--color-primary)] cursor-pointer shrink-0 mt-1"
                                                            />
                                                        </div>
                                                        <div
                                                            className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-black shadow-sm relative transition-transform shrink-0 ${year.is_active ? "bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 text-[var(--color-primary)]" : "bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]"}`}
                                                        >
                                                            <span className="relative z-10">
                                                                {year.academic_year?.slice(2, 4) || "??"}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div
                                                                    className="min-w-0 flex-1"
                                                                    onClick={() => handleOpenReadOnlyDetail(year)}
                                                                >
                                                                    <button className="font-extrabold text-sm text-[var(--color-text)] hover:text-[var(--color-primary)] text-left truncate block w-full">
                                                                        {year.academic_year}
                                                                    </button>
                                                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                                        <span
                                                                            className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest border ${year.semester === "Ganjil" ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" : "bg-purple-500/10 text-purple-600 border-purple-500/20"}`}
                                                                        >
                                                                            {year.semester}
                                                                        </span>
                                                                        <span className="text-[10px] font-bold text-[var(--color-text-muted)]">
                                                                            {formatDate(year.start_date)} —{" "}
                                                                            {formatDate(year.end_date)}
                                                                        </span>
                                                                        {year.registration_start && (
                                                                            <span className="text-[10px] font-bold text-[var(--color-text-muted)]">
                                                                                Daftar: {formatDate(year.registration_start)} — {formatDate(year.registration_end)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[10px] text-[var(--color-text-muted)] font-mono mt-1 opacity-60 uppercase tracking-widest">
                                                                        ID: {year.id}
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    {canEdit && !year.is_locked && (
                                                                        <button
                                                                            onClick={() => handleEdit(year)}
                                                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]"
                                                                        >
                                                                            <Pencil className="text-xs" />
                                                                        </button>
                                                                    )}
                                                                    {canEdit && (
                                                                        <button
                                                                            onClick={() => handleToggleLock(year)}
                                                                            title={year.is_locked ? "Buka Kunci" : "Kunci"}
                                                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${year.is_locked ? "text-emerald-500 hover:bg-emerald-500/10" : "text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-rose-500/10"}`}
                                                                        >
                                                                            {year.is_locked ? <LockOpen className="text-xs" /> : <Lock className="text-xs" />}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="mt-3 flex items-center gap-2">
                                                                {year.is_active ? (
                                                                    <div className="flex-1 h-9 rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                                                        Aktif
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex-1 h-9 rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                                                                        Tidak Aktif
                                                                    </div>
                                                                )}
                                                                <button
                                                                    onClick={() => handleOpenHistory(year)}
                                                                    className="flex-1 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                                                                >
                                                                    <ClockCounterClockwise className="text-xs" />{" "}
                                                                    Riwayat
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                    <Pagination
                        totalRows={totalRows}
                        page={page}
                        pageSize={pageSize}
                        setPage={setPage}
                        setPageSize={setPageSize}
                        label="data"
                        jumpPage={jumpPage}
                        setJumpPage={setJumpPage}
                    />
                </div>

                {/* ── Modals ── */}
                <PeriodFormModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedItem(null);
                    }}
                    selectedItem={selectedItem}
                    years={years}
                    onSubmit={handleSubmit}
                    submitting={isSaving}
                />
                <ArchiveModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => {
                        setIsDeleteModalOpen(false);
                        setItemToDelete(null);
                    }}
                    selectedItem={itemToDelete}
                    onConfirm={handleDeleteConfirm}
                    submitting={isDeleting}
                />

                <Modal
                    isOpen={isReadOnlyDetailOpen}
                    onClose={() => {
                        setIsReadOnlyDetailOpen(false);
                        setReadOnlyDetailItem(null);
                    }}
                    title="Detail Tahun Pelajaran"
                    size="full"
                    mobileVariant="bottom-sheet"
                >
                    {readOnlyDetailItem &&
                        (() => {
                            return (
                                <div className="space-y-4 pb-2">
                                    <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                                                Tahun Pelajaran
                                            </p>
                                            <h4 className="w-5 h-5 font-black text-[var(--color-text)] leading-tight truncate">
                                                {readOnlyDetailItem.academic_year}
                                            </h4>
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                <span
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${readOnlyDetailItem.semester === "Ganjil" ? "bg-blue-500/10 text-blue-600 border border-blue-500/20" : "bg-purple-500/10 text-purple-600 border border-purple-500/20"}`}
                                                >
                                                    Semester {readOnlyDetailItem.semester}
                                                </span>
                                            </div>
                                        </div>
                                        <div
                                            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 ${readOnlyDetailItem.is_active ? "bg-[var(--color-primary)] text-white shadow-md" : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)]"}`}
                                        >
                                            {readOnlyDetailItem.academic_year?.slice(2, 4) || "??"}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2">
                                                Periode
                                            </p>
                                            <div className="w-3 h-3 font-bold">
                                                {formatDate(readOnlyDetailItem.start_date)} —{" "}
                                                {formatDate(readOnlyDetailItem.end_date)}
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2">
                                                Durasi
                                            </p>
                                            <div className="w-3 h-3 font-black">
                                                {getDuration(
                                                    readOnlyDetailItem.start_date,
                                                    readOnlyDetailItem.end_date,
                                                )}
                                            </div>
                                        </div>
                                        {readOnlyDetailItem.registration_start && (
                                            <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2">
                                                    Pendaftaran
                                                </p>
                                                <div className="w-3 h-3 font-bold">
                                                    {formatDate(readOnlyDetailItem.registration_start)} —{" "}
                                                    {formatDate(readOnlyDetailItem.registration_end)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setIsReadOnlyDetailOpen(false);
                                            handleOpenHistory(readOnlyDetailItem);
                                        }}
                                        className="w-full h-12 rounded-xl bg-indigo-500/10 text-indigo-600 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-indigo-500/20"
                                    >
                                        <ClockCounterClockwise />
                                        Riwayat Perubahan
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsReadOnlyDetailOpen(false);
                                            setReadOnlyDetailItem(null);
                                        }}
                                        className="w-full h-12 rounded-xl bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] font-black text-[10px] uppercase tracking-widest transition-all"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            );
                        })()}
                </Modal>

                <Modal
                    isOpen={isHistoryOpen}
                    onClose={() => {
                        setIsHistoryOpen(false);
                        setHistoryItem(null);
                    }}
                    title={`Riwayat · ${historyItem?.academic_year || ""}`}
                    description="Audit log untuk rekaman ini."
                    icon={Fingerprint}
                    iconBg="bg-orange-500/10"
                    iconColor="text-orange-500"
                    size="md"
                >
                    {historyItem && (
                        <div className="h-[40vh] min-h-[200px] overflow-auto">
                            <AuditTimeline
                                tableName="periods"
                                recordId={historyItem.id}
                                limit={30}
                            />
                        </div>
                    )}
                </Modal>

                <Modal
                    isOpen={isBulkDeleteOpen}
                    onClose={() => setIsBulkDeleteOpen(false)}
                    title="Arsipkan Massal"
                    description={`Pindahkan ${selectedIds.length} data ke arsip.`}
                    icon={Archive}
                    iconBg="bg-red-500/10"
                    iconColor="text-red-500"
                    size="sm"
                    footer={
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsBulkDeleteOpen(false)}
                                className="h-9 px-4 rounded-xl border border-[var(--color-border)] text-[10px] font-black text-[var(--color-text-muted)] transition-all"
                            >
                                Batal
                            </button>
                            <div className="flex-1" />
                            <button
                                onClick={handleBulkDelete}
                                disabled={isDeleting}
                                className="h-9 px-5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-[10px] transition-all flex items-center gap-2"
                            >
                                Arsipkan Sekarang
                            </button>
                        </div>
                    }
                >
                    <p className="text-[11px] font-bold text-red-700/70 p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                        Anda akan mengarsipkan{" "}
                        <span className="font-black text-red-600">
                            {selectedIds.length} tahun pelajaran
                        </span>{" "}
                        secara bersamaan.
                    </p>
                </Modal>

                <PeriodArchiveModal
                    isOpen={isArchivedOpen}
                    onClose={() => setIsArchivedOpen(false)}
                    archivedYears={archivedYears}
                    loadingArchived={loadingArchived}
                    setArchivedYears={setArchivedYears}
                    fetchArchivedYears={fetchArchived}
                    fetchData={fetchData}
                    addToast={addToast}
                />

                <ConfirmDialog
                    isOpen={isGenerateConfirmOpen}
                    onClose={() => setIsGenerateConfirmOpen(false)}
                    onConfirm={() => {
                        setIsGenerateConfirmOpen(false);
                        handleGenerateNextYear();
                    }}
                    title="Generate Tahun Pelajaran Baru"
                    description={`Buat Periode untuk tahun berikutnya secara otomatis.`}
                    icon={ArrowClockwise}
                    iconBg="bg-indigo-500/10"
                    iconColor="text-indigo-500"
                    confirmText="Generate Sekarang"
                    confirmIcon={ArrowClockwise}
                    confirmClassName="h-9 px-5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    submitting={isSaving}
                >
                    <p className="text-[11px] text-[var(--color-text-muted)] p-4 rounded-2xl bg-[var(--color-surface-alt)]/50 border border-[var(--color-border)]">
                        Sistem akan membuat{" "}
                        <span className="font-black text-[var(--color-text)]">2 periode baru</span>{" "}
                        (Ganjil + Genap) berdasarkan tahun pelajaran terakhir yang ada.
                    </p>
                </ConfirmDialog>

                <React.Suspense fallback={null}>
                    {isExportModalOpen && (
                        <LazyPeriodExportModal
                            isOpen={isExportModalOpen}
                            onClose={() => {
                                if (exporting) return;
                                setIsExportModalOpen(false);
                            }}
                            years={filtered}
                            selectedIds={selectedIds}
                            exportScope={exportScope}
                            setExportScope={setExportScope}
                            exportColumns={exportColumns}
                            setExportColumns={setExportColumns}
                            exporting={exporting}
                            handleExportCSV={handleExportCSV}
                            handleExportExcel={handleExportExcel}
                            handleExportPDF={handleExportPDF}
                            addToast={addToast}
                        />
                    )}
                    {isImportModalOpen && (
                        <LazyPeriodImportModal
                            isOpen={isImportModalOpen}
                            onClose={() => {
                                if (importing) return;
                                setIsImportModalOpen(false);
                                setImportPreview([]);
                                setImportIssues([]);
                                setImportFileName("");
                                setImportDragOver(false);
                                setImportStep(1);
                            }}
                            importing={importing}
                            importStep={importStep}
                            setImportStep={setImportStep}
                            importPreview={importPreview}
                            importFileName={importFileName}
                            importFileInputRef={importFileInputRef}
                            importDragOver={importDragOver}
                            setImportDragOver={setImportDragOver}
                            processImportFile={processImportFile}
                            handleDownloadTemplate={handleDownloadTemplate}
                            importFileHeaders={importFileHeaders}
                            SYSTEM_COLS={SYSTEM_COLS}
                            importColumnMapping={importColumnMapping}
                            setImportColumnMapping={setImportColumnMapping}
                            importRawData={importRawData}
                            importLoading={importLoading}
                            setImportLoading={setImportLoading}
                            buildImportPreview={buildImportPreview}
                            importIssues={importIssues}
                            importValidationOpen={importValidationOpen}
                            setImportValidationOpen={setImportValidationOpen}
                            importProgress={importProgress}
                            handleCommitImport={handleCommitImport}
                            handleImportClick={handleImportClick}
                            hasImportBlockingErrors={hasImportBlockingErrors}
                            importReadyRows={importReadyRows}
                            handleImportCellEdit={handleImportCellEdit}
                            importEditCell={importEditCell}
                            setImportEditCell={setImportEditCell}
                            handleRemoveImportRow={handleRemoveImportRow}
                            importSkipDupes={importSkipDupes}
                            setImportSkipDupes={setImportSkipDupes}
                        />
                    )}
                </React.Suspense>
            </div>
        </DashboardLayout>
    );
}
