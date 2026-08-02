import React, { memo } from 'react'
import { IdentificationCard, Briefcase, Phone, ClockCounterClockwise, Pencil, ChatCircle, Copy, Book, PresentationChart } from '@phosphor-icons/react'

import { Modal, AuditTimeline } from '@shared/components'
import { useErrorHandler } from '@hooks'
import { TYPE_LABELS } from '@features/teachers/components/TeacherRow'

const STATUS_CONFIG = {
    active: { label: 'Aktif', color: 'bg-emerald-500 text-white border-white/20' },
    inactive: { label: 'Nonaktif', color: 'bg-rose-500 text-white border-white/20' },
}

export default memo(function TeacherProfileModal({
    isOpen, onClose, selectedTeacher,
    profileTab, setProfileTab,
    canEdit, handleEdit, addToast, fetchData, userRole
}) {
    const { handleError } = useErrorHandler('TeacherProfileModal')
    if (!isOpen || !selectedTeacher) return null

    const isAdmin = ['developer', 'admin'].includes(userRole)
    if (profileTab === 'audit' && !isAdmin) setProfileTab('info')

    const copyToClipboard = async (text, label) => {
        if (!text) return
        try {
            await navigator.clipboard.writeText(text)
            addToast(`${label} berhasil disalin`, 'success')
        } catch (err) { handleError(err, { context: 'Gagal menyalin ke clipboard' }) }
    }

    const InfoRow = ({ label, value, hint }) => (
        <div className="space-y-1">
            <p className="text-[9px] font-black uppercase text-[var(--color-text-muted)] tracking-widest opacity-80">
                {label}
            </p>
            {value ? (
                <p className="text-[12px] font-bold text-[var(--color-text)] truncate">{value}</p>
            ) : (
                <p className="text-[11px] text-[var(--color-text-muted)] italic">{hint || 'Belum diisi'}</p>
            )}
        </div>
    )

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Profil Guru & Karyawan"
            description="Detail informasi kepegawaian dan data kontak."
            icon={PresentationChart}
            size="lg"
            mobileVariant="bottom-sheet"
            contentClassName="!pb-4"
            footer={
                <div className="flex items-center w-full gap-3">
                    <button onClick={onClose} className="h-10 px-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-surface-alt)] transition-all flex items-center justify-center">
                        Tutup
                    </button>
                    <div className="flex-1" />
                    {canEdit && (
                        <button
                            onClick={() => {
                                onClose();
                                handleEdit(selectedTeacher);
                            }}
                            className="h-10 px-8 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 border border-white/10"
                        >
                            <Pencil className="opacity-70" /> Edit Data
                        </button>
                    )}
                </div>
            }
        >
            <div className="space-y-4">
                {/* Header Profile Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-900 p-5 text-white shadow-xl">
                    <div className="relative flex items-center gap-5">
                        <div className="relative shrink-0">
                            <div className="w-20 h-20 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-1 flex items-center justify-center text-2xl font-black overflow-hidden shadow-lg">
                                {selectedTeacher.avatar_url || selectedTeacher.photo_url ? (
                                    <img src={selectedTeacher.avatar_url || selectedTeacher.photo_url} className="w-full h-full object-cover rounded-lg" alt="" />
                                ) : (
                                    <span>{selectedTeacher.name?.charAt(0) || '?'}</span>
                                )}
                            </div>
                            <div className={`absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md text-[8px] font-black shadow-lg border border-white/20 ${STATUS_CONFIG[selectedTeacher.status]?.color || 'bg-slate-500 text-white'}`}>
                                {STATUS_CONFIG[selectedTeacher.status]?.label || selectedTeacher.status}
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-black tracking-tight truncate mb-1">
                                {selectedTeacher.name}
                            </h2>
                            <div className="flex flex-wrap gap-3 items-center text-[10px] font-bold text-white/70 uppercase tracking-wider">
                                <span className="flex items-center gap-1.5"><Briefcase className="text-indigo-400" /> {(Array.isArray(selectedTeacher.type) ? selectedTeacher.type : [selectedTeacher.type]).map(t => TYPE_LABELS[t] || t).join(', ') || 'Guru'}</span>
                                {selectedTeacher.subject && (
                                    <>
                                        <span className="w-1 h-1 rounded-full bg-white/30" />
                                        <span className="flex items-center gap-1.5 text-emerald-300"><Book className="text-emerald-400" /> {selectedTeacher.subject}</span>
                                    </>
                                )}
                            </div>
                            {selectedTeacher.created_at && (
                                <p className="text-[10px] text-white/40 mt-2">
                                    Bergabung sejak {new Date(selectedTeacher.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 border-b border-[var(--color-border)]">
                    {[
                        { key: 'info', label: 'Info', icon: IdentificationCard },
                        ...(isAdmin ? [{ key: 'audit', label: 'Audit', icon: ClockCounterClockwise }] : []),
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setProfileTab(tab.key)}
                            className={`flex items-center gap-1.5 pb-3 text-[11px] font-bold border-b-2 transition-all ${
                                profileTab === tab.key
                                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                            }`}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Sections */}
                {profileTab === 'info' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Identitas */}
                        <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-5">
                            <div className="flex items-center gap-2.5 pt-1">
                                <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                                <IdentificationCard className="text-indigo-500 w-3 h-3 opacity-70" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">Identitas</span>
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--color-border)] to-transparent opacity-40" />
                            </div>
                            <div className="grid grid-cols-2 gap-y-5 gap-x-6">
                                <InfoRow label="Nama Lengkap" value={selectedTeacher.name} hint="Klik Edit untuk menambahkan" />
                                <InfoRow label="Jenis Kelamin" value={selectedTeacher.gender === 'L' ? 'Laki-laki' : selectedTeacher.gender === 'P' ? 'Perempuan' : null} hint="Pilih di form Edit" />
                                <InfoRow label="Tipe Tugas" value={(Array.isArray(selectedTeacher.type) ? selectedTeacher.type : [selectedTeacher.type]).map(t => TYPE_LABELS[t] || t).join(', ') || 'Guru'} hint="Klik Edit untuk ubah" />
                            </div>
                        </div>

                        {/* Kepegawaian */}
                        <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-5">
                            <div className="flex items-center gap-2.5 pt-1">
                                <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                                <Briefcase className="text-emerald-500 w-3 h-3 opacity-70" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">Kepegawaian</span>
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--color-border)] to-transparent opacity-40" />
                            </div>
                            <div className="grid grid-cols-2 gap-y-5 gap-x-6">
                                <InfoRow label="Mata Pelajaran" value={selectedTeacher.subject} hint="Pilih di form Edit" />
                                <InfoRow label="Status" value={STATUS_CONFIG[selectedTeacher.status]?.label || selectedTeacher.status} />
                                <InfoRow label="Bergabung" value={selectedTeacher.created_at ? new Date(selectedTeacher.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : null} />
                            </div>
                        </div>

                        {/* Kontak */}
                        <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-5">
                            <div className="flex items-center gap-2.5 pt-1">
                                <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                                <Phone className="text-emerald-500 w-3 h-3 opacity-70" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">Kontak</span>
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--color-border)] to-transparent opacity-40" />
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase text-[var(--color-text-muted)] tracking-widest mb-1 opacity-80">
                                        No. HP / WhatsApp
                                    </p>
                                    <div className="flex items-center justify-between group/wa">
                                        <p className="text-[13px] font-bold text-[var(--color-text)] tracking-wider">
                                            {selectedTeacher.phone || '---'}
                                        </p>
                                        {selectedTeacher.phone && (
                                            <div className="flex gap-1.5">
                                                <button onClick={() => copyToClipboard(selectedTeacher.phone, 'HP')} className="w-7 h-7 rounded-lg bg-[var(--color-surface-alt)] flex items-center justify-center text-[11px] hover:bg-[var(--color-border)] transition-colors">
                                                    <Copy className="opacity-40" />
                                                </button>
                                                <a
                                                    href={`https://wa.me/${selectedTeacher.phone.replace(/\D/g, '').replace(/^0/, '62')}`}
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-[11px] hover:brightness-110 transition-all shadow-sm"
                                                >
                                                    <ChatCircle />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {selectedTeacher.updated_at && (
                                    <p className="text-[9px] text-[var(--color-text-muted)] opacity-50">
                                        Terakhir diperbarui {new Date(selectedTeacher.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {profileTab === 'audit' && isAdmin && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/10 p-1">
                        <AuditTimeline
                            tableName="teachers"
                            recordId={selectedTeacher.id}
                            onRestored={fetchData}
                        />
                    </div>
                )}
            </div>
        </Modal >
    )
})