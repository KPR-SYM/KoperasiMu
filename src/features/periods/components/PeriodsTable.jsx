import React, { memo, useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
    Calendar,
    Clock,
    ClockCounterClockwise,
    Copy,
    DotsThree,
    GraduationCap,
    Lock,
    LockOpen,
    MagnifyingGlass,
    Pencil,
    PushPin,
    Trash,
    Prohibit,
    CheckCircle,
} from "@phosphor-icons/react";
import { Checkbox, EmptyState, PrivacyMask } from "@shared/components";
import InlineCell from "./InlineCell";
import PeriodContextTooltip from "./PeriodContextTooltip";

const COL_LABELS = {
    period: "Tahun Akademik",
    semester: "Semester",
    duration: "Pelaksanaan",
    status: "Status",
    created_at: "Dibuat",
};

function renderColHeader(key) {
    if (!COL_LABELS[key]) return null;
    return <th className="px-6 py-4 text-left whitespace-nowrap">{COL_LABELS[key]}</th>;
}

function renderColCell(key, { year, isPrivacyMode, maskValue, formatDate, getDuration, getPeriodStats, inlineEditCell, setInlineEditCell, handleInlineSave, onQuickFilterYear, years, pinnedIds }) {
    if (key === "period") {
        const isPinned = pinnedIds?.includes(year.id);
        return (
            <td className="px-6 py-4">
                <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shadow-sm relative transition-transform hover:scale-110 shrink-0 ${isPinned ? "bg-amber-500/10 text-amber-600" : year.is_active ? "bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 text-[var(--color-primary)]" : "bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]"}`}>
                            <span className="relative z-10">
                                {isPinned ? <PushPin weight="fill" className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                            </span>
                        </div>
                        <div className="flex items-center min-w-0 flex-1">
                            <PeriodContextTooltip years={years} currentId={year.id} formatDate={formatDate}>
                                <span onClick={() => onQuickFilterYear?.(year.academic_year)} className="font-extrabold text-[var(--color-text)] leading-snug truncate cursor-pointer hover:text-[var(--color-primary)] transition-colors">
                                    <PrivacyMask active={isPrivacyMode}>{year.academic_year}</PrivacyMask>
                                </span>
                            </PeriodContextTooltip>
                        </div>
                    </div>
            </td>
        );
    }
    if (key === "semester") {
        return (
            <td className="px-6 py-4">
                <InlineCell id={year.id} field="semester" value={year.semester} displayValue={year.semester} type="select" options={[{ value: "Ganjil", label: "Ganjil" }, { value: "Genap", label: "Genap" }]} canEdit={!year.is_locked} className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border ${year.semester === "Ganjil" ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" : "bg-purple-500/10 text-purple-600 border-purple-500/20"}`} inlineEditCell={inlineEditCell} setInlineEditCell={setInlineEditCell} handleInlineSave={handleInlineSave} />
            </td>
        );
    }
    if (key === "duration") {
        const st = getPeriodStats?.(year.start_date, year.end_date);
        let pct = 0;
        let barColor = "bg-emerald-500";
        if (year.start_date && year.end_date) {
            const now = Date.now();
            const s = new Date(year.start_date).getTime();
            const e = new Date(year.end_date).getTime();
            pct = Math.min(100, Math.max(0, ((now - s) / (e - s)) * 100));
            barColor = pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500";
        }
        const durationText = getDuration(year.start_date, year.end_date);
        const statsText = st ? `${st.elapsed}/${st.totalDays} hari · ${st.remaining} hari lagi` : null;
        return (
            <td className="px-6 py-4">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-bold text-[var(--color-text)] whitespace-nowrap">
                        <InlineCell id={year.id} field="start_date" value={year.start_date} displayValue={formatDate(year.start_date)} type="date" canEdit={!year.is_locked} inlineEditCell={inlineEditCell} setInlineEditCell={setInlineEditCell} handleInlineSave={handleInlineSave} />
                        {" — "}
                        <InlineCell id={year.id} field="end_date" value={year.end_date} displayValue={formatDate(year.end_date)} type="date" canEdit={!year.is_locked} inlineEditCell={inlineEditCell} setInlineEditCell={setInlineEditCell} handleInlineSave={handleInlineSave} />
                    </span>
                    <span className="text-[9px] text-[var(--color-text-muted)]">
                        <PrivacyMask active={isPrivacyMode}>{durationText}</PrivacyMask>{statsText ? ` · ` : ""}{statsText ? <PrivacyMask active={isPrivacyMode}>{statsText}</PrivacyMask> : ""}
                    </span>
                    {year.start_date && year.end_date && (
                        <div className="w-full h-1 rounded-full bg-[var(--color-surface-alt)] mt-0.5 overflow-hidden">
                            <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                    )}
                </div>
            </td>
        );
    }
    if (key === "status") {
        return (
            <td className="px-4 py-2.5 text-left whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                    {year.is_active ? (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-600">Aktif</span>
                    ) : (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]">Tidak Aktif</span>
                    )}
                    {year.is_locked ? (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-500 flex items-center gap-1"><Lock className="w-2 h-2" /> Terkunci</span>
                    ) : (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] flex items-center gap-1">Bisa Diedit</span>
                    )}
                </div>
            </td>
        );
    }
    if (key === "created_at") {
        return (
            <td className="px-6 py-4">
                <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-[var(--color-text-muted)]/40" />
                    <span className="text-[10px] font-semibold text-[var(--color-text-muted)] whitespace-nowrap">
                        <PrivacyMask active={isPrivacyMode}>{formatDate(year.created_at)}</PrivacyMask>
                    </span>
                </div>
            </td>
        );
    }
    return null;
}

