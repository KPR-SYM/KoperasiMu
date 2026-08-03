import { memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    FileArrowDown,
    FileArrowUp,
    ArrowClockwise,
    Archive,
} from "@phosphor-icons/react";

const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator?.platform);
const MOD = isMac ? "⌘" : "Ctrl";

function getPortalContainer(id) {
    if (typeof document === "undefined") return null;
    let el = document.getElementById(id);
    if (!el) {
        el = document.createElement("div");
        el.id = id;
        document.body.appendChild(el);
    }
    return el;
}

const PeriodsHeaderMenu = memo(function PeriodsHeaderMenu({
    isOpen,
    rect,
    mounted,
    canEdit,
    isMutating,
    years,
    archivedCount = 0,
    onClose,
    onImportClick,
    onOpenExport,
    onGenerate,
    onOpenArchived,
    fetchArchived,
}) {
    const [activeIdx, setActiveIdx] = useState(-1);
    const menuRef = useRef(null);
    const itemRefs = useRef([]);

    const items = [
        { id: "import", label: "Import CSV / Excel", desc: "Unggah data periode masal dari file Excel/CSV", icon: FileArrowDown, color: "emerald", shortcut: `${MOD}+I`, disabled: !canEdit, onClick: onImportClick },
        { id: "export", label: "Export Data", desc: "Cadangkan seluruh database ke format Excel", icon: FileArrowUp, color: "amber", shortcut: `${MOD}+E`, disabled: false, onClick: onOpenExport },
        null, // divider
        { id: "generate", label: "Generate Tahun Baru", desc: "Buat Ganjil + Genap tahun depan otomatis", icon: ArrowClockwise, color: "indigo", shortcut: `${MOD}+G`, disabled: !canEdit || isMutating || years.length === 0, onClick: onGenerate },
        { id: "archived", label: "Arsip Periode", desc: "Lihat & pulihkan data periode tidak aktif", icon: Archive, color: "orange", badge: archivedCount, disabled: false, onClick: () => { fetchArchived?.(); onOpenArchived?.(); } },
    ];

    const colorMap = {
        emerald: "bg-emerald-500/10 text-emerald-500",
        amber: "bg-amber-500/10 text-amber-500",
        indigo: "bg-indigo-500/10 text-indigo-500",
        orange: "bg-orange-500/10 text-orange-500",
    };

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => {
            if (e.key === "Escape") onClose();
            const clickable = items.filter(i => i && !i.disabled);
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIdx(prev => {
                    const next = prev + 1;
                    return next >= clickable.length ? 0 : next;
                });
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIdx(prev => {
                    const next = prev - 1;
                    return next < 0 ? clickable.length - 1 : next;
                });
            } else if (e.key === "Enter" && activeIdx >= 0) {
                e.preventDefault();
                clickable[activeIdx]?.onClick?.();
                onClose();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, onClose, activeIdx]);

    useEffect(() => {
        if (isOpen) setActiveIdx(-1);
    }, [isOpen]);

    useEffect(() => {
        if (activeIdx >= 0 && itemRefs.current[activeIdx]) {
            itemRefs.current[activeIdx].scrollIntoView({ block: "nearest" });
        }
    }, [activeIdx]);

    if (!mounted || !rect) return null;

    let clickableIdx = -1;

    return createPortal(
        <>
            <div
                className={`fixed inset-0 z-[9990] transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0"}`}
                onClick={onClose}
            />
            <div
                ref={menuRef}
                className={`fixed z-[9991] w-60 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl p-1.5 transition-all duration-200 ease-out origin-top-right
                ${isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2"}`}
                style={{
                    top: rect.bottom + 8,
                    left: Math.max(10, rect.right - 240),
                }}
            >
                {items.map((item, i) => {
                    if (item === null) {
                        return <div key={`div-${i}`} className="h-px bg-[var(--color-border)] my-1 mx-2" />;
                    }

                    const idx = ++clickableIdx;
                    const isActive = !item.disabled && activeIdx === idx;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            ref={el => { if (!item.disabled) itemRefs.current[idx] = el; }}
                            onClick={() => {
                                if (item.disabled) return;
                                onClose();
                                item.onClick?.();
                            }}
                            onMouseEnter={() => {
                                if (!item.disabled) setActiveIdx(idx);
                            }}
                            disabled={item.disabled}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group
                            ${item.disabled ? "opacity-35 cursor-not-allowed" : "cursor-pointer"}
                            ${isActive ? "bg-[var(--color-surface-alt)]" : ""}`}
                        >
                            <div className={`w-8 h-8 rounded-lg ${colorMap[item.color]} flex items-center justify-center shrink-0 transition-transform ${!item.disabled ? "group-hover:scale-110" : ""}`}>
                                <Icon className="w-3.5 h-3.5" weight="bold" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-[11px] font-black leading-tight text-[var(--color-text)] truncate">{item.label}</p>
                                    {item.badge > 0 && (
                                        <span className="px-1.5 py-0.5 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)] text-[8px] font-black shrink-0">
                                            {item.badge}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[9px] font-medium text-[var(--color-text-muted)] leading-tight mt-0.5 truncate">{item.desc}</p>
                            </div>
                            {item.shortcut && (
                                <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--color-surface-alt)] border border-[var(--color-border)]/60 text-[8px] font-bold text-[var(--color-text-muted)] font-mono shrink-0">
                                    {item.shortcut}
                                </kbd>
                            )}
                        </button>
                    );
                })}
            </div>
        </>,
        getPortalContainer("portal-periods-header-menu"),
    );
});

export default PeriodsHeaderMenu;
