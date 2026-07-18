import { memo } from "react";

const InlineCell = memo(function InlineCell({
    id,
    field,
    value,
    displayValue,
    type = "text",
    options,
    className = "",
    canEdit = true,
    inlineEditCell,
    setInlineEditCell,
    handleInlineSave,
}) {
    const isEditing = inlineEditCell?.id === id && inlineEditCell?.field === field;

    if (!canEdit) {
        return <span className={className}>{displayValue ?? value ?? "-"}</span>;
    }

    if (isEditing) {
        if (type === "select" && options) {
            return (
                <div className="relative inline-flex">
                    <select
                        autoFocus
                        defaultValue={value || ""}
                        className="bg-[var(--color-surface)] border-2 border-[var(--color-primary)] rounded-lg px-2 py-1 text-[11px] font-bold outline-none min-w-[80px]"
                        onChange={(e) => {
                            const newVal = e.target.value;
                            if (newVal && newVal !== value) {
                                handleInlineSave(id, field, newVal);
                            } else {
                                setInlineEditCell(null);
                            }
                        }}
                        onBlur={(e) => {
                            if (e.target.value && e.target.value !== value) {
                                handleInlineSave(id, field, e.target.value);
                            } else {
                                setInlineEditCell(null);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") setInlineEditCell(null);
                        }}
                    >
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            );
        }
        if (type === "date") {
            return (
                <input
                    autoFocus
                    type="date"
                    defaultValue={value || ""}
                    className="bg-[var(--color-surface)] border-2 border-[var(--color-primary)] rounded-lg px-2 py-1 text-[11px] font-bold outline-none min-w-[130px]"
                    onBlur={(e) => {
                        if (e.target.value && e.target.value !== value) {
                            handleInlineSave(id, field, e.target.value);
                        } else {
                            setInlineEditCell(null);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            if (e.target.value && e.target.value !== value) {
                                handleInlineSave(id, field, e.target.value);
                            } else {
                                setInlineEditCell(null);
                            }
                        }
                        if (e.key === "Escape") setInlineEditCell(null);
                    }}
                />
            );
        }
        return (
            <input
                autoFocus
                type="text"
                defaultValue={value || ""}
                className="bg-[var(--color-surface)] border-2 border-[var(--color-primary)] rounded-lg px-2 py-1 text-[11px] font-bold outline-none min-w-[80px]"
                onBlur={(e) => {
                    const trimmed = e.target.value.trim();
                    if (trimmed && trimmed !== value) {
                        handleInlineSave(id, field, trimmed);
                    } else {
                        setInlineEditCell(null);
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        const trimmed = e.target.value.trim();
                        if (trimmed && trimmed !== value) {
                            handleInlineSave(id, field, trimmed);
                        } else {
                            setInlineEditCell(null);
                        }
                    }
                    if (e.key === "Escape") setInlineEditCell(null);
                }}
            />
        );
    }

    return (
        <span
            className={`cursor-pointer hover:bg-[var(--color-primary)]/10 rounded px-1 -mx-1 transition-all ${className}`}
            onClick={() => setInlineEditCell({ id, field, value })}
            title="Klik untuk edit"
        >
            {displayValue ?? value ?? "-"}
        </span>
    );
});

export default InlineCell;
