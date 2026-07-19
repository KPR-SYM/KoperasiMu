import { memo } from "react";
import {
    ArrowCounterClockwise,
    CaretLeft,
    CaretRight,
    CheckCircle,
    Calendar,
    CheckSquare,
    Checks,
    CircleDashed,
    ClockClockwise,
    EyeSlash,
    Fingerprint,
    List,
    MagnifyingGlass,
    SlidersHorizontal,
    StackSimple,
    X,
} from "@phosphor-icons/react";
import { RichSelect } from "@shared/components";
import DebouncedSearchInput from "./DebouncedSearchInput";

const PeriodsToolbar = memo(function PeriodsToolbar({
    searchQuery,
    setSearchQuery,
    searchInputRef,
    loading,
    totalRows,
    filterSemester,
    setFilterSemester,
    filterStatus,
    setFilterStatus,
    filterLock,
    setFilterLock,
    filterTimeStatus,
    setFilterTimeStatus,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    sortBy,
    setSortBy,
    isFilterOpen,
    setIsFilterOpen,
    activeFilterCount,
    resetAllFilters,
    filterPresets,
    saveFilterPreset,
    loadFilterPreset,
    deleteFilterPreset,
    viewMode,
    setViewMode,
    selectedIds,
    toggleSelectAll,
    setPage,
}) {
    return (
        <div>
            <div className="flex items-center gap-2 p-2.5 lg:p-3">
                <div className="flex-1 min-w-[120px] transition-all duration-300">
                    <DebouncedSearchInput
                        searchQuery={searchQuery}
                        onSearch={setSearchQuery}
                        inputRef={searchInputRef}
                        isLoading={loading}
                    />
                </div>

                {totalRows >= 5 && (
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
                )}

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
                        <button
                            onClick={() => setViewMode("calendar")}
                            className={`h-7 px-3 rounded-lg flex items-center gap-2 text-[9px] font-black uppercase tracking-wider transition-all ${viewMode === "calendar" ? "bg-[var(--color-primary)] text-white shadow-md" : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]"}`}
                        >
                            <Calendar className="w-3 h-3" />
                            <span>Kalender</span>
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
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1">
                                Tanggal Mulai
                            </label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full px-2.5 h-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[10px] font-bold outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1">
                                Tanggal Selesai
                            </label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full px-2.5 h-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[10px] font-bold outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-[var(--color-border)]/30">
                        <div className="flex items-center gap-2 flex-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Preset:</span>
                            <select
                                value=""
                                onChange={(e) => {
                                    const name = e.target.value;
                                    if (!name) return;
                                    const preset = filterPresets.find(p => p.name === name);
                                    if (preset) loadFilterPreset(preset);
                                }}
                                className="h-8 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[10px] font-bold outline-none text-[var(--color-text)] flex-1 min-w-0"
                            >
                                <option value="">Muat preset...</option>
                                {filterPresets.map(p => (
                                    <option key={p.name} value={p.name}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={() => {
                                    const name = prompt("Nama preset:");
                                    if (name?.trim()) saveFilterPreset(name.trim());
                                }}
                                className="h-8 px-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[9px] font-black uppercase tracking-widest text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-all"
                                title="Simpan preset filter"
                            >
                                Simpan
                            </button>
                            {filterPresets.length > 0 && (
                                <button
                                    onClick={() => {
                                        const name = prompt("Hapus preset (ketik nama):");
                                        if (name?.trim()) deleteFilterPreset(name.trim());
                                    }}
                                    className="h-8 px-2.5 rounded-lg border border-red-200 bg-red-50 text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-100 transition-all"
                                    title="Hapus preset"
                                >
                                    Hapus
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => setIsFilterOpen(false)}
                            className="h-8 px-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[9px] font-black uppercase tracking-widest text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-all"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});

export default PeriodsToolbar;
