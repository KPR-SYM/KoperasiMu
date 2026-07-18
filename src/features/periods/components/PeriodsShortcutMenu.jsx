import { memo } from "react";
import { createPortal } from "react-dom";

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

const SHORTCUTS = [
    { section: "Navigasi" },
    { keys: ["Ctrl", "K"], label: "Fokus ke search" },
    { section: "Aksi" },
    { keys: ["N"], label: "Tambah periode baru" },
    { keys: ["X"], label: "Reset semua filter" },
    { keys: ["?"], label: "Tampilkan shortcut ini" },
];

const PeriodsShortcutMenu = memo(function PeriodsShortcutMenu({
    isOpen,
    rect,
    onClose,
}) {
    if (!isOpen || !rect) return null;

    return createPortal(
        <>
            <div
                className="fixed inset-0 z-[9990] bg-black/5 backdrop-blur-[1px]"
                onClick={onClose}
            />
            <div
                className="fixed z-[9991] w-72 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl shadow-black/10 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200"
                style={{
                    top: rect.bottom + 8,
                    left: Math.max(10, rect.right - 288),
                }}
            >
                <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface-alt)]/50">
                    <p className="text-[11px] font-black uppercase tracking-widest text-[var(--color-text)]">
                        Keyboard Shortcuts
                    </p>
                    <span className="text-[9px] text-[var(--color-text-muted)] font-bold">
                        Tekan ? untuk toggle
                    </span>
                </div>
                <div className="p-3 space-y-0.5">
                    {SHORTCUTS.map((item, i) =>
                        item.section ? (
                            <p
                                key={i}
                                className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] pt-2 pb-1 px-1"
                            >
                                {item.section}
                            </p>
                        ) : (
                            <div
                                key={i}
                                className="flex items-center justify-between px-1 py-1 rounded-lg hover:bg-[var(--color-surface-alt)] transition-all"
                            >
                                <span className="text-[11px] font-semibold text-[var(--color-text)]">
                                    {item.label}
                                </span>
                                <div className="flex items-center gap-1">
                                    {item.keys.map((k, ki) => (
                                        <span
                                            key={ki}
                                            className="px-1.5 py-0.5 rounded-md bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[9px] font-black text-[var(--color-text-muted)] font-mono"
                                        >
                                            {k}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ),
                    )}
                </div>
            </div>
        </>,
        getPortalContainer("portal-periods-shortcut-menu"),
    );
});

export default PeriodsShortcutMenu;
