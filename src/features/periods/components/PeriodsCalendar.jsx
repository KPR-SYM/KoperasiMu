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

function getBarColors(year) {
    const isActive = year.is_active;
    const isLocked = year.is_locked;
    return {
        isActive,
        isLocked,
        backgroundColor: isActive
            ? "var(--color-primary)"
            : isLocked
                ? "var(--color-surface-alt)"
                : "var(--color-border)",
        borderColor: isLocked ? "var(--color-border)" : undefined,
    };
}

function MobileCalendarList({ years, rangeStart, totalDays, todayPct, showToday, formatDate, maskValue }) {
    return (
        <div className="md:hidden divide-y divide-[var(--color-border)]">
            {years.map((year) => {
                const startDate = new Date(year.start_date);
                const endDate = new Date(year.end_date);
                const isActive = year.is_active;
                const isLocked = year.is_locked;
                const durDays = Math.round(daysBetween(startDate, endDate));
                const colors = getBarColors(year);

                const rawStart = ((startDate - rangeStart) / totalDays) * 100;
                const rawEnd = ((endDate - rangeStart) / totalDays) * 100;
                const barLeft = Math.max(0, Math.min(100, rawStart));
                const barRight = Math.max(0, Math.min(100, rawEnd));
                const barWidth = Math.max(0, barRight - barLeft);

                return (
                    <div key={year.id} className="p-3.5">
                        {/* Title row */}
                        <div className="flex items-center gap-2.5">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${isActive ? "bg-emerald-500" : isLocked ? "bg-amber-500" : "bg-[var(--color-border)]"}`} />
                                <p className="text-[13px] font-extrabold text-[var(--color-text)] leading-tight truncate">
                                    {maskValue(year.academic_year, "year")}
                                </p>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {isActive && <Star className="w-3 h-3 text-emerald-500" weight="fill" />}
                                    {isLocked && <Lock className="w-3 h-3 text-amber-500" weight="bold" />}
                                </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-1.5">
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest border whitespace-nowrap ${year.semester === "Ganjil" ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" : "bg-purple-500/10 text-purple-600 border-purple-500/20"}`}>
                                    {maskValue(year.semester, "semester")}
                                </span>
                            </div>
                        </div>

                        {/* Dates + duration */}
                        <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold text-[var(--color-text-muted)] truncate">
                                {maskValue(formatDate(year.start_date), "date")} – {maskValue(formatDate(year.end_date), "date")}
                            </span>
                            <span className="text-[9px] font-black text-[var(--color-text-muted)] shrink-0">
                                {maskValue(String(durDays), "number")} hr
                            </span>
                        </div>

                        {/* Proportional bar */}
                        <div className="relative h-3 rounded-full bg-[var(--color-surface-alt)] mt-2.5 overflow-hidden">
                            {showToday && (
                                <div
                                    className="absolute top-0 bottom-0 w-[2px] bg-red-500/70 z-10 pointer-events-none"
                                    style={{ left: `${todayPct}%` }}
                                    title="Hari ini"
                                />
                            )}
                            <div
                                className={`absolute top-0.5 bottom-0.5 rounded-full flex items-center justify-center overflow-hidden px-1 ${isActive && !isLocked ? "shadow-sm" : ""}`}
                                style={{
                                    left: `${barLeft}%`,
                                    width: `${barWidth}%`,
                                    minWidth: 10,
                                    backgroundColor: colors.backgroundColor,
                                    border: colors.borderColor ? `1px solid ${colors.borderColor}` : "none",
                                }}
                                title={`${maskValue(year.academic_year, "year")} ${maskValue(year.semester, "semester")}\n${maskValue(formatDate(year.start_date), "date")} – ${maskValue(formatDate(year.end_date), "date")}${isLocked ? "\n(Terkunci)" : ""}`}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function DesktopGantt({ years, months, totalMonths, rangeStart, todayPct, showToday, formatDate, onEdit, canEdit, maskValue }) {
    return (
        <div className="hidden md:block p-4 overflow-x-auto">
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
                        const durDays = Math.round(daysBetween(startDate, endDate));

                        // Compute proper month indices against range start
                        const sIdx = Math.max(0, (startDate.getFullYear() - rangeStart.getFullYear()) * 12 + startDate.getMonth() - rangeStart.getMonth());
                        const eIdx = Math.min(totalMonths - 1, (endDate.getFullYear() - rangeStart.getFullYear()) * 12 + endDate.getMonth() - rangeStart.getMonth());

                        const colors = getBarColors(year);
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
                                                    {maskValue(year.academic_year, "year")}
                                                </p>
                                                {isActive && <Star className="w-2.5 h-2.5 text-emerald-500 shrink-0" weight="fill" />}
                                                {isLocked && <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" weight="bold" />}
                                            </div>
                                            <p className="text-[8px] font-bold text-[var(--color-text-muted)] truncate">
                                                {maskValue(year.semester, "semester")} · {maskValue(formatDate(year.start_date), "date")} – {maskValue(formatDate(year.end_date), "date")}
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
                                    {sIdx <= eIdx && (
                                        <button
                                            onClick={() => canClick && onEdit?.(year)}
                                            title={`${maskValue(year.academic_year, "year")} ${maskValue(year.semester, "semester")}\n${maskValue(formatDate(year.start_date), "date")} – ${maskValue(formatDate(year.end_date), "date")}${isLocked ? "\n(Terkunci)" : ""}`}
                                            className={`absolute top-1 h-5 rounded-md flex items-center justify-center text-[8px] font-black tracking-wider transition-all overflow-hidden px-1 ${canClick ? "cursor-pointer hover:brightness-110" : "cursor-default"} ${isActive ? "shadow-sm" : ""}`}
                                            style={{
                                                left: `${(sIdx / totalMonths) * 100}%`,
                                                width: `${((eIdx - sIdx + 1) / totalMonths) * 100}%`,
                                                minWidth: 20,
                                                backgroundColor: colors.backgroundColor,
                                                color: isActive ? "#fff" : "var(--color-text-muted)",
                                            }}
                                        >
                                            <span className="truncate">{maskValue(year.academic_year, "year")}</span>
                                        </button>
                                    )}
                                </div>
                                <div className="w-14 shrink-0 text-center">
                                    <span className="text-[8px] font-bold text-[var(--color-text-muted)]">
                                        {maskValue(String(durDays), "number")} hr
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-6 pt-3 border-t border-[var(--color-border)]">
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
                        <div className="w-0.5 h-3 bg-red-500/60 rounded" />
                        <span className="text-[9px] text-[var(--color-text-muted)] font-medium">Hari Ini</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

const PeriodsCalendar = memo(function PeriodsCalendar({
    years,
    onEdit,
    canEdit,
    formatDate,
    isPrivacyMode,
    maskValue,
}) {
    const { start, end } = getYearRange(years);

    if (years.length === 0) {
        return (
            <div className="p-6">
                <EmptyState icon={Calendar} title="Tidak Ada Data" description="Tidak ada periode untuk ditampilkan." color="slate" />
            </div>
        );
    }

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

    const identityMask = (v, t) => v;

    return (
        <>
            <MobileCalendarList
                years={years}
                rangeStart={rangeStart}
                totalDays={totalDays}
                todayPct={todayPct}
                showToday={showToday}
                formatDate={formatDate}
                maskValue={maskValue || identityMask}
            />
            <DesktopGantt
                years={years}
                months={months}
                totalMonths={totalMonths}
                rangeStart={rangeStart}
                todayPct={todayPct}
                showToday={showToday}
                formatDate={formatDate}
                onEdit={onEdit}
                canEdit={canEdit}
                maskValue={maskValue || identityMask}
            />
        </>
    );
});

export default PeriodsCalendar;