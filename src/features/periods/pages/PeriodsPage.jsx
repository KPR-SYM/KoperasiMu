import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import {
    Archive,
    Calendar,
    CheckCircle,
    Eye,
    EyeSlash,
    Keyboard,
    Lock,
    LockOpen,
    ArrowsLeftRight,
    Plus,
    Pencil,
    SlidersHorizontal,
    MagnifyingGlass,
} from "@phosphor-icons/react";

import DashboardLayout from "@core/layouts/DashboardLayout";
import { useToast } from "@context/Toast";
import { findOverlappingPeriods, findPeriodGaps, shiftDateByYear } from "@features/periods/utils/periodValidation";
import {
    Badge,
    EmptyState,
    PageHeader,
    Pagination,
    BulkActionsBar,
    StatCard,
    StatsCarousel,
    ConfirmDialog,
    Alert,
} from "@shared/components";
import Skeleton from "@shared/components/Skeleton";
import PeriodFormModal from "@features/periods/components/PeriodFormModal";
import { ArchiveModal, LockModal, UnlockModal, ShiftDatesModal } from "@features/periods/components/PeriodConfirmModals";
import { usePeriodsCore } from "@features/periods/hooks/usePeriodsCore";
import { usePeriodsKeyboard } from "@features/periods/hooks/usePeriodsKeyboard";
import { usePeriodsModals } from "@features/periods/hooks/usePeriodsModals";
import { usePeriodsImportExport } from "@features/periods/hooks/usePeriodsImportExport";

import PeriodsToolbar from "@features/periods/components/PeriodsToolbar";
import PeriodsTimeline from "@features/periods/components/PeriodsTimeline";
import PeriodsCalendar from "@features/periods/components/PeriodsCalendar";
import PeriodsTable from "@features/periods/components/PeriodsTable";
import PeriodsHeaderMenu from "@features/periods/components/PeriodsHeaderMenu";
import PeriodsShortcutMenu from "@features/periods/components/PeriodsShortcutMenu";
import PeriodsReadOnlyDetail from "@features/periods/components/PeriodsReadOnlyDetail";
import PeriodsHistoryModal from "@features/periods/components/PeriodsHistoryModal";
import { PeriodSkeletonRow, PeriodSkeletonCard } from "@features/periods/components/PeriodSkeletons";
import { ColumnMenuPortal } from "@shared/components";
import LazyLoad from "@features/periods/components/LazyLoad";
import { usePeriodsNotifications } from "@features/periods/hooks/usePeriodsNotifications";

const LazyPeriodComparisonModal = React.lazy(
    () => import("@features/periods/components/PeriodComparisonModal"),
);
const LazyPeriodBulkEditModal = React.lazy(
    () => import("@features/periods/components/PeriodBulkEditModal"),
);
const LazyPeriodArchiveModal = React.lazy(
    () => import("@features/periods/components/PeriodArchiveModal"),
);
const LazyPeriodGenerateModal = React.lazy(
    () => import("@features/periods/components/PeriodGenerateModal"),
);
const LazyPeriodExportModal = React.lazy(
    () => import("@features/periods/components/PeriodExportModal"),
);
const LazyPeriodDetailPanel = React.lazy(
    () => import("@features/periods/components/PeriodDetailPanel"),
);

