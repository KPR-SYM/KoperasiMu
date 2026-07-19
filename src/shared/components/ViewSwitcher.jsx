import { memo } from "react";

const ACTIVE_STYLES = {
    primary: "bg-[var(--color-primary)] text-white shadow-md",
    surface: "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm border border-[var(--color-border)]",
};

const ViewSwitcher = memo(function ViewSwitcher({
    value,
    onChange,
    views = [],
    activeStyle = "primary",
    className = "",
}) {
    const activeCls = ACTIVE_STYLES[activeStyle] || ACTIVE_STYLES.primary;

    return (
        <div className={`flex items-center rounded-xl bg-[var(--color-surface-alt)] p-0.5 border border-[var(--color-border)] shrink-0 select-none ${className}`}>
            {views.map((view) => {
                const isActive = value === view.key;
                const Icon = view.icon;
                return (
                    <button
                        key={view.key}
                        onClick={() => onChange(view.key)}
                        title={view.label}
                        className={`h-7 px-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${isActive ? activeCls : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"}`}
                    >
                        {Icon && <Icon className="w-3 h-3" />}
                        {view.label && <span className="hidden sm:inline">{view.label}</span>}
                    </button>
                );
            })}
        </div>
    );
});

export default ViewSwitcher;
