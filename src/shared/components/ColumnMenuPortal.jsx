import { createPortal } from "react-dom";
import Checkbox from "./Checkbox";

export default function ColumnMenuPortal({
    isOpen,
    viewMode,
    loading,
    portalRef,
    colMenuPos,
    columnOrder,
    colLabels,
    visibleCols,
    setVisibleCols,
    moveColumnLeft,
    moveColumnRight,
}) {
    if (!isOpen || (viewMode && viewMode !== "table") || loading) return null;

    const orderedKeys = columnOrder.filter((k) => colLabels[k]);

    return createPortal(
        <div
            ref={portalRef}
            className={`absolute z-[9999] w-56 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl shadow-black/10 p-2 space-y-0.5 animate-in fade-in zoom-in-95 ${colMenuPos?.showUp ? "slide-in-from-bottom-2" : "slide-in-from-top-2"}`}
            style={{
                top: colMenuPos?.top,
                right: colMenuPos?.right,
            }}
        >
            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] px-3 py-2">
                Atur Kolom
            </p>
            {orderedKeys.map((key, idx) => (
                <div
                    key={key}
                    className="flex items-center gap-1 px-1 py-1 rounded-xl hover:bg-[var(--color-surface-alt)] transition-all group"
                >
                    {moveColumnLeft && moveColumnRight && (
                        <div className="flex flex-col gap-0.5">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    moveColumnLeft(key);
                                }}
                                disabled={idx === 0}
                                className="w-3.5 h-3 flex items-center justify-center text-[6px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-20 disabled:cursor-not-allowed"
                            >
                                ▲
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    moveColumnRight(key);
                                }}
                                disabled={idx === orderedKeys.length - 1}
                                className="w-3.5 h-3 flex items-center justify-center text-[6px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-20 disabled:cursor-not-allowed"
                            >
                                ▼
                            </button>
                        </div>
                    )}
                    <label className="flex-1 flex items-center justify-between cursor-pointer py-1.5">
                        <span className="text-[11px] font-bold text-[var(--color-text)] transition-colors">
                            {colLabels[key]}
                        </span>
                        <Checkbox
                            checked={!!visibleCols[key]}
                            onChange={() =>
                                setVisibleCols((p) => ({
                                    ...p,
                                    [key]: !p[key],
                                }))
                            }
                            small
                        />
                    </label>
                </div>
            ))}
        </div>,
        document.body,
    );
}
