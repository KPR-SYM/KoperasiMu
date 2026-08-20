import { memo } from 'react'
import { Trash, Warning, Archive, CheckCircle } from '@phosphor-icons/react'

import { ConfirmDialog } from '@shared/components'

export const TeacherDeleteModal = memo(function TeacherDeleteModal({ isOpen, onClose, onConfirm, loading, itemName = '' }) {
    return (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title="Hapus Guru?"
            description={`Guru "${itemName}" akan dihapus secara permanen.`}
            icon={Trash}
            iconBg="bg-red-500/10"
            iconColor="text-red-600"
            confirmText="Hapus"
            confirmIcon={Trash}
            confirmColor="red"
            submitting={loading}
        />
    )
})

export const TeacherBulkDeleteModal = memo(function TeacherBulkDeleteModal({ isOpen, onClose, onConfirm, loading, count = 0 }) {
    return (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title={`Hapus ${count} Guru?`}
            description={`${count} guru yang dipilih akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`}
            icon={Trash}
            iconBg="bg-red-500/10"
            iconColor="text-red-600"
            confirmText="Hapus Semua"
            confirmIcon={Trash}
            confirmColor="red"
            submitting={loading}
        />
    )
})

export const TeacherBulkDeactivateModal = memo(function TeacherBulkDeactivateModal({ isOpen, onClose, onConfirm, loading, count = 0 }) {
    return (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title={`Nonaktifkan ${count} Guru?`}
            description={`${count} guru yang dipilih akan dinonaktifkan.`}
            icon={Warning}
            iconBg="bg-orange-500/10"
            iconColor="text-orange-600"
            confirmText="Nonaktifkan"
            confirmIcon={Warning}
            confirmColor="orange"
            submitting={loading}
        />
    )
})

export const TeacherBulkReactivateModal = memo(function TeacherBulkReactivateModal({ isOpen, onClose, onConfirm, loading, count = 0 }) {
    return (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title={`Aktifkan ${count} Guru?`}
            description={`${count} guru yang dipilih akan diaktifkan kembali.`}
            icon={CheckCircle}
            iconBg="bg-emerald-500/10"
            iconColor="text-emerald-600"
            confirmText="Aktifkan"
            confirmIcon={CheckCircle}
            confirmColor="emerald"
            submitting={loading}
        />
    )
})

export const TeacherBulkArchiveModal = memo(function TeacherBulkArchiveModal({ isOpen, onClose, onConfirm, loading, count = 0 }) {
    return (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title={`Arsipkan ${count} Guru?`}
            description={`${count} guru yang dipilih akan diarsipkan. Data tetap aman dan dapat dipulihkan.`}
            icon={Archive}
            iconBg="bg-amber-500/10"
            iconColor="text-amber-600"
            confirmText="Arsipkan"
            confirmIcon={Archive}
            confirmColor="amber"
            submitting={loading}
        />
    )
})

export const TeacherRestoreAllModal = memo(function TeacherRestoreAllModal({ isOpen, onClose, onConfirm, loading, count = 0 }) {
    return (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title={`Pulihkan ${count} Guru?`}
            description={`${count} guru yang diarsipkan akan dipulihkan.`}
            icon={CheckCircle}
            iconBg="bg-emerald-500/10"
            iconColor="text-emerald-600"
            confirmText="Pulihkan Semua"
            confirmIcon={CheckCircle}
            confirmColor="emerald"
            submitting={loading}
        />
    )
})
