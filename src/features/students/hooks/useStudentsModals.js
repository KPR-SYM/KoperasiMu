import { useState } from 'react'

export function useStudentsModals() {
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingStudent, setEditingStudent] = useState(null)
    const [viewingStudent, setViewingStudent] = useState(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [isExportModalOpen, setIsExportModalOpen] = useState(false)
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)
    const [isBulkDeactivateOpen, setIsBulkDeactivateOpen] = useState(false)
    const [isBulkReactivateOpen, setIsBulkReactivateOpen] = useState(false)
    const [isBulkArchiveOpen, setIsBulkArchiveOpen] = useState(false)
    const [isRestoreAllOpen, setIsRestoreAllOpen] = useState(false)
    const [isShortcutOpen, setIsShortcutOpen] = useState(false)
    const [historyItem, setHistoryItem] = useState(null)
    const [detailTab, setDetailTab] = useState('identity')

    const openAdd = () => { setEditingStudent(null); setIsFormOpen(true) }
    const openEdit = (student) => { setEditingStudent(student); setIsFormOpen(true) }
    const openDetail = (student) => { setViewingStudent(student); setIsDetailOpen(true); setDetailTab('identity') }

    const closeAll = () => {
        setIsFormOpen(false)
        setEditingStudent(null)
        setIsDetailOpen(false)
        setViewingStudent(null)
        setIsImportModalOpen(false)
        setIsExportModalOpen(false)
        setIsBulkDeleteOpen(false)
        setIsBulkDeactivateOpen(false)
        setIsBulkReactivateOpen(false)
        setIsBulkArchiveOpen(false)
        setIsRestoreAllOpen(false)
        setIsShortcutOpen(false)
        setHistoryItem(null)
    }

    return {
        isFormOpen, setIsFormOpen, editingStudent, setEditingStudent,
        viewingStudent, setViewingStudent, isDetailOpen, setIsDetailOpen,
        isImportModalOpen, setIsImportModalOpen, isExportModalOpen, setIsExportModalOpen,
        isBulkDeleteOpen, setIsBulkDeleteOpen, isBulkDeactivateOpen, setIsBulkDeactivateOpen,
        isBulkReactivateOpen, setIsBulkReactivateOpen, isBulkArchiveOpen, setIsBulkArchiveOpen,
        isRestoreAllOpen, setIsRestoreAllOpen, isShortcutOpen, setIsShortcutOpen,
        historyItem, setHistoryItem, detailTab, setDetailTab,
        openAdd, openEdit, openDetail, closeAll,
    }
}
