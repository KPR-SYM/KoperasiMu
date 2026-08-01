import { useEffect } from 'react'

export function useTeachersKeyboard({
    setIsPrivacyMode,
    canEdit,
    handleAdd,
    searchInputRef,
    selectedIds,
    setIsBulkModalOpen,
    setIsShortcutOpen,
    searchQuery,
    setSearchQuery,
    hasActiveFilters,
    resetAllFilters,
    setSelectedIds,
    setIsExportModalOpen,
    fetchData,
}) {
    useEffect(() => {
        const handler = e => {
            const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
            const ctrl = e.ctrlKey || e.metaKey

            if (e.key === 'Escape') {
                if (setIsShortcutOpen) { setIsShortcutOpen(false); return }
                if (searchQuery) { setSearchQuery(''); return }
                if (selectedIds.length) { setSelectedIds([]); return }
                if (hasActiveFilters) { resetAllFilters(); return }
            }
            if (ctrl && e.key === 'k') { e.preventDefault(); searchInputRef.current?.focus(); searchInputRef.current?.select(); return }
            if (ctrl && e.key === 'f' && !isTyping) { e.preventDefault(); return }
            if (ctrl && e.key === 'a' && !isTyping) { e.preventDefault(); return }
            if (ctrl && e.key === 'e' && !isTyping) { e.preventDefault(); if (setIsExportModalOpen) setIsExportModalOpen(true); return }
            if (e.key === 'n' && !isTyping) { e.preventDefault(); handleAdd(); return }
            if (e.key === 'p' && !isTyping) { e.preventDefault(); setIsPrivacyMode(v => !v); return }
            if (e.key === 'r' && !isTyping) { e.preventDefault(); fetchData(); return }
            if (e.key === 'x' && !isTyping) { e.preventDefault(); resetAllFilters(); return }
            if (e.key === '?' && !isTyping) { setIsShortcutOpen(v => !v); return }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [setIsPrivacyMode, canEdit, handleAdd, searchInputRef, selectedIds, setIsBulkModalOpen, setIsShortcutOpen, searchQuery, setSearchQuery, hasActiveFilters, resetAllFilters, setSelectedIds, setIsExportModalOpen, fetchData])
}
