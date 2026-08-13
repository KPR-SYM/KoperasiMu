import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Bed, Buildings, Eye, EyeSlash, Keyboard, Lock, LockOpen, Plus, SlidersHorizontal, Trash, Users } from '@phosphor-icons/react'
import { useNavigate, useParams } from 'react-router-dom'

import DashboardLayout from '@core/layouts/DashboardLayout'
import { useToast } from '@context/Toast'
import { useClassesCore } from '@features/classes/hooks/useClassesCore'
import { useClassesKeyboard } from '@features/classes/hooks/useClassesKeyboard'
import { useClassesModals } from '@features/classes/hooks/useClassesModals'
import { useClassesImportExport } from '@features/classes/hooks/useClassesImportExport'
import ClassesToolbar from '@features/classes/components/ClassesToolbar'
import ClassesTable from '@features/classes/components/ClassesTable'
import ClassesHeaderMenu from '@features/classes/components/ClassesHeaderMenu'
import ClassesShortcutMenu from '@features/classes/components/ClassesShortcutMenu'
import ClassFormModal from '@features/classes/components/ClassFormModal'
import ClassExportModal from '@features/classes/components/ClassExportModal'
import ClassArchiveModal from '@features/classes/components/ClassArchiveModal'
import ClassImportModal from '@features/classes/components/ClassImportModal'
import ClassDetailPanel from '@features/classes/components/ClassDetailPanel'
import ClassesHistoryModal from '@features/classes/components/ClassesHistoryModal'
import { ClassBulkDeleteModal, ClassBulkLockModal, ClassBulkUnlockModal } from '@features/classes/components/ClassConfirmModals'
import {
    BulkActionsBar,
    ConfirmDialog,
    Alert,
    EmptyState,
    PageHeader,
    Pagination,
    StatCard,
    StatsCarousel,
} from '@shared/components'

