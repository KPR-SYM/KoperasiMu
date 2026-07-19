import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

function findAdjacent(years, currentId) {
    const sorted = [...years].sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    const idx = sorted.findIndex((y) => y.id === currentId);
    return {
        prev: idx > 0 ? sorted[idx - 1] : null,
        next: idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null,
    };
}

export default function PeriodContextTooltip({ years, children, currentId, formatDate }) {
    const [tooltip, setTooltip] = useState(null);
    const timerRef = useRef(null);
    const targetRef = useRef(null);

    const show = useCallback(() => {
        if (!currentId) return;
        const { prev, next } = findAdjacent(years, currentId);
        if (!prev && !next) return;
        const rect = targetRef.current?.getBoundingClientRect();
        if (!rect) return;
        setTooltip({
            prev,
            next,
            top: rect.bottom + 6,
            left: rect.left + rect.width / 2,
        });
    }, [years, currentId]);

    const hide = useCallback(() => {
        setTooltip(null);
    }, []);

    return (
        <>
            <span
                ref={targetRef}
                onMouseEnter={() => {
                    clearTimeout(timerRef.current);
                    timerRef.current = setTimeout(show, 500);
                }}
                onMouseLeave={() => {
                    clearTimeout(timerRef.current);
                    timerRef.current = null;
                    hide();
                }}
                className="inline"
            >
                {children}
            </span>
            {tooltip && createPortal(
                <div
                    className="fixed z-[9999] w-56 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl p-3 animate-in fade-in zoom-in-95 pointer-events-none"
                    style={{ top: tooltip.top, left: tooltip.left, transform: "translateX(-50%)" }}
                    onMouseEnter={() => { clearTimeout(timerRef.current); }}
                >
                    <p className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2">Periode Berdekatan</p>
                    {tooltip.prev ? (
                        <div className="flex items-center gap-2 py-1.5 border-b border-[var(--color-border)]/50">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-[var(--color-text)] truncate">{tooltip.prev.academic_year} {tooltip.prev.semester}</p>
                                <p className="text-[8px] text-[var(--color-text-muted)] truncate">{formatDate?.(tooltip.prev.start_date)} – {formatDate?.(tooltip.prev.end_date)}</p>
                            </div>
                            <span className="text-[7px] font-black uppercase tracking-wider text-indigo-500 shrink-0">Sebelum</span>
                        </div>
                    ) : (
                        <div className="py-1.5 border-b border-[var(--color-border)]/50">
                            <p className="text-[9px] text-[var(--color-text-muted)] italic">Tidak ada periode sebelumnya</p>
                        </div>
                    )}
                    {tooltip.next ? (
                        <div className="flex items-center gap-2 py-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-[var(--color-text)] truncate">{tooltip.next.academic_year} {tooltip.next.semester}</p>
                                <p className="text-[8px] text-[var(--color-text-muted)] truncate">{formatDate?.(tooltip.next.start_date)} – {formatDate?.(tooltip.next.end_date)}</p>
                            </div>
                            <span className="text-[7px] font-black uppercase tracking-wider text-emerald-500 shrink-0">Berikutnya</span>
                        </div>
                    ) : (
                        <div className="py-1.5">
                            <p className="text-[9px] text-[var(--color-text-muted)] italic">Tidak ada periode berikutnya</p>
                        </div>
                    )}
                </div>,
                document.body
            )}
        </>
    );
}
