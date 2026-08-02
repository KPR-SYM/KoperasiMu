import React from 'react'
import { Archive, ArrowCounterClockwise, CheckCircle, Eye, EyeSlash, Keyboard, MagnifyingGlass, Plus, SlidersHorizontal, Spinner, Suitcase, ChatCircle, Trash, X } from '@phosphor-icons/react'

import DashboardLayout from '@core/layouts/DashboardLayout'
import { useToast } from '@context/Toast'
import { useAuth } from '@context/Auth'
import { useTeachersCore } from '@features/teachers/hooks/useTeachersCore'
import { useTeachersKeyboard } from '@features/teachers/hooks/useTeachersKeyboard'
import { useTeachersModals } from '@features/teachers/hooks/useTeachersModals'
import { useTeachersImportExport } from '@features/teachers/hooks/useTeachersImportExport'
import TeachersToolbar from '@features/teachers/components/TeachersToolbar'
import TeachersTable from '@features/teachers/components/TeachersTable'
import TeachersHeaderMenu from '@features/teachers/components/TeachersHeaderMenu'
import TeachersShortcutMenu from '@features/teachers/components/TeachersShortcutMenu'
import TeacherFormModal from '@features/teachers/components/TeacherFormModal'
import TeacherProfileModal from '@features/teachers/components/TeacherProfileModal'
import TeacherImportModal from '@features/teachers/components/TeacherImportModal'
import TeacherExportModal from '@features/teachers/components/TeacherExportModal'
import TeacherArchiveModal from '@features/teachers/components/TeacherArchiveModal'
import { STATUS_CONFIG } from '@features/teachers/components/TeacherRow'
import {
    BulkActionsBar,
    ConfirmDialog,
    Alert,
    EmptyState,
    PageHeader,
    Pagination,
    StatCard,
    StatsCarousel,
    Modal,
} from '@shared/components'

