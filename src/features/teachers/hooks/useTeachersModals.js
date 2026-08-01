import { useState } from 'react'

export function useTeachersModals() {
    const [isExportModalOpen, setIsExportModalOpen] = useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false)

    return {
        isExportModalOpen, setIsExportModalOpen,
        isImportModalOpen, setIsImportModalOpen,
        isArchivedModalOpen, setIsArchivedModalOpen,
    }
}
