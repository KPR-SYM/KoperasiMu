import { memo, useCallback } from "react";

const VARIANT_STYLES = {
    pill: {
        container: "flex gap-1 p-1 rounded-2xl bg-[var(--color-surface-alt)] border border-[var(--color-border)]",
        active: "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm",
        inactive: "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
    },
    segmented: {
        container: "flex items-center rounded-xl bg-[var(--color-surface-alt)] p-0.5 border border-[var(--color-border)]",
        active: "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm",
        inactive: "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
    },
    filled: {
        container: "flex items-center gap-1 p-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-sm",
        active: "bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20",
        inactive: "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]",
    },
    underline: {
        container: "flex bg-[var(--color-surface-alt)] p-1 rounded-xl border border-[var(--color-border)]",
        active: "text-[var(--color-primary)]",
        inactive: "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
    },
};

const Tabs = memo(function Tabs({
    value,
    onChange,
    items = [],
    variant = "pill",
    size = "sm",
    fullWidth = false,
    className = "",
}) {
    const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.pill;

    const sizeClasses = {
        sm: "h-9 px-6 text-[11px]",
        md: "h-10 px-6 text-[10px]",
    };

    const handleKeyDown = useCallback((e, idx) => {
        let targetIdx = null
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault()
            targetIdx = (idx + 1) % items.length
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault()
            targetIdx = (idx - 1 + items.length) % items.length
        } else if (e.key === 'Home') {
            e.preventDefault()
            targetIdx = 0
        } else if (e.key === 'End') {
            e.preventDefault()
            targetIdx = items.length - 1
        }
        if (targetIdx !== null) {
            onChange(items[targetIdx].key)
            e.currentTarget.parentElement?.querySelectorAll('[role="tab"]')[targetIdx]?.focus()
        }
    }, [items, onChange])

    return (
        <div
            role="tablist"
            className={`${styles.container} ${fullWidth ? "w-full" : "w-fit"} overflow-x-auto scrollbar-hide shrink-0 ${className}`}
        >
            {items.map((item, idx) => {
                const isActive = value === item.key;
                const Icon = item.icon;

                return (
                    <button
                        key={item.key}
                        role="tab"
                        aria-selected={isActive}
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => onChange(item.key)}
                        onKeyDown={(e) => handleKeyDown(e, idx)}
                        className={`
                            ${fullWidth ? "flex-1" : "flex-none"}
                            ${sizeClasses[size] || sizeClasses.sm}
                            rounded-xl font-black flex items-center justify-center gap-2 transition-all whitespace-nowrap
                            ${isActive ? styles.active : styles.inactive}
                            ${variant === "underline" ? "flex-1 min-w-[80px] h-12 flex-col relative" : ""}
                        `}
                    >
                        {variant === "underline" && Icon && (
                            <Icon className="text-sm mb-1" />
                        )}
                        {variant !== "underline" && Icon && (
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{item.label}</span>
                        {item.count != null && (
                            <span className={`text-[7px] px-1 rounded-sm font-black ${isActive ? (variant === "filled" ? "bg-white/20 text-white" : "bg-[var(--color-primary)]/10 text-[var(--color-primary)]") : "bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]"}`}>
                                {item.count}
                            </span>
                        )}
                        {variant === "underline" && isActive && (
                            <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--color-primary)] rounded-full" />
                        )}
                    </button>
                );
            })}
        </div>
    );
});

export default Tabs;
