import { useEffect, useRef } from 'react'

export function useTeachersKeyboard({
    setIsPrivacyMode,
    canEdit,
    handleAdd,
    searchInputRef,
    selectedIds,
    setSelectedIds,
    setIsBulkModalOpen,
    setIsShortcutOpen,
    searchQuery,
    setSearchQuery,
    hasActiveFilters,
    resetAllFilters,
    setIsExportModalOpen,
    setIsImportModalOpen,
    fetchData,
    teachers,
    handleEdit,
    toggleSelectAll,
} = {}) {
    const actionRef = useRef({})
    useEffect(() => {
        actionRef.current = {
            canEdit, handleAdd, searchInputRef, selectedIds, setSelectedIds,
            setIsBulkModalOpen, setIsShortcutOpen, searchQuery, setSearchQuery,
            hasActiveFilters, resetAllFilters, setIsExportModalOpen, setIsImportModalOpen,
            fetchData, teachers, handleEdit, toggleSelectAll,
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
            if (ctrl && e.key === 'i' && !isTyping) { e.preventDefault(); if (ctx.setIsImportModalOpen) ctx.setIsImportModalOpen(true); return }
            if (ctrl && e.key === 'e' && !isTyping) { e.preventDefault(); if (ctx.setIsExportModalOpen) ctx.setIsExportModalOpen(true); return }
            if (e.key === 'n' && !isTyping) { e.preventDefault(); ctx.handleAdd(); return }
            if (e.key === 'p' && !isTyping) { e.preventDefault(); setIsPrivacyMode(v => !v); return }
            if (ctrl && e.key === 'p' && !isTyping) { e.preventDefault(); setIsPrivacyMode(v => !v); return }
            if (e.key === 'r' && !isTyping) { e.preventDefault(); ctx.fetchData(); return }
            if (e.key === 'x' && !isTyping) { e.preventDefault(); ctx.resetAllFilters(); return }
            if (e.key === '?' && !isTyping) { ctx.setIsShortcutOpen?.(v => !v); return }
            if (e.key === 'e' && !isTyping && ctx.selectedIds.length === 1) { e.preventDefault(); const item = ctx.teachers?.find(t => t.id === ctx.selectedIds[0]); if (item) ctx.handleEdit?.(item); return }
            if (ctrl && e.key === 'a' && !isTyping) { e.preventDefault(); ctx.toggleSelectAll?.(); return }
            if ((e.key === 'Delete' || e.key === 'Backspace') && !isTyping && ctx.selectedIds.length > 0) { e.preventDefault(); ctx.setIsBulkModalOpen?.(true); return }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [setIsPrivacyMode])
}
