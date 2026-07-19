export function normalizeSemester(value) {
    const trimmed = String(value || "").trim();
    const map = { ganjil: "Ganjil", genap: "Genap" };
    return map[trimmed.toLowerCase()] || trimmed;
}

export function isValidDateRange(start, end) {
    if (!start || !end) return false;
    const s = new Date(start);
    const e = new Date(end);
    return !Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime()) && e > s;
}

export function periodsOverlap(a, b) {
    if (a.semester !== b.semester) return false;
    const aStart = new Date(a.start_date);
    const aEnd = new Date(a.end_date);
    const bStart = new Date(b.start_date);
    const bEnd = new Date(b.end_date);
    return aStart <= bEnd && aEnd >= bStart;
}

export function findOverlappingPeriod({ semester, startDate, endDate, excludeId = null, periods }) {
    if (!semester || !startDate || !endDate || !periods) return null;
    const targetS = new Date(startDate);
    const targetE = new Date(endDate);
    if (Number.isNaN(targetS.getTime()) || Number.isNaN(targetE.getTime())) return null;
    return (
        periods.find((y) => {
            if (excludeId && y.id === excludeId) return false;
            if (y.semester !== semester) return false;
            const s = new Date(y.start_date);
            const e = new Date(y.end_date);
            return (
                (targetS >= s && targetS <= e) ||
                (targetE >= s && targetE <= e) ||
                (targetS <= s && targetE >= e)
            );
        }) || null
    );
}

export function findOverlappingPeriods(periods) {
    const overlaps = [];
    for (let i = 0; i < periods.length; i++) {
        for (let j = i + 1; j < periods.length; j++) {
            if (periodsOverlap(periods[i], periods[j])) {
                overlaps.push({ a: periods[i], b: periods[j] });
            }
        }
    }
    return overlaps;
}

export function findPeriodGaps(periods) {
    if (!periods || periods.length < 2) return [];
    const groups = {};
    for (const p of periods) {
        if (!p.semester) continue;
        if (!groups[p.semester]) groups[p.semester] = [];
        groups[p.semester].push(p);
    }
    const gaps = [];
    for (const sem of Object.keys(groups)) {
        const sorted = groups[sem].sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
        for (let i = 0; i < sorted.length - 1; i++) {
            const curr = sorted[i];
            const next = sorted[i + 1];
            if (!curr.end_date || !next.start_date) continue;
            const currEnd = new Date(curr.end_date);
            const nextStart = new Date(next.start_date);
            const gapDays = Math.round((nextStart - currEnd) / (1000 * 60 * 60 * 24)) - 1;
            if (gapDays > 1) {
                gaps.push({ before: curr, after: next, gapDays });
            }
        }
    }
    return gaps;
}

export function assertEditable(period, canEdit) {
    if (!canEdit) return "Mode read-only — anda tidak memiliki izin untuk mengubah data.";
    if (period?.is_locked) return "Periode terkunci — tidak dapat diedit. Buka kunci terlebih dahulu.";
    return null;
}
