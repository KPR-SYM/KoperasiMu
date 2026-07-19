import { memo, useState, useEffect } from "react";
import { MagnifyingGlass, Spinner } from "@phosphor-icons/react";

const DebouncedSearchInput = memo(function DebouncedSearchInput({
    searchQuery,
    onSearch,
    inputRef,
    isLoading = false,
    placeholder = "Cari... (Ctrl+K)",
    debounceMs = 350,
    className = "",
}) {
    const [value, setValue] = useState(searchQuery);

    useEffect(() => {
        if (searchQuery === "" && value !== "") setValue("");
    }, [searchQuery]);

    useEffect(() => {
        const t = setTimeout(() => onSearch(value), debounceMs);
        return () => clearTimeout(t);
    }, [value, debounceMs]);

    return (
        <div className={`relative group ${className}`}>
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors">
                {isLoading ? (
                    <Spinner className="animate-spin w-3.5 h-3.5 text-[var(--color-primary)]" />
                ) : (
                    <MagnifyingGlass className="w-3.5 h-3.5" />
                )}
            </div>
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className="input-field pl-10 w-full h-9 text-xs sm:text-sm bg-[var(--color-surface-alt)]/50 border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all rounded-xl font-bold placeholder:font-normal placeholder:opacity-40"
            />
        </div>
    );
});

export default DebouncedSearchInput;
