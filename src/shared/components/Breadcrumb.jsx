import { CaretRight } from "@phosphor-icons/react";

export default function Breadcrumb({ items = [], className = '' }) {
    return (
        <div className={`flex items-center gap-1.5 ${className}`}>
            {items.map((item, i) => (
                <span key={item.label} className="flex items-center gap-1.5">
                    {item.onClick ? (
                        <button
                            onClick={item.onClick}
                            className="text-[10px] font-bold text-[var(--color-text-muted)] opacity-60 hover:text-[var(--color-primary)] hover:opacity-100 transition-all"
                        >
                            {item.label}
                        </button>
                    ) : (
                        <span className="text-[10px] font-bold text-[var(--color-text)]">
                            {item.label}
                        </span>
                    )}
                    {i < items.length - 1 && (
                        <CaretRight className="w-2.5 h-2.5 text-[var(--color-text-muted)] opacity-30" />
                    )}
                </span>
            ))}
        </div>
    );
}
