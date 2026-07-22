import { memo } from "react";

const COLOR_MAP = {
    emerald: {
        soft: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        solid: "bg-emerald-500 text-white border-emerald-500",
        outline: "bg-transparent text-emerald-600 border-emerald-500/40",
        dot: "bg-emerald-500",
    },
    rose: {
        soft: "bg-rose-500/10 text-rose-600 border-rose-500/20",
        solid: "bg-rose-500 text-white border-rose-500",
        outline: "bg-transparent text-rose-600 border-rose-500/40",
        dot: "bg-rose-500",
    },
    amber: {
        soft: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        solid: "bg-amber-500 text-white border-amber-500",
        outline: "bg-transparent text-amber-600 border-amber-500/40",
        dot: "bg-amber-500",
    },
    indigo: {
        soft: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
        solid: "bg-indigo-500 text-white border-indigo-500",
        outline: "bg-transparent text-indigo-600 border-indigo-500/40",
        dot: "bg-indigo-500",
    },
    purple: {
        soft: "bg-purple-500/10 text-purple-600 border-purple-500/20",
        solid: "bg-purple-500 text-white border-purple-500",
        outline: "bg-transparent text-purple-600 border-purple-500/40",
        dot: "bg-purple-500",
    },
    sky: {
        soft: "bg-sky-500/10 text-sky-600 border-sky-500/20",
        solid: "bg-sky-500 text-white border-sky-500",
        outline: "bg-transparent text-sky-600 border-sky-500/40",
        dot: "bg-sky-500",
    },
    blue: {
        soft: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        solid: "bg-blue-500 text-white border-blue-500",
        outline: "bg-transparent text-blue-600 border-blue-500/40",
        dot: "bg-blue-500",
    },
    orange: {
        soft: "bg-orange-500/10 text-orange-600 border-orange-500/20",
        solid: "bg-orange-500 text-white border-orange-500",
        outline: "bg-transparent text-orange-600 border-orange-500/40",
        dot: "bg-orange-500",
    },
    teal: {
        soft: "bg-teal-500/10 text-teal-600 border-teal-500/20",
        solid: "bg-teal-500 text-white border-teal-500",
        outline: "bg-transparent text-teal-600 border-teal-500/40",
        dot: "bg-teal-500",
    },
    slate: {
        soft: "bg-slate-500/10 text-slate-600 border-slate-500/20",
        solid: "bg-slate-500 text-white border-slate-500",
        outline: "bg-transparent text-slate-600 border-slate-500/40",
        dot: "bg-slate-400",
    },
    red: {
        soft: "bg-red-500/10 text-red-600 border-red-500/20",
        solid: "bg-red-500 text-white border-red-500",
        outline: "bg-transparent text-red-600 border-red-500/40",
        dot: "bg-red-500",
    },
    primary: {
        soft: "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20",
        solid: "bg-[var(--color-primary)] text-white border-[var(--color-primary)]",
        outline: "bg-transparent text-[var(--color-primary)] border-[var(--color-primary)]/40",
        dot: "bg-[var(--color-primary)]",
    },
};

const SIZE_MAP = {
    xs: "text-[8px] px-1.5 py-0.5",
    sm: "text-[9px] px-2 py-0.5",
    md: "text-[10px] px-2.5 py-0.5",
    lg: "text-xs px-3 py-1",
};

const SHAPE_MAP = {
    pill: "rounded-full",
    rect: "rounded-lg",
    square: "rounded",
};

const PRESET_MAP = {
    success: { color: "emerald", variant: "soft" },
    error: { color: "red", variant: "soft" },
    warning: { color: "amber", variant: "soft" },
    info: { color: "sky", variant: "soft" },
    active: { color: "emerald", variant: "soft", dot: true },
    locked: { color: "rose", variant: "soft" },
    inactive: { color: "slate", variant: "soft" },
    primary: { color: "primary", variant: "soft" },
}

const Badge = memo(function Badge({
    children,
    color = "slate",
    variant = "soft",
    size = "sm",
    shape = "pill",
    dot = false,
    icon: Icon,
    pulse = false,
    preset,
    className = "",
    ...props
}) {
    const presetConfig = preset ? (PRESET_MAP[preset] || {}) : {}
    const finalColor = presetConfig.color || color
    const finalVariant = presetConfig.variant || variant
    const finalDot = presetConfig.dot !== undefined ? presetConfig.dot : dot

    const colors = COLOR_MAP[finalColor] || COLOR_MAP.slate;
    const sizeClass = SIZE_MAP[size] || SIZE_MAP.sm;
    const shapeClass = SHAPE_MAP[shape] || SHAPE_MAP.pill;

    return (
        <span
            className={`inline-flex items-center gap-1.5 font-black border ${colors[finalVariant]} ${sizeClass} ${shapeClass} ${pulse ? "animate-pulse" : ""} ${className}`}
            {...props}
        >
            {finalDot && (
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />
            )}
            {Icon && <Icon className="shrink-0 text-[0.65em]" />}
            {children}
        </span>
    );
});

const ROLE_META = {
    developer: { label: "Developer", color: "rose" },
    admin: { label: "Admin", color: "purple" },
    pimpinan: { label: "Pimpinan", color: "amber" },
    teacher: { label: "Teacher", color: "indigo" },
    staff: { label: "Staff", color: "emerald" },
};

function RoleBadge({ role, className = "" }) {
    const meta = ROLE_META[role] || { label: role, color: "slate" };
    return (
        <Badge color={meta.color} size="md" shape="rect" className={className}>
            {meta.label}
        </Badge>
    );
}

function NotifBadge({ count, className = "" }) {
    if (!count || count <= 0) return null;
    return (
        <span className={`absolute -top-0.5 -end-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center border border-[var(--color-surface)] pointer-events-none ${className}`}>
            {count > 9 ? "9+" : count}
        </span>
    );
}

export { Badge, RoleBadge, NotifBadge, COLOR_MAP };
export default Badge;
