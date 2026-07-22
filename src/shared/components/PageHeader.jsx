export default function PageHeader({
    title,
    subtitle,
    actions = null,
    className = ''
}) {
    return (
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 ${className}`}>
            <div>
                <h1 className="text-xl font-black font-heading tracking-tight text-[var(--color-text)] leading-tight">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-[var(--color-text-muted)] text-[10px] mt-1 font-medium">
                        {subtitle}
                    </p>
                )}
            </div>

            {actions && (
                <div className="flex flex-wrap items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    )
}
