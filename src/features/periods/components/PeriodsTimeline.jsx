import { memo } from "react";
import {
    Archive,
    Calendar,
    Check,
    ClockCounterClockwise,
    Copy,
    MagnifyingGlass,
    Pencil,
    ArrowCounterClockwise,
    Trash,
} from "@phosphor-icons/react";
import { EmptyState } from "@shared/components";
import InlineCell from "./InlineCell";

function TimelineView({
    years,
    onEdit,
    onHistory,
    onSetActive,
    onDuplicate,
    onDelete,
    onToggleLock,
    canEdit,
    isPrivacyMode,
    maskValue,
    getTimeStatus,
    getDuration,
}) {
    if (years.length === 0) {
        return (
            <EmptyState
                icon={MagnifyingGlass}
                title="Tidak Ada Data Ditemukan"
                description="Sesuaikan filter atau kata kunci pencarian Anda"
                color="slate"
                variant="plain"
            />
        );
    }

    const sorted = [...years].sort(
        (a, b) => new Date(a.start_date) - new Date(b.start_date),
    );

    return (
        <div className="relative w-full">
            <div
                className="relative overflow-x-auto pb-6 pt-6 no-scrollbar select-none flex justify-start lg:justify-center"
                style={{ minHeight: "280px" }}
            >
                <div
                    className="flex items-start px-6 md:px-16 relative mx-auto z-10"
                    style={{ minWidth: "max-content" }}
                >
                    {/* Horizontal timeline line */}
                    <div className="absolute top-5 left-0 right-0 h-[2px] bg-[var(--color-border)] opacity-50" />

                    {sorted.map((year) => {
                        const isActive = year.is_active;
                        const isGanjil = year.semester === "Ganjil";
                        const ts = getTimeStatus(year.start_date, year.end_date);
                        const dur = getDuration(year.start_date, year.end_date);

                        return (
                            <div
                                key={year.id}
                                className="relative flex flex-col items-center group/item shrink-0"
                                style={{ width: "220px" }}
                            >
                                {/* Node */}
                                <div className="relative z-10 flex items-center justify-center w-10 h-10 mb-4">
                                    {isActive && (
                                        <div className="absolute inset-0 rounded-full bg-[var(--color-primary)]/15 animate-pulse" />
                                    )}
                                    <div
                                        className={`relative flex items-center justify-center w-7 h-7 rounded-full border-[3px] border-[var(--color-surface)] transition-all duration-300 group-hover/item:scale-125 shadow-md ${isActive ? "bg-[var(--color-primary)] shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.35)]" : "bg-[var(--color-surface-alt)] border-[var(--color-border)] group-hover/item:border-[var(--color-primary)]"}`}
                                    >
                                        <div
                                            className={`w-2 h-2 rounded-full transition-all duration-300 ${isActive ? "bg-white" : "bg-[var(--color-border)] group-hover/item:bg-[var(--color-primary)]"}`}
                                        />
                                    </div>
                                </div>

                                {/* Stalk */}
                                <div
                                    className={`w-[2px] h-6 -mt-3 mb-2 rounded-full transition-colors duration-300 ${isActive ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"}`}
                                />

                                {/* Card */}
                                <div
                                    className={`px-3 w-full transition-all duration-300 ${isActive ? "opacity-100" : "opacity-70 group-hover/item:opacity-100"}`}
                                >
                                    <div
                                        className={`relative rounded-2xl p-4 border transition-all duration-300 hover:-translate-y-1 ${isActive ? "bg-[var(--color-surface)] border-[var(--color-primary)]/40 shadow-lg shadow-[var(--color-primary)]/5" : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-primary)]/30 shadow-sm"}`}
                                    >
                                        {/* Badges */}
                                        <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                                            <div
                                                className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${isGanjil ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]" : "bg-purple-500/10 text-purple-600"}`}
                                            >
                                                {maskValue(year.semester, "semester")}
                                            </div>
                                            {isActive && (
                                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[7px] font-black">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                                    AKTIF
                                                </div>
                                            )}
                                            {ts && (
                                                <div
                                                    className={`px-1.5 py-0.5 rounded-full text-[7px] font-bold ${ts.cls}`}
                                                >
                                                    {ts.label}
                                                </div>
                                            )}
                                            {year.is_locked && (
                                                <div className="px-1.5 py-0.5 rounded-full text-[7px] font-black bg-rose-500/10 text-rose-600">
                                                    TUTUP
                                                </div>
                                            )}
                                        </div>

                                        {/* Year */}
                                        <h4 className="text-lg font-black font-heading tracking-tight text-[var(--color-text)] leading-none mb-1.5 group-hover/item:text-[var(--color-primary)] transition-colors">
                                            {maskValue(year.academic_year, "year")}
                                        </h4>

                                        {/* Dates */}
                                        <div className="flex items-center gap-1.5 text-[9px] text-[var(--color-text-muted)] font-medium">
                                            <Calendar className="w-3 h-3 opacity-50 shrink-0" />
                                            <span
                                                className={
                                                    isPrivacyMode
                                                        ? "blur-sm select-none transition-all duration-200"
                                                        : ""
                                                }
                                            >
                                                {new Date(year.start_date).toLocaleDateString("id-ID", {
                                                    day: "numeric",
                                                    month: "short",
                                                })}
                                                {" – "}
                                                {new Date(year.end_date).toLocaleDateString("id-ID", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "2-digit",
                                                })}
                                            </span>
                                        </div>
                                        {dur && (
                                            <div
                                                className={`mt-1 text-[8px] font-bold text-[var(--color-text-muted)] opacity-60 ${isPrivacyMode ? "blur-sm select-none" : ""}`}
                                            >
                                                {dur}
                                            </div>
                                        )}

                                        {/* Actions — always visible */}
                                        <div className="mt-3 pt-2.5 border-t border-[var(--color-border)]/50 flex items-center justify-between gap-1">
                                            <div className="flex items-center gap-1 min-w-0 flex-1">
                                                {canEdit && !isActive && !year.is_locked && (
                                                    <button
                                                        onClick={() => onSetActive(year)}
                                                        className="w-6 h-6 rounded-lg bg-[var(--color-primary)] text-white transition-all flex items-center justify-center shrink-0 hover:brightness-110"
                                                        title="Aktifkan"
                                                    >
                                                        <Check className="w-2.5 h-2.5" />
                                                    </button>
                                                )}
                                                {isActive && (
                                                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-wider">
                                                        Aktif
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-0.5 shrink-0">
                                                {canEdit && !year.is_locked && (
                                                    <button
                                                        onClick={() => onEdit(year)}
                                                        className="w-6 h-6 rounded-lg bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-all flex items-center justify-center"
                                                    >
                                                        <Pencil className="w-2.5 h-2.5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => onHistory(year)}
                                                    className="w-6 h-6 rounded-lg bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-all flex items-center justify-center"
                                                >
                                                    <ClockCounterClockwise className="w-2.5 h-2.5" />
                                                </button>
                                                {canEdit && (
                                                    <button
                                                        onClick={() => onDuplicate(year)}
                                                        title="Duplikat"
                                                        className="w-6 h-6 rounded-lg bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-emerald-500 transition-all flex items-center justify-center"
                                                    >
                                                        <Copy className="w-2.5 h-2.5" />
                                                    </button>
                                                )}
                                                {canEdit && !isActive && (
                                                    <button
                                                        onClick={() => onToggleLock(year)}
                                                        title={year.is_locked ? "Buka Buku" : "Tutup Buku"}
                                                        className={`w-6 h-6 rounded-lg transition-all flex items-center justify-center ${year.is_locked ? "bg-rose-500/10 text-rose-500" : "bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-rose-500"}`}
                                                    >
                                                        {year.is_locked ? (
                                                            <ArrowCounterClockwise className="w-2.5 h-2.5" />
                                                        ) : (
                                                            <Archive className="w-2.5 h-2.5" />
                                                        )}
                                                    </button>
                                                )}
                                                {canEdit && !year.is_locked && !isActive && (
                                                    <button
                                                        onClick={() => onDelete(year)}
                                                        className="w-6 h-6 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                                    >
                                                        <Trash className="w-2.5 h-2.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default memo(TimelineView);
