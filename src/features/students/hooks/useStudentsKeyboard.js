import { useEffect } from 'react'

export function useStudentsKeyboard({
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
    toggleSelectAll,
}) {
    useEffect(() => {
        const handler = (e) => {
            if (e.key === '?' && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault()
                setIsShortcutOpen?.(v => !v)
            }
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'k') {
                    e.preventDefault()
                    searchInputRef?.current?.focus()
                }
                if (e.key === 'n' && canEdit) {
                    e.preventDefault()
                    handleAdd?.()
                }
                if (e.key === 'e') {
                    e.preventDefault()
                    setIsExportModalOpen?.()
                }
                if (e.key === 'i') {
                    e.preventDefault()
                    setIsImportModalOpen?.()
                }
                if (e.key === 'a' && !e.target.closest('table')) {
                    e.preventDefault()
                    toggleSelectAll?.()
                }
            }
            if (e.key === 'Escape') {
                setSelectedIds?.([])
                setIsShortcutOpen?.(false)
            }
            if (e.key === 'Delete' && selectedIds?.length > 0 && canEdit) {
                setIsBulkDeleteOpen?.(true)
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [canEdit, handleAdd, searchInputRef, selectedIds, setSelectedIds, setIsBulkDeleteOpen, setIsShortcutOpen, searchQuery, setSearchQuery, hasActiveFilters, resetAllFilters, setIsExportModalOpen, setIsImportModalOpen, toggleSelectAll])
}