export default function TeachersPage() {
    const { addToast } = useToast()
    const { profile } = useAuth()

    // ── Core Hook ──
    const {
        canEdit,
        teachers, loading, submitting, totalRows,
        subjectsList, classesList, stats, uploadingPhoto,
        searchQuery, setSearchQuery,
        filterSubject, setFilterSubject, filterGender, setFilterGender,
        filterStatus, setFilterStatus, filterType, setFilterType,
        filterMissing, setFilterMissing, sortBy, setSortBy,
        page, setPage, jumpPage, setJumpPage, pageSize, setPageSize,
        showAdvFilter, setShowAdvFilter,
        visibleCols,
        isPrivacyMode, setIsPrivacyMode,
        isShortcutOpen, setIsShortcutOpen,
        isHeaderMenuOpen, setIsHeaderMenuOpen,
        headerMenuBtnRef, shortcutBtnRef, headerMenuRect, setHeaderMenuRect,
        shortcutRect, setShortcutRect, headerMenuMounted,
        searchInputRef,
        isModalOpen, setIsModalOpen,
        isArchiveModalOpen, setIsArchiveModalOpen,
        isArchivedOpen, setIsArchivedOpen,
        isProfileOpen, setIsProfileOpen,
        isBulkModalOpen, setIsBulkModalOpen,
        isBulkWAOpen, setIsBulkWAOpen,
        selectedItem, setSelectedItem,
        teacherToAction, setTeacherToAction,
        profileTeacher,
        loadingProfile, profileTab, setProfileTab,
        archivedTeachers, setArchivedTeachers, loadingArchived,
        selectedIds, setSelectedIds,
        bulkWAIndex, bulkWAResults, waTemplate, setWaTemplate,
        quickStatusId, setQuickStatusId, quickStatusRef,
        activeFilterCount, hasActiveFilters, resetAllFilters,
        fetchData, fetchStats,
        handleAdd, handleEdit, handleSubmit, handleArchive, fetchArchived,
        handleTogglePin, handlePhotoUpload, handleQuickStatus, openProfile,
        allSelected, someSelected, toggleSelectAll, toggleSelect,
        handleBulkArchive,
        bulkWATeachers, startBulkWA, sendNextWA,
    } = useTeachersCore({ addToast })

    // ── Modal State ──
    const {
        isExportModalOpen, setIsExportModalOpen,
        isImportModalOpen, setIsImportModalOpen,
        isArchivedModalOpen: _isArchivedModalOpen, setIsArchivedModalOpen: _setIsArchivedModalOpen,
    } = useTeachersModals()

    // ── Import/Export Hook ──
    const {
        importStep, setImportStep, importFileName, setImportFileName,
        importRawData,
        importFileHeaders,
        importColumnMapping, setImportColumnMapping,
        importPreview, setImportPreview,
        importIssues, setImportIssues,
        importLoading, setImportLoading,
        importValidationOpen, setImportValidationOpen,
        importDrag, setImportDrag, importing,
        importProgress,
        importEditCell, setImportEditCell,
        importSkipDupes, setImportSkipDupes,
        exportScope, setExportScope, exportColumns, setExportColumns, exporting,
        importReadyRows, hasImportBlockingErrors,
        processImportFile, buildImportPreview, handleImportCellEdit, handleRemoveImportRow,
        handleBulkFix, handleDownloadTemplate, handleCommitImport,
        handleExportCSV, handleExportExcel, handleExportPDF,
        SYSTEM_COLS,
    } = useTeachersImportExport({
        teachers, selectedIds,
        filterStatus, filterGender, filterSubject, filterType,
        fetchData, fetchStats,
        addToast,
        setIsImportModalOpen, setIsExportModalOpen,
    })

    // ── Keyboard Shortcuts ──
    useTeachersKeyboard({
        setIsPrivacyMode,
        canEdit, handleAdd,
        searchInputRef,
        selectedIds, setSelectedIds,
        setIsBulkModalOpen,
        setIsShortcutOpen,
        searchQuery, setSearchQuery,
        hasActiveFilters, resetAllFilters,
        setIsExportModalOpen,
        fetchData,
    })

    const isAnyModalOpen = isModalOpen || isArchiveModalOpen || isArchivedOpen || isProfileOpen || isImportModalOpen || isExportModalOpen || isBulkModalOpen || isBulkWAOpen

    const disp = val => isPrivacyMode ? (val ? val.substring(0, 4) + '***' : '—') : (val || '—')

    const importFileRef = React.useRef(null)

    return (
        <DashboardLayout title="Data Guru" hideHeader={isAnyModalOpen} hideSidebar={isAnyModalOpen}>
            <style>{isAnyModalOpen ? ` .top-nav, .sidebar, .floating-dock { display: none !important; } main { padding-top: 0 !important; } ` : ''}</style>
            <div className="space-y-3 max-w-[1800px] mx-auto relative">

                {/* Bulk Action Bar */}
                {selectedIds.length > 0 && (
                    <BulkActionsBar
                        selectedCount={selectedIds.length}
                        onClear={() => setSelectedIds([])}
                        title="Data Terpilih"
                        subtitle="Aksi Massal"
                        selectedItems={selectedIds.map(id => teachers.find(t => t.id === id)).filter(Boolean)}
                        onRemoveItem={(id) => setSelectedIds((prev) => prev.filter((x) => x !== id))}
                        primaryAction={{
                            label: "Arsip",
                            icon: <Archive className="w-3.5 h-3.5" />,
                            variant: "destructive",
                            onClick: () => setIsBulkModalOpen(true),
                            disabled: !canEdit || submitting,
                        }}
                        secondaryActions={[
                            {
                                label: "WA Massal",
                                icon: <ChatCircle className="w-3.5 h-3.5" />,
                                variant: "default",
                                onClick: startBulkWA,
                                disabled: !bulkWATeachers.length,
                            },
                        ]}
                    />
                )}

                {!canEdit && (
                    <Alert variant="rose" size="md">
                        Mode Read-only — Pen data guru dinonaktifkan oleh administrator.
                    </Alert>
                )}

                {/* ── Header Row ── */}
                <PageHeader
                    title="Data Guru"
                    subtitle={`Kelola ${stats.total} data ${filterType === 'karyawan' ? 'karyawan' : filterType === 'guru' ? 'guru' : 'guru dan karyawan'} dalam sistem.`}
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

                            <TeachersHeaderMenu
                                isOpen={isHeaderMenuOpen}
                                rect={headerMenuRect}
                                mounted={headerMenuMounted}
                                canEdit={canEdit}
                                isMutating={submitting}
                                onClose={() => setIsHeaderMenuOpen(false)}
                                onImportClick={() => { setImportStep(1); setImportPreview([]); setImportFileName(''); setIsImportModalOpen(true) }}
                                onExportClick={() => setIsExportModalOpen(true)}
                                onArchivedClick={() => { fetchArchived(); setIsArchivedOpen(true) }}
                            />

                            <input
                                type="file"
                                ref={importFileRef}
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

                            <TeachersShortcutMenu
                                isOpen={isShortcutOpen}
                                rect={shortcutRect}
                                onClose={() => setIsShortcutOpen(false)}
                            />

                            <button
                                onClick={() => setIsPrivacyMode(v => !v)}
                                className={`h-9 w-9 sm:w-auto sm:px-3 rounded-lg border flex items-center justify-center sm:justify-start gap-2 transition-all active:scale-95 ${isPrivacyMode ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' : 'bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'} `}
                                title={isPrivacyMode ? "Matikan Mode Privasi" : "Aktifkan Mode Privasi"}
                            >
                                {isPrivacyMode ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Privasi</span>
                            </button>

                            {canEdit && (
                                <button onClick={handleAdd} className="h-9 px-4 sm:px-5 rounded-xl bg-[var(--color-primary)] text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-[var(--color-primary)]/20 border border-white/10">
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Tambah Guru</span>
                                </button>
                            )}
                        </>
                    }
                />

                {/* ── Stats ── */}
                <StatsCarousel count={4} cols={4}>
                    <StatCard
                        icon={ArrowCounterClockwise}
                        label="Total"
                        value={stats.total}
                        color="primary"
                        onClick={() => { setFilterType(''); setPage(1) }}
                    />
                    <StatCard
                        icon={CheckCircle}
                        label="Aktif"
                        value={stats.active}
                        color="primary"
                        onClick={() => { setFilterStatus('active'); setPage(1) }}
                    />
                    <StatCard
                        icon={ArrowCounterClockwise}
                        label="Guru"
                        value={stats.guru}
                        color="primary"
                        onClick={() => { setFilterType('guru'); setPage(1) }}
                    />
                    <StatCard
                        icon={Suitcase}
                        label="Karyawan"
                        value={stats.karyawan}
                        color="primary"
                        onClick={() => { setFilterType('karyawan'); setPage(1) }}
                    />
                </StatsCarousel>

                {/* ── Main Data View ── */}
                <div className="glass rounded-2xl border border-[var(--color-border)] overflow-hidden relative">
                    <TeachersToolbar
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        searchInputRef={searchInputRef}
                        loading={loading}
                        showAdvFilter={showAdvFilter}
                        setShowAdvFilter={setShowAdvFilter}
                        activeFilterCount={activeFilterCount}
                        resetAllFilters={resetAllFilters}
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                        filterGender={filterGender}
                        setFilterGender={setFilterGender}
                        filterSubject={filterSubject}
                        setFilterSubject={setFilterSubject}
                        filterType={filterType}
                        setFilterType={setFilterType}
                        filterMissing={filterMissing}
                        setFilterMissing={setFilterMissing}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        subjectsList={subjectsList}
                        setPage={setPage}
                    />
                    <TeachersTable
                        teachers={teachers}
                        totalRows={totalRows}
                        selectedIds={selectedIds}
                        toggleSelect={toggleSelect}
                        visibleCols={visibleCols}
                        allSelected={allSelected}
                        someSelected={someSelected}
                        toggleSelectAll={toggleSelectAll}
                        canEdit={canEdit}
                        handleEdit={handleEdit}
                        handleTogglePin={handleTogglePin}
                        handleQuickStatus={handleQuickStatus}
                        setTeacherToAction={setTeacherToAction}
                        setIsArchiveModalOpen={setIsArchiveModalOpen}
                        quickStatusId={quickStatusId}
                        setQuickStatusId={setQuickStatusId}
                        quickStatusRef={quickStatusRef}
                        isPrivacyMode={isPrivacyMode}
                        disp={disp}
                        openProfile={openProfile}
                        loading={loading}
                        searchQuery={searchQuery}
                        filterStatus={filterStatus}
                        filterGender={filterGender}
                        filterSubject={filterSubject}
                        filterType={filterType}
                        filterMissing={filterMissing}
                        resetAllFilters={resetAllFilters}
                        handleAdd={handleAdd}
                        page={page}
                        pageSize={pageSize}
                        setPage={setPage}
                        setPageSize={setPageSize}
                        jumpPage={jumpPage}
                        setJumpPage={setJumpPage}
                    />
                </div>

                {/* ── Modals (lazy render) ── */}
                {isModalOpen && (
                    <TeacherFormModal
                        isOpen={isModalOpen}
                        onClose={() => { setIsModalOpen(false); setSelectedItem(null) }}
                        selectedItem={selectedItem}
                        classesList={classesList}
                        subjectsList={subjectsList}
                        onSubmit={handleSubmit}
                        submitting={submitting}
                        onPhotoUpload={handlePhotoUpload}
                        uploadingPhoto={uploadingPhoto}
                    />
                )}

                {isProfileOpen && (
                    <TeacherProfileModal
                        isOpen={isProfileOpen}
                        onClose={() => setIsProfileOpen(false)}
                        selectedTeacher={profileTeacher}
                        loadingProfile={loadingProfile}
                        profileTab={profileTab}
                        setProfileTab={setProfileTab}
                        canEdit={canEdit}
                        handleEdit={handleEdit}
                        addToast={addToast}
                        fetchData={fetchData}
                        userRole={profile?.role}
                    />
                )}

                {isImportModalOpen && (
                    <TeacherImportModal
                        isOpen={isImportModalOpen}
                        onClose={() => { if (importing) return; setIsImportModalOpen(false); setImportPreview([]); setImportIssues([]); setImportFileName(''); setImportStep(1) }}
                        importing={importing}
                        importStep={importStep}
                        setImportStep={setImportStep}
                        importPreview={importPreview}
                        importFileName={importFileName}
                        importFileInputRef={importFileRef}
                        importDragOver={importDrag}
                        setImportDragOver={setImportDrag}
                        processImportFile={processImportFile}
                        subjectsList={subjectsList}
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
                        handleImportClick={() => importFileRef.current?.click()}
                        hasImportBlockingErrors={hasImportBlockingErrors}
                        importReadyRows={importReadyRows}
                        handleImportCellEdit={handleImportCellEdit}
                        importEditCell={importEditCell}
                        setImportEditCell={setImportEditCell}
                        handleRemoveImportRow={handleRemoveImportRow}
                        importSkipDupes={importSkipDupes}
                        setImportSkipDupes={setImportSkipDupes}
                        handleBulkFix={handleBulkFix}
                        STATUS_CONFIG={STATUS_CONFIG}
                    />
                )}

                {isExportModalOpen && (
                    <TeacherExportModal
                        isOpen={isExportModalOpen}
                        onClose={() => setIsExportModalOpen(false)}
                        teachers={teachers}
                        selectedTeacherIds={selectedIds}
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

                {isArchivedOpen && (
                    <TeacherArchiveModal
                        isOpen={isArchivedOpen}
                        onClose={() => setIsArchivedOpen(false)}
                        archivedTeachers={archivedTeachers}
                        loadingArchived={loadingArchived}
                        setArchivedTeachers={setArchivedTeachers}
                        fetchArchivedTeachers={fetchArchived}
                        fetchData={fetchData}
                        fetchStats={fetchStats}
                        addToast={addToast}
                    />
                )}

                {/* Archive Confirm Modal */}
                <Modal
                    isOpen={isArchiveModalOpen}
                    onClose={() => { setIsArchiveModalOpen(false); setTeacherToAction(null) }}
                    title="Konfirmasi Arsip"
                    description="Guru akan dipindahkan ke folder Arsip"
                    icon={Archive}
                    iconBg="bg-amber-500/10"
                    iconColor="text-amber-600"
                    size="sm"
                    mobileVariant="bottom-sheet"
                    footer={
                        <div className="flex items-center w-full gap-3">
                            <button
                                type="button"
                                onClick={() => { setIsArchiveModalOpen(false); setTeacherToAction(null) }}
                                className="h-10 px-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] text-[10px] font-black uppercase tracking-widest transition-all shrink-0"
                            >
                                Batal
                            </button>
                            <div className="flex-1" />
                            <button
                                type="button"
                                onClick={handleArchive}
                                disabled={submitting}
                                className="h-10 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                            >
                                {submitting ? <Spinner className="animate-spin w-3 h-3" /> : <Archive className="w-3 h-3 opacity-70" />}
                                Arsipkan
                            </button>
                        </div>
                    }
                >
                    <div className="px-1">
                        <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed font-bold">
                            Guru <span className="text-amber-600 font-black px-1.5 py-0.5 bg-amber-500/10 rounded-md border border-amber-500/20">{teacherToAction?.name}</span> akan diarsipkan. Riwayat mengajar & data tetap tersimpan dengan aman.
                        </p>
                    </div>
                </Modal>

                {/* Bulk Archive Modal */}
                <Modal
                    isOpen={isBulkModalOpen}
                    onClose={() => setIsBulkModalOpen(false)}
                    title="Arsip Massal"
                    description={`${selectedIds.length} guru akan diarsipkan`}
                    icon={Archive}
                    iconBg="bg-amber-500/10"
                    iconColor="text-amber-600"
                    size="sm"
                >
                    <div className="space-y-6">
                        <div className="py-2">
                            <p className="w-3 h-3 text-[var(--color-text-muted)] leading-relaxed font-bold">
                                Anda akan mengarsipkan <span className="text-amber-600 font-black px-1.5 py-0.5 bg-amber-500/10 rounded-md border border-amber-500/20">{selectedIds.length} guru</span>.
                            </p>
                            <p className="text-[10px] text-[var(--color-text-muted)] mt-1 font-medium italic">
                                Data ini dapat dipulihkan kapan saja melalui folder Arsip.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setIsBulkModalOpen(false)} className="flex-1 h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] text-[10px] font-black uppercase tracking-widest transition-all">
                                BATAL
                            </button>
                            <button
                                onClick={handleBulkArchive}
                                disabled={submitting}
                                className="flex-[2] h-11 rounded-xl bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                            >
                                {submitting ? <Spinner className="animate-spin" /> : (
                                    <><Archive className="w-3 h-3" /> ARSIPKAN SEMUA</>
                                )}
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Bulk WA Modal */}
                <Modal isOpen={isBulkWAOpen} onClose={() => setIsBulkWAOpen(false)} title="WA Massal Guru" size="sm">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Template Pesan</p>
                            {[{ id: 'info', label: 'Info Akun Sistem' }, { id: 'notif', label: 'Notifikasi Baru' }].map(t => (
                                <button key={t.id} onClick={() => setWaTemplate(t.id)} className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all ${waTemplate === t.id ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-lg' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-border)]'}`}>{t.label}</button>
                            ))}
                        </div>
                        <div className="p-3 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-muted)] font-medium">
                            {bulkWATeachers.length} guru dengan WA · {Object.values(bulkWAResults).filter(v => v === 'sent').length} sudah dikirim
                        </div>
                        <div className="max-h-56 overflow-y-auto space-y-2">
                            {bulkWATeachers.map((t, i) => (
                                <div key={t.id} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${i === bulkWAIndex ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : bulkWAResults[t.id] === 'sent' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-[var(--color-border)]'}`}>
                                    <div className="w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white text-xs font-black shrink-0">
                                        {t.avatar_url
                                            ? <img src={t.avatar_url} alt={t.name} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none' }} />
                                            : t.name.charAt(0)
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0"><p className="text-xs font-bold truncate">{t.name}</p><p className="text-[10px] text-[var(--color-text-muted)]">{t.phone}</p></div>
                                    {bulkWAResults[t.id] === 'sent' && <CheckCircle className="text-emerald-500 shrink-0" />}
                                    {i === bulkWAIndex && <span className="text-[9px] font-black text-[var(--color-primary)] uppercase">Berikutnya</span>}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setIsBulkWAOpen(false)} className="flex-1 h-11 rounded-xl bg-[var(--color-surface-alt)] text-xs font-black uppercase tracking-widest">Selesai</button>
                            {bulkWAIndex >= 0 && bulkWAIndex < bulkWATeachers.length && (
                                <button onClick={sendNextWA} className="flex-1 h-11 rounded-xl bg-green-500 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 transition-all">
                                    <ChatCircle />Kirim ke {bulkWATeachers[bulkWAIndex]?.name.split(' ')[0]}
                                </button>
                            )}
                        </div>
                    </div>
                </Modal>

            </div>
        </DashboardLayout>
    )
}
