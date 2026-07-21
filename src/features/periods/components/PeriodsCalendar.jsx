import { memo } from "react";
import { Calendar, Lock, Star } from "@phosphor-icons/react";
import { EmptyState } from "@shared/components";

const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function getYearRange(years) {
    if (years.length === 0) return { start: 2024, end: 2025 };
    let min = Infinity, max = -Infinity;
    for (const y of years) {
        if (y.start_date) {
            const yr = new Date(y.start_date).getFullYear();
            if (yr < min) min = yr;
        }
        if (y.end_date) {
            const yr = new Date(y.end_date).getFullYear();
            if (yr > max) max = yr;
        }
    }
    if (min === Infinity) min = new Date().getFullYear();
    if (max === -Infinity) max = min + 1;
    return { start: min, end: max };
}

function daysBetween(a, b) {
    return (b - a) / (1000 * 60 * 60 * 24);
}

const PeriodsCalendar = memo(function PeriodsCalendar({
    years,
    onEdit,
    canEdit,
    formatDate,
}) {
    const { start, end } = getYearRange(years);
    const months = [];
    for (let y = start; y <= end; y++) {
        for (let m = 0; m < 12; m++) {
            months.push({ year: y, month: m, label: `${MONTHS[m]} ${y}` });
        }
    }
    const totalMonths = months.length;

    const today = new Date();
    const rangeStart = new Date(start, 0);
    const rangeEnd = new Date(end + 1, 0);
    const totalDays = daysBetween(rangeStart, rangeEnd) || 1;

    const todayPct = (daysBetween(rangeStart, today) / totalDays) * 100;
    const showToday = today >= rangeStart && today <= rangeEnd;

    if (years.length === 0) {
        return (
            <div className="p-6">
                <EmptyState icon={Calendar} title="Tidak Ada Data" description="Tidak ada periode untuk ditampilkan." color="slate" />
            </div>
        );
    }

    return (
        <div className="p-4 overflow-x-auto">
            <div className="min-w-[600px]">
                {/* Header: months — aligned with data rows */}
                <div className="flex items-center border-b border-[var(--color-border)] mb-2">
                    <div className="w-40 shrink-0 text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] px-3 py-[9px]">
                        Periode
                    </div>
                    <div className="flex flex-1 h-8 relative">
                        {months.map((m, i) => (
                            <div
                                key={i}
                                className={`flex-1 flex items-center justify-center text-[8px] font-bold ${m.month === 0 ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)] opacity-60"}`}
                            >
                                {m.month === 0 ? m.year : MONTHS[m.month].slice(0, 3)}
                            </div>
                        ))}
                    </div>
                    <div className="w-14 shrink-0 text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] text-center py-[9px]">
                        Durasi
                    </div>
                </div>

                {/* Rows */}
                <div className="space-y-1">
                    {years.map((year) => {
                        const startDate = new Date(year.start_date);
                        const endDate = new Date(year.end_date);
                        const isActive = year.is_active;
                        const isLocked = year.is_locked;

                        const startIdx = Math.max(0, (startDate.getFullYear() - start) * 12 + startDate.getMonth());
                        const endIdx = Math.min(totalMonths - 1, (endDate.getFullYear() - start) * 12 + endDate.getMonth());
                        const durDays = Math.round(daysBetween(startDate, endDate));

                        const canClick = canEdit && !isLocked;

                        return (
                            <div
                                key={year.id}
                                className="flex items-center py-2 px-0 rounded-xl hover:bg-[var(--color-surface-alt)]/50 transition-all group"
                            >
                                <div className="w-40 shrink-0 px-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${isActive ? "bg-emerald-500" : isLocked ? "bg-amber-500" : "bg-[var(--color-border)]"}`} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1">
                                                <p className="text-[11px] font-bold text-[var(--color-text)] leading-tight truncate">
                                                    {year.academic_year}
                                                </p>
                                                {isActive && <Star className="w-2.5 h-2.5 text-emerald-500 shrink-0" weight="fill" />}
                                                {isLocked && <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" weight="bold" />}
                                            </div>
                                            <p className="text-[8px] font-bold text-[var(--color-text-muted)]">
                                                {year.semester} · {formatDate(year.start_date)} – {formatDate(year.end_date)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-1 h-8 relative">
                                    {Array.from({ length: totalMonths }).map((_, i) => (
                                        <div key={i} className="flex-1 border-r border-[var(--color-border)]/20" />
                                    ))}
                                    {/* Today marker */}
                                    {showToday && (
                                        <div
                                            className="absolute top-0 bottom-0 w-0.5 bg-red-500/60 z-10 pointer-events-none"
                                            style={{ left: `${todayPct}%` }}
                                            title="Hari ini"
                                        />
                                    )}
                                    {/* Period bar */}
                                    {startIdx <= endIdx && (
                                        <button
                                            onClick={() => canClick && onEdit(year)}
                                            disabled={!canClick}
                                            className={`absolute top-1 h-5 rounded-md flex items-center justify-center text-[8px] font-black tracking-wider transition-all overflow-hidden px-1 ${canClick ? "cursor-pointer hover:brightness-110" : "cursor-default"} ${isActive ? "shadow-sm" : ""}`}
                                            style={{
                                                left: `${(startIdx / totalMonths) * 100}%`,
                                                width: `${((endIdx - startIdx + 1) / totalMonths) * 100}%`,
                                                minWidth: 20,
                                                backgroundColor: isActive
                                                    ? "var(--color-primary)"
                                                    : isLocked
                                                        ? "var(--color-surface-alt)"
                                                        : "var(--color-border)",
                                                color: isActive ? "#fff" : "var(--color-text-muted)",
                                            }}
                                            title={`${year.academic_year} ${year.semester}\n${formatDate(year.start_date)} – ${formatDate(year.end_date)}${isLocked ? "\n(Terkunci)" : ""}`}
                                        >
                                            <span className="truncate">{year.academic_year}</span>
                                        </button>
                                    )}
                                </div>
                                <div className="w-14 shrink-0 text-center">
                                    <span className="text-[8px] font-bold text-[var(--color-text-muted)]">
                                        {durDays} hr
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-6 pt-3 border-t border-[var(--color-border)]">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-[var(--color-primary)]" />
                        <span className="text-[9px] text-[var(--color-text-muted)] font-medium">Aktif</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-[var(--color-border)]" />
                        <span className="text-[9px] text-[var(--color-text-muted)] font-medium">Nonaktif</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-[var(--color-surface-alt)] border border-[var(--color-border)]" />
                        <span className="text-[9px] text-[var(--color-text-muted)] font-medium">Terkunci</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Star className="w-2.5 h-2.5 text-emerald-500" weight="fill" />
                        <span className="text-[9px] text-[var(--color-text-muted)] font-medium">Aktif</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Lock className="w-2.5 h-2.5 text-amber-500" weight="bold" />
                        <span className="text-[9px] text-[var(--color-text-muted)] font-medium">Terkunci</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                        <div className="w-0.5 h-3 bg-red-500/60 rounded" />
                        <span className="text-[9px] text-[var(--color-text-muted)] font-medium">Hari Ini</span>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default PeriodsCalendar;
