import React, { memo } from 'react'
import { ArrowCounterClockwise, ArrowDown, ChatCircle, CheckCircle, CheckSquare, Checks, GenderMale, GenderFemale, MagnifyingGlass, PresentationChart, SlidersHorizontal, SortDescending, UserCheck, X, Archive } from '@phosphor-icons/react'
import { DebouncedSearchInput, Select } from '@shared/components'

const TeachersToolbar = memo(function TeachersToolbar({
    searchQuery, setSearchQuery, searchInputRef, loading,
    filterStatus, setFilterStatus,
    filterGender, setFilterGender,
    sortBy, setSortBy,
    showAdvFilter, setShowAdvFilter,
    activeFilterCount, resetAllFilters,
    selectedIds, toggleSelectAll,
    filterType, setFilterType,
    filterSubject, setFilterSubject,
    filterMissing, setFilterMissing,
    subjectsList,
    setPage,
}) {
    return (
        <div className="glass rounded-[1.5rem] mb-4 border border-[var(--color-border)] overflow-hidden">
            {/* Row 1: Search + Quick Filters + Action Buttons */}
            <div className="flex items-center gap-2 p-2.5 lg:p-3">
                {/* Search */}
                <div className="flex-initial w-full lg:w-[232px] xl:w-[352px] min-w-[120px] transition-all duration-300">
                    <DebouncedSearchInput
                        searchQuery={searchQuery}
                        onSearch={setSearchQuery}
                        inputRef={searchInputRef}
                        isLoading={loading}
                        placeholder="Cari nama, NBM, mapel, email... (Ctrl+K)"
                    />
                </div>

                {/* Quick Filter Chips - Desktop Only */}
                <div className="hidden lg:flex flex-1 items-center gap-2 overflow-x-auto scrollbar-hide py-0.5 min-w-0 pr-8 h-full [mask-image:linear-gradient(to_right,black_calc(100%-32px),transparent)]">
                    <div className="h-4 w-px bg-[var(--color-border)] mx-1 hidden lg:block" />

                    {/* Status */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        {[
                            { id: '', label: 'Semua', icon: X },
                            { id: 'active', label: 'Aktif', icon: CheckCircle },
                            { id: 'inactive', label: 'Nonaktif', icon: X },
                        ].map((s) => (
                            <button
                                key={s.id}
                                onClick={() => { setFilterStatus(s.id); setPage(1) }}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${filterStatus === s.id
                                    ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                                    : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)]'
                                    }`}
                            >
                                <s.icon className={`text-[10px] ${filterStatus === s.id ? 'opacity-100' : 'opacity-30'}`} />
                                {s.label}
                            </button>
                        ))}
                    </div>

                    <div className="h-4 w-px bg-[var(--color-border)] mx-1 shrink-0" />

                    {/* Gender */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        {[
                            { id: 'L', label: 'Putra', icon: GenderMale, activeCls: 'bg-blue-500 border-blue-500' },
                            { id: 'P', label: 'Putri', icon: GenderFemale, activeCls: 'bg-pink-500 border-pink-500' },
                        ].map((g) => (
                            <button
                                key={g.id}
                                onClick={() => { setFilterGender(filterGender === g.id ? '' : g.id); setPage(1) }}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${filterGender === g.id
                                    ? `${g.activeCls} text-white`
                                    : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)]'
                                    }`}
                            >
                                <g.icon className={`text-[10px] ${filterGender === g.id ? 'opacity-100' : 'opacity-30'}`} />
                                {g.label}
                            </button>
                        ))}
                    </div>

                    <div className="h-4 w-px bg-[var(--color-border)] mx-1 shrink-0" />

                    {/* Sort */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            onClick={() => { setSortBy(sortBy === 'name_asc' ? 'name_desc' : 'name_asc'); setPage(1) }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${sortBy.includes('name')
                                ? 'bg-amber-500 border-amber-500 text-white'
                                : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-amber-500/30 hover:bg-amber-500/5 hover:text-amber-600'
                                }`}
                        >
                            <ArrowDown className={`w-3 h-3 ${sortBy.includes('name') ? 'opacity-100' : 'opacity-30'}`} />
                            Nama {sortBy === 'name_asc' ? 'A-Z' : 'Z-A'}
                        </button>
                        <button
                            onClick={() => { setSortBy(sortBy === 'subject_asc' ? 'name_asc' : 'subject_asc'); setPage(1) }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${sortBy === 'subject_asc'
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-600'
                                }`}
                        >
                            <SortDescending className={`w-3 h-3 ${sortBy === 'subject_asc' ? 'opacity-100' : 'opacity-30'}`} />
                            Mapel A-Z
                        </button>
                    </div>
                </div>

                <div className="hidden lg:block w-px h-4 bg-[var(--color-border)] mx-2 shrink-0" />

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 shrink-0 lg:ml-auto">
                    <button
                        onClick={toggleSelectAll}
                        className={`h-9 px-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${selectedIds.length > 0 ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]'} `}
                        title="Pilih Semua / Batal"
                    >
                        {selectedIds.length > 0 ? <Checks /> : <CheckSquare />}
                        <span className="hidden xs:inline">{selectedIds.length > 0 ? 'Terpilih' : 'Pilih'}</span>
                        {selectedIds.length > 0 && (
                            <span className="w-4 h-4 rounded-full bg-white/20 text-white text-[9px] font-black flex items-center justify-center">
                                {selectedIds.length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setShowAdvFilter(!showAdvFilter)}
                        className={`h-9 px-3 sm:px-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${showAdvFilter || activeFilterCount > 0 ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/30' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]'}`}
                    >
                        <SlidersHorizontal />
                        <span className="hidden xs:inline">Filter</span>
                        {activeFilterCount > 0 && <span className="w-4 h-4 rounded-full bg-white/30 text-white text-[9px] font-black flex items-center justify-center">{activeFilterCount}</span>}
                    </button>
                </div>
            </div>

            {/* Active Filter Chips */}
            {(searchQuery || filterSubject || filterGender || (filterStatus && filterStatus !== 'active') || filterType || filterMissing) && (
                <div className="px-3 pb-3 -mt-1">
                    <div className="flex flex-wrap gap-2">
                        {searchQuery && (
                            <button type="button" onClick={() => setSearchQuery('')}
                                className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/40 text-[10px] font-black text-[var(--color-text)]" title="Hapus pencarian">
                                <MagnifyingGlass className="w-3 h-3 opacity-60" />
                                <span className="max-w-[180px] truncate">"{searchQuery}"</span>
                                <span className="w-5 h-5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] group-hover:text-red-500 transition-colors">
                                    <X className="w-3 h-3" />
                                </span>
                            </button>
                        )}
                        {filterSubject && (
                            <button type="button" onClick={() => setFilterSubject('')}
                                className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 text-[10px] font-black text-[var(--color-primary)]" title="Hapus filter mapel">
                                <PresentationChart className="w-3 h-3 opacity-70" />
                                {filterSubject}
                                <span className="w-5 h-5 rounded-lg bg-white/70 dark:bg-[var(--color-surface)] border border-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)] opacity-70 group-hover:opacity-100 transition-opacity">
                                    <X className="w-3 h-3" />
                                </span>
                            </button>
                        )}
                        {filterGender && (
                            <button type="button" onClick={() => setFilterGender('')}
                                className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/40 text-[10px] font-black text-[var(--color-text)]" title="Hapus filter gender">
                                {filterGender === 'L' ? <GenderMale className="w-3 h-3 opacity-70" /> : <GenderFemale className="w-3 h-3 opacity-70" />}
                                Gender: {filterGender === 'L' ? 'Putra' : 'Putri'}
                                <span className="w-5 h-5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] group-hover:text-red-500 transition-colors">
                                    <X className="w-3 h-3" />
                                </span>
                            </button>
                        )}
                        {filterStatus && filterStatus !== 'active' && (
                            <button type="button" onClick={() => setFilterStatus('')}
                                className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-[10px] font-black text-amber-600" title="Hapus filter status">
                                Status: {(filterStatus?.charAt(0).toUpperCase() || '') + (filterStatus?.slice(1) || '')}
                                <span className="w-5 h-5 rounded-lg bg-white/70 dark:bg-[var(--color-surface)] border border-amber-500/20 flex items-center justify-center text-amber-600 opacity-70 group-hover:opacity-100 transition-opacity">
                                    <X className="w-3 h-3" />
                                </span>
                            </button>
                        )}
                        {filterType && (
                            <button type="button" onClick={() => setFilterType('')}
                                className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-[10px] font-black text-indigo-600" title="Hapus filter jenis">
                                <UserCheck className="w-3 h-3 opacity-70" />
                                Jenis: {filterType === 'guru' ? 'Guru' : 'Karyawan'}
                                <span className="w-5 h-5 rounded-lg bg-white/70 dark:bg-[var(--color-surface)] border border-indigo-500/20 flex items-center justify-center text-indigo-600 opacity-70 group-hover:opacity-100 transition-opacity">
                                    <X className="w-3 h-3" />
                                </span>
                            </button>
                        )}
                        {filterMissing && (
                            <button type="button" onClick={() => setFilterMissing('')}
                                className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-orange-500/20 bg-orange-500/10 text-[10px] font-black text-orange-600" title="Hapus filter data hilang">
                                {filterMissing === 'wa' ? 'Tanpa WA' : filterMissing}
                                <span className="w-5 h-5 rounded-lg bg-white/70 dark:bg-[var(--color-surface)] border border-orange-500/20 flex items-center justify-center text-orange-600 opacity-70 group-hover:opacity-100 transition-opacity">
                                    <X className="w-3 h-3" />
                                </span>
                            </button>
                        )}
                        <button type="button" onClick={resetAllFilters}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-red-500/20 bg-red-500/5 text-[10px] font-black text-red-600" title="Reset semua filter">
                            <ArrowCounterClockwise className="w-3 h-3" />
                            Reset semua
                        </button>
                    </div>
                </div>
            )}

            {/* Advanced Filter Panel */}
            {showAdvFilter && (
                <div className="border-t border-[var(--color-border)] p-3.5 bg-[var(--color-surface-alt)]/60 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-1 h-3.5 bg-indigo-500 rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2">
                                <SlidersHorizontal className="w-3 h-3 opacity-60" />
                                Filter Lanjutan
                            </span>
                        </div>
                        <button
                            onClick={resetAllFilters}
                            className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 border border-transparent hover:border-red-100"
                        >
                            <ArrowCounterClockwise className="w-3 h-3" />
                            Reset Semua Filter
                        </button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">Jenis</label>
                                <Select
                                    value={filterType}
                                    onChange={val => { setFilterType(val); setPage(1) }}
                                    options={[
                                        { id: '', name: 'Semua Jenis' },
                                        { id: 'guru', name: 'Guru' },
                                        { id: 'karyawan', name: 'Karyawan' }
                                    ]}
                                    placeholder="Semua Jenis"
                                    small
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">Mata Pelajaran</label>
                                <Select
                                    value={filterSubject}
                                    onChange={val => { setFilterSubject(val); setPage(1) }}
                                    options={[
                                        { id: '', name: 'Semua Mapel' },
                                        ...subjectsList.map(s => ({ id: s, name: s }))
                                    ]}
                                    placeholder="Semua Mapel"
                                    small
                                    searchable
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">Gender</label>
                                <Select
                                    value={filterGender}
                                    onChange={val => { setFilterGender(val); setPage(1) }}
                                    options={[
                                        { id: '', name: 'Semua' },
                                        { id: 'L', name: 'Laki-laki' },
                                        { id: 'P', name: 'Perempuan' }
                                    ]}
                                    placeholder="Semua"
                                    small
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">Status</label>
                                <Select
                                    value={filterStatus}
                                    onChange={val => { setFilterStatus(val); setPage(1) }}
                                    options={[
                                        { id: '', name: 'Semua Status' },
                                        { id: 'active', name: 'Aktif' },
                                        { id: 'inactive', name: 'Nonaktif' },
                                        { id: 'cuti', name: 'Cuti' }
                                    ]}
                                    placeholder="Semua Status"
                                    small
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">Urutkan</label>
                                <Select
                                    value={sortBy}
                                    onChange={val => { setSortBy(val); setPage(1) }}
                                    options={[
                                        { id: 'name_asc', name: 'Nama A-Z' },
                                        { id: 'name_desc', name: 'Nama Z-A' },
                                        { id: 'subject_asc', name: 'Mapel A-Z' },
                                        { id: 'join_desc', name: 'Bergabung Terbaru' },
                                        { id: 'join_asc', name: 'Bergabung Terlama' }
                                    ]}
                                    placeholder="Urutkan"
                                    small
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">List Cepat & Aksi</label>
                            <div className="flex gap-1.5 overflow-x-auto pb-1">
                                {[
                                    { label: 'Semua', icon: X, active: !filterMissing && filterStatus === 'active', onClick: () => { setFilterMissing(''); setFilterStatus('active'); setSortBy('name_asc') } },
                                    { label: 'Tanpa WA', icon: ChatCircle, active: filterMissing === 'wa', onClick: () => { setFilterMissing('wa'); setPage(1) } },
                                    { label: 'Nonaktif', icon: Archive, active: filterStatus === 'inactive', onClick: () => { setFilterStatus('inactive'); setPage(1) } },
                                    { label: 'Cuti', icon: Archive, active: filterStatus === 'cuti', onClick: () => { setFilterStatus('cuti'); setPage(1) } },
                                ].map((s, i) => (
                                    <button key={i} onClick={s.onClick} className={`whitespace-nowrap h-9 px-3 rounded-xl border flex items-center gap-2 transition-all ${s.active ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-md shadow-[var(--color-primary)]/20' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]'}`}>
                                        <s.icon className="w-3 h-3" /><span className="text-[9px] font-black uppercase tracking-widest">{s.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
})

export default TeachersToolbar
