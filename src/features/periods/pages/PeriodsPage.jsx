import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
    Archive,
    Calendar,
    CheckCircle,
    Eye,
    EyeSlash,
    Keyboard,
    Lock,
    LockOpen,
    ArrowClockwise,
    ArrowsLeftRight,
    Plus,
    Pencil,
    SlidersHorizontal,
    Warning,
    MagnifyingGlass,
    Clock,
} from "@phosphor-icons/react";
import { createPortal } from "react-dom";

import DashboardLayout from "@core/layouts/DashboardLayout";
import { useToast } from "@context/Toast";
import { findOverlappingPeriods, findPeriodGaps } from "@features/periods/utils/periodValidation";
import {
    Badge,
    Checkbox,
    EmptyState,
    PageHeader,
    Pagination,
    BulkActionsBar,
    StatsInline,
    ConfirmDialog,
    Alert,
} from "@shared/components";
import PeriodFormModal from "@features/periods/components/PeriodFormModal";
import { ArchiveModal, LockModal, UnlockModal, ShiftDatesModal } from "@features/periods/components/PeriodConfirmModals";
import { usePeriodsCore } from "@features/periods/hooks/usePeriodsCore";
import { usePeriodsKeyboard } from "@features/periods/hooks/usePeriodsKeyboard";
import { usePeriodsModals } from "@features/periods/hooks/usePeriodsModals";
import { usePeriodsImportExport, SYSTEM_COLS } from "@features/periods/hooks/usePeriodsImportExport";

import PeriodsToolbar from "@features/periods/components/PeriodsToolbar";
import PeriodsTimeline from "@features/periods/components/PeriodsTimeline";
import PeriodsCalendar from "@features/periods/components/PeriodsCalendar";
import PeriodsTable from "@features/periods/components/PeriodsTable";
import PeriodsHeaderMenu from "@features/periods/components/PeriodsHeaderMenu";
import PeriodsShortcutMenu from "@features/periods/components/PeriodsShortcutMenu";
import PeriodsReadOnlyDetail, { PeriodsHistoryModal } from "@features/periods/components/PeriodsReadOnlyDetail";
import PeriodTemplateModal from "@features/periods/components/PeriodTemplateModal";
import { usePeriodsNotifications } from "@features/periods/hooks/usePeriodsNotifications";
import { usePeriodTemplates } from "@features/periods/hooks/usePeriodTemplates";

const LazyPeriodComparisonModal = React.lazy(
    () => import("@features/periods/components/PeriodComparisonModal"),
);
const LazyPeriodBulkEditModal = React.lazy(
    () => import("@features/periods/components/PeriodBulkEditModal"),
);
const LazyPeriodArchiveModal = React.lazy(
    () => import("@features/periods/components/PeriodArchiveModal"),
);
const LazyPeriodExportModal = React.lazy(
    () => import("@features/periods/components/PeriodExportModal"),
);
const LazyPeriodImportModal = React.lazy(
    () => import("@features/periods/components/PeriodImportModal"),
);

