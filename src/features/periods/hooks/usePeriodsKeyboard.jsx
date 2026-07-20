import { useEffect } from "react";

export function usePeriodsKeyboard({
    setIsPrivacyMode,
    handleUndo,
    handleRedo,
    undoStack,
    redoStack,
    canEdit,
    handleAdd,
    searchInputRef,
    setViewMode,
    selectedIds,
    setIsBulkDeleteOpen,
}) {
    useEffect(() => {
        const handler = (e) => {
            const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable
            if ((e.ctrlKey || e.metaKey) && e.key === "p") {
                e.preventDefault();
                setIsPrivacyMode(prev => !prev);
                return
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
                e.preventDefault();
                if (undoStack.length > 0) handleUndo();
                return
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
                e.preventDefault();
                if (redoStack.length > 0) handleRedo();
                return
            }

            if (isInput) return

            if (e.key === "n" || e.key === "N") {
                e.preventDefault()
                if (canEdit) handleAdd()
                return
            }
            if (e.key === "f" || e.key === "F") {
                e.preventDefault()
                searchInputRef.current?.focus()
                return
            }
            if (e.key === "v" || e.key === "V") {
                e.preventDefault()
                setViewMode(prev => prev === "table" ? "timeline" : prev === "timeline" ? "calendar" : "table")
                return
            }
            if (e.key === "Delete" || e.key === "Backspace") {
                if (selectedIds.length > 0) {
                    e.preventDefault()
                    setIsBulkDeleteOpen(true)
                }
                return
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [setIsPrivacyMode, handleUndo, handleRedo, undoStack, redoStack, canEdit, handleAdd, searchInputRef, setViewMode, selectedIds, setIsBulkDeleteOpen]);
}