export default function ClassesPage() {
    const { addToast } = useToast()
    const navigate = useNavigate()
    const { id: classId } = useParams()
    const isDetailView = !!classId

    // ── Core Hook ──
    const {
        classes, archivedClasses, setArchivedClasses, loading, loadingArchived, stats,
        fetchData, fetchArchived, handleRestore, handlePermanentDelete,
        teachersList, periodsList,
        submitting, isDeleting, isMutating,
        canEdit,
        searchQuery, setSearchQuery, filterLevel, setFilterLevel,
        filterProgram, setFilterProgram, sortBy, setSortBy,
        filterNoTeacher, setFilterNoTeacher, filterCrowded, setFilterCrowded,
        isFilterOpen, setIsFilterOpen, activeFilterCount, hasActiveFilters, resetAllFilters,
        page, setPage, jumpPage, setJumpPage, pageSize, setPageSize,
        totalRows, paged, filtered,
        selectedIds, setSelectedIds, selectedItems, toggleSelect, toggleSelectAll,
        allSelected, someSelected,
        visibleCols, setVisibleCols,
        isColMenuOpen, setIsColMenuOpen, colMenuPos, setColMenuPos,
        colMenuRef, colMenuPortalRef,
        pinnedIds, togglePin,
        isPrivacyMode, setIsPrivacyMode, togglePrivacyMode,
        isShortcutOpen, setIsShortcutOpen, isHeaderMenuOpen, setIsHeaderMenuOpen,
        headerMenuBtnRef, shortcutBtnRef, headerMenuRect, setHeaderMenuRect,
        shortcutRect, setShortcutRect, headerMenuMounted, searchInputRef,
        selectedItem, setSelectedItem, itemToDelete, setItemToDelete,
        isModalOpen, setIsModalOpen, isDeleteModalOpen, setIsDeleteModalOpen,
        isBulkDeleteOpen, setIsBulkDeleteOpen,
        handleAdd, handleEdit, handleSubmit, handleDeleteConfirm, handleBulkDelete,
        handleBulkLock, handleBulkUnlock, handleDuplicate, handleArchive,
        LEVELS, PROGRAMS,
        handleError,
        viewMode, setViewMode,
        undoStack, redoStack, handleUndo, handleRedo,
    } = useClassesCore({ addToast })

    // ── Detail View State ──
    const handleViewClass = useCallback((cls) => {
        navigate(`/master/classes/${cls.uuid || cls.id}`)
    }, [navigate])
    const handleBackToList = useCallback(() => {
        navigate('/master/classes')
        fetchData()
    }, [navigate, fetchData])

    // ── Modal State ──
    const {
        isExportModalOpen, setIsExportModalOpen,
        isImportModalOpen, setIsImportModalOpen,
        isArchivedModalOpen, setIsArchivedModalOpen,
        isLockModalOpen, setIsLockModalOpen,
        isUnlockModalOpen, setIsUnlockModalOpen,
    } = useClassesModals()

    // ── History State ──
    const [historyItem, setHistoryItem] = useState(null)
    const isHistoryOpen = !!historyItem
    const handleOpenHistory = useCallback((cls) => {
        setHistoryItem(cls)
    }, [])

    // ── Import/Export Hook ──
    const {
        importStep, setImportStep, importFileName, setImportFileName,
        importRawData,
        importFileHeaders,
        importColumnMapping, setImportColumnMapping,
        importPreview, setImportPreview,
        importIssues,
        importLoading, setImportLoading,
        importValidationOpen, setImportValidationOpen,
        importDragOver, setImportDragOver,
        importing, importProgress,
        importEditCell, setImportEditCell,
        importSkipDupes, setImportSkipDupes,
        exportScope, setExportScope, exportColumns, setExportColumns, exporting,
        importReadyRows, hasImportBlockingErrors,
        importFileInputRef,
        handleImportClick, processImportFile,
        buildImportPreview, handleImportCellEdit, handleRemoveImportRow,
        handleDownloadTemplate, handleCommitImport,
        handleExportCSV, handleExportExcel, handleExportPDF,
        SYSTEM_COLS,
    } = useClassesImportExport({
        classes, filtered, selectedIds, canEdit, fetchData,
        addToast, handleError,
        teachersList, periodsList,
        isImportModalOpen, setIsImportModalOpen,
        isExportModalOpen, setIsExportModalOpen,
    })

    // ── Keyboard Shortcuts ──
    useClassesKeyboard({
        setIsPrivacyMode,
        canEdit, handleAdd,
        searchInputRef,
        selectedIds, setSelectedIds,
        setIsBulkDeleteOpen,
        setIsShortcutOpen,
        searchQuery, setSearchQuery,
        hasActiveFilters, resetAllFilters,
        setIsExportModalOpen: () => navigate('/master/classes/export'),
        setIsImportModalOpen: () => navigate('/master/classes/import'),
        handleBulkLock,
        handleBulkUnlock,
        isMutating,
        classes,
        handleEdit,
        setViewMode,
        viewMode,
        handleUndo,
        handleRedo,
        undoStack,
        redoStack,
        toggleSelectAll,
        handleOpenHistory,
    })

    const isAnyModalOpen = isModalOpen || isDeleteModalOpen || isBulkDeleteOpen || isExportModalOpen || isImportModalOpen || isArchivedModalOpen || isLockModalOpen || isUnlockModalOpen

    const statsContent = useMemo(() => (
        <StatsCarousel count={4} cols={4}>
            <StatCard icon={Buildings} label="Total Kelas" value={stats.total} color="primary" />
            <StatCard icon={Bed} label="Boarding" value={stats.boarding} color="primary" />
            <StatCard icon={Buildings} label="Reguler" value={stats.reguler} color="primary" />
            <StatCard icon={Users} label="Total Siswa" value={stats.totalStudents} color="primary" />
        </StatsCarousel>
    ), [stats])

    return (
        <DashboardLayout title="Data Kelas">
            <div className="space-y-3 max-w-[1800px] mx-auto relative">

                {/* ── Detail View ── */}
                {isDetailView ? (
                    <ClassDetailPanel
                        classId={classId}
                        onBack={handleBackToList}
                        teachersList={teachersList}
                        periodsList={periodsList}
                    />
                ) : (
                    <>
                        {/* Bulk Action Bar */}
                        {selectedIds.length > 0 && (
                            <BulkActionsBar
                                selectedCount={selectedIds.length}
                                onClear={() => setSelectedIds([])}
                                title="Data Terpilih"
                                subtitle="Aksi Massal"
                                selectedItems={selectedItems}
                                onRemoveItem={(id) => setSelectedIds((prev) => prev.filter((x) => x !== id))}
                                primaryAction={{
                                    label: "Hapus",
                                    icon: <Trash className="w-3.5 h-3.5" />,
                                    variant: "destructive",
                                    onClick: () => setIsBulkDeleteOpen(true),
                                    disabled: !canEdit || isMutating,
                                }}
                                secondaryActions={[
                                    {
                                        label: "Kunci",
                                        icon: <Lock className="w-3.5 h-3.5" />,
                                        onClick: () => setIsLockModalOpen(true),
                                        disabled: !canEdit || isMutating,
                                    },
                                    {
                                        label: "Buka Kunci",
                                        icon: <LockOpen className="w-3.5 h-3.5" />,
                                        onClick: () => setIsUnlockModalOpen(true),
                                        disabled: !canEdit || isMutating,
                                    },
                                ]}
                            />
                        )}

                        {!canEdit && (
                            <Alert variant="rose" size="md">
                                Mode Read-only — Pen data kelas dinonaktifkan oleh administrator.
                            </Alert>
                        )}

                        {/* ── Header Row ── */}
                        <PageHeader
                            title="Data Kelas"
                            subtitle={`Kelola ${stats.total} data kelas dalam sistem.`}
                            actions={
                                <>
                                    <button
                                        ref={headerMenuBtnRef}
                                        onClick={() => { if (!isHeaderMenuOpen) setHeaderMenuRect(headerMenuBtnRef.current?.getBoundingClientRect()); setIsHeaderMenuOpen(v => !v) }}
                                        className={`h-9 w-9 rounded-lg border flex items-center justify-center text-sm transition-all active:scale-95 ${isHeaderMenuOpen ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30 text-[var(--color-primary)]' : 'bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]'}`}
                                        title="Aksi lainnya"
                                    >
                                        <SlidersHorizontal />
                                    </button>

                                    <ClassesHeaderMenu
                                        isOpen={isHeaderMenuOpen}
                                        rect={headerMenuRect}
                                        mounted={headerMenuMounted}
                                        canEdit={canEdit}
                                        isMutating={isMutating}
                                        onClose={() => setIsHeaderMenuOpen(false)}
                                        onImportClick={() => navigate('/master/classes/import')}
                                        onExportClick={() => navigate('/master/classes/export')}
                                        onArchivedClick={() => setIsArchivedModalOpen(true)}
                                        archivedCount={archivedClasses.length}
                                        fetchArchived={fetchArchived}
                                    />

                                    <input
                                        type="file"
                                        ref={importFileInputRef}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) processImportFile(file)
                                            e.target.value = ''
                                        }}
                                        className="hidden"
                                        accept=".csv,.xlsx"
                                    />

                                    <button
                                        ref={shortcutBtnRef}
                                        onClick={() => { if (!isShortcutOpen) setShortcutRect(shortcutBtnRef.current?.getBoundingClientRect()); setIsShortcutOpen(v => !v) }}
                                        className={`hidden sm:flex h-9 w-9 rounded-lg border items-center justify-center transition-all active:scale-95
                                ${isShortcutOpen
                                                ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30 text-[var(--color-primary)]'
                                                : 'bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                                            }`}
                                        title="Keyboard Shortcuts (?)"
                                    >
                                        <Keyboard className="w-4 h-4" />
                                    </button>

                                    <ClassesShortcutMenu
                                        isOpen={isShortcutOpen}
                                        rect={shortcutRect}
                                        onClose={() => setIsShortcutOpen(false)}
                                        selectedCount={selectedIds.length}
                                        onAction={(action) => {
                                            if (action === 'focusSearch') { searchInputRef.current?.focus(); searchInputRef.current?.select() }
                                            else if (action === 'toggleView') { setViewMode(prev => prev === 'table' ? 'timeline' : 'table') }
                                            else if (action === 'add') { handleAdd() }
                                            else if (action === 'import') { navigate('/master/classes/import') }
                                            else if (action === 'export') { navigate('/master/classes/export') }
                                            else if (action === 'edit' && selectedIds.length === 1) { const item = classes.find(c => c.id === selectedIds[0]); if (item) handleEdit(item) }
                                            else if (action === 'resetFilter') { resetAllFilters() }
                                            else if (action === 'selectAll') { toggleSelectAll() }
                                            else if (action === 'bulkDelete') { setIsBulkDeleteOpen(true) }
                                            else if (action === 'privacy') { togglePrivacyMode() }
                                            else if (action === 'undo') { handleUndo() }
                                            else if (action === 'redo') { handleRedo() }
                                            setIsShortcutOpen(false)
                                        }}
                                    />

                                    <button
                                        onClick={togglePrivacyMode}
                                        className={`h-9 w-9 rounded-lg border flex items-center justify-center transition-all active:scale-95 ${isPrivacyMode ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' : 'bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'} `}
                                        title={isPrivacyMode ? "Matikan Mode Privasi" : "Aktifkan Mode Privasi"}
                                    >
                                        {isPrivacyMode ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>

                                    {canEdit && (
                                        <button onClick={handleAdd} className="h-9 px-4 sm:px-5 rounded-xl bg-[var(--color-primary)] text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-[var(--color-primary)]/20 border border-white/10">
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Tambah Kelas</span>
                                        </button>
                                    )}
                                </>
                            }
                        />

                        {/* ── Stats ── */}
                        {statsContent}

                        {/* ── Main Data View ── */}
                        <div className="glass rounded-2xl border border-[var(--color-border)] overflow-hidden relative">
                            <div className="border-b border-[var(--color-border)]">
                                <ClassesToolbar
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    searchInputRef={searchInputRef}
                                    loading={loading}
                                    totalRows={totalRows}
                                    filterLevel={filterLevel}
                                    setFilterLevel={setFilterLevel}
                                    filterProgram={filterProgram}
                                    setFilterProgram={setFilterProgram}
                                    sortBy={sortBy}
                                    setSortBy={setSortBy}
                                    filterNoTeacher={filterNoTeacher}
                                    setFilterNoTeacher={setFilterNoTeacher}
                                    filterCrowded={filterCrowded}
                                    setFilterCrowded={setFilterCrowded}
                                    isFilterOpen={isFilterOpen}
                                    setIsFilterOpen={setIsFilterOpen}
                                    activeFilterCount={activeFilterCount}
                                    resetAllFilters={resetAllFilters}
                                    selectedIds={selectedIds}
                                    toggleSelectAll={toggleSelectAll}
                                    LEVELS={LEVELS}
                                    PROGRAMS={PROGRAMS}
                                    setPage={setPage}
                                />
                            </div>
                            <ClassesTable
                                paged={paged}
                                totalFilteredRows={totalRows}
                                selectedIds={selectedIds}
                                toggleSelect={toggleSelect}
                                visibleCols={visibleCols}
                                allSelected={allSelected}
                                someSelected={someSelected}
                                toggleSelectAll={toggleSelectAll}
                                handleEdit={handleEdit}
                                handleView={handleViewClass}
                                handleDuplicate={canEdit ? handleDuplicate : null}
                                handleArchive={canEdit ? handleArchive : null}
                                onHistory={handleOpenHistory}
                                setItemToDelete={setItemToDelete}
                                setIsDeleteModalOpen={setIsDeleteModalOpen}
                                isPrivacyMode={isPrivacyMode}
                                canEdit={canEdit}
                                loading={loading}
                                searchQuery={searchQuery}
                                filterLevel={filterLevel}
                                filterProgram={filterProgram}
                                filterNoTeacher={filterNoTeacher}
                                filterCrowded={filterCrowded}
                                resetAllFilters={resetAllFilters}
                                handleAdd={handleAdd}
                                page={page}
                                pageSize={pageSize}
                                setPage={setPage}
                                setPageSize={setPageSize}
                                jumpPage={jumpPage}
                                setJumpPage={setJumpPage}
                                pinnedIds={pinnedIds}
                                togglePin={canEdit ? togglePin : null}
                                colMenuRef={colMenuRef}
                                isColMenuOpen={isColMenuOpen}
                                setIsColMenuOpen={setIsColMenuOpen}
                                colMenuPos={colMenuPos}
                                setColMenuPos={setColMenuPos}
                                colMenuPortalRef={colMenuPortalRef}
                                setVisibleCols={setVisibleCols}
                            />
                        </div>

                        {/* ── Modals ── */}
                        <ClassFormModal
                            isOpen={isModalOpen}
                            onClose={() => { setIsModalOpen(false); setSelectedItem(null) }}
                            selectedItem={selectedItem}
                            teachersList={teachersList}
                            periodsList={periodsList}
                            onSubmit={handleSubmit}
                            submitting={submitting}
                        />

                        <ConfirmDialog
                            isOpen={isDeleteModalOpen}
                            onClose={() => { setIsDeleteModalOpen(false); setItemToDelete(null) }}
                            onConfirm={handleDeleteConfirm}
                            title="Hapus Kelas"
                            description={`Yakin menghapus kelas "${itemToDelete?.name}"? Penghapusan tidak dapat dibatalkan.`}
                            icon={Trash}
                            iconBg="bg-red-500/10"
                            iconColor="text-red-500"
                            confirmText="Hapus"
                            confirmIcon={Trash}
                            confirmColor="red"
                            submitting={isDeleting}
                        />

                        <ConfirmDialog
                            isOpen={isBulkDeleteOpen}
                            onClose={() => setIsBulkDeleteOpen(false)}
                            onConfirm={handleBulkDelete}
                            title="Hapus Massal Kelas"
                            description={`${selectedIds.length} kelas akan dihapus permanen. Penghapusan tidak dapat dibatalkan.`}
                            icon={Trash}
                            iconBg="bg-red-500/10"
                            iconColor="text-red-500"
                            confirmText="Hapus Semua"
                            confirmIcon={Trash}
                            confirmColor="red"
                            submitting={isDeleting}
                        >
                            <div className="p-4 rounded-2xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[11px] font-bold text-[var(--color-text-muted)] leading-relaxed shadow-sm space-y-2">
                                <p>Anda akan menghapus <span className="font-black text-[var(--color-text)]">{selectedIds.length}</span> kelas secara bersamaan.</p>
                                {selectedItems.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {selectedItems.slice(0, 5).map(item => (
                                            <span key={item.id} className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 text-[9px] font-bold">{item.name}</span>
                                        ))}
                                        {selectedItems.length > 5 && <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 text-[9px] font-bold">+{selectedItems.length - 5}</span>}
                                    </div>
                                )}
                            </div>
                        </ConfirmDialog>

                        <ClassExportModal
                            isOpen={isExportModalOpen}
                            onClose={() => setIsExportModalOpen(false)}
                            classes={classes}
                            selectedClassIds={selectedIds}
                            exportScope={exportScope}
                            setExportScope={setExportScope}
                            exportColumns={exportColumns}
                            setExportColumns={setExportColumns}
                            exporting={exporting}
                            handleExportCSV={handleExportCSV}
                            handleExportExcel={handleExportExcel}
                            handleExportPDF={handleExportPDF}
                        />

                        <ClassArchiveModal
                            isOpen={isArchivedModalOpen}
                            onClose={() => setIsArchivedModalOpen(false)}
                            archivedClasses={archivedClasses}
                            loadingArchived={loadingArchived}
                            setArchivedClasses={setArchivedClasses}
                            fetchArchived={fetchArchived}
                            fetchData={fetchData}
                            addToast={addToast}
                        />

                        <ClassesHistoryModal
                            isOpen={isHistoryOpen}
                            onClose={() => setHistoryItem(null)}
                            item={historyItem}
                        />

                        <ClassImportModal
                            isOpen={isImportModalOpen}
                            onClose={() => setIsImportModalOpen(false)}
                            importing={importing}
                            importStep={importStep}
                            setImportStep={setImportStep}
                            importPreview={importPreview}
                            importFileName={importFileName}
                            importDragOver={importDragOver}
                            setImportDragOver={setImportDragOver}
                            processImportFile={processImportFile}
                            teachersList={teachersList}
                            periodsList={periodsList}
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

                        <ClassBulkLockModal
                            isOpen={isLockModalOpen}
                            onClose={() => setIsLockModalOpen(false)}
                            onConfirm={() => { handleBulkLock(); setIsLockModalOpen(false) }}
                            loading={isMutating}
                            count={selectedIds.length}
                        />

                        <ClassBulkUnlockModal
                            isOpen={isUnlockModalOpen}
                            onClose={() => setIsUnlockModalOpen(false)}
                            onConfirm={() => { handleBulkUnlock(); setIsUnlockModalOpen(false) }}
                            loading={isMutating}
                            count={selectedIds.length}
                        />

                    </>
                )}
            </div>
        </DashboardLayout>
    )
}
