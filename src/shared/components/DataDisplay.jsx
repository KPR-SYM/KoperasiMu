import React from 'react'
import { useCountUp } from '@hooks/useCountUp'
import { useLanguage } from '@context'

const renderIcon = (icon, className = '') => {
    if (!icon) return null;
    const IconComp = icon;
    return <IconComp className={className} />;
};

export function StatCard({
    icon,
    label,
    value,
    suffix,
    trend,
    trendUp,
    loading = false,
    borderColor,
    iconBg,
    color = 'primary',
    isActive = false,
    progressValue,
    progressMax = 100,
    className = '',
    valueClassName = '',
    onClick,
    title,
    variant = 'gradient', // 'gradient' | 'flat'
}) {
    const { tNum } = useLanguage()

    // ── Color palette ──────────────────────────────────────────────
    const colorMap = {
        primary: {
            gradient: 'from-[var(--color-primary)] to-[var(--color-primary)]/70',
            shadow: 'shadow-[var(--color-primary)]/30',
            ring: 'ring-[var(--color-primary)]',
            flat_border: 'border-t-[var(--color-primary)]',
            flat_dot: 'bg-[var(--color-primary)]',
            flat_iconBg: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
        },
        indigo: {
            gradient: 'from-indigo-600 to-indigo-500/70',
            shadow: 'shadow-indigo-500/30',
            ring: 'ring-indigo-500',
            flat_border: 'border-t-indigo-500',
            flat_dot: 'bg-indigo-500',
            flat_iconBg: 'bg-indigo-500/10 text-indigo-500',
        },
        emerald: {
            gradient: 'from-emerald-600 to-emerald-500/70',
            shadow: 'shadow-emerald-500/30',
            ring: 'ring-emerald-500',
            flat_border: 'border-t-emerald-500',
            flat_dot: 'bg-emerald-500',
            flat_iconBg: 'bg-emerald-500/10 text-emerald-500',
        },
        amber: {
            gradient: 'from-amber-500 to-amber-400/70',
            shadow: 'shadow-amber-500/30',
            ring: 'ring-amber-500',
            flat_border: 'border-t-amber-500',
            flat_dot: 'bg-amber-500',
            flat_iconBg: 'bg-amber-500/10 text-amber-500',
        },
        rose: {
            gradient: 'from-rose-600 to-rose-500/70',
            shadow: 'shadow-rose-500/30',
            ring: 'ring-rose-500',
            flat_border: 'border-t-rose-500',
            flat_dot: 'bg-rose-500',
            flat_iconBg: 'bg-rose-500/10 text-rose-500',
        },
        sky: {
            gradient: 'from-sky-600 to-sky-500/70',
            shadow: 'shadow-sky-500/30',
            ring: 'ring-sky-500',
            flat_border: 'border-t-sky-500',
            flat_dot: 'bg-sky-500',
            flat_iconBg: 'bg-sky-500/10 text-sky-500',
        },
    }

    const resolved = colorMap[color] || colorMap.primary

    const progressPct = progressValue != null
        ? Math.min(100, Math.max(0, (progressValue / (progressMax || 100)) * 100))
        : null

    const animatedValue = useCountUp(value, 1500, loading)
    const displayValue = typeof value === 'number' || !isNaN(parseFloat(value)) ? animatedValue : value
    const TrendArrow = trendUp === true ? '↑' : trendUp === false ? '↓' : null

    // ── GRADIENT VARIANT (new, matches reference image) ────────────
    if (variant === 'gradient') {
        return (
            <div
                onClick={onClick}
                title={title}
                className={`shrink-0 snap-center w-[200px] xs:w-[220px] sm:w-auto relative overflow-hidden rounded-2xl bg-gradient-to-br ${resolved.gradient} p-3.5 flex items-center gap-3 shadow-lg ${resolved.shadow} transition-all duration-300 ${isActive ? `ring-2 ring-white/50 ring-offset-1 ring-offset-transparent` : ''} ${onClick ? 'cursor-pointer active:scale-[0.97] hover:brightness-110' : ''} ${className}`}
            >
                {/* Watermark icon — large, decorative, bottom-right */}
                {icon && (
                    <div className="absolute -right-3 -bottom-3 opacity-[0.12] pointer-events-none select-none">
                        {renderIcon(icon, 'w-20 h-20 text-white')}
                    </div>
                )}

                {/* Icon box */}
                <div className="shrink-0 w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/25 shadow-inner">
                    {loading
                        ? <span className="w-4 h-4 rounded bg-white/30 animate-pulse" />
                        : renderIcon(icon, 'w-4 h-4 text-white')
                    }
                </div>

                {/* Text block */}
                <div className="relative z-10 min-w-0 flex-1">
                    {loading ? (
                        <>
                            <span className="block w-20 h-4 rounded bg-white/25 animate-pulse mb-1.5" />
                            <span className="block w-14 h-3 rounded bg-white/15 animate-pulse" />
                        </>
                    ) : (
                        <>
                            <h3 className={`font-black font-heading leading-none tabular-nums tracking-tighter text-white text-lg sm:text-xl ${valueClassName}`}>
                                {tNum(displayValue)}{suffix && <span className="text-sm font-bold ml-0.5 opacity-80">{tNum(suffix)}</span>}
                            </h3>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/70 mt-1 truncate">{label}</p>

                            {/* Trend badge */}
                            {trend && (
                                <span className={`inline-flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none mt-1.5
                                    ${trendUp === true ? 'bg-white/20 text-white' :
                                        trendUp === false ? 'bg-black/20 text-white/80' :
                                            'bg-white/10 text-white/60'}`}
                                >
                                    {TrendArrow && <span>{TrendArrow}</span>}
                                    {tNum(trend)}
                                </span>
                            )}
                        </>
                    )}
                </div>

                {/* Progress bar */}
                {progressPct != null && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/15">
                        <div
                            className="h-full bg-white/60 transition-all duration-1000 ease-out rounded-full"
                            style={{ width: loading ? '0%' : `${progressPct}%` }}
                        />
                    </div>
                )}
            </div>
        )
    }

    // ── FLAT VARIANT (original look, kept for backward-compat) ─────
    const finalBorderTop = borderColor
        ? (colorMap[borderColor]?.flat_border ?? (borderColor.startsWith('border-t-') ? borderColor : `border-t-${borderColor}`))
        : resolved.flat_border
    const finalBg = iconBg || resolved.flat_iconBg

    return (
        <div
            onClick={onClick}
            title={title}
            className={`shrink-0 snap-center w-[160px] xs:w-[180px] sm:w-auto glass group relative overflow-hidden rounded-2xl border-t ${finalBorderTop} border border-[var(--color-border)] p-2.5 flex flex-col justify-center gap-1 hover:border-[var(--color-primary)]/30 hover:shadow-lg hover:shadow-[var(--color-primary)]/5 transition-all duration-300 min-h-[48px] ${onClick ? 'cursor-pointer active:scale-95' : ''} ${isActive ? `ring-2 ring-offset-1 ${resolved.ring}` : ''} ${className}`}
        >
            <div className="absolute top-2.5 right-2.5 rtl:right-auto rtl:left-2.5">
                <div className={`w-1.5 h-1.5 rounded-full ${resolved.flat_dot} opacity-50 animate-pulse`} />
            </div>

            {loading
                ? <span className="inline-block w-16 h-2 rounded bg-[var(--color-border)] animate-pulse" />
                : <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] opacity-70 truncate pr-4">{label}</p>
            }

            <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${finalBg} transform group-hover:scale-110 transition-all duration-500`}>
                    {renderIcon(icon, 'w-3 h-3')}
                </div>

                {loading
                    ? <span className="inline-block w-10 h-4 rounded bg-[var(--color-border)] animate-pulse" />
                    : (
                        <h3 className={`font-black font-heading leading-none tabular-nums tracking-tighter text-lg sm:text-xl text-[var(--color-text)] ${valueClassName}`}>
                            {tNum(displayValue)}{suffix && tNum(suffix)}
                        </h3>
                    )
                }

                {!loading && trend && (
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none ${trendUp === true ? 'text-emerald-500 bg-emerald-500/10' :
                        trendUp === false ? 'text-rose-500 bg-rose-500/10' :
                            'text-[var(--color-text-muted)] bg-[var(--color-surface-alt)]'
                        }`}>
                        {TrendArrow && <span>{TrendArrow}</span>}
                        {tNum(trend)}
                    </span>
                )}
            </div>

            {progressPct != null && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--color-border)]/60">
                    <div
                        className={`h-full ${resolved.flat_dot} opacity-70 transition-all duration-1000 ease-out rounded-full`}
                        style={{ width: loading ? '0%' : `${progressPct}%` }}
                    />
                </div>
            )}
        </div>
    )
}

