import { memo, useState } from "react";
import { Warning, Info, CheckCircle, X, XCircle } from "@phosphor-icons/react";

const ALERT_CONFIG = {
    error: {
        bg: "bg-red-500/10",
        border: "border-red-500/20",
        text: "text-red-600",
        iconColor: "text-red-500",
        iconBg: "bg-red-500/20",
        Icon: XCircle,
    },
    warning: {
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        text: "text-amber-600",
        iconColor: "text-amber-500",
        iconBg: "bg-amber-500/20",
        Icon: Warning,
    },
    info: {
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20",
        text: "text-indigo-600",
        iconColor: "text-indigo-500",
        iconBg: "bg-indigo-500/20",
        Icon: Info,
    },
    success: {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        text: "text-emerald-600",
        iconColor: "text-emerald-500",
        iconBg: "bg-emerald-500/20",
        Icon: CheckCircle,
    },
    rose: {
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
        text: "text-rose-600",
        iconColor: "text-rose-500",
        iconBg: "bg-rose-500/20",
        Icon: Warning,
    },
};

const SIZE_MAP = {
    sm: "px-3 py-2",
    md: "px-4 py-2.5",
    lg: "px-4 py-3",
};

const Alert = memo(function Alert({
    variant = "warning",
    icon: CustomIcon,
    iconBg: customIconBg,
    title,
    children,
    action,
    dismissible = false,
    onClose,
    animate = true,
    size = "md",
    className = "",
}) {
    const [dismissed, setDismissed] = useState(false);
    if (dismissed) return null;

    const config = ALERT_CONFIG[variant] || ALERT_CONFIG.warning;
    const IconComponent = CustomIcon || config.Icon;
    const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

    const handleClose = () => {
        setDismissed(true);
        onClose?.();
    };

    return (
        <div
            className={`flex items-center gap-2 rounded-xl border ${config.bg} ${config.border} ${sizeClass} ${animate ? "animate-in fade-in slide-in-from-top-2" : ""} ${className}`}
        >
            {customIconBg ? (
                <div className={`w-7 h-7 rounded-lg ${customIconBg} flex items-center justify-center shrink-0`}>
                    <IconComponent className={`w-3.5 h-3.5 ${config.iconColor}`} />
                </div>
            ) : (
                <IconComponent className={`w-4 h-4 ${config.iconColor} shrink-0`} />
            )}

            <div className="flex-1 min-w-0">
                {title ? (
                    <p className={`text-[11px] font-black ${config.text}`}>{title}</p>
                ) : (
                    <div className={`text-[11px] font-bold ${config.text}`}>{children}</div>
                )}
                {title && children && (
                    <div className={`text-[10px] font-medium ${config.text} opacity-80 mt-0.5`}>{children}</div>
                )}
            </div>

            {action && <div className="shrink-0">{action}</div>}

            {dismissible && (
                <button
                    onClick={handleClose}
                    className={`shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors ${config.iconColor}`}
                >
                    <X className="w-3 h-3" />
                </button>
            )}
        </div>
    );
});

export default Alert;
