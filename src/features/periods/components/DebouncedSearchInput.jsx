import { memo, useState, useEffect } from "react";
import { MagnifyingGlass, Spinner } from "@phosphor-icons/react";

const DebouncedSearchInput = memo(
    ({ searchQuery, onSearch, inputRef, isLoading }) => {
        const [value, setValue] = useState(searchQuery);
        const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);

        if (searchQuery !== prevSearchQuery) {
            setPrevSearchQuery(searchQuery);
            if (searchQuery === "") {
                setValue("");
            }
        }

        // Debounce: propagate ke parent setelah 350ms berhenti mengetik
        useEffect(() => {
            const t = setTimeout(() => onSearch(value), 350);
            return () => clearTimeout(t);
        }, [value, onSearch]);

        return (
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)] w-4 h-4 group-focus-within:text-[var(--color-primary)] transition-colors">
                    {isLoading ? (
                        <Spinner className="animate-spin w-3 h-3 text-[var(--color-primary)]" />
                    ) : (
                        <MagnifyingGlass />
                    )}
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Cari nama tahun pelajaran (contoh: 2024/2025)... (Ctrl+K)"
                    className="input-field w-full h-9 text-xs sm:text-sm bg-[var(--color-surface-alt)]/50 border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all rounded-xl font-bold placeholder:font-normal placeholder:opacity-40"
                />
            </div>
        );
    },
);
DebouncedSearchInput.displayName = "DebouncedSearchInput";

export default DebouncedSearchInput;
