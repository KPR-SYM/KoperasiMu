import { useState, useRef, forwardRef, useImperativeHandle, memo } from "react";
import { UploadSimple, Spinner } from "@phosphor-icons/react";

const VARIANT_STYLES = {
    compact: {
        container: "w-full h-14 rounded-xl border-2 border-dashed cursor-pointer flex items-center justify-center gap-3 transition-all",
        idle: "border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 hover:border-[var(--color-primary)]/60 hover:bg-[var(--color-primary)]/10",
        drag: "border-[var(--color-primary)] bg-[var(--color-primary)]/10 scale-[1.01]",
        iconSize: "w-4 h-4",
        iconIdle: "text-[var(--color-primary)]/60",
        iconDrag: "text-[var(--color-primary)] scale-110",
        text: "text-[11px] font-black text-[var(--color-primary)] uppercase tracking-wider leading-none",
        subtext: "text-[10px] text-[var(--color-text-muted)] font-bold mt-1 opacity-60",
    },
    card: {
        container: "w-full h-44 rounded-2xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-4 transition-all",
        idle: "border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 hover:border-[var(--color-primary)]/60 hover:bg-[var(--color-primary)]/5",
        drag: "border-[var(--color-primary)] bg-[var(--color-primary)]/10 scale-[1.01]",
        iconSize: "w-5 h-5",
        iconIdle: "text-[var(--color-primary)]",
        iconDrag: "text-[var(--color-primary)] scale-110",
        text: "text-[13px] font-black text-[var(--color-text)]",
        subtext: "text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider",
    },
};

const Dropzone = memo(forwardRef(function Dropzone({
    onFileSelect,
    accept = ".csv,.xlsx",
    variant = "compact",
    loading = false,
    loadingText = "Membaca file...",
    dragText = "Lepaskan file di sini",
    idleText = "Drag & Drop atau Klik untuk Pilih File",
    subtext = "Mendukung .csv dan .xlsx",
    icon: CustomIcon,
    disabled = false,
    dragOver: externalDragOver,
    setDragOver: externalSetDragOver,
    className = "",
    children,
}, ref) {
    const [internalDragOver, setInternalDragOver] = useState(false);
    const inputRef = useRef(null);

    const dragOver = externalDragOver !== undefined ? externalDragOver : internalDragOver;
    const setDragOver = externalSetDragOver || setInternalDragOver;

    useImperativeHandle(ref, () => ({
        click: () => inputRef.current?.click(),
        input: inputRef.current,
    }));

    const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.compact;
    const Icon = CustomIcon || UploadSimple;

    const handleDragOver = (e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
    };

    const handleDragLeave = () => setDragOver(false);

    const handleDrop = async (e) => {
        e.preventDefault();
        setDragOver(false);
        if (disabled) return;
        const file = e.dataTransfer.files?.[0];
        if (file) onFileSelect?.(file);
    };

    const handleClick = () => {
        if (!disabled) inputRef.current?.click();
    };

    const handleChange = (e) => {
        const file = e.target.files?.[0];
        if (file) onFileSelect?.(file);
        e.target.value = "";
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            className={`${styles.container} ${dragOver ? styles.drag : styles.idle} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
        >
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={handleChange}
                disabled={disabled}
            />
            {loading ? (
                <div className="flex items-center gap-2">
                    <Spinner className={`${styles.iconSize} text-[var(--color-primary)] animate-spin`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">{loadingText}</span>
                </div>
            ) : children || (
                <>
                    <Icon className={`${styles.iconSize} transition-all ${dragOver ? styles.iconDrag : styles.iconIdle}`} />
                    <div className={variant === "compact" ? "text-left" : "text-center"}>
                        <p className={styles.text}>
                            {dragOver ? dragText : idleText}
                        </p>
                        {subtext && <p className={styles.subtext}>{subtext}</p>}
                    </div>
                </>
            )}
        </div>
    );
}));

export default Dropzone;