const PeriodsTable = memo(function PeriodsTable({
    paged,
    years,
    emptyState,
    selectedIds,
    visibleCols,
    columnOrder,
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
    const orderedCols = columnOrder.filter(k => visibleCols[k] && COL_LABELS[k]);
    const colCellArgs = { isPrivacyMode, maskValue, formatDate, getDuration, getPeriodStats, inlineEditCell, setInlineEditCell, handleInlineSave, onQuickFilterYear, years, pinnedIds };

    const [openMenuId, setOpenMenuId] = useState(null);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const menuRef = useRef(null);

    const [mobileMenuId, setMobileMenuId] = useState(null);
    const [mobileMenuPos, setMobileMenuPos] = useState({ top: 0, left: 0 });
    const mobileMenuRef = useRef(null);

    const closeMenu = useCallback(() => setOpenMenuId(null), []);
    const closeMobileMenu = useCallback(() => setMobileMenuId(null), []);

    const toggleMenu = useCallback((e, id) => {
        if (openMenuId === id) {
            closeMenu();
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            const menuHeight = 200;
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const showUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;
            const top = showUp ? rect.top - 4 : rect.bottom + 4;
            setMenuPos({ top: showUp ? undefined : top, bottom: showUp ? window.innerHeight - rect.top + 4 : undefined, left: rect.right - 176 });
            setOpenMenuId(id);
        }
    }, [openMenuId, closeMenu]);

    useEffect(() => {
        if (!openMenuId) return;
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) closeMenu();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [openMenuId, closeMenu]);

    useEffect(() => {
        if (!mobileMenuId) return;
        const handler = (e) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) closeMobileMenu();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [mobileMenuId, closeMobileMenu]);

    const toggleMobileMenu = useCallback((e, year) => {
        e.stopPropagation();
        if (mobileMenuId === year.id) {
            closeMobileMenu();
        } else {
            setMobileMenuPos({ top: e.currentTarget.getBoundingClientRect().top - 8, right: window.innerWidth - e.currentTarget.getBoundingClientRect().right - 8 });
            setMobileMenuId(year.id);
        }
    }, [mobileMenuId, closeMobileMenu]);

    return (
        <>
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm" style={{ tableLayout: "auto" }}>
                    <thead className="bg-[var(--color-surface-alt)] sticky top-0 z-10">
                        <tr className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                            <th className="px-6 py-4 text-center w-12">
                                <Checkbox
                                    checked={selectedIds.length === paged.length && paged.length > 0}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            {orderedCols.map(key => (
                                <React.Fragment key={key}>{renderColHeader(key)}</React.Fragment>
                            ))}
                            <th className="px-6 py-4 relative">
                                <div className="flex items-center justify-center">
                                    <span>Aksi</span>
                                </div>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <button
                                        ref={colMenuRef}
                                        onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const menuHeight = 220;
                                            const spaceBelow = window.innerHeight - rect.bottom;
                                            const showUp = spaceBelow < menuHeight && rect.top > menuHeight;
                                            setColMenuPos({
                                                top: showUp ? rect.top + window.scrollY - menuHeight - 8 : rect.bottom + window.scrollY + 8,
                                                right: window.innerWidth - rect.right - window.scrollX,
                                                showUp,
                                            });
                                            setIsColMenuOpen((p) => !p);
                                        }}
                                        title="Atur tampilan kolom"
                                        className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${isColMenuOpen ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"}`}
                                    >
                                        <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
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
                                <td colSpan={2 + orderedCols.length} className="text-center">
                                    {emptyState || (
                                        <EmptyState
                                            icon={years.length === 0 ? GraduationCap : MagnifyingGlass}
                                            title={years.length === 0 ? "Belum Ada Tahun Akademik" : "Tidak ada data ditemukan"}
                                            description={years.length === 0 ? "Tambahkan periode akademik pertama untuk mulai menggunakan modul ini." : "Sesuaikan filter atau kata kunci pencarian Anda"}
                                            color={years.length === 0 ? "primary" : "slate"}
                                            variant="plain"
                                        />
                                    )}
                                </td>
                            </tr>
                        ) : (
                            paged.map((year) => {
                                const isSelected = selectedIds.includes(year.id);
                                const isPinned = pinnedIds?.includes(year.id);
                                return (
                                    <tr
                                        key={year.id}
                                        data-row-id={year.id}
                                        className={`border-t border-[var(--color-border)] transition-colors group/row ${isPinned ? "bg-amber-500/[0.03] border-l-2 border-l-amber-500/40" : ""} ${isSelected ? "bg-[var(--color-primary)]/5" : "hover:bg-[var(--color-surface-alt)]/40"}`}
                                    >
                                        <td className="px-6 py-4">
                                            <Checkbox checked={isSelected} onChange={() => toggleSelect(year.id)} />
                                        </td>
                                        {orderedCols.map(key => (
                                            <React.Fragment key={key}>{renderColCell(key, { year, ...colCellArgs })}</React.Fragment>
                                        ))}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => handleOpenReadOnlyDetail(year)} title="Lihat Detail" className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all text-sm">
                                                    <MagnifyingGlass />
                                                </button>
                                                {canEdit && !year.is_locked && (
                                                    <button onClick={() => handleEdit(year)} title="Edit" className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-blue-500 hover:bg-blue-500/10 transition-all text-sm">
                                                        <Pencil />
                                                    </button>
                                                )}
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => toggleMenu(e, year.id)}
                                                        title="Lainnya"
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-all text-sm"
                                                    >
                                                        <DotsThree weight="bold" />
                                                    </button>
                                                    {openMenuId === year.id && createPortal(
                                                        <div ref={menuRef} style={{ position: "fixed", top: menuPos.top, bottom: menuPos.bottom, left: menuPos.left, zIndex: 9999 }} className="w-48 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
                                                            <button onClick={() => { onTogglePin?.(year.id); closeMenu(); }} className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2.5 hover:bg-[var(--color-surface-alt)] transition-colors">
                                                                <PushPin className="w-4 h-4" /> {pinnedIds?.includes(year.id) ? "Lepas Pin" : "Pin ke Atas"}
                                                            </button>
                                                            {canEdit && (
                                                                <button onClick={() => { onQuickDuplicate?.(year); closeMenu(); }} className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2.5 hover:bg-[var(--color-surface-alt)] transition-colors">
                                                                    <Copy className="w-4 h-4" /> Duplikasi
                                                                </button>
                                                            )}
                                                            <button onClick={() => { handleOpenHistory(year); closeMenu(); }} className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2.5 hover:bg-[var(--color-surface-alt)] transition-colors">
                                                                <ClockCounterClockwise className="w-4 h-4" /> Riwayat
                                                            </button>
                                                            {canEdit && (
                                                                <button onClick={() => { handleToggleLock(year); closeMenu(); }} className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2.5 hover:bg-[var(--color-surface-alt)] transition-colors">
                                                                    {year.is_locked ? <><LockOpen className="w-4 h-4" /> Buka Kunci</> : <><Lock className="w-4 h-4" /> Kunci</>}
                                                                </button>
                                                            )}
                                                            {canEdit && onQuickToggleActive && (
                                                                <button onClick={() => { onQuickToggleActive(year); closeMenu(); }} className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2.5 hover:bg-[var(--color-surface-alt)] transition-colors">
                                                                    {year.is_active ? <><Prohibit className="w-4 h-4" /> Nonaktifkan</> : <><CheckCircle className="w-4 h-4" /> Aktifkan</>}
                                                                </button>
                                                            )}
                                                            {canEdit && !year.is_locked && (
                                                                <>
                                                                    <div className="my-1.5 border-t border-[var(--color-border)]" />
                                                                    <button onClick={() => { setItemToDelete(year); setIsDeleteModalOpen(true); closeMenu(); }} className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2.5 text-red-500 hover:bg-red-50 transition-colors">
                                                                        <Trash className="w-4 h-4" /> Hapus
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>,
                                                        document.body
                                                    )}
                                                </div>
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
                        {emptyState || (
                            <EmptyState
                                icon={years.length === 0 ? GraduationCap : MagnifyingGlass}
                                title={years.length === 0 ? "Belum Ada Tahun Akademik" : "Tidak ada data ditemukan"}
                                description={years.length === 0 ? "Tambahkan periode akademik pertama." : "Sesuaikan filter atau kata kunci pencarian Anda"}
                                color={years.length === 0 ? "primary" : "slate"}
                                variant="plain"
                            />
                        )}
                    </div>
                ) : (
                    paged.map((year) => {
                        const isSelected = selectedIds.includes(year.id);
                        const isPinned = pinnedIds?.includes(year.id);
                        const st = getPeriodStats?.(year.start_date, year.end_date);
                        const now = Date.now();
                        const s = new Date(year.start_date).getTime();
                        const e = new Date(year.end_date).getTime();
                        const pct = Math.min(100, Math.max(0, ((now - s) / (e - s)) * 100));
                        const barColor = pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500";
                        return (
                            <div
                                key={year.id}
                                className={`p-4 transition-colors group/mob ${isSelected ? "bg-[var(--color-primary)]/5" : ""}`}
                            >
                                {/* Top: checkbox + title */}
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        checked={isSelected}
                                        onChange={() => toggleSelect(year.id)}
                                        small
                                    />
                                    <div
                                        className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black shadow-sm relative transition-transform shrink-0 ${isPinned ? "bg-amber-500/10 text-amber-600" : year.is_active ? "bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 text-[var(--color-primary)]" : "bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]"}`}
                                    >
                                        <span className="relative z-10">
                                            {isPinned ? <PushPin weight="fill" className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0 flex items-center gap-3" onClick={() => handleOpenReadOnlyDetail(year)}>
                                        <PeriodContextTooltip years={years} currentId={year.id} formatDate={formatDate}>
                                            <p className="font-extrabold text-[13px] text-[var(--color-text)] leading-snug truncate cursor-pointer hover:text-[var(--color-primary)] transition-colors">
                                                <PrivacyMask active={isPrivacyMode}>{year.academic_year}</PrivacyMask>
                                            </p>
                                        </PeriodContextTooltip>
                                        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest border whitespace-nowrap ${year.semester === "Ganjil" ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" : "bg-purple-500/10 text-purple-600 border-purple-500/20"}`}>
                                                <PrivacyMask active={isPrivacyMode}>{year.semester}</PrivacyMask>
                                            </span>
                                            {year.is_active ? (
                                                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 whitespace-nowrap">
                                                    Aktif
                                                </span>
                                            ) : (
                                                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] whitespace-nowrap">
                                                    Nonaktif
                                                </span>
                                            )}
                                            {year.is_locked && (
                                                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border border-rose-500/20 bg-rose-500/10 text-rose-500 flex items-center gap-1 whitespace-nowrap">
                                                    <Lock className="w-2 h-2" /> Terkunci
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Dates — baris sendiri, sejajar dengan ikon */}
                                <div className="mt-2.5 flex items-center gap-1 text-[11px] font-bold text-[var(--color-text)] pl-[26px]">
                                    <Calendar className="w-3 h-3 text-[var(--color-text-muted)]/50 shrink-0" />
                                    <span className="truncate">
                                        <PrivacyMask active={isPrivacyMode}>{formatDate(year.start_date)}</PrivacyMask> — {" "}
                                        <PrivacyMask active={isPrivacyMode}>{formatDate(year.end_date)}</PrivacyMask>
                                    </span>
                                </div>

                                {/* Stats + progress */}
                                {(st || year.start_date) && (
                                    <div className="mt-2 pl-[26px]">
                                        {st && (
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[9px] text-[var(--color-text-muted)] truncate">
                                                    <PrivacyMask active={isPrivacyMode}>{st.elapsed}</PrivacyMask> / <PrivacyMask active={isPrivacyMode}>{st.totalDays}</PrivacyMask> hari · <PrivacyMask active={isPrivacyMode}>{st.remaining}</PrivacyMask> hari lagi
                                                </span>
                                            </div>
                                        )}
                                        {year.start_date && year.end_date && (
                                            <div className="w-full h-1 rounded-full bg-[var(--color-surface-alt)] mt-1 overflow-hidden">
                                                <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Footer: dibuat + aksi */}
                                <div className="mt-3 pt-3 border-t border-[var(--color-border)]/40 flex items-center justify-between gap-2 pl-[26px]">
                                    <div className="flex items-center gap-1.5 text-[9px] text-[var(--color-text-muted)] min-w-0">
                                        {year.created_at && (
                                            <>
                                                <Clock className="w-3 h-3 text-[var(--color-text-muted)]/40 shrink-0" />
                                                <span className="truncate">Dibuat <PrivacyMask active={isPrivacyMode}>{formatDate(year.created_at)}</PrivacyMask></span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-0.5 shrink-0">
                                        <button
                                            onClick={() => onTogglePin?.(year.id)}
                                            title={isPinned ? "Lepas pin" : "Pin ke atas"}
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all active:scale-95 ${isPinned ? "text-amber-500 bg-amber-500/10 border-amber-500/20" : "text-[var(--color-text-muted)] hover:text-amber-500 hover:bg-amber-500/10 border-[var(--color-border)]"}`}
                                        >
                                            <PushPin weight={isPinned ? "fill" : "regular"} className="text-sm" />
                                        </button>
                                        <button
                                            onClick={() => handleOpenReadOnlyDetail(year)}
                                            title="Lihat Detail"
                                            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 border border-[var(--color-border)] transition-all active:scale-95"
                                        >
                                            <MagnifyingGlass className="text-sm" />
                                        </button>
                                        {canEdit && !year.is_locked && (
                                            <button
                                                onClick={() => handleEdit(year)}
                                                title="Edit"
                                                className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:text-blue-500 hover:bg-blue-500/10 border border-[var(--color-border)] transition-all active:scale-95"
                                            >
                                                <Pencil className="text-sm" />
                                            </button>
                                        )}
                                        <div className="relative">
                                            <button
                                                onClick={(e) => toggleMobileMenu(e, year)}
                                                title="Lainnya"
                                                className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] border border-[var(--color-border)] transition-all active:scale-95"
                                            >
                                                <DotsThree weight="bold" />
                                            </button>
                                            {mobileMenuId === year.id && createPortal(
                                                <div
                                                    ref={mobileMenuRef}
                                                    style={{ position: "fixed", top: mobileMenuPos.top, right: mobileMenuPos.right, zIndex: 9999 }}
                                                    className="w-48 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl"
                                                >
                                                    {canEdit && (
                                                        <button onClick={() => { onQuickDuplicate?.(year); closeMobileMenu(); }} className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2.5 hover:bg-[var(--color-surface-alt)] transition-colors">
                                                            <Copy className="w-4 h-4" /> Duplikasi
                                                        </button>
                                                    )}
                                                    <button onClick={() => { handleOpenHistory(year); closeMobileMenu(); }} className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2.5 hover:bg-[var(--color-surface-alt)] transition-colors">
                                                        <ClockCounterClockwise className="w-4 h-4" /> Riwayat
                                                    </button>
                                                    {canEdit && (
                                                        <button onClick={() => { handleToggleLock(year); closeMobileMenu(); }} className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2.5 hover:bg-[var(--color-surface-alt)] transition-colors">
                                                            {year.is_locked ? <><LockOpen className="w-4 h-4" /> Buka Kunci</> : <><Lock className="w-4 h-4" /> Kunci</>}
                                                        </button>
                                                    )}
                                                    {canEdit && onQuickToggleActive && (
                                                        <button onClick={() => { onQuickToggleActive(year); closeMobileMenu(); }} className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2.5 hover:bg-[var(--color-surface-alt)] transition-colors">
                                                            {year.is_active ? <><Prohibit className="w-4 h-4" /> Nonaktifkan</> : <><CheckCircle className="w-4 h-4" /> Aktifkan</>}
                                                        </button>
                                                    )}
                                                    {canEdit && !year.is_locked && (
                                                        <>
                                                            <div className="my-1.5 border-t border-[var(--color-border)]" />
                                                            <button onClick={() => { setItemToDelete(year); setIsDeleteModalOpen(true); closeMobileMenu(); }} className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2.5 text-red-500 hover:bg-red-50 transition-colors">
                                                                <Trash className="w-4 h-4" /> Hapus
                                                            </button>
                                                        </>
                                                    )}
                                                </div>,
                                                document.body
                                            )}
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
