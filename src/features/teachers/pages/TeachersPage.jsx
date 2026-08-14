import React, { useMemo, useCallback } from 'react'
import { Archive, ArrowCounterClockwise, CheckCircle, Eye, EyeSlash, Keyboard, Plus, SlidersHorizontal, Suitcase, ChatCircle, Trash } from '@phosphor-icons/react'
import { useNavigate, useParams } from 'react-router-dom'

import DashboardLayout from '@core/layouts/DashboardLayout'
import { useToast } from '@context/Toast'
import { useTeachersCore } from '@features/teachers/hooks/useTeachersCore'
import { useTeachersKeyboard } from '@features/teachers/hooks/useTeachersKeyboard'
import TeachersToolbar from '@features/teachers/components/TeachersToolbar'
import TeachersTable from '@features/teachers/components/TeachersTable'
import TeachersHeaderMenu from '@features/teachers/components/TeachersHeaderMenu'
import TeachersShortcutMenu from '@features/teachers/components/TeachersShortcutMenu'
import TeacherFormModal from '@features/teachers/components/TeacherFormModal'
import TeacherDetailPanel from '@features/teachers/components/TeacherDetailPanel'
import TeacherArchiveModal from '@features/teachers/components/TeacherArchiveModal'
import {
    BulkActionsBar,
    ConfirmDialog,
    Alert,
    PageHeader,
    StatCard,
    StatsCarousel,
    Modal,
    ColumnMenuPortal,
} from '@shared/components'