export function StatsInline({ items, label, separator = true, className = '' }) {
    return (
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-white/[0.05] border border-[var(--color-border)] ${className}`}>
            {label && (
                <>
                    <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">{label}</span>
                    {separator && <span className="w-1 h-1 rounded-full bg-[var(--color-border)] shrink-0" />}
                </>
            )}
            {items.map((item, i) => (
                <React.Fragment key={item.label || i}>
                    {i > 0 && separator && <span className="w-1 h-1 rounded-full bg-[var(--color-border)] shrink-0" />}
                    <span className="text-xs font-bold whitespace-nowrap">
                        <span className={item.color || 'text-[var(--color-text)]'}>{item.value}</span>
                        <span className="text-[var(--color-text-muted)] ml-1 text-[10px]">{item.label}</span>
                    </span>
                </React.Fragment>
            ))}
        </div>
    );
}

export function DataTable({ columns, data, onRowClick, loading, emptyMessage = 'Tidak ada data' }) {
    if (loading) {
        return (
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            {columns.map((col, i) => (
                                <th key={i}>{col.header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i}>
                                {columns.map((_, j) => (
                                    <td key={j}>
                                        <div className="skeleton h-4 w-full" />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }

    if (!data || data.length === 0) {
        return (
            <div className="glass text-center py-16 rounded-2xl">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)]">
                    <span className="text-2xl">👀</span>
                </div>
                <p className="text-[var(--color-text-muted)] font-medium text-sm">{emptyMessage}</p>
            </div>
        )
    }

    return (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        {columns.map((col, i) => (
                            <th key={i}>{col.header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIdx) => (
                        <tr
                            key={row.id || rowIdx}
                            onClick={() => onRowClick?.(row)}
                            className={onRowClick ? 'cursor-pointer' : ''}
                        >
                            {columns.map((col, colIdx) => (
                                <td key={colIdx}>
                                    {col.render ? col.render(row) : row[col.accessor]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export function EmptyState({ icon, title, description, action, variant = 'glass', color = 'primary' }) {
    const isPlain = variant === 'plain'
    const isDashed = variant === 'dashed'
    const isMinimal = isPlain || isDashed

    // Exact colors matching Dashboard widgets
    const colorMap = {
        primary: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20 shadow-[var(--color-primary)]/10',
        indigo: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 shadow-indigo-500/10',
        emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/10',
        amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-amber-500/10',
        slate: 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] border-[var(--color-border)] shadow-black/5',
    }[color] || 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] border-[var(--color-border)] shadow-black/5'
    // Dynamic text colors for the glass variant
    const glassColor = {
        primary: 'text-[var(--color-primary)]',
        indigo: 'text-indigo-500',
        emerald: 'text-emerald-500',
        amber: 'text-amber-500',
        slate: 'text-[var(--color-text-muted)]',
    }[color] || 'text-[var(--color-primary)]'

    const containerClasses = isPlain
        ? 'flex-1 flex flex-col items-center justify-center py-12 text-center opacity-70 hover:opacity-100 transition-opacity'
        : isDashed
            ? 'flex-1 flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-[var(--color-border)] rounded-[2rem] bg-[var(--color-surface-alt)]/20 transition-all hover:bg-[var(--color-surface-alt)]/40'
            : 'glass rounded-[1.5rem] py-12 text-center px-5 relative overflow-hidden transition-all duration-500 animate-in fade-in zoom-in-95'

    return (
        <div className={containerClasses}>
            {/* Ambient Background Glow for Empty State */}
            {variant === 'glass' && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[var(--color-primary)]/5 rounded-full blur-[80px] pointer-events-none" />
            )}

            <div className={`relative z-10 flex flex-col items-center`}>
                {icon && (
                    <div className={`${isMinimal ? `w-14 h-14 rounded-xl border flex items-center justify-center text-2xl mb-3 shadow-lg mx-auto transform rotate-3 ${colorMap}` : `w-16 h-16 mb-4 rounded-2xl mx-auto flex items-center justify-center bg-gradient-to-br from-[var(--color-surface-alt)] to-[var(--color-surface)] border border-[var(--color-border)] ${glassColor} shadow-sm group-hover:scale-110 transition-transform duration-500`}`}>
                        {renderIcon(icon, isMinimal ? 'w-5 h-5' : 'w-6 h-6')}
                    </div>
                )}
                <h3 className={`${isMinimal ? 'text-[14px] font-black mb-1' : 'text-base font-black font-heading uppercase tracking-widest mb-1'} text-[var(--color-text)]`}>
                    {title}
                </h3>
                <p className={`${isMinimal ? 'text-[10px] max-w-xs px-4 opacity-60 font-medium' : 'text-[9px] max-w-[220px] mx-auto opacity-60 font-bold mb-6'} text-[var(--color-text-muted)] leading-relaxed`}>
                    {description}
                </p>
                {action && <div className={`${isMinimal ? 'mt-3' : 'mt-4'}`}>{action}</div>}
            </div>
        </div>
    )
}
