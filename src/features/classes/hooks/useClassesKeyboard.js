import { useEffect, useRef } from 'react'

export function useClassesKeyboard({
    setIsPrivacyMode,
    canEdit,
    handleAdd,
    searchInputRef,
    selectedIds,
    setSelectedIds,
    setIsBulkDeleteOpen,
    setIsShortcutOpen,
    searchQuery,
    setSearchQuery,
    hasActiveFilters,
    resetAllFilters,
    setIsExportModalOpen,
    setIsImportModalOpen,
    setViewMode,
    viewMode,
    handleUndo,
    handleRedo,
    undoStack,
    redoStack,
    handleBulkLock,
    handleBulkUnlock,
    isMutating,
    classes,
    handleEdit,
} = {}) {
    const actionRef = useRef({})
    useEffect(() => {
        actionRef.current = {
            canEdit, handleAdd, searchInputRef, selectedIds, setSelectedIds,
            setIsBulkDeleteOpen, setIsShortcutOpen, searchQuery, setSearchQuery,
            hasActiveFilters, resetAllFilters, setIsExportModalOpen, setIsImportModalOpen,
            setViewMode, viewMode, handleUndo, handleRedo, undoStack, redoStack,
            handleBulkLock, handleBulkUnlock, isMutating, classes, handleEdit,
        }
    })

    useEffect(() => {
        const handler = e => {
            const ctx = actionRef.current
            const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
            const ctrl = e.ctrlKey || e.metaKey

            if (e.key === 'Escape') {
                if (ctx.setIsShortcutOpen) { ctx.setIsShortcutOpen(false); return }
                if (ctx.searchQuery) { ctx.setSearchQuery(''); return }
                if (ctx.selectedIds.length) { ctx.setSelectedIds([]); return }
                if (ctx.hasActiveFilters) { ctx.resetAllFilters(); return }
            }
            if (ctrl && e.key === 'k') { e.preventDefault(); ctx.searchInputRef.current?.focus(); ctx.searchInputRef.current?.select(); return }
            if (ctrl && e.key === 'e' && !isTyping) { e.preventDefault(); if (ctx.setIsExportModalOpen) ctx.setIsExportModalOpen(true); return }
            if (ctrl && e.key === 'i' && !isTyping) { e.preventDefault(); if (ctx.setIsImportModalOpen) ctx.setIsImportModalOpen(true); return }
            if (e.key === 'n' && !isTyping) { e.preventDefault(); ctx.handleAdd(); return }
            if (e.key === 'p' && !isTyping) { e.preventDefault(); setIsPrivacyMode(v => !v); return }
            if (e.key === 'v' && !isTyping) { e.preventDefault(); ctx.setViewMode?.(prev => prev === 'table' ? 'timeline' : prev === 'timeline' ? 'table' : 'table'); return }
            if (e.key === 'x' && !isTyping) { e.preventDefault(); ctx.resetAllFilters(); return }
            if (e.key === '?' && !isTyping) { ctx.setIsShortcutOpen?.(v => !v); return }
            if (e.key === 'e' && !isTyping && ctx.selectedIds.length === 1) { e.preventDefault(); const item = ctx.classes?.find(c => c.id === ctx.selectedIds[0]); if (item) ctx.handleEdit?.(item); return }
            if (e.key === 'l' && !isTyping && ctx.selectedIds.length > 0 && ctx.canEdit && !ctx.isMutating) { e.preventDefault(); ctx.handleBulkLock?.(); return }
            if (ctrl && e.key === 'z' && !isTyping) { e.preventDefault(); if (ctx.undoStack?.length > 0) ctx.handleUndo?.(); return }
            if (ctrl && e.key === 'y' && !isTyping) { e.preventDefault(); if (ctx.redoStack?.length > 0) ctx.handleRedo?.(); return }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [setIsPrivacyMode])
}
