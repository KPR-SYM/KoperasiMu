import { memo } from 'react'
import { Trash, Warning, Eye, EyeSlash, Archive, CheckCircle } from '@phosphor-icons/react'

import { ConfirmDialog } from '@shared/components'

export const StudentDeleteModal = memo(function StudentDeleteModal({ isOpen, onClose, onConfirm, loading, itemName = '' }) {
    return (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title="Hapus Siswa?"
            description={`Siswa "${itemName}" akan dihapus secara permanen.`}
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

export const StudentBulkDeleteModal = memo(function StudentBulkDeleteModal({ isOpen, onClose, onConfirm, loading, count = 0 }) {
    return (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title={`Hapus ${count} Siswa?`}
            description={`${count} siswa yang dipilih akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`}
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

export const StudentBulkDeactivateModal = memo(function StudentBulkDeactivateModal({ isOpen, onClose, onConfirm, loading, count = 0 }) {
    return (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title={`Nonaktifkan ${count} Siswa?`}
            description={`${count} siswa yang dipilih akan dinonaktifkan.`}
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

export const StudentBulkReactivateModal = memo(function StudentBulkReactivateModal({ isOpen, onClose, onConfirm, loading, count = 0 }) {
    return (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title={`Aktifkan ${count} Siswa?`}
            description={`${count} siswa yang dipilih akan diaktifkan kembali.`}
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

export const StudentBulkArchiveModal = memo(function StudentBulkArchiveModal({ isOpen, onClose, onConfirm, loading, count = 0 }) {
    return (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title={`Arsipkan ${count} Siswa?`}
            description={`${count} siswa yang dipilih akan diarsipkan. Data tetap aman dan dapat dipulihkan.`}
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

export const StudentRestoreAllModal = memo(function StudentRestoreAllModal({ isOpen, onClose, onConfirm, loading, count = 0 }) {
    return (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title={`Pulihkan ${count} Siswa?`}
            description={`${count} siswa yang diarsipkan akan dipulihkan.`}
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
