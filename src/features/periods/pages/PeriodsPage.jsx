import React, { useState, useEffect } from "react";
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
    Plus,
    SlidersHorizontal,
    Warning,
} from "@phosphor-icons/react";
import { createPortal } from "react-dom";

import DashboardLayout from "@core/layouts/DashboardLayout";
import { useToast } from "@context/Toast";
import { findOverlappingPeriods } from "@features/periods/utils/periodValidation";
import {
    PageHeader,
    Modal,
    Pagination,
    BulkActionsBar,
    StatsInline,
    ConfirmDialog,
    AuditTimeline,
} from "@shared/components";
import PeriodFormModal from "@features/periods/components/PeriodFormModal";
import { ArchiveModal, LockModal, UnlockModal } from "@features/periods/components/PeriodConfirmModals";
import PeriodArchiveModal from "@features/periods/components/PeriodArchiveModal";
import { usePeriodsCore } from "@features/periods/hooks/usePeriodsCore";
import { usePeriodsImportExport, SYSTEM_COLS } from "@features/periods/hooks/usePeriodsImportExport";

import PeriodsToolbar from "@features/periods/components/PeriodsToolbar";
import PeriodsTimeline from "@features/periods/components/PeriodsTimeline";
import PeriodsTable from "@features/periods/components/PeriodsTable";
import PeriodsHeaderMenu from "@features/periods/components/PeriodsHeaderMenu";
import PeriodsShortcutMenu from "@features/periods/components/PeriodsShortcutMenu";
import PeriodsReadOnlyDetail, { PeriodsHistoryModal } from "@features/periods/components/PeriodsReadOnlyDetail";

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
        filterTimeStatus, setFilterTimeStatus, sortBy, setSortBy,
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
        readOnlyDetailItem, setReadOnlyDetailItem, historyItem, setHistoryItem,
        isModalOpen, setIsModalOpen, isDeleteModalOpen, setIsDeleteModalOpen,
        isArchivedOpen, setIsArchivedOpen, loadingArchived,
        isBulkDeleteOpen, setIsBulkDeleteOpen, isReadOnlyDetailOpen, setIsReadOnlyDetailOpen,
        isHistoryOpen, setIsHistoryOpen, isGenerateConfirmOpen, setIsGenerateConfirmOpen,
        inlineEditCell, setInlineEditCell, saveStatus,
        handleAdd, handleEdit, handleDuplicate, handleSubmit,
        handleSetActive, handleInlineSave, handleToggleLock,
        handleDeleteConfirm, handleBulkDelete, handleBulkSetActive,
        handleBulkLock, handleBulkUnlock, handleGenerateNextYear,
        handleOpenReadOnlyDetail, handleOpenHistory,
        formatDate, getDuration, getTimeStatus, handleError,
    } = usePeriodsCore({ addToast, addUndoToast });

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isLockModalOpen, setIsLockModalOpen] = useState(false);
    const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);

    // ── Import/Export Hook ──
    const {
        importStep, setImportStep, importFileName, setImportFileName,
        importRawData, importFileHeaders,
        importColumnMapping, setImportColumnMapping, importPreview, setImportPreview,
        importIssues, setImportIssues, importLoading, setImportLoading,
        importValidationOpen, setImportValidationOpen, importDragOver, setImportDragOver,
        importing, importProgress,
        importEditCell, setImportEditCell, importSkipDupes, setImportSkipDupes,
        exportScope, setExportScope, exportColumns, setExportColumns, exporting,
        importReadyRows, hasImportBlockingErrors, importFileInputRef,
        handleImportClick, handleFileChange, processImportFile, buildImportPreview,
        handleImportCellEdit, handleRemoveImportRow, handleDownloadTemplate, handleCommitImport,
        handleExportCSV, handleExportExcel, handleExportPDF,
    } = usePeriodsImportExport({
        years, filtered, selectedIds, canEdit, fetchData, addToast,
        handleError,
        isImportModalOpen, setIsImportModalOpen,
        isExportModalOpen, setIsExportModalOpen,
    });

    // ── Shortcut: Ctrl+P / Cmd+P toggles privacy mode ───────────────────────
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "p") {
                e.preventDefault();
                setIsPrivacyMode(prev => !prev);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [setIsPrivacyMode]);

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

    const selectedItemsData = selectedIds.map(id => years.find(y => y.id === id)).filter(Boolean);
    const allLocked = selectedItemsData.length > 0 && selectedItemsData.every(y => y.is_locked);
    const allUnlocked = selectedItemsData.length > 0 && selectedItemsData.every(y => !y.is_locked);
    const singleItem = selectedIds.length === 1 ? years.find(y => y.id === selectedIds[0]) : null;

    const overlaps = findOverlappingPeriods(years.filter((y) => y.is_active));
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
                                onClick: () => setIsLockModalOpen(true),
                                disabled: !canEdit || isMutating || selectedIds.length === 0 || allLocked,
                                title: allLocked ? "Semua sudah terkunci" : undefined,
                            },
                            {
                                label: "Buka",
                                icon: <LockOpen className="w-3 h-3" />,
                                variant: "default",
                                onClick: () => setIsUnlockModalOpen(true),
                                disabled: !canEdit || isMutating || selectedIds.length === 0 || allUnlocked,
                                title: allUnlocked ? "Semua sudah terbuka" : undefined,
                            },
                        ]}
                    />
                )}

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
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 animate-in fade-in slide-in-from-top-2">
                        <Warning className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <span className="text-[11px] font-black text-red-600">
                            ⚠ {overlaps.length} periode tumpang tindih (overlap) terdeteksi
                        </span>
                        <button
                            type="button"
                            onClick={() => setFilterTimeStatus("Sedang Berjalan")}
                            className="ml-auto px-2 py-1 text-[9px] font-black uppercase tracking-wider bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                            Filter
                        </button>
                    </div>
                )}

                {/* ── Main Data View ── */}
                <div className="glass rounded-[1.5rem] border border-[var(--color-border)] overflow-hidden relative">
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
                            {saveStatus === "saving" ? "Menyimpan..." : saveStatus === "saved" ? "Tersimpan" : "Gagal Simpan"}
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
                                onHistory={handleOpenHistory}
                                canEdit={canEdit}
                                isPrivacyMode={isPrivacyMode}
                                maskValue={maskValue}
                                getTimeStatus={getTimeStatus}
                                getDuration={getDuration}
                            />
                        ) : (
                            <>
                                <PeriodsTable
                                    paged={paged}
                                    years={years}
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
                                    handleInlineSave={handleInlineSave}
                                    inlineEditCell={inlineEditCell}
                                    setInlineEditCell={setInlineEditCell}
                                    handleEdit={handleEdit}
                                    handleOpenHistory={handleOpenHistory}
                                    handleToggleLock={handleToggleLock}
                                    handleOpenReadOnlyDetail={handleOpenReadOnlyDetail}
                                    setItemToDelete={setItemToDelete}
                                    setIsDeleteModalOpen={setIsDeleteModalOpen}
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
                                    { key: "period", label: "Tahun Pelajaran" },
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
                    confirmClassName="h-9 px-5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    submitting={isDeleting}
                >
                    <div className="p-4 rounded-2xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[11px] font-bold text-[var(--color-text-muted)] leading-relaxed shadow-sm">
                        Anda akan mengarsipkan <span className="font-black text-[var(--color-text)]">{selectedIds.length}</span> tahun pelajaran secara bersamaan. Data tetap aman dan dapat dipulihkan kapan saja dari menu arsip.
                    </div>
                </ConfirmDialog>

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

                <LockModal isOpen={isLockModalOpen} onClose={() => setIsLockModalOpen(false)} selectedCount={selectedIds.length} onConfirm={handleBulkLock} submitting={isDeleting} />
                <UnlockModal isOpen={isUnlockModalOpen} onClose={() => setIsUnlockModalOpen(false)} selectedCount={selectedIds.length} onConfirm={handleBulkUnlock} submitting={isDeleting} />

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