export default function PeriodsPage() {
    const { addToast, addUndoToast } = useToast();
    const navigate = useNavigate();
    const { id: periodId } = useParams();
    const isDetailView = !!periodId;

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
        formatDate, getDuration, getTimeStatus, getPeriodStats,         handleError,
        columnOrder, moveColumnLeft, moveColumnRight,
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

    const handleOpenImport = useCallback(() => {
        navigate('/master/periods/import');
    }, [navigate]);

    const handleOpenExport = useCallback(() => {
        navigate('/master/periods/export');
    }, [navigate]);

    // Ref for shortcut action to avoid large dependency array
    const shortcutActionRef = useRef({});
    shortcutActionRef.current = {
        canEdit, isMutating, years, selectedIds,
        handleAdd, handleOpenImport, handleOpenExport, handleEdit, handleDuplicateClick,
        resetAllFilters, toggleSelectAll, setIsBulkDeleteOpen, handleToggleLock,
        handleOpenHistory, togglePrivacyMode, handleUndo, handleRedo,
        undoStack, redoStack, searchInputRef, setViewMode, setIsGenerateConfirmOpen,
    };

    const handleShortcutAction = useCallback((action) => {
        const ctx = shortcutActionRef.current;
        switch (action) {
            case "focusSearch":
                ctx.searchInputRef.current?.focus();
                break;
            case "toggleView":
                ctx.setViewMode(prev => prev === "table" ? "timeline" : prev === "timeline" ? "calendar" : "table");
                break;
            case "add":
                if (ctx.canEdit) ctx.handleAdd();
                break;
            case "import":
                if (ctx.canEdit) ctx.handleOpenImport();
                break;
            case "export":
                ctx.handleOpenExport();
                break;
            case "generate":
                if (ctx.canEdit && !ctx.isMutating && ctx.years.length > 0) ctx.setIsGenerateConfirmOpen(true);
                break;
            case "edit":
                if (ctx.selectedIds.length === 1) ctx.handleEdit(ctx.years.find(y => y.id === ctx.selectedIds[0]));
                break;
            case "duplicate":
                if (ctx.selectedIds.length === 1) ctx.handleDuplicateClick(ctx.years.find(y => y.id === ctx.selectedIds[0]));
                break;
            case "resetFilter":
                ctx.resetAllFilters();
                break;
            case "selectAll":
                ctx.toggleSelectAll();
                break;
            case "bulkDelete":
                if (ctx.selectedIds.length > 0) ctx.setIsBulkDeleteOpen(true);
                break;
            case "toggleLock":
                if (ctx.selectedIds.length === 1) ctx.handleToggleLock(ctx.years.find(y => y.id === ctx.selectedIds[0]));
                break;
            case "history":
                if (ctx.selectedIds.length === 1) ctx.handleOpenHistory(ctx.years.find(y => y.id === ctx.selectedIds[0]));
                break;
            case "privacy":
                ctx.togglePrivacyMode();
                break;
            case "undo":
                if (ctx.undoStack.length > 0) ctx.handleUndo();
                break;
            case "redo":
                if (ctx.redoStack.length > 0) ctx.handleRedo();
                break;
        }
    }, []);

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
        return {
            academic_year: `${nextStart}/${nextEnd}`,
            start_date: shiftDateByYear(itemToDuplicate.start_date),
            end_date: shiftDateByYear(itemToDuplicate.end_date),
        };
    }, [itemToDuplicate]);

    // ── Import/Export Hook (only export modal state needed here) ──
    const {
        exportScope, setExportScope, exportColumns, setExportColumns, exporting, exportError,
        handleExportCSV, handleExportExcel, handleExportPDF, handleExportICS,
        getExportData,
    } = usePeriodsImportExport({
        years, filtered, selectedIds, canEdit, fetchData, addToast,
        handleError,
        isImportModalOpen, setIsImportModalOpen,
        isExportModalOpen, setIsExportModalOpen,
    });

    // ── Notifikasi Terjadwal ───────────────────────────────────────────
    usePeriodsNotifications({ years, addToast });

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
        resetAllFilters,
        setIsShortcutOpen,
        handleEdit,
        onQuickDuplicate: handleDuplicateClick,
        toggleSelectAll,
        handleToggleLock,
        handleOpenHistory,
        handleOpenImport,
        handleOpenExport,
        handleGenerate: () => setIsGenerateConfirmOpen(true),
        isMutating,
        years,
    });

    // ── Deep-linking: ?period=uuid ────────────────────────────────────
    useEffect(() => {
        const periodId = searchParams.get("period")
        if (!periodId || !years.length || loading) return
        const found = years.find(y => y.id === periodId || y.uuid === periodId)
        if (found) {
            navigate(`/master/periods/${found.uuid || periodId}`, { replace: true })
        }
    }, [searchParams, years, loading, navigate])

    // ── Utility functions ──
    const saveStatusStyles = {
        saving: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        saved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        error: "bg-red-500/10 text-red-600 border-red-500/20",
    };

    const getSaveStatusText = (status, lastChange) => {
        if (status === "saving") return "Menyimpan...";
        if (status === "saved") {
            if (!lastChange) return "Tersimpan";
            const fieldLabels = { semester: "Semester", start_date: "Tgl Mulai", end_date: "Tgl Selesai" };
            return `${fieldLabels[lastChange.field] || lastChange.field} diubah`;
        }
        return "Gagal Simpan";
    };

    // ── Grouped Props for PeriodsTable (memoized to preserve React.memo) ──
    const tableDisplayProps = useMemo(() => ({
        visibleCols, columnOrder, isPrivacyMode, maskValue,
        setVisibleCols, moveColumnLeft, moveColumnRight,
        colMenuRef, colMenuPortalRef, isColMenuOpen, setIsColMenuOpen,
        colMenuPos, setColMenuPos,
    }), [visibleCols, columnOrder, isPrivacyMode, maskValue, setVisibleCols, moveColumnLeft, moveColumnRight, colMenuRef, colMenuPortalRef, isColMenuOpen, setIsColMenuOpen, colMenuPos, setColMenuPos]);

    const tableFormatters = useMemo(() => ({
        formatDate, getDuration, getPeriodStats,
    }), [formatDate, getDuration, getPeriodStats]);

    const tableActions = useMemo(() => ({
        handleEdit, handleOpenHistory, handleToggleLock,
        onQuickToggleActive: handleQuickToggleActive,
        onQuickDuplicate: handleDuplicateClick,
        onTogglePin: togglePin, pinnedIds,
        handleOpenReadOnlyDetail, setItemToDelete, setIsDeleteModalOpen,
        onQuickFilterYear: handleQuickFilterYear,
    }), [handleEdit, handleOpenHistory, handleToggleLock, handleQuickToggleActive, handleDuplicateClick, togglePin, pinnedIds, handleOpenReadOnlyDetail, setItemToDelete, setIsDeleteModalOpen, handleQuickFilterYear]);

    // ── Grouped Props for PeriodsToolbar (memoized) ──
    const toolbarSearchProps = useMemo(() => ({
        searchQuery, setSearchQuery, searchInputRef,
    }), [searchQuery, setSearchQuery, searchInputRef]);

    const toolbarFilterProps = useMemo(() => ({
        filterSemester, setFilterSemester, filterStatus, setFilterStatus,
        filterLock, setFilterLock, filterTimeStatus, setFilterTimeStatus,
        dateFrom, setDateFrom, dateTo, setDateTo,
        isFilterOpen, setIsFilterOpen, activeFilterCount, resetAllFilters,
    }), [filterSemester, setFilterSemester, filterStatus, setFilterStatus, filterLock, setFilterLock, filterTimeStatus, setFilterTimeStatus, dateFrom, setDateFrom, dateTo, setDateTo, isFilterOpen, setIsFilterOpen, activeFilterCount, resetAllFilters]);

    if (!moduleEnabled) {
        return (
            <DashboardLayout title="Tahun Akademik">
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
    const singleItem = useMemo(() => selectedItemsData.length === 1 ? selectedItemsData[0] : null, [selectedItemsData]);

    const activePeriods = useMemo(() => years.filter((y) => y.is_active), [years]);
    const overlaps = useMemo(() => findOverlappingPeriods(activePeriods), [activePeriods]);
    const gaps = useMemo(() => findPeriodGaps(years), [years]);

    if (isDetailView) {
        return (
            <DashboardLayout title="Detail Periode">
                <LazyLoad fallback={
                    <div className="space-y-4 p-5">
                        <Skeleton className="h-7 w-7 rounded-lg" />
                        <Skeleton className="h-7 w-56 rounded-lg" />
                        <Skeleton className="h-64 rounded-2xl" />
                    </div>
                }>
                    <LazyPeriodDetailPanel
                        periodId={periodId}
                        onBack={() => navigate('/master/periods')}
                    />
                </LazyLoad>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Tahun Akademik">
            <div className="space-y-3 max-w-[1800px] mx-auto relative">
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
                        Mode Read-only — Pen tahun akademik dinonaktifkan oleh administrator.
                    </Alert>
                )}

                {/* ── Header Row ── */}
                <PageHeader
                    title="Tahun Akademik"
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
                                archivedCount={archivedYears.length}
                                onClose={() => setIsHeaderMenuOpen(false)}
                                onImportClick={handleOpenImport}
                                onOpenExport={handleOpenExport}
                                onGenerate={() => setIsGenerateConfirmOpen(true)}
                                onOpenArchived={() => setIsArchivedOpen(true)}
                                fetchArchived={fetchArchived}
                            />

                            {/* Keyboard Shortcuts Button - hidden on mobile */}
                            <button
                                onClick={() => setIsShortcutOpen(v => !v)}
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
                                onClose={() => setIsShortcutOpen(false)}
                                onAction={handleShortcutAction}
                                selectedCount={selectedIds.length}
                            />

                            {/* Privasi toggle */}
                            <button
                                onClick={togglePrivacyMode}
                                className={`h-9 w-9 rounded-lg border flex items-center justify-center transition-all active:scale-95 ${isPrivacyMode ? "bg-amber-500/10 border-amber-500/30 text-amber-600" : "bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"} `}
                                title={isPrivacyMode ? "Matikan Mode Privasi" : "Aktifkan Mode Privasi"}
                            >
                                {isPrivacyMode ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                <StatsCarousel count={4} cols={4}>
                    <StatCard
                        icon={Calendar}
                        label="Total Periode"
                        value={stats.total}
                        color="primary"
                    />
                    <StatCard
                        icon={CheckCircle}
                        label="Periode Aktif"
                        value={stats.active}
                        color="primary"
                    />
                    <StatCard
                        icon={Calendar}
                        label="Semester Ganjil"
                        value={stats.ganjil}
                        color="primary"
                    />
                    <StatCard
                        icon={Calendar}
                        label="Semester Genap"
                        value={stats.genap}
                        color="primary"
                    />
                </StatsCarousel>

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
                        {gaps.length} celah periode terdeteksi (total {gaps.reduce((s, g) => s + g.gapDays, 0)} hari):{" "}
                        {gaps.map((g, i) => (
                            <span key={i}>
                                <span className="font-bold">{g.before.academic_year} {g.before.semester}</span>
                                {" → "}
                                <span className="font-bold">{g.after.academic_year} {g.after.semester}</span>
                                {" ("}{g.gapDays} hari{")"}
                                {i < gaps.length - 1 ? ", " : ""}
                            </span>
                        ))}
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
                            loading={loading}
                            totalRows={totalRows}
                            sortBy={sortBy}
                            setSortBy={setSortBy}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            selectedIds={selectedIds}
                            toggleSelectAll={toggleSelectAll}
                            setPage={setPage}
                            {...toolbarSearchProps}
                            {...toolbarFilterProps}
                        />
                    </div>
                    {saveStatus !== "idle" && (
                        <div className={`absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm border transition-all animate-in fade-in ${saveStatusStyles[saveStatus] || saveStatusStyles.error}`}>
                            {getSaveStatusText(saveStatus, lastChange)}
                        </div>
                    )}
                    {loading ? (
                        viewMode === "timeline" ? (
                            <div className="p-5 space-y-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <PeriodSkeletonCard key={i} />
                                ))}
                            </div>
                        ) : (
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-[var(--color-surface-alt)] sticky top-0 z-10">
                                        <tr className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                                            <th className="px-4 py-2.5 text-center w-12">
                                                <Skeleton className="w-4 h-4 rounded-lg mx-auto" />
                                            </th>
                                            <th className="px-4 py-2.5 text-left">
                                                <Skeleton className="w-20 h-3 rounded" />
                                            </th>
                                            <th className="px-4 py-2.5 text-left">
                                                <Skeleton className="w-14 h-3 rounded" />
                                            </th>
                                            <th className="px-4 py-2.5 text-left">
                                                <Skeleton className="w-18 h-3 rounded" />
                                            </th>
                                            <th className="px-4 py-2.5 text-left">
                                                <Skeleton className="w-12 h-3 rounded" />
                                            </th>
                                            <th className="px-4 py-2.5 text-center w-32">
                                                <Skeleton className="w-10 h-3 rounded mx-auto" />
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
                                                title="Belum Ada Tahun Akademik"
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
                                    canEdit={canEdit}
                                    toggleSelect={toggleSelect}
                                    toggleSelectAll={toggleSelectAll}
                                    handleInlineSave={handleInlineSave}
                                    inlineEditCell={inlineEditCell}
                                    setInlineEditCell={setInlineEditCell}
                                    {...tableDisplayProps}
                                    {...tableFormatters}
                                    {...tableActions}
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
                    <ColumnMenuPortal
                        isOpen={isColMenuOpen}
                        viewMode={viewMode}
                        loading={loading}
                        portalRef={colMenuPortalRef}
                        colMenuPos={colMenuPos}
                        columnOrder={columnOrder}
                        colLabels={{ period: "Tahun Akademik", semester: "Semester", duration: "Pelaksanaan", status: "Status" }}
                        visibleCols={visibleCols}
                        setVisibleCols={setVisibleCols}
                        moveColumnLeft={moveColumnLeft}
                        moveColumnRight={moveColumnRight}
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
                    <div className="space-y-2">
                        <p className="text-[11px] font-bold text-[var(--color-text-muted)] leading-relaxed">
                            Anda akan mengarsipkan <span className="font-black text-[var(--color-text)]">{selectedIds.length}</span> tahun akademik secara bersamaan. Data tetap aman dan dapat dipulihkan kapan saja dari menu arsip.
                        </p>
                        {selectedItemsData.length > 0 && (
                            <div className="flex flex-wrap gap-2">
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

                <LazyLoad>
                    <LazyPeriodArchiveModal
                        isOpen={isArchivedOpen}
                        onClose={() => setIsArchivedOpen(false)}
                        archivedYears={archivedYears}
                        loadingArchived={loadingArchived}
                        setArchivedYears={setArchivedYears}
                        fetchArchivedYears={fetchArchived}
                        fetchData={fetchData}
                        addToast={addToast}
                        addUndoToast={addUndoToast}
                    />
                </LazyLoad>

                <LockModal isOpen={isLockModalOpen} onClose={() => setIsLockModalOpen(false)} selectedCount={selectedIds.length} onConfirm={handleBulkLock} submitting={isSaving} />
                <UnlockModal isOpen={isUnlockModalOpen} onClose={() => setIsUnlockModalOpen(false)} selectedCount={selectedIds.length} onConfirm={handleBulkUnlock} submitting={isSaving} />
                <ShiftDatesModal isOpen={isShiftModalOpen} onClose={() => setIsShiftModalOpen(false)} selectedCount={selectedIds.length} onConfirm={handleBulkShiftDates} submitting={isSaving} />
                <LazyLoad>
                    <LazyPeriodBulkEditModal
                        isOpen={isBulkEditOpen}
                        onClose={() => setIsBulkEditOpen(false)}
                        selectedCount={selectedIds.length}
                        onConfirm={handleBulkEdit}
                        submitting={isSaving}
                    />
                </LazyLoad>

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
                        <div className="space-y-3">
                            <p className="text-[11px] font-bold text-[var(--color-text-muted)] leading-relaxed">
                                Periode baru dibuat dengan tanggal sama, tahun bergeser +1.
                            </p>
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
                        <p className="text-[11px] font-bold text-[var(--color-text-muted)] leading-relaxed">
                            Format tahun tidak valid, tidak bisa menampilkan preview.
                        </p>
                    )}
                </ConfirmDialog>

                <LazyLoad>
                    <LazyPeriodComparisonModal
                        isOpen={isCompareOpen}
                        onClose={() => setIsCompareOpen(false)}
                        itemA={compareItems[0]}
                        itemB={compareItems[1]}
                        formatDate={formatDate}
                        getDuration={getDuration}
                        getPeriodStats={getPeriodStats}
                    />
                </LazyLoad>

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
                        <div className="space-y-2">
                            <p className="text-[11px] font-bold text-[var(--color-text-muted)] leading-relaxed">
                                Periode <span className="font-black text-[var(--color-text)]">{activateTarget.academic_year} {activateTarget.semester}</span> akan menjadi periode aktif. Semua periode lain akan dinonaktifkan secara otomatis.
                            </p>
                            <p className="text-[10px] text-[var(--color-text-muted)] opacity-70">
                                Aksi ini dapat dibatalkan lewat undo toast setelah konfirmasi.
                            </p>
                        </div>
                    )}
                </ConfirmDialog>

                <LazyLoad>
                    <LazyPeriodGenerateModal
                        isOpen={isGenerateConfirmOpen}
                        onClose={() => setIsGenerateConfirmOpen(false)}
                        onConfirm={(count) => {
                            setIsGenerateConfirmOpen(false);
                            handleGenerateNextYear(count);
                        }}
                        years={years}
                        batchCount={batchCount}
                        setBatchCount={setBatchCount}
                        resetBatchCount={resetBatchCount}
                        submitting={isSaving}
                    />
                </LazyLoad>

                <LazyLoad>
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
                </LazyLoad>
            </div>
        </DashboardLayout>
    );
}
