import { memo } from "react";
import { Calendar, Clock, CheckCircle, CircleDashed } from "@phosphor-icons/react";
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

const PeriodsCalendar = memo(function PeriodsCalendar({
    years,
    onEdit,
    canEdit,
    formatDate,
    getTimeStatus,
}) {
    if (years.length === 0) {
        return (
            <div className="p-6">
                <EmptyState icon={Calendar} title="Tidak Ada Data" description="Tidak ada periode untuk ditampilkan." color="slate" />
            </div>
        );
    }

    const { start, end } = getYearRange(years);
    const months = [];
    for (let y = start; y <= end; y++) {
        for (let m = 0; m < 12; m++) {
            months.push({ year: y, month: m, label: `${MONTHS[m]} ${y}` });
        }
    }

    return (
        <div className="p-4 overflow-x-auto">
            <div className="min-w-[600px]">
                {/* Header: months */}
                <div className="flex border-b border-[var(--color-border)] pb-2 mb-2">
                    <div className="w-40 shrink-0 text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] px-3 py-2">
                        Periode
                    </div>
                    <div className="flex flex-1">
                        {months.map((m, i) => (
                            <div
                                key={i}
                                className={`flex-1 text-[8px] font-bold text-center leading-tight ${m.month === 0 ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)] opacity-60"}`}
                                style={{ minWidth: 0 }}
                            >
                                {m.month === 0 ? m.year : MONTHS[m.month].slice(0, 3)}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rows */}
                <div className="space-y-1">
                    {years.map((year) => {
                        const startDate = new Date(year.start_date);
                        const endDate = new Date(year.end_date);
                        const regStart = year.registration_start ? new Date(year.registration_start) : null;
                        const regEnd = year.registration_end ? new Date(year.registration_end) : null;

                        const totalMonths = months.length;
                        const startIdx = Math.max(0, (startDate.getFullYear() - start) * 12 + startDate.getMonth());
                        const endIdx = Math.min(totalMonths - 1, (endDate.getFullYear() - start) * 12 + endDate.getMonth());

                        return (
                            <div
                                key={year.id}
                                className="flex items-center py-2 px-0 rounded-xl hover:bg-[var(--color-surface-alt)]/50 transition-all group"
                            >
                                <div className="w-40 shrink-0 px-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${year.is_active ? "bg-emerald-500" : "bg-[var(--color-border)]"}`} />
                                        <div>
                                            <p className="text-[11px] font-bold text-[var(--color-text)] leading-tight">
                                                {year.academic_year}
                                            </p>
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
                                    {/* Period bar */}
                                    {startIdx <= endIdx && (
                                        <div
                                            className="absolute top-1 h-5 rounded-lg flex items-center justify-center text-[8px] font-black tracking-wider cursor-pointer transition-all hover:brightness-110"
                                            style={{
                                                left: `${(startIdx / totalMonths) * 100}%`,
                                                width: `${((endIdx - startIdx + 1) / totalMonths) * 100}%`,
                                                backgroundColor: year.is_active
                                                    ? "var(--color-primary)"
                                                    : "var(--color-border)",
                                                color: year.is_active ? "#fff" : "var(--color-text-muted)",
                                            }}
                                            title={`${year.academic_year} ${year.semester}: ${formatDate(year.start_date)} – ${formatDate(year.end_date)}`}
                                        >
                                            {year.is_active ? "AKTIF" : ""}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

export default PeriodsCalendar;
