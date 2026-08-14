import { memo, useEffect, useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
    MagnifyingGlass,
    Plus,
    Pencil,
    Archive,
    CheckSquare,
    Eye,
    ArrowCounterClockwise,
    Keyboard,
    FadersHorizontal,
    Upload,
    Download,
} from "@phosphor-icons/react";

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

const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? "⌘" : "Ctrl";

const SHORTCUTS = [
    { section: "Shortcuts" },
    { keys: [MOD, "K"], label: "Fokus ke search", icon: MagnifyingGlass, action: "focusSearch" },
    { keys: ["?"], label: "Tampilkan shortcut ini", icon: Keyboard, action: null },
    { section: "Aksi" },
    { keys: ["N"], label: "Tambah guru baru", icon: Plus, action: "add" },
    { keys: [MOD, "I"], label: "Import CSV / Excel", icon: Upload, action: "import" },
    { keys: [MOD, "E"], label: "Export Data", icon: Download, action: "export" },
    { keys: ["E"], label: "Edit guru terpilih", icon: Pencil, action: "edit", needsSelection: true },
    { keys: ["R"], label: "Refresh data", icon: ArrowCounterClockwise, action: "refresh" },
    { keys: ["X"], label: "Reset semua filter", icon: FadersHorizontal, action: "resetFilter" },
    { keys: [MOD, "A"], label: "Pilih semua", icon: CheckSquare, action: "selectAll" },
    { keys: ["⌫"], label: "Arsipkan terpilih", icon: Archive, action: "bulkArchive", needsSelection: true },
    { section: "Mode" },
    { keys: [MOD, "P"], label: "Toggle mode privasi", icon: Eye, action: "privacy" },
];

const TeachersShortcutMenu = memo(function TeachersShortcutMenu({
    isOpen,
    onClose,
    onAction,
    selectedCount = 0,
}) {
    const [visible, setVisible] = useState(false);
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setQuery("");
            setActiveIndex(0);
            requestAnimationFrame(() => {
                setVisible(true);
                inputRef.current?.focus();
            });
        } else {
            setVisible(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    const filtered = useMemo(() => {
        if (!query.trim()) return SHORTCUTS;
        const q = query.toLowerCase();
        return SHORTCUTS.filter(
            (item) => item.section || item.label?.toLowerCase().includes(q)
        );
    }, [query]);

    const items = useMemo(() => filtered.filter((i) => !i.section), [filtered]);
    const groups = useMemo(() => {
        const g = [];
        let current = null;
        filtered.forEach((item) => {
            if (item.section) {
                current = { section: item.section, items: [] };
                g.push(current);
            } else if (current) {
                current.items.push(item);
            }
        });
        return g;
    }, [filtered]);

    useEffect(() => {
        setActiveIndex(0);
    }, [query]);

    const handleKeyDown = (e) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => {
                let next = i + 1;
                while (next < items.length && items[next] && (items[next].section || (items[next].needsSelection && selectedCount === 0))) next++;
                return Math.min(next, items.length - 1);
            });
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => {
                let prev = i - 1;
                while (prev >= 0 && items[prev] && (items[prev].section || (items[prev].needsSelection && selectedCount === 0))) prev--;
                return Math.max(prev, 0);
            });
        } else if (e.key === "Enter") {
            e.preventDefault();
            const item = items[activeIndex];
            if (item?.action && onAction && !(item.needsSelection && selectedCount === 0)) {
                onAction(item.action);
                onClose();
            }
        }
    };

    const handleClick = (item) => {
        if (item.action && onAction) {
            onAction(item.action);
            onClose();
        }
    };

    if (!isOpen) return null;

    const container = getPortalContainer("portal-teachers-shortcut-menu");

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/20" onClick={onClose} />
            <div
                className={`relative z-10 w-full max-w-[480px] bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-2xl shadow-black/10 overflow-hidden transition-all duration-150 ${visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-[0.98] -translate-y-1"}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
                    <MagnifyingGlass className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Run a command or search..."
                        className="flex-1 bg-transparent text-sm font-medium text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 outline-none"
                    />
                    <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[9px] font-bold text-[var(--color-text-muted)] font-mono">
                        ESC
                    </kbd>
                </div>
                <div ref={listRef} className="max-h-[50vh] overflow-y-auto custom-scrollbar p-1.5">
                    {groups.length === 0 ? (
                        <div className="py-8 text-center">
                            <p className="text-sm font-medium text-[var(--color-text-muted)]">No results found</p>
                        </div>
                    ) : (
                        groups.map((group, gi) => (
                            <div key={gi}>
                                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)]/50 px-2.5 pt-2.5 pb-1">
                                    {group.section}
                                </p>
                                {group.items.map((item) => {
                                    const globalIdx = items.indexOf(item);
                                    const Icon = item.icon;
                                    const isClickable = !!item.action;
                                    const isDisabled = item.needsSelection && selectedCount === 0;
                                    return (
                                        <div
                                            key={item.label}
                                            onClick={() => !isDisabled && handleClick(item)}
                                            className={`flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors ${isDisabled ? "opacity-35 cursor-not-allowed" : isClickable ? "cursor-pointer" : "cursor-default"} ${globalIdx === activeIndex && !isDisabled ? "bg-[var(--color-surface-alt)]" : "hover:bg-[var(--color-surface-alt)]"}`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                {Icon && <Icon className="w-4 h-4 text-[var(--color-text-muted)]" />}
                                                <span className={`text-[13px] font-medium ${isClickable ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]"}`}>
                                                    {item.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-0.5">
                                                {item.keys.map((k, ki) => (
                                                    <kbd key={ki} className="min-w-[20px] h-5 px-1 rounded-md bg-[var(--color-surface-alt)] border border-[var(--color-border)]/60 text-[10px] font-semibold text-[var(--color-text-muted)] font-mono inline-flex items-center justify-center">
                                                        {k}
                                                    </kbd>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>,
        container,
    );
});

export default TeachersShortcutMenu;
