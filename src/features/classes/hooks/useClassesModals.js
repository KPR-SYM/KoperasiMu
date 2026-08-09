import { useState, useCallback } from 'react'

export function useClassesModals() {
    const [isExportModalOpen, setIsExportModalOpen] = useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false)
    const [isLockModalOpen, setIsLockModalOpen] = useState(false)
    const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false)
    const [isBulkEditOpen, setIsBulkEditOpen] = useState(false)
    const [itemToDuplicate, setItemToDuplicate] = useState(null)

    const openCompare = useCallback(() => {}, [])

    return {
        isExportModalOpen, setIsExportModalOpen,
        isImportModalOpen, setIsImportModalOpen,
        isArchivedModalOpen, setIsArchivedModalOpen,
        isLockModalOpen, setIsLockModalOpen,
        isUnlockModalOpen, setIsUnlockModalOpen,
        isBulkEditOpen, setIsBulkEditOpen,
        itemToDuplicate, setItemToDuplicate,
        openCompare,
    }
}
