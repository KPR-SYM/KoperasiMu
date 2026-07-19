import { useState, useEffect, useRef, useCallback, memo } from "react";
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

const DropdownMenu = memo(function DropdownMenu({
    isOpen,
    onClose,
    triggerRef,
    items = [],
    width = "w-56",
    align = "end",
    portalId = "portal-dropdown",
    children,
}) {
    const [rect, setRect] = useState(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
        } else {
            const t = setTimeout(() => setMounted(false), 200);
            return () => clearTimeout(t);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const update = () => {
            if (triggerRef?.current) {
                setRect(triggerRef.current.getBoundingClientRect());
            }
        };
        update();
        window.addEventListener("scroll", update, true);
        window.addEventListener("resize", update);
        return () => {
            window.removeEventListener("scroll", update, true);
            window.removeEventListener("resize", update);
        };
    }, [isOpen, triggerRef]);

    useEffect(() => {
        if (!isOpen) return;
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);

    if (!mounted || !rect) return null;

    const menuWidth = width === "w-56" ? 224 : width === "w-64" ? 256 : width === "w-72" ? 288 : 224;
    const leftPos = align === "end"
        ? Math.max(10, rect.right - menuWidth)
        : rect.left;

    return createPortal(
        <>
            <div
                className={`fixed inset-0 z-[9990] transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0"}`}
                onClick={onClose}
                style={{ background: "rgba(0,0,0,0.05)", backdropFilter: "blur(1px)" }}
            />
            <div
                className={`fixed z-[9991] ${width} rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl p-2 transition-all duration-200 ease-out origin-top-right ${isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2"}`}
                style={{ top: rect.bottom + 8, left: leftPos }}
            >
                {children || items.map((item, i) => {
                    if (item.type === "separator") {
                        return <div key={i} className="h-px bg-[var(--color-border)] my-1 mx-2" />;
                    }
                    if (item.type === "label") {
                        return (
                            <p key={i} className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] px-3 py-2">
                                {item.label}
                            </p>
                        );
                    }
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.key || i}
                            onClick={() => {
                                if (item.disabled) return;
                                onClose();
                                item.onClick?.();
                            }}
                            disabled={item.disabled}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${item.disabled ? "opacity-40 cursor-not-allowed text-[var(--color-text-muted)]" : "hover:bg-[var(--color-surface-alt)] text-[var(--color-text)]"}`}
                        >
                            {Icon && (
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${item.iconBg || "bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]"}`}>
                                    <Icon className="w-3 h-3" />
                                </div>
                            )}
                            <div className="text-left min-w-0">
                                <p className="text-[11px] font-black leading-tight">{item.label}</p>
                                {item.description && (
                                    <p className="text-[9px] opacity-60 font-medium leading-tight mt-0.5">{item.description}</p>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </>,
        getPortalContainer(portalId),
    );
});

export default DropdownMenu;