export default function TeachersPage() {
    const { addToast } = useToast()
    const navigate = useNavigate()
    const { id: teacherId } = useParams()
    const isDetailView = !!teacherId

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
        visibleCols, setVisibleCols, columnOrder,
        isColMenuOpen, setIsColMenuOpen, colMenuPos, setColMenuPos,
        colMenuRef, colMenuPortalRef, moveColumnLeft, moveColumnRight,
        isPrivacyMode, setIsPrivacyMode,
        isShortcutOpen, setIsShortcutOpen,
        isHeaderMenuOpen, setIsHeaderMenuOpen,
        headerMenuBtnRef, shortcutBtnRef, headerMenuRect, setHeaderMenuRect,
        setShortcutRect, headerMenuMounted, setHeaderMenuMounted,
        searchInputRef,
        isModalOpen, setIsModalOpen,
        isArchiveModalOpen, setIsArchiveModalOpen,
        isArchivedOpen, setIsArchivedOpen,
        isBulkModalOpen, setIsBulkModalOpen,
        isBulkWAOpen, setIsBulkWAOpen,
        selectedItem, setSelectedItem,
        teacherToAction, setTeacherToAction,
        archivedTeachers, setArchivedTeachers, loadingArchived,
        selectedIds, setSelectedIds,
        bulkWAIndex, bulkWAResults, waTemplate, setWaTemplate,
        quickStatusId, setQuickStatusId, quickStatusRef,
        activeFilterCount, hasActiveFilters, resetAllFilters,
        fetchData, fetchStats,
        handleAdd, handleEdit, handleSubmit, handleArchive, fetchArchived,
        handleTogglePin, handlePhotoUpload, handleQuickStatus,
        allSelected, someSelected, toggleSelectAll, toggleSelect,
        handleBulkArchive,
        bulkWATeachers, startBulkWA, sendNextWA,
    } = useTeachersCore({ addToast })

    // ── Navigation Handlers ──
    const handleOpenImport = useCallback(() => {
        navigate('/master/teachers/import')
    }, [navigate])

    const handleOpenExport = useCallback(() => {
        navigate('/master/teachers/export')
    }, [navigate])

    const handleViewTeacher = useCallback((teacher) => {
        if (teacher?.id) navigate(`/master/teachers/${teacher.id}`)
    }, [navigate])

    const handleBackToList = useCallback(() => {
        navigate('/master/teachers')
        fetchData()
    }, [navigate, fetchData])

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
        setIsExportModalOpen: handleOpenExport,
        setIsImportModalOpen: handleOpenImport,
        fetchData,
        teachers,
        handleEdit,
        toggleSelectAll,
    })

    const disp = useCallback(val => isPrivacyMode ? (val ? val.substring(0, 4) + '***' : '—') : (val || '—'), [isPrivacyMode])

    const statsContent = useMemo(() => (
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
    ), [stats, setFilterType, setFilterStatus, setPage])

    const selectedItems = useMemo(() => {
        return selectedIds.map(id => {
            const t = teachers.find(x => x.id === id)
            if (!t) return null
            return {
                id: t.id,
                label: t.name || t.full_name,
                meta: `${t.subject || '—'} · ${t.phone || '—'}`
            }
        }).filter(Boolean)
    }, [selectedIds, teachers])

    return (
        <DashboardLayout title="Data Guru">
            <div className="space-y-3 max-w-[1800px] mx-auto relative">

                {/* ── Detail View ── */}
                {isDetailView ? (
                    <TeacherDetailPanel
                        teacherId={teacherId}
                        onBack={handleBackToList}
                        subjectsList={subjectsList}
                        canEdit={canEdit}
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
                                        onClick={() => { if (!isHeaderMenuOpen) { setHeaderMenuRect(headerMenuBtnRef.current?.getBoundingClientRect()); setHeaderMenuMounted(true) } setIsHeaderMenuOpen(v => !v) }}
                                        className={`h-9 w-9 rounded-lg border flex items-center justify-center text-sm transition-all active:scale-95 ${isHeaderMenuOpen ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30 text-[var(--color-primary)]' : 'bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]'}`}
                                        title="Aksi lainnya"
                                    >
                                        <SlidersHorizontal />
                                    </button>

                                    <TeachersHeaderMenu
                                        isOpen={isHeaderMenuOpen}
                                        rect={headerMenuRect}
                                        mounted={headerMenuMounted}
                                        onClose={() => setIsHeaderMenuOpen(false)}
                                        onImportClick={handleOpenImport}
                                        onExportClick={handleOpenExport}
                                        onArchivedClick={() => { fetchArchived(); setIsArchivedOpen(true) }}
                                        archivedCount={archivedTeachers.length}
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
                                        onClose={() => setIsShortcutOpen(false)}
                                        selectedCount={selectedIds.length}
                                        onAction={(action) => {
                                            if (action === 'focusSearch') { searchInputRef.current?.focus(); searchInputRef.current?.select() }
                                            else if (action === 'add') { handleAdd() }
                                            else if (action === 'import') { handleOpenImport() }
                                            else if (action === 'export') { handleOpenExport() }
                                            else if (action === 'edit' && selectedIds.length === 1) { const item = teachers.find(t => t.id === selectedIds[0]); if (item) handleEdit(item) }
                                            else if (action === 'refresh') { fetchData() }
                                            else if (action === 'resetFilter') { resetAllFilters() }
                                            else if (action === 'selectAll') { toggleSelectAll() }
                                            else if (action === 'bulkArchive') { setIsBulkModalOpen(true) }
                                            else if (action === 'privacy') { setIsPrivacyMode(v => !v) }
                                            setIsShortcutOpen(false)
                                        }}
                                    />

                                    <button
                                        onClick={() => setIsPrivacyMode(v => !v)}
                                        className={`h-9 w-9 rounded-lg border flex items-center justify-center transition-all active:scale-95 ${isPrivacyMode ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' : 'bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'} `}
                                        title={isPrivacyMode ? "Matikan Mode Privasi" : "Aktifkan Mode Privasi"}
                                    >
                                        {isPrivacyMode ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                        {statsContent}

                        {/* ── Main Data View ── */}
                        <div className="glass rounded-2xl border border-[var(--color-border)] overflow-hidden relative">
                            <div className="border-b border-[var(--color-border)]">
                                <TeachersToolbar
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    searchInputRef={searchInputRef}
                                    loading={loading}
                                    totalRows={totalRows}
                                    isFilterOpen={showAdvFilter}
                                    setIsFilterOpen={setShowAdvFilter}
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
                                    selectedIds={selectedIds}
                                    toggleSelectAll={toggleSelectAll}
                                    setPage={setPage}
                                />
                            </div>
                            <TeachersTable
                                teachers={teachers}
                                totalRows={totalRows}
                                selectedIds={selectedIds}
                                toggleSelect={toggleSelect}
                                visibleCols={visibleCols}
                                columnOrder={columnOrder}
                                allSelected={allSelected}
                                someSelected={someSelected}
                                toggleSelectAll={toggleSelectAll}
                                canEdit={canEdit}
                                handleEdit={handleEdit}
                                handleView={handleViewTeacher}
                                handleTogglePin={handleTogglePin}
                                handleQuickStatus={handleQuickStatus}
                                setTeacherToAction={setTeacherToAction}
                                setIsArchiveModalOpen={setIsArchiveModalOpen}
                                quickStatusId={quickStatusId}
                                setQuickStatusId={setQuickStatusId}
                                quickStatusRef={quickStatusRef}
                                disp={disp}
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
                                colMenuRef={colMenuRef}
                                isColMenuOpen={isColMenuOpen}
                                setIsColMenuOpen={setIsColMenuOpen}
                                setColMenuPos={setColMenuPos}
                            />

                            <ColumnMenuPortal
                                isOpen={isColMenuOpen}
                                loading={loading}
                                portalRef={colMenuPortalRef}
                                colMenuPos={colMenuPos}
                                columnOrder={columnOrder}
                                colLabels={{ subject: "Mapel", gender: "Gender", contact: "Kontak", status: "Status", join: "Bergabung" }}
                                visibleCols={visibleCols}
                                setVisibleCols={setVisibleCols}
                                moveColumnLeft={moveColumnLeft}
                                moveColumnRight={moveColumnRight}
                            />
                        </div>

                        {/* ── Modals ── */}
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

                        <TeacherArchiveModal
                            isOpen={isArchivedOpen}
                            onClose={() => setIsArchivedOpen(false)}
                            archivedTeachers={archivedTeachers}
                            loadingArchived={loadingArchived}
                            setArchivedTeachers={setArchivedTeachers}
                            fetchData={fetchData}
                            fetchStats={fetchStats}
                            addToast={addToast}
                        />

                        <ConfirmDialog
                            isOpen={isArchiveModalOpen}
                            onClose={() => { setIsArchiveModalOpen(false); setTeacherToAction(null) }}
                            onConfirm={handleArchive}
                            title="Konfirmasi Arsip"
                            description="Guru akan dipindahkan ke folder Arsip"
                            icon={Archive}
                            iconBg="bg-amber-500/10"
                            iconColor="text-amber-600"
                            confirmText="Arsipkan"
                            confirmIcon={Archive}
                            confirmColor="amber"
                            submitting={submitting}
                        >
                            <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed font-bold">
                                Guru <span className="text-amber-600 font-black px-1.5 py-0.5 bg-amber-500/10 rounded-md border border-amber-500/20">{teacherToAction?.name}</span> akan diarsipkan. Riwayat mengajar & data tetap tersimpan dengan aman.
                            </p>
                        </ConfirmDialog>

                        <ConfirmDialog
                            isOpen={isBulkModalOpen}
                            onClose={() => setIsBulkModalOpen(false)}
                            onConfirm={handleBulkArchive}
                            title="Arsip Massal"
                            description={`${selectedIds.length} guru akan diarsipkan`}
                            icon={Archive}
                            iconBg="bg-amber-500/10"
                            iconColor="text-amber-600"
                            confirmText="Arsipkan Semua"
                            confirmIcon={Archive}
                            confirmColor="amber"
                            submitting={submitting}
                        >
                            <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed font-bold">
                                Anda akan mengarsipkan <span className="text-amber-600 font-black px-1.5 py-0.5 bg-amber-500/10 rounded-md border border-amber-500/20">{selectedIds.length} guru</span>.
                            </p>
                            <p className="text-[10px] text-[var(--color-text-muted)] mt-1 font-medium italic">
                                Data ini dapat dipulihkan kapan saja melalui folder Arsip.
                            </p>
                        </ConfirmDialog>

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

                    </>
                )}
            </div>
        </DashboardLayout>
    )
}
