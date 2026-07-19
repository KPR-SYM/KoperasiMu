import { memo } from "react";
import {
    Calendar,
    ClockCounterClockwise,
    Copy,
    GraduationCap,
    Lock,
    LockOpen,
    MagnifyingGlass,
    Pencil,
    PushPin,
    Trash,
} from "@phosphor-icons/react";
import { Checkbox, EmptyState } from "@shared/components";
import { PrivacyValue } from "@hooks/usePrivacyMode";
import InlineCell from "./InlineCell";
import PeriodContextTooltip from "./PeriodContextTooltip";

const PeriodsTable = memo(function PeriodsTable({
    paged,
    years,
    selectedIds,
    visibleCols,
    isPrivacyMode,
    canEdit,
    colMenuRef,
    isColMenuOpen,
    setIsColMenuOpen,
    setColMenuPos,
    toggleSelect,
    toggleSelectAll,
    maskValue,
    formatDate,
    getDuration,
    getPeriodStats,
    handleInlineSave,
    inlineEditCell,
    setInlineEditCell,
    handleEdit,
    handleOpenHistory,
    handleToggleLock,
    onQuickToggleActive,
    onQuickDuplicate,
    onTogglePin,
    pinnedIds,
    handleOpenReadOnlyDetail,
    setItemToDelete,
    setIsDeleteModalOpen,
    onQuickFilterYear,
}) {
    return (
        <>
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-[var(--color-surface-alt)] sticky top-0 z-10">
                        <tr className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                            <th className="px-6 py-4 text-center w-12">
                                <Checkbox
                                    checked={
                                        selectedIds.length === paged.length &&
                                        paged.length > 0
                                    }
                                    onChange={toggleSelectAll}
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
                                            <rect x="0" y="0" width="5" height="5" rx="1" />
                                            <rect x="7" y="0" width="5" height="5" rx="1" />
                                            <rect x="0" y="7" width="5" height="5" rx="1" />
                                            <rect x="7" y="7" width="5" height="5" rx="1" />
                                        </svg>
                                    </button>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paged.length === 0 ? (
                            <tr>
                                <td colSpan={2 + Object.values(visibleCols).filter(Boolean).length} className="py-24 text-center">
                                    <EmptyState
                                        icon={years.length === 0 ? GraduationCap : MagnifyingGlass}
                                        title={years.length === 0 ? "Belum Ada Tahun Pelajaran" : "Tidak ada data ditemukan"}
                                        description={years.length === 0 ? "Tambahkan periode akademik pertama untuk mulai menggunakan modul ini." : "Sesuaikan filter atau kata kunci pencarian Anda"}
                                        color={years.length === 0 ? "primary" : "slate"}
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
                                            <Checkbox
                                                checked={selectedIds.includes(year.id)}
                                                onChange={() => toggleSelect(year.id)}
                                            />
                                        </td>
                                        {visibleCols.period && (
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shadow-sm relative transition-transform hover:scale-110 shrink-0 ${year.is_active ? "bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 text-[var(--color-primary)]" : "bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]"}`}
                                                    >
                                                        <span className="relative z-10">
                                                            <Calendar className="w-4 h-4" />
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <PeriodContextTooltip years={years} currentId={year.id} formatDate={formatDate}>
                                                            <span
                                                                onClick={() => onQuickFilterYear?.(year.academic_year)}
                                                                className="font-extrabold text-[var(--color-text)] leading-snug truncate cursor-pointer hover:text-[var(--color-primary)] transition-colors"
                                                            >
                                                                <PrivacyValue active={isPrivacyMode}>
                                                                    {year.academic_year}
                                                                </PrivacyValue>
                                                            </span>
                                                        </PeriodContextTooltip>
                                                        <p className="text-[10px] text-[var(--color-text-muted)] font-mono opacity-60 uppercase tracking-wider mt-1">
                                                            <span className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded-md ${year.semester === "Ganjil" ? "bg-indigo-500/10 text-indigo-600" : "bg-purple-500/10 text-purple-600"}`}>
                                                                {maskValue(year.semester, "semester")}
                                                            </span>
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
                                                    inlineEditCell={inlineEditCell}
                                                    setInlineEditCell={setInlineEditCell}
                                                    handleInlineSave={handleInlineSave}
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
                                                            inlineEditCell={inlineEditCell}
                                                            setInlineEditCell={setInlineEditCell}
                                                            handleInlineSave={handleInlineSave}
                                                        />
                                                        {" — "}
                                                        <InlineCell
                                                            id={year.id}
                                                            field="end_date"
                                                            value={year.end_date}
                                                            displayValue={formatDate(year.end_date)}
                                                            type="date"
                                                            canEdit={!year.is_locked}
                                                            inlineEditCell={inlineEditCell}
                                                            setInlineEditCell={setInlineEditCell}
                                                            handleInlineSave={handleInlineSave}
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
                                                    {!isPrivacyMode && (() => {
                                                        const st = getPeriodStats?.(year.start_date, year.end_date, year.registration_start, year.registration_end);
                                                        if (!st) return null;
                                                        return (
                                                            <span className="text-[8px] text-[var(--color-text-muted)] mt-0.5">
                                                                {st.elapsed} / {st.totalDays} hari · {st.remaining} hari lagi
                                                                {st.regStatus && <span className={`ml-1 ${st.regStatus.cls}`}>{st.regStatus.label}</span>}
                                                            </span>
                                                        );
                                                    })()}
                                                    {year.start_date && year.end_date && !isPrivacyMode && (() => {
                                                        const now = Date.now();
                                                        const s = new Date(year.start_date).getTime();
                                                        const e = new Date(year.end_date).getTime();
                                                        const pct = Math.min(100, Math.max(0, ((now - s) / (e - s)) * 100));
                                                        const color = pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500";
                                                        return (
                                                            <div className="w-full h-1 rounded-full bg-[var(--color-surface-alt)] mt-1.5 overflow-hidden">
                                                                <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                                                            </div>
                                                        );
                                                    })()}
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
                                                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-600">Aktif</span>
                                                    ) : (
                                                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]">Tidak Aktif</span>
                                                    )}
                                                    {year.is_locked ? (
                                                        canEdit ? (
                                                            <button onClick={() => handleToggleLock(year)} className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-500 flex items-center gap-1 cursor-pointer hover:brightness-110 transition-all"><Lock className="w-2 h-2" /> Terkunci</button>
                                                        ) : (
                                                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-500 flex items-center gap-1"><Lock className="w-2 h-2" /> Terkunci</span>
                                                        )
                                                    ) : canEdit ? (
                                                        <button onClick={() => handleToggleLock(year)} className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] flex items-center gap-1 cursor-pointer hover:brightness-110 transition-all">Bisa Diedit</button>
                                                    ) : null}
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => onTogglePin?.(year.id)}
                                                    title={pinnedIds?.includes(year.id) ? "Lepas pin" : "Pin ke atas"}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all text-sm ${pinnedIds?.includes(year.id) ? "text-amber-500 bg-amber-500/10" : "text-[var(--color-text-muted)] hover:text-amber-500 hover:bg-amber-500/10"}`}
                                                >
                                                    <PushPin weight={pinnedIds?.includes(year.id) ? "fill" : "regular"} />
                                                </button>
                                                {canEdit && !year.is_locked && (
                                                    <button
                                                        onClick={() => handleEdit(year)}
                                                        title="Edit"
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-blue-500 hover:bg-blue-500/10 transition-all text-sm"
                                                    >
                                                        <Pencil />
                                                    </button>
                                                )}
                                                {canEdit && (
                                                    <button
                                                        onClick={() => onQuickDuplicate?.(year)}
                                                        title="Duplikasi ke tahun berikutnya"
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-amber-500 hover:bg-amber-500/10 transition-all text-sm"
                                                    >
                                                        <Copy />
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
                {paged.length === 0 ? (
                    <div className="p-8 text-center">
                        <EmptyState
                            icon={years.length === 0 ? GraduationCap : MagnifyingGlass}
                            title={years.length === 0 ? "Belum Ada Tahun Pelajaran" : "Tidak ada data ditemukan"}
                            description={years.length === 0 ? "Tambahkan periode akademik pertama." : "Sesuaikan filter atau kata kunci pencarian Anda"}
                            color={years.length === 0 ? "primary" : "slate"}
                            variant="plain"
                        />
                    </div>
                ) : (
                    paged.map((year) => {
                        const isSelected = selectedIds.includes(year.id);
                        return (
                            <div
                                key={year.id}
                                className={`p-4 transition-colors group/mob ${isSelected ? "bg-[var(--color-primary)]/5" : ""}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex flex-col items-center gap-3 pt-1">
                                        <Checkbox
                                            checked={selectedIds.includes(year.id)}
                                            onChange={() => toggleSelect(year.id)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-black shadow-sm relative transition-transform shrink-0 ${year.is_active ? "bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 text-[var(--color-primary)]" : "bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]"}`}
                                    >
                                        <span className="relative z-10">
                                            <Calendar className="w-4 h-4" />
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div
                                                className="min-w-0 flex-1"
                                                onClick={() => handleOpenReadOnlyDetail(year)}
                                            >
                                                <PeriodContextTooltip years={years} currentId={year.id} formatDate={formatDate}>
                                                    <button type="button" onClick={() => onQuickFilterYear?.(year.academic_year)} className="font-extrabold text-sm text-[var(--color-text)] hover:text-[var(--color-primary)] text-left truncate block w-full">
                                                        {year.academic_year}
                                                    </button>
                                                </PeriodContextTooltip>
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
                                                    {!isPrivacyMode && (() => {
                                                        const st = getPeriodStats?.(year.start_date, year.end_date, year.registration_start, year.registration_end);
                                                        if (!st) return null;
                                                        return (
                                                            <span className="text-[8px] text-[var(--color-text-muted)]">
                                                                {st.elapsed} / {st.totalDays} hari · {st.remaining} hari lagi
                                                                {st.regStatus && <span className={`ml-1 ${st.regStatus.cls}`}>{st.regStatus.label}</span>}
                                                            </span>
                                                        );
                                                    })()}
                                                    {year.start_date && year.end_date && !isPrivacyMode && (() => {
                                                        const now = Date.now();
                                                        const s = new Date(year.start_date).getTime();
                                                        const e = new Date(year.end_date).getTime();
                                                        const pct = Math.min(100, Math.max(0, ((now - s) / (e - s)) * 100));
                                                        const color = pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500";
                                                        return (
                                                            <div className="w-full h-1 rounded-full bg-[var(--color-surface-alt)] mt-1.5 overflow-hidden">
                                                                <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => onTogglePin?.(year.id)}
                                                    title={pinnedIds?.includes(year.id) ? "Lepas pin" : "Pin ke atas"}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${pinnedIds?.includes(year.id) ? "text-amber-500 bg-amber-500/10" : "text-[var(--color-text-muted)] hover:text-amber-500 hover:bg-amber-500/10"}`}
                                                >
                                                    <PushPin weight={pinnedIds?.includes(year.id) ? "fill" : "regular"} className="text-xs" />
                                                </button>
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
                                                        onClick={() => onQuickDuplicate?.(year)}
                                                        title="Duplikasi"
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-amber-500 hover:bg-amber-500/10 transition-all"
                                                    >
                                                        <Copy className="text-xs" />
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
                                                <span className="flex-1 h-9 rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                                    Aktif
                                                </span>
                                            ) : (
                                                <span className="flex-1 h-9 rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                                                    Tidak Aktif
                                                </span>
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
                    })
                )}
            </div>
        </>
    );
});

export default PeriodsTable;