function PeriodSkeletonRow() {
    return (
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
}

function PeriodSkeletonCard() {
    return (
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
}

export default function PeriodsPage() {
    const { addToast, addUndoToast } = useToast();

    // ── Core Hook ──
    const {
        years, archivedYears, setArchivedYears, loading, stats, fetchData, fetchArchived,
        isSaving, isDeleting, isMutating, canEdit, moduleEnabled,
        searchQuery, setSearchQuery, filterSemester, setFilterSemester,
        filterStatus, setFilterStatus, filterLock, setFilterLock,
        filterTimeStatus, setFilterTimeStatus,
        dateFrom, setDateFrom, dateTo, setDateTo,
        sortBy, setSortBy,
        isFilterOpen, setIsFilterOpen, activeFilterCount, resetAllFilters,
        page, setPage, jumpPage, setJumpPage, pageSize, setPageSize,
        totalRows, paged, filtered,
        selectedIds, setSelectedIds, selectedItems, toggleSelect, toggleSelectAll,
        visibleCols, setVisibleCols, isColMenuOpen, setIsColMenuOpen,
        colMenuPos, setColMenuPos, colMenuRef, colMenuPortalRef,
        isPrivacyMode, setIsPrivacyMode, togglePrivacyMode, maskValue,
        isShortcutOpen, setIsShortcutOpen, isHeaderMenuOpen, setIsHeaderMenuOpen,
        headerMenuBtnRef, shortcutBtnRef, headerMenuRect, setHeaderMenuRect,
        shortcutRect, setShortcutRect,
        headerMenuMounted, searchInputRef, viewMode, setViewMode,
        selectedItem, setSelectedItem, itemToDelete, setItemToDelete,
        readOnlyDetailItem, setReadOnlyDetailItem, historyItem, setHistoryItem, periodUsageStats,
        isModalOpen, setIsModalOpen, isDeleteModalOpen, setIsDeleteModalOpen,
        isArchivedOpen, setIsArchivedOpen, loadingArchived,
        isBulkDeleteOpen, setIsBulkDeleteOpen, isReadOnlyDetailOpen, setIsReadOnlyDetailOpen,
        isHistoryOpen, setIsHistoryOpen, isGenerateConfirmOpen, setIsGenerateConfirmOpen,
        inlineEditCell, setInlineEditCell, saveStatus, lastChange,
        expiredActive, suggestedNext,
        handleAdd, handleEdit, handleDuplicate, handleSubmit,
        handleSetActive, handleInlineSave, handleToggleLock, handleQuickToggleActive,
        handleDeleteConfirm, handleBulkEdit, handleBulkDelete, handleBulkSetActive,
        handleBulkLock, handleBulkUnlock, handleBulkShiftDates, handleGenerateNextYear,
        handleUndo, handleRedo, undoStack, redoStack,
        handleOpenReadOnlyDetail, handleOpenHistory,
        handleQuickDuplicate, togglePin, pinnedIds,
        formatDate, getDuration, getTimeStatus, getPeriodStats, handleError,
        columnOrder, moveColumnLeft, moveColumnRight,
        reminderDays, setReminderDays,
    } = usePeriodsCore({ addToast, addUndoToast });

    // ── Modal State ──
    const {
        isImportModalOpen, setIsImportModalOpen,
        isExportModalOpen, setIsExportModalOpen,
        isLockModalOpen, setIsLockModalOpen,
        isUnlockModalOpen, setIsUnlockModalOpen,
        isShiftModalOpen, setIsShiftModalOpen,
        isCompareOpen, setIsCompareOpen,
        itemToDuplicate, setItemToDuplicate,
        compareItems, setCompareItems,
        isBulkEditOpen, setIsBulkEditOpen,
        batchCount, setBatchCount,
        isActivateConfirmOpen, setIsActivateConfirmOpen,
        activateTarget, setActivateTarget,
        openCompare,
        openActivateConfirm,
        closeActivateConfirm,
        resetBatchCount,
    } = usePeriodsModals();

    const [searchParams, setSearchParams] = useSearchParams();

    const handleQuickFilterYear = useCallback((year) => {
        setSearchQuery(year);
        setPage(1);
    }, [setSearchQuery, setPage]);

    const handleDuplicateClick = useCallback((item) => {
        setItemToDuplicate(item);
    }, [setItemToDuplicate]);

    const handleDuplicateConfirm = useCallback(() => {
        if (itemToDuplicate) {
            handleQuickDuplicate(itemToDuplicate);
            setItemToDuplicate(null);
        }
    }, [itemToDuplicate, handleQuickDuplicate, setItemToDuplicate]);

    const duplicatePreview = useMemo(() => {
        if (!itemToDuplicate) return null;
        const match = itemToDuplicate.academic_year.match(/(\d{4})\/(\d{4})/);
        if (!match) return null;
        const nextStart = parseInt(match[1]) + 1;
        const nextEnd = parseInt(match[2]) + 1;
        const shiftDate = (d) => {
            if (!d) return null;
            const date = new Date(d);
            date.setFullYear(date.getFullYear() + 1);
            return date.toISOString().split("T")[0];
        };
        return {
            academic_year: `${nextStart}/${nextEnd}`,
            start_date: shiftDate(itemToDuplicate.start_date),
            end_date: shiftDate(itemToDuplicate.end_date),
        };
    }, [itemToDuplicate]);

    // ── Import/Export Hook ──
    const {
        importStep, setImportStep, importFileName, setImportFileName,
        importRawData, importFileHeaders,
        importColumnMapping, setImportColumnMapping, importPreview, setImportPreview,
        importIssues, setImportIssues, importLoading, setImportLoading,
        importValidationOpen, setImportValidationOpen, importDragOver, setImportDragOver,
        importing, importProgress,
        importEditCell, setImportEditCell,
        importDiffPreview, setImportDiffPreview,
        exportScope, setExportScope, exportColumns, setExportColumns, exporting, exportError,
        importReadyRows, hasImportBlockingErrors, importFileInputRef,
        handleImportClick, handleFileChange, processImportFile, buildImportPreview,
        handleImportCellEdit, handleRemoveImportRow, handleDownloadTemplate, handleCommitImport,
        handleExportCSV, handleExportExcel, handleExportPDF, handleExportICS,
        getExportData,
    } = usePeriodsImportExport({
        years, filtered, selectedIds, canEdit, fetchData, addToast,
        handleError,
        isImportModalOpen, setIsImportModalOpen,
        isExportModalOpen, setIsExportModalOpen,
    });

    // ── Notifikasi Terjadwal ───────────────────────────────────────────
    usePeriodsNotifications({ years, reminderDays, addToast });

    // ── Template Periode ────────────────────────────────────────────────
    const {
        templates,
        isModalOpen: isTemplateModalOpen,
        setIsModalOpen: setIsTemplateModalOpen,
        saveTemplate,
        deleteTemplate,
        applyTemplate,
    } = usePeriodTemplates({ addToast });

    // ── Keyboard Shortcuts ─────────────────────────────────────────────
    usePeriodsKeyboard({
        setIsPrivacyMode,
        handleUndo,
        handleRedo,
        undoStack,
        redoStack,
        canEdit,
        handleAdd,
        searchInputRef,
        setViewMode,
        selectedIds,
        setIsBulkDeleteOpen,
    });

    // ── Deep-linking: ?period=uuid ────────────────────────────────────
    useEffect(() => {
        const periodId = searchParams.get("period")
        if (!periodId || !years.length || loading) return
        const found = years.find(y => y.id === periodId)
        if (found) {
            setReadOnlyDetailItem(found)
            setIsReadOnlyDetailOpen(true)
            // Hapus param dari URL
            const next = new URLSearchParams(searchParams)
            next.delete("period")
            setSearchParams(next, { replace: true })
        }
    }, [searchParams, years, loading, setSearchParams])

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

    const selectedItemsData = useMemo(() => selectedIds.map(id => years.find(y => y.id === id)).filter(Boolean), [selectedIds, years]);
    const allLocked = useMemo(() => selectedItemsData.length > 0 && selectedItemsData.every(y => y.is_locked), [selectedItemsData]);
    const allUnlocked = useMemo(() => selectedItemsData.length > 0 && selectedItemsData.every(y => !y.is_locked), [selectedItemsData]);
    const singleItem = useMemo(() => selectedIds.length === 1 ? years.find(y => y.id === selectedIds[0]) : null, [selectedIds, years]);

    const activePeriods = useMemo(() => years.filter((y) => y.is_active), [years]);
    const overlaps = useMemo(() => findOverlappingPeriods(activePeriods), [activePeriods]);
    const gaps = useMemo(() => findPeriodGaps(years), [years]);
    return (
        <DashboardLayout title="Tahun Pelajaran">
            <div className="space-y-4 max-w-[1800px] mx-auto relative">
                {selectedIds.length > 0 && (
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
                            icon: <Archive className="w-3.5 h-3.5" />,
                            variant: "destructive",
                            onClick: () => setIsBulkDeleteOpen(true),
                            disabled: !canEdit || isMutating,
                        }}
                        secondaryActions={[
                            {
                                label: "Aktifkan",
                                icon: <CheckCircle className="w-3.5 h-3.5" />,
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
                                                : undefined,
                            },
                            {
                                label: "Kunci",
                                icon: <Lock className="w-3.5 h-3.5" />,
                                variant: "default",
                                onClick: () => setIsLockModalOpen(true),
                                disabled: !canEdit || isMutating || selectedIds.length === 0 || allLocked,
                                title: allLocked ? "Semua sudah terkunci" : undefined,
                            },
                            {
                                label: "Buka",
                                icon: <LockOpen className="w-3.5 h-3.5" />,
                                variant: "default",
                                onClick: () => setIsUnlockModalOpen(true),
                                disabled: !canEdit || isMutating || selectedIds.length === 0 || allUnlocked,
                                title: allUnlocked ? "Semua sudah terbuka" : undefined,
                            },
                            {
                                label: "Edit Massal",
                                icon: <Pencil className="w-3.5 h-3.5" />,
                                variant: "default",
                                onClick: () => setIsBulkEditOpen(true),
                                disabled: !canEdit || isMutating || selectedIds.length === 0,
                            },
                            {
                                label: "Shift Tanggal",
                                icon: <Calendar className="w-3.5 h-3.5" />,
                                variant: "default",
                                onClick: () => setIsShiftModalOpen(true),
                                disabled: !canEdit || isMutating || selectedIds.length === 0,
                            },
                            {
                                label: "Bandingkan",
                                icon: <ArrowsLeftRight className="w-3.5 h-3.5" />,
                                variant: "default",
                                onClick: () => {
                                    const items = selectedIds.map((id) => years.find((y) => y.id === id)).filter(Boolean);
                                    openCompare(items);
                                },
                                disabled: isMutating || selectedIds.length !== 2,
                                title: selectedIds.length !== 2 ? "Pilih 2 periode untuk dibandingkan" : undefined,
                            },
                        ]}
                    />
                )}

                {!canEdit && (
                    <Alert variant="rose" size="md">
                        Mode Read-only — Pen tahun pelajaran dinonaktifkan oleh administrator.
                    </Alert>
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

                            <PeriodsHeaderMenu
                                isOpen={isHeaderMenuOpen}
                                rect={headerMenuRect}
                                mounted={headerMenuMounted}
                                canEdit={canEdit}
                                isMutating={isMutating}
                                years={years}
                                onClose={() => setIsHeaderMenuOpen(false)}
                                onImportClick={handleImportClick}
                                onOpenExport={() => setIsExportModalOpen(true)}
                                onGenerate={() => setIsGenerateConfirmOpen(true)}
                                onOpenArchived={() => setIsArchivedOpen(true)}
                                fetchArchived={fetchArchived}
                                onOpenTemplates={() => setIsTemplateModalOpen(true)}
                            />

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

                            <PeriodsShortcutMenu
                                isOpen={isShortcutOpen}
                                rect={shortcutRect}
                                onClose={() => setIsShortcutOpen(false)}
                            />

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

                            {/* Reminder threshold */}
                            <button
                                onClick={() => {
                                    const next = { 3: 7, 7: 14, 14: 3 }[reminderDays] || 7
                                    setReminderDays(next)
                                    addToast(`Notifikasi diubah: ${next} hari sebelum mulai/berakhir`, "info")
                                }}
                                className="h-9 px-2.5 rounded-lg border flex items-center gap-1.5 transition-all active:scale-95 bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                                title={`Notifikasi ${reminderDays} hari sebelum mulai/berakhir. Klik untuk ganti.`}
                            >
                                <Clock className="w-3.5 h-3.5" />
                                <span className="text-[9px] font-black uppercase tracking-widest">{reminderDays} hr</span>
                            </button>

                            {/* Add button */}
                            {canEdit && (
                                <button
                                    onClick={handleAdd}
                                    className="h-9 px-4 sm:px-5 rounded-xl bg-[var(--color-primary)] text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-[var(--color-primary)]/20 disabled:opacity-40 disabled:cursor-not-allowed border border-white/10"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Tambah Periode</span>
                                </button>
                            )}
                        </>
                    }
                />

                {/* ── Stats ── */}
                <StatsInline
                    items={[
                        { label: "Periode", value: stats.total, color: "text-[var(--color-text)]" },
                        { label: "Aktif", value: stats.active, color: "text-emerald-600" },
                        { label: "Ganjil", value: stats.ganjil, color: "text-indigo-500" },
                        { label: "Genap", value: stats.genap, color: "text-purple-500" },
                    ]}
                />

                {/* ── Conflict Detection Badge ── */}
                {overlaps.length > 0 && (
                    <Alert
                        variant="error"
                        size="md"
                        animate
                        action={
                            <button
                                type="button"
                                onClick={() => setFilterTimeStatus("Sedang Berjalan")}
                                className="px-2 py-1 text-[9px] font-black uppercase tracking-wider bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                                Filter
                            </button>
                        }
                    >
                        {overlaps.length} periode tumpang tindih (overlap) terdeteksi
                    </Alert>
                )}
                {gaps.length > 0 && (
                    <Alert variant="warning" size="md" animate>
                        {gaps.length} celah periode terdeteksi (total {gaps.reduce((s, g) => s + g.gapDays, 0)} hari)
                    </Alert>
                )}

                {/* ── Auto-Transition Banner ── */}
                {expiredActive && (
                    <Alert
                        variant="info"
                        size="md"
                        animate
                        action={
                            suggestedNext && (
                                <button
                                    onClick={() => {
                                        openActivateConfirm(suggestedNext);
                                    }}
                                    className="h-8 px-4 rounded-lg bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-md shadow-indigo-500/20 shrink-0"
                                >
                                    Aktifkan Sekarang
                                </button>
                            )
                        }
                    >
                        Periode <span className="underline">{expiredActive.academic_year} {expiredActive.semester}</span> sudah berakhir.
                        {suggestedNext ? ` Aktifkan ${suggestedNext.academic_year} ${suggestedNext.semester} sebagai periode berikutnya?` : " Tidak ada periode berikutnya yang tersedia."}
                    </Alert>
                )}

                {/* ── Main Data View ── */}
                <div className="glass rounded-2xl border border-[var(--color-border)] overflow-hidden relative">
                    <div className="border-b border-[var(--color-border)]">
                        <PeriodsToolbar
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            searchInputRef={searchInputRef}
                            loading={loading}
                            totalRows={totalRows}
                            filterSemester={filterSemester}
                            setFilterSemester={setFilterSemester}
                            filterStatus={filterStatus}
                            setFilterStatus={setFilterStatus}
                            filterLock={filterLock}
                            setFilterLock={setFilterLock}
                            filterTimeStatus={filterTimeStatus}
                            setFilterTimeStatus={setFilterTimeStatus}
                            dateFrom={dateFrom}
                            setDateFrom={setDateFrom}
                            dateTo={dateTo}
                            setDateTo={setDateTo}
                            sortBy={sortBy}
                            setSortBy={setSortBy}
                            isFilterOpen={isFilterOpen}
                            setIsFilterOpen={setIsFilterOpen}
                            activeFilterCount={activeFilterCount}
                            resetAllFilters={resetAllFilters}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            selectedIds={selectedIds}
                            toggleSelectAll={toggleSelectAll}
                            setPage={setPage}
                        />
                    </div>
                    {saveStatus !== "idle" && (
                        <div className={`absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm border transition-all animate-in fade-in ${saveStatus === "saving" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : saveStatus === "saved" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"}`}>
                            {saveStatus === "saving" ? "Menyimpan..." : saveStatus === "saved" ? (lastChange ? `${lastChange.field === "semester" ? "Semester" : lastChange.field === "start_date" ? "Tgl Mulai" : lastChange.field === "end_date" ? "Tgl Selesai" : lastChange.field} diubah` : "Tersimpan") : "Gagal Simpan"}
                        </div>
                    )}
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
                        viewMode === "timeline" ? (
                            <PeriodsTimeline
                                years={filtered}
                                onEdit={handleEdit}
                                onSetActive={handleSetActive}
                                onDuplicate={handleDuplicate}
                                onDelete={(y) => {
                                    setItemToDelete(y);
                                    setIsDeleteModalOpen(true);
                                }}
                                onToggleLock={handleToggleLock}
                                onQuickToggleActive={handleQuickToggleActive}
                                onQuickDuplicate={handleDuplicateClick}
                                onTogglePin={togglePin}
                                pinnedIds={pinnedIds}
                                onHistory={handleOpenHistory}
                                canEdit={canEdit}
                                isPrivacyMode={isPrivacyMode}
                                maskValue={maskValue}
                                formatDate={formatDate}
                                getTimeStatus={getTimeStatus}
                                getDuration={getDuration}
                                getPeriodStats={getPeriodStats}
                                onQuickFilterYear={handleQuickFilterYear}
                            />
                        ) : viewMode === "calendar" ? (
                            <PeriodsCalendar
                                years={filtered}
                                onEdit={handleEdit}
                                canEdit={canEdit}
                                formatDate={formatDate}
                                getTimeStatus={getTimeStatus}
                            />
                        ) : (
                            <>
                                <PeriodsTable
                                    paged={paged}
                                    years={years}
                                    emptyState={
                                        years.length === 0 ? (
                                            <EmptyState
                                                variant="plain"
                                                icon={Calendar}
                                                title="Belum Ada Tahun Pelajaran"
                                                description="Mulai dengan menambah periode baru atau import data dari file CSV/Excel."
                                                action={
                                                    canEdit && (
                                                        <button
                                                            onClick={handleAdd}
                                                            className="h-9 px-5 rounded-xl bg-[var(--color-primary)] text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-[var(--color-primary)]/20"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" /> Tambah Periode
                                                        </button>
                                                    )
                                                }
                                            />
                                        ) : (
                                            <EmptyState
                                                variant="plain"
                                                icon={MagnifyingGlass}
                                                title="Tidak Ada Hasil"
                                                description={`Tidak ditemukan data dengan filter "${searchQuery}". Coba ubah kata kunci atau filter lainnya.`}
                                                action={
                                                    <button
                                                        onClick={resetAllFilters}
                                                        className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] transition"
                                                    >
                                                        Reset Semua Filter
                                                    </button>
                                                }
                                            />
                                        )
                                    }
                                    selectedIds={selectedIds}
                                    visibleCols={visibleCols}
                                    isPrivacyMode={isPrivacyMode}
                                    canEdit={canEdit}
                                    colMenuRef={colMenuRef}
                                    colMenuPortalRef={colMenuPortalRef}
                                    isColMenuOpen={isColMenuOpen}
                                    setIsColMenuOpen={setIsColMenuOpen}
                                    colMenuPos={colMenuPos}
                                    setColMenuPos={setColMenuPos}
                                    setVisibleCols={setVisibleCols}
                                    toggleSelect={toggleSelect}
                                    toggleSelectAll={toggleSelectAll}
                                    maskValue={maskValue}
                                    formatDate={formatDate}
                                    getDuration={getDuration}
                                    getPeriodStats={getPeriodStats}
                                    handleInlineSave={handleInlineSave}
                                    inlineEditCell={inlineEditCell}
                                    setInlineEditCell={setInlineEditCell}
                                    handleEdit={handleEdit}
                                    handleOpenHistory={handleOpenHistory}
                                    handleToggleLock={handleToggleLock}
                                    onQuickToggleActive={handleQuickToggleActive}
                                    onQuickDuplicate={handleDuplicateClick}
                                    onTogglePin={togglePin}
                                    pinnedIds={pinnedIds}
                                    handleOpenReadOnlyDetail={handleOpenReadOnlyDetail}
                                    setItemToDelete={setItemToDelete}
                                    setIsDeleteModalOpen={setIsDeleteModalOpen}
                                    onQuickFilterYear={handleQuickFilterYear}
                                />
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
                            </>
                        )
                    )}

                    {/* Column menu portal (desktop table only) */}
                    {isColMenuOpen && viewMode === "table" && !loading && (
                        createPortal(
                            <div
                                ref={colMenuPortalRef}
                                className={`absolute z-[9999] w-56 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl shadow-black/10 p-2 space-y-0.5 animate-in fade-in zoom-in-95 ${colMenuPos.showUp ? "slide-in-from-bottom-2" : "slide-in-from-top-2"}`}
                                style={{
                                    top: colMenuPos.top,
                                    right: colMenuPos.right,
                                }}
                            >
                                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] px-3 py-2">
                                    Atur Kolom
                                </p>
                                {(() => {
                                    const colLabels = {
                                        period: "Tahun Pelajaran",
                                        semester: "Semester",
                                        duration: "Pelaksanaan",
                                        registration: "Pendaftaran",
                                        status: "Status",
                                    };
                                    return columnOrder.filter(k => colLabels[k]).map((key, idx) => (
                                        <div key={key} className="flex items-center gap-1 px-1 py-1 rounded-xl hover:bg-[var(--color-surface-alt)] transition-all group">
                                            <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); moveColumnLeft(key); }}
                                                    disabled={idx === 0}
                                                    className="w-3.5 h-3 flex items-center justify-center text-[6px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-20 disabled:cursor-not-allowed"
                                                >▲</button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); moveColumnRight(key); }}
                                                    disabled={idx === columnOrder.filter(k => colLabels[k]).length - 1}
                                                    className="w-3.5 h-3 flex items-center justify-center text-[6px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-20 disabled:cursor-not-allowed"
                                                >▼</button>
                                            </div>
                                            <label className="flex-1 flex items-center justify-between cursor-pointer py-1.5">
                                                <span className="text-[11px] font-bold text-[var(--color-text)] transition-colors">
                                                    {colLabels[key]}
                                                </span>
                                                <Checkbox
                                                    checked={visibleCols[key]}
                                                    onChange={() =>
                                                        setVisibleCols((p) => ({
                                                            ...p,
                                                            [key]: !p[key],
                                                        }))
                                                    }
                                                    small
                                                />
                                            </label>
                                        </div>
                                    ));
                                })()}
                            </div>,
                            document.body,
                        )
                    )}
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

                <PeriodsReadOnlyDetail
                    isOpen={isReadOnlyDetailOpen}
                    onClose={() => {
                        setIsReadOnlyDetailOpen(false);
                        setReadOnlyDetailItem(null);
                    }}
                    item={readOnlyDetailItem}
                    formatDate={formatDate}
                    getDuration={getDuration}
                    onOpenHistory={handleOpenHistory}
                    usageStats={periodUsageStats}
                />

                <PeriodsHistoryModal
                    isOpen={isHistoryOpen}
                    onClose={() => {
                        setIsHistoryOpen(false);
                        setHistoryItem(null);
                    }}
                    item={historyItem}
                />

                <ConfirmDialog
                    isOpen={isBulkDeleteOpen}
                    onClose={() => setIsBulkDeleteOpen(false)}
                    onConfirm={handleBulkDelete}
                    title="Konfirmasi Arsip"
                    description="Tahun akademik ini akan diarsipkan."
                    icon={Archive}
                    iconBg="bg-amber-500/10"
                    iconColor="text-amber-600"
                    confirmText="Arsipkan Sekarang"
                    confirmIcon={Archive}
                    confirmColor="amber"
                    submitting={isDeleting}
                >
                    <div className="p-4 rounded-2xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[11px] font-bold text-[var(--color-text-muted)] leading-relaxed shadow-sm space-y-2">
                        <p>Anda akan mengarsipkan <span className="font-black text-[var(--color-text)]">{selectedIds.length}</span> tahun pelajaran secara bersamaan. Data tetap aman dan dapat dipulihkan kapan saja dari menu arsip.</p>
                        {selectedItemsData.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {(() => {
                                    const ganjilCount = selectedItemsData.filter(y => y.semester === "Ganjil").length;
                                    const genapCount = selectedItemsData.filter(y => y.semester === "Genap").length;
                                    const lockedCount = selectedItemsData.filter(y => y.is_locked).length;
                                    const activeCount = selectedItemsData.filter(y => y.is_active).length;
                                    return (
                                        <>
                                            <Badge color="indigo">Ganjil: {ganjilCount}</Badge>
                                            <Badge color="purple">Genap: {genapCount}</Badge>
                                            {lockedCount > 0 && <Badge color="rose">Terkunci: {lockedCount}</Badge>}
                                            {activeCount > 0 && <Badge color="emerald">Aktif: {activeCount}</Badge>}
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </ConfirmDialog>

                <React.Suspense fallback={null}>
                    <LazyPeriodArchiveModal
                        isOpen={isArchivedOpen}
                        onClose={() => setIsArchivedOpen(false)}
                        archivedYears={archivedYears}
                        loadingArchived={loadingArchived}
                        setArchivedYears={setArchivedYears}
                        fetchArchivedYears={fetchArchived}
                        fetchData={fetchData}
                        addToast={addToast}
                    />
                </React.Suspense>

                <LockModal isOpen={isLockModalOpen} onClose={() => setIsLockModalOpen(false)} selectedCount={selectedIds.length} onConfirm={handleBulkLock} submitting={isSaving} />
                <UnlockModal isOpen={isUnlockModalOpen} onClose={() => setIsUnlockModalOpen(false)} selectedCount={selectedIds.length} onConfirm={handleBulkUnlock} submitting={isSaving} />
                <ShiftDatesModal isOpen={isShiftModalOpen} onClose={() => setIsShiftModalOpen(false)} selectedCount={selectedIds.length} onConfirm={handleBulkShiftDates} submitting={isSaving} />
                <React.Suspense fallback={null}>
                    <LazyPeriodBulkEditModal
                        isOpen={isBulkEditOpen}
                        onClose={() => setIsBulkEditOpen(false)}
                        selectedCount={selectedIds.length}
                        onConfirm={handleBulkEdit}
                        submitting={isSaving}
                    />
                </React.Suspense>

                <ConfirmDialog
                    isOpen={!!itemToDuplicate}
                    onClose={() => setItemToDuplicate(null)}
                    onConfirm={handleDuplicateConfirm}
                    title="Duplikasi Periode"
                    description={`Duplikasi ${itemToDuplicate?.academic_year} ${itemToDuplicate?.semester} ke tahun berikutnya?`}
                    icon={Calendar}
                    iconBg="bg-[var(--color-primary)]/10"
                    iconColor="text-[var(--color-primary)]"
                    confirmText="Duplikasi"
                    confirmIcon={CheckCircle}
                    confirmColor="primary"
                    submitting={isSaving}
                >
                    {itemToDuplicate && duplicatePreview && (
                        <div className="p-4 rounded-2xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[11px] font-bold text-[var(--color-text-muted)] leading-relaxed shadow-sm space-y-3">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                                <p className="text-[var(--color-text)]">Periode baru dibuat dengan tanggal sama, tahun bergeser +1.</p>
                            </div>
                            <div className="rounded-xl border border-[var(--color-border)] overflow-hidden divide-y divide-[var(--color-border)]">
                                <div className="p-2.5 bg-[var(--color-surface)]">
                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-0.5">Sumber</p>
                                    <p className="text-[var(--color-text)]">{itemToDuplicate.academic_year} {itemToDuplicate.semester}</p>
                                    <p className="text-[10px] opacity-70">{formatDate(itemToDuplicate.start_date)} — {formatDate(itemToDuplicate.end_date)}</p>
                                </div>
                                <div className="p-2.5 bg-[var(--color-primary)]/5">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-primary)] opacity-70 mb-0.5">Akan Dibuat</p>
                                    <p className="text-[var(--color-primary)] font-black">{duplicatePreview.academic_year} {itemToDuplicate.semester}</p>
                                    <p className="text-[10px] text-[var(--color-primary)]">{formatDate(duplicatePreview.start_date)} — {formatDate(duplicatePreview.end_date)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {itemToDuplicate && !duplicatePreview && (
                        <div className="p-4 rounded-2xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[11px] font-bold text-[var(--color-text-muted)] leading-relaxed shadow-sm">
                            Format tahun tidak valid, tidak bisa menampilkan preview.
                        </div>
                    )}
                </ConfirmDialog>

                <React.Suspense fallback={null}>
                    <LazyPeriodComparisonModal
                        isOpen={isCompareOpen}
                        onClose={() => setIsCompareOpen(false)}
                        itemA={compareItems[0]}
                        itemB={compareItems[1]}
                        formatDate={formatDate}
                        getDuration={getDuration}
                        getPeriodStats={getPeriodStats}
                    />
                </React.Suspense>

                <ConfirmDialog
                    isOpen={isActivateConfirmOpen}
                    onClose={closeActivateConfirm}
                    onConfirm={() => {
                        if (!activateTarget) return
                        handleQuickToggleActive(activateTarget)
                        closeActivateConfirm()
                    }}
                    title="Aktivasi Periode"
                    description={`Aktifkan ${activateTarget?.academic_year} ${activateTarget?.semester} sebagai periode berjalan?`}
                    icon={CheckCircle}
                    iconBg="bg-indigo-500/10"
                    iconColor="text-indigo-500"
                    confirmText="Aktifkan Sekarang"
                    confirmIcon={CheckCircle}
                    confirmColor="indigo"
                    submitting={isSaving}
                >
                    {activateTarget && (
                        <div className="p-4 rounded-2xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[11px] font-bold text-[var(--color-text-muted)] leading-relaxed shadow-sm space-y-2">
                            <p>Periode <span className="font-black text-[var(--color-text)]">{activateTarget.academic_year} {activateTarget.semester}</span> akan menjadi periode aktif. Semua periode lain akan dinonaktifkan secara otomatis.</p>
                            <p className="text-[10px] opacity-70">Aksi ini dapat dibatalkan lewat undo toast setelah konfirmasi.</p>
                        </div>
                    )}
                </ConfirmDialog>

                <ConfirmDialog
                    isOpen={isGenerateConfirmOpen}
                    onClose={() => {
                        setIsGenerateConfirmOpen(false);
                        resetBatchCount();
                    }}
                    onConfirm={() => {
                        setIsGenerateConfirmOpen(false);
                        handleGenerateNextYear(batchCount);
                        resetBatchCount();
                    }}
                    title="Generate Tahun Pelajaran Baru"
                    description={`Buat ${batchCount} tahun pelajaran ke depan secara otomatis.`}
                    icon={ArrowClockwise}
                    iconBg="bg-indigo-500/10"
                    iconColor="text-indigo-500"
                    confirmText={`Generate ${batchCount > 1 ? `${batchCount} Tahun` : "Sekarang"}`}
                    confirmIcon={ArrowClockwise}
                    confirmColor="indigo"
                    submitting={isSaving}
                >
                    <div className="space-y-4">
                        <p className="text-[11px] text-[var(--color-text-muted)] p-4 rounded-2xl bg-[var(--color-surface-alt)]/50 border border-[var(--color-border)]">
                            Sistem akan membuat{" "}
                            <span className="font-black text-[var(--color-text)]">{batchCount * 2} periode baru</span>{" "}
                            ({batchCount} × Ganjil + Genap) berdasarkan tahun pelajaran terakhir yang ada.
                        </p>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-alt)]/30 border border-[var(--color-border)]">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">Jumlah Tahun</span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setBatchCount(Math.max(1, batchCount - 1))}
                                    disabled={batchCount <= 1}
                                    className="w-8 h-8 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] font-black text-sm flex items-center justify-center hover:bg-[var(--color-surface-alt)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    −
                                </button>
                                <span className="w-8 text-center text-sm font-black text-[var(--color-text)]">{batchCount}</span>
                                <button
                                    type="button"
                                    onClick={() => setBatchCount(Math.min(5, batchCount + 1))}
                                    disabled={batchCount >= 5}
                                    className="w-8 h-8 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] font-black text-sm flex items-center justify-center hover:bg-[var(--color-surface-alt)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>
                </ConfirmDialog>

                <React.Suspense fallback={null}>
                    {isExportModalOpen && (
                        <LazyPeriodExportModal
                            isOpen={isExportModalOpen}
                            onClose={() => {
                                if (exporting) {
                                    addToast("Export sedang berjalan...", "info", 2000);
                                    return;
                                }
                                setIsExportModalOpen(false);
                            }}
                            years={filtered}
                            selectedIds={selectedIds}
                            exportScope={exportScope}
                            setExportScope={setExportScope}
                            exportColumns={exportColumns}
                            setExportColumns={setExportColumns}
                            exporting={exporting}
                            exportError={exportError}
                            handleExportCSV={handleExportCSV}
                            handleExportExcel={handleExportExcel}
                            handleExportPDF={handleExportPDF}
                            handleExportICS={handleExportICS}
                            getExportData={getExportData}
                            addToast={addToast}
                        />
                    )}
                    {isImportModalOpen && (
                        <LazyPeriodImportModal
                            isOpen={isImportModalOpen}
                            onClose={() => {
                                if (importing) {
                                    addToast("Import sedang berjalan...", "info", 2000);
                                    return;
                                }
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
                            importDiffPreview={importDiffPreview}
                            setImportDiffPreview={setImportDiffPreview}
                        />
                    )}
                </React.Suspense>

                <PeriodTemplateModal
                    isOpen={isTemplateModalOpen}
                    onClose={() => setIsTemplateModalOpen(false)}
                    templates={templates}
                    onSave={saveTemplate}
                    onDelete={deleteTemplate}
                    onApply={(tpl) => {
                        const preview = applyTemplate(tpl, years);
                        if (preview) {
                            addToast(`Template "${tpl.name}" siap: ${preview.academic_year} ${preview.semester}`, "success");
                        }
                    }}
                />
            </div>
        </DashboardLayout>
    );
}
