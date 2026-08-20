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
    resetAllFilters,
    setIsShortcutOpen,
    handleEdit,
    onQuickDuplicate,
    toggleSelectAll,
    handleToggleLock,
    handleOpenHistory,
    handleOpenImport,
    handleOpenExport,
    handleGenerate,
    isMutating,
    years,
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
            if ((e.ctrlKey || e.metaKey) && (e.key === "i" || e.key === "I")) {
                e.preventDefault();
                if (canEdit) handleOpenImport?.();
                return
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === "e" || e.key === "E")) {
                e.preventDefault();
                handleOpenExport?.();
                return
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === "g" || e.key === "G")) {
                e.preventDefault();
                if (canEdit && !isMutating && years.length > 0) handleGenerate?.();
                return
            }

            if (isInput) return

            if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
                e.preventDefault()
                setIsShortcutOpen(prev => !prev)
                return
            }
            if (e.key === "n" || e.key === "N") {
                e.preventDefault()
                if (canEdit) handleAdd()
                return
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
                e.preventDefault()
                searchInputRef.current?.focus()
                return
            }
            if (e.key === "x" || e.key === "X") {
                e.preventDefault()
                resetAllFilters?.()
                return
            }
            if (e.key === "v" || e.key === "V") {
                e.preventDefault()
                setViewMode(prev => prev === "table" ? "timeline" : prev === "timeline" ? "calendar" : "table")
                return
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === "a" || e.key === "A")) {
                e.preventDefault()
                toggleSelectAll?.()
                return
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === "d" || e.key === "D")) {
                e.preventDefault()
                if (selectedIds.length === 1) {
                    const item = years.find(y => y.id === selectedIds[0])
                    if (item) onQuickDuplicate?.(item)
                }
                return
            }
            if (e.key === "e" || e.key === "E") {
                e.preventDefault()
                if (selectedIds.length === 1) {
                    const item = years.find(y => y.id === selectedIds[0])
                    if (item) handleEdit?.(item)
                }
                return
            }
            if (e.key === "l" || e.key === "L") {
                e.preventDefault()
                if (selectedIds.length === 1) {
                    const item = years.find(y => y.id === selectedIds[0])
                    if (item) handleToggleLock?.(item)
                }
                return
            }
            if (e.key === "h" || e.key === "H") {
                e.preventDefault()
                if (selectedIds.length === 1) {
                    const item = years.find(y => y.id === selectedIds[0])
                    if (item) handleOpenHistory?.(item)
                }
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
    }, [setIsPrivacyMode, handleUndo, handleRedo, undoStack, redoStack, canEdit, handleAdd, searchInputRef, setViewMode, selectedIds, setIsBulkDeleteOpen, resetAllFilters, setIsShortcutOpen, handleEdit, onQuickDuplicate, toggleSelectAll, handleToggleLock, handleOpenHistory, handleOpenImport, handleOpenExport, handleGenerate, isMutating, years]);
}
