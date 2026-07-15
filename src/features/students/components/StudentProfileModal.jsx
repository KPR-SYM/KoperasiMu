import React, { memo } from 'react'
import { SealCheck, Calendar, Copy, DoorOpen, GraduationCap, HandHeart, Heart, ClockCounterClockwise, IdentificationCard, Info, MapPin, GenderMale, ChatCircle, Pencil, Plus, Tag, UserCheck, Users, Lightning } from '@phosphor-icons/react'

import Modal from '@shared/components/Modal'

import { AuditTimeline } from '@shared/components'
import { useErrorHandler } from '@hooks'


export default memo(function StudentProfileModal({
    isOpen, onClose, selectedStudent, isPrivacyMode, maskInfo, calculateCompleteness,
    canEdit, handleEdit, profileTab, setProfileTab,
    addToast, onOpenTagModal,
    buildWAMessage, openWAForStudent
}) {
    const { handleError } = useErrorHandler('StudentProfileModal')
    if (!isOpen || !selectedStudent) return null

    const copyToClipboard = async (text, label) => {
        if (isPrivacyMode) return addToast('Mode privasi aktif', 'warning')
        if (!text) return
        try {
            await navigator.clipboard.writeText(text)
            addToast(`${label} berhasil disalin`, 'success')
        } catch (err) { handleError(err, { context: 'Gagal menyalin ke clipboard' }) }
    }

    const InfoRow = ({ label, value, icon }) => (
        <div className="space-y-1">
            <p className="text-[9px] font-black uppercase text-[var(--color-text-muted)] tracking-widest flex items-center gap-1.5 opacity-80">
                {icon && <icon className="opacity-50 w-2 h-2" />} {label}
            </p>
            <p className="text-[12px] font-bold text-[var(--color-text)] truncate">{value || '-'}</p>
        </div>
    )

    const calculateAge = (birthDate) => {
        if (!birthDate) return null
        const birth = new Date(birthDate)
        const today = new Date()
        let age = today.getFullYear() - birth.getFullYear()
        const m = today.getMonth() - birth.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
        return age
    }

    const age = calculateAge(selectedStudent.birth_date)

    const SectionEmptyState = ({ label, icon = Info }) => (
        <div className="py-4 flex flex-col items-center justify-center text-center space-y-2 border border-dashed border-[var(--color-border)] rounded-xl bg-[var(--color-surface-alt)]/30">
            <div className="w-8 h-8 rounded-full bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-muted)] shadow-sm">
                                <icon className="w-3 h-3 opacity-40" />
            </div>
            <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-[var(--color-text-muted)]">Data {label} belum tersedia</p>
                {canEdit && !isPrivacyMode && (
                    <button onClick={() => { onClose(); handleEdit(selectedStudent); }} className="text-[8px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 transition-colors">
                        Lengkapi Data <Plus className="ml-1" />
                    </button>
                )}
            </div>
        </div>
    )

    const handleSaveContact = () => {
        if (isPrivacyMode) return addToast('Mode privasi aktif', 'warning')
        if (!selectedStudent.phone) return addToast('Nomor WA kosong', 'error')

        const guardianName = selectedStudent.guardian_name || 'Ortu'
        const studentName = selectedStudent.name || 'Siswa'
        const cleanPhone = selectedStudent.phone.replace(/\D/g, '')
        const phoneNum = cleanPhone.startsWith('0') ? `+62${cleanPhone.substring(1)}` : `+${cleanPhone}`

        const vCardData = `BEGIN:VCARD\nVERSION:3.0\nFN:Wali - ${studentName} (${guardianName})\nTEL;TYPE=CELL:${phoneNum}\nEND:VCARD`
        const blob = new Blob([vCardData], { type: 'text/vcard;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `Wali_${studentName.replace(/\s+/g, '_')}.vcf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        addToast('Kontak VCF berhasil diunduh', 'success')
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Profil Siswa"
            description="Detail informasi akademik, statistik perilaku, histori laporan perizinan, dan rekapan raport siswa."
            icon={UserCheck}
            size="lg"
            mobileVariant="bottom-sheet"
            footer={
                <div className="flex items-center w-full gap-3">
                    <button onClick={onOpenTagModal} className="h-10 px-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-surface-alt)] transition-all flex items-center justify-center gap-2 shrink-0">
                        <Tag className="opacity-70" /> Label
                    </button>

                    <div className="flex-1" />

                    <button onClick={onClose} className="h-10 px-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-surface-alt)] transition-all flex items-center justify-center shrink-0">
                        Tutup
                    </button>

                    {canEdit && !isPrivacyMode && (
                        <button
                            onClick={() => {
                                onClose();
                                handleEdit(selectedStudent);
                            }}
                            className="h-10 px-8 rounded-xl bg-[var(--color-primary)] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--color-primary)]/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 shrink-0"
                        >
                            <Pencil className="opacity-70" /> Pen Data
                        </button>
                    )}
                </div>
            }
        >
            <div className="space-y-4">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-900 p-5 text-white shadow-xl">
                    <div className="relative flex items-center gap-5">
                        <div className="relative shrink-0">
                            <div className="w-20 h-20 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-1 flex items-center justify-center text-2xl font-black overflow-hidden shadow-lg">
                                {selectedStudent.photo_url && !isPrivacyMode ? (
                                    <img src={selectedStudent.photo_url} className="w-full h-full object-cover rounded-lg" alt="" onError={(e) => { e.target.onerror = null; e.target.parentElement.innerHTML = `<span>${selectedStudent.name?.charAt(0) || '?'}</span>` }} />
                                ) : (
                                    <span>{isPrivacyMode ? maskInfo(selectedStudent.name, 1) : (selectedStudent.name?.charAt(0) || '?')}</span>
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 px-2 py-0.5 bg-indigo-500 text-white rounded-md text-[8px] font-black shadow-lg border border-white/20">
                                {calculateCompleteness(selectedStudent)}%
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-black tracking-tight truncate mb-1">
                                {isPrivacyMode ? maskInfo(selectedStudent.name, 4) : selectedStudent.name}
                            </h2>
                            <div className="flex flex-wrap gap-3 items-center text-[10px] font-bold text-white/70 uppercase tracking-wider">
                                <span className="flex items-center gap-1.5"><IdentificationCard className="text-indigo-400" /> {selectedStudent.registration_code}</span>
                                <span className="w-1 h-1 rounded-full bg-white/30" />
                                <span className="flex items-center gap-1.5"><GraduationCap className="text-indigo-400" /> {selectedStudent.className}</span>
                            </div>

                            {/* Tag display */}
                            {selectedStudent.tags && selectedStudent.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {selectedStudent.tags.map(tag => (
                                        <span key={tag} className="px-1.5 py-0.5 rounded-md bg-white/10 border border-white/10 text-[7px] font-black uppercase tracking-wider">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                <div className="flex bg-[var(--color-surface-alt)] p-1 rounded-xl border border-[var(--color-border)] overflow-x-auto no-scrollbar">
                    {['info', 'audit'].map(t => (
                        <button
                            key={t}
                            onClick={() => setProfileTab(t)}
                            aria-selected={profileTab === t}
                            className={`flex-1 min-w-[70px] h-12 flex flex-col items-center justify-center gap-1 transition-all relative
                                ${profileTab === t ? 'text-indigo-500' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
                        >
                            {t === 'info' ? <IdentificationCard className="w-4 h-4 mb-1" /> : <ClockCounterClockwise className="w-4 h-4 mb-1" />}
                            <span className="text-[10px] font-black uppercase tracking-widest">{t}</span>
                            {profileTab === t && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-500 rounded-full" />}
                        </button>
                    ))}
                </div>

                <div>
                    {profileTab === 'info' && (
                        <div className="space-y-6">
                            <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-5">
                                <div className="flex items-center gap-2.5 pt-1">
                                    <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                                    <IdentificationCard className="text-indigo-500 w-3 h-3 opacity-70" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">Profil Pribadi</span>
                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--color-border)] to-transparent opacity-40" />
                                </div>
                                <div className="grid grid-cols-2 gap-y-5 gap-x-6">
                                    <div className="col-span-2">
                                        <p className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-widest mb-1 opacity-80 text-indigo-600/70">NIS / NIK</p>
                                        <p className="text-[13px] font-bold text-[var(--color-text)] tracking-wider">
                                            {isPrivacyMode ? maskInfo(selectedStudent.nis, 4) : (selectedStudent.nis || '---')} /
                                            {isPrivacyMode ? maskInfo(selectedStudent.nik, 4) : (selectedStudent.nik || '---')}
                                        </p>
                                    </div>
                                    <InfoRow label="Tempat, Tgl Lahir" value={`${selectedStudent.birth_place || '-'}, ${selectedStudent.birth_date || '-'}${age !== null ? ` (${age} thn)` : ''}`} icon={Calendar} />
                                    <InfoRow label="Jenis Kelamin" value={selectedStudent.gender === 'L' ? 'Laki-laki' : 'Perempuan'} icon={GenderMale} />
                                    <InfoRow label="Agama" value={selectedStudent.religion || 'Islam'} icon={HandHeart} />
                                    <InfoRow label="Status" value={selectedStudent.status ? (selectedStudent.status.charAt(0).toUpperCase() + selectedStudent.status.slice(1)) : 'Aktif'} icon={SealCheck} />
                                </div>
                            </div>

                            {/* â”€â”€ Data Orang Tua & Wali (Unified GridFour) â”€â”€ */}
                            <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-6">
                                <div className="flex items-center gap-2.5 pt-1">
                                    <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                                    <Users className="text-indigo-500 w-3 h-3 opacity-70" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">Data Orang Tua & Wali</span>
                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--color-border)] to-transparent opacity-40" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Kolom Ayah */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
                                            <UserCheck className="w-3 h-3 text-indigo-500/60" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Ayah</span>
                                        </div>
                                        {selectedStudent.metadata?.father?.name || selectedStudent.metadata?.father?.nik ? (
                                            <div className="space-y-3 px-1">
                                                <InfoRow label="Nama Ayah" value={isPrivacyMode ? maskInfo(selectedStudent.metadata?.father?.name, 4) : (selectedStudent.metadata?.father?.name || '-')} />
                                                <InfoRow label="NIK Ayah" value={isPrivacyMode ? maskInfo(selectedStudent.metadata?.father?.nik, 4) : (selectedStudent.metadata?.father?.nik || '-')} />
                                                <InfoRow label="Pekerjaan" value={selectedStudent.metadata?.father?.job || '-'} />
                                            </div>
                                        ) : (
                                            <SectionEmptyState label="Ayah" icon={UserCheck} />
                                        )}
                                    </div>

                                    {/* Kolom Ibu */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
                                            <Heart className="w-3 h-3 text-pink-500/60" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Ibu</span>
                                        </div>
                                        {selectedStudent.metadata?.mother?.name || selectedStudent.metadata?.mother?.nik ? (
                                            <div className="space-y-3 px-1">
                                                <InfoRow label="Nama Ibu" value={isPrivacyMode ? maskInfo(selectedStudent.metadata?.mother?.name, 4) : (selectedStudent.metadata?.mother?.name || '-')} />
                                                <InfoRow label="NIK Ibu" value={isPrivacyMode ? maskInfo(selectedStudent.metadata?.mother?.nik, 4) : (selectedStudent.metadata?.mother?.nik || '-')} />
                                                <InfoRow label="Pekerjaan" value={selectedStudent.metadata?.mother?.job || '-'} />
                                            </div>
                                        ) : (
                                            <SectionEmptyState label="Ibu" icon={Heart} />
                                        )}
                                    </div>

                                    {/* Kolom Wali / Kontak */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
                                            <SealCheck className="w-3 h-3 text-emerald-500/60" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Kontak Wali Utama</span>
                                        </div>
                                        <div className="space-y-1 px-1">
                                            <InfoRow label="Nama Wali / Ortu" value={isPrivacyMode ? maskInfo(selectedStudent.guardian_name, 4) : (selectedStudent.guardian_name || '-')} />
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black uppercase text-[var(--color-text-muted)] tracking-widest mb-1 flex items-center gap-1.5 opacity-80">
                                                    <ChatCircle className="text-emerald-500 w-3 h-3" /> No. HP / WhatsApp
                                                </p>
                                                <div className="flex items-center justify-between group/wa">
                                                    <p className="text-[12px] font-bold text-[var(--color-text)] tracking-wider">
                                                        {isPrivacyMode ? maskInfo(selectedStudent.phone, 4) : (selectedStudent.phone || '---')}
                                                    </p>
                                                    {selectedStudent.phone && !isPrivacyMode && (
                                                        <div className="flex gap-1.5 opacity-0 group-hover/wa:opacity-100 transition-opacity">
                                                            <button onClick={() => copyToClipboard(selectedStudent.phone, 'HP')} className="w-6 h-6 rounded-lg bg-[var(--color-surface-alt)] flex items-center justify-center text-[10px] hover:bg-[var(--color-border)] transition-colors">
                                                                <Copy className="opacity-40" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    if (openWAForStudent && buildWAMessage) {
                                                                        openWAForStudent(selectedStudent, buildWAMessage(selectedStudent, 'general'))
                                                                    } else {
                                                                        const cleanPhone = (selectedStudent.phone || '').replace(/\D/g, '')
                                                                        const waPhone = cleanPhone.startsWith('0') ? `62${cleanPhone.substring(1)}` : cleanPhone
                                                                        const text = encodeURIComponent(`Assalamualaikum Wr. Wb.\n\nBapak/Ibu Wali dari Ananda *${selectedStudent.name}*.\n\n`)
                                                                        window.open(`https://wa.me/${waPhone}?text=${text}`, '_blank')
                                                                    }
                                                                }}
                                                                className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-[10px] hover:brightness-110 transition-all shadow-sm"
                                                            >
                                                                <ChatCircle />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {!isPrivacyMode && selectedStudent.phone && (
                                                <button onClick={handleSaveContact} className="w-full mt-2 h-8 rounded-lg border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 text-[8px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all flex items-center justify-center gap-2">
                                                    <IdentificationCard className="w-3 h-3" /> Simpan Kontak VCF
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-5">
                                <div className="flex items-center gap-2.5 pt-1">
                                    <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                                    <MapPin className="text-emerald-500 w-3 h-3 opacity-70" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">Alamat & Domisili</span>
                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--color-border)] to-transparent opacity-40" />
                                </div>
                                {selectedStudent.address || selectedStudent.metadata?.address_detail?.rt || selectedStudent.metadata?.address?.rt ? (
                                    <div className="space-y-4">
                                        <div className="p-3 rounded-xl bg-[var(--color-surface-alt)]/50 border border-[var(--color-border)]/50">
                                            <p className="text-[7px] font-black uppercase text-[var(--color-text-muted)] tracking-widest mb-1.5">Alamat Lengkap</p>
                                            <p className="text-[10px] font-bold leading-relaxed">{isPrivacyMode ? maskInfo(selectedStudent.address, 10) : (selectedStudent.address || '-')}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                            <InfoRow label="RT / RW" value={isPrivacyMode ? '***' : `${selectedStudent.metadata?.address_detail?.rt || selectedStudent.metadata?.address?.rt || '-'}/${selectedStudent.metadata?.address_detail?.rw || selectedStudent.metadata?.address?.rw || '-'}`} />
                                            <InfoRow label="Dusun / Desa" value={isPrivacyMode ? maskInfo(selectedStudent.metadata?.address_detail?.village || selectedStudent.metadata?.address?.village, 3) : (selectedStudent.metadata?.address_detail?.village || selectedStudent.metadata?.address?.village || '-')} />
                                            <InfoRow label="Kecamatan" value={isPrivacyMode ? maskInfo(selectedStudent.metadata?.address_detail?.district || selectedStudent.metadata?.address?.district, 3) : (selectedStudent.metadata?.address_detail?.district || selectedStudent.metadata?.address?.district || '-')} />
                                            <InfoRow label="Kabupaten/Kota" value={isPrivacyMode ? maskInfo(selectedStudent.metadata?.address_detail?.city || selectedStudent.metadata?.address?.city, 3) : (selectedStudent.metadata?.address_detail?.city || selectedStudent.metadata?.address?.city || '-')} />
                                            <InfoRow label="Provinsi" value={isPrivacyMode ? maskInfo(selectedStudent.metadata?.address_detail?.province || selectedStudent.metadata?.address?.province, 3) : (selectedStudent.metadata?.address_detail?.province || selectedStudent.metadata?.address?.province || '-')} />
                                            <InfoRow label="Kamar / Rayon" value={selectedStudent.metadata?.kamar || '-'} icon={DoorOpen} />
                                        </div>
                                    </div>
                                ) : (
                                    <SectionEmptyState label="Alamat" icon={MapPin} />
                                )}
                            </div>

                            <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-5">
                                <div className="flex items-center gap-2.5 pt-1">
                                    <div className="w-1 h-4 bg-amber-500 rounded-full" />
                                    <SealCheck className="text-amber-500 w-3 h-3 opacity-70" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">Dokumen Sipil</span>
                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--color-border)] to-transparent opacity-40" />
                                </div>
                                {selectedStudent.metadata?.documents?.no_kk || selectedStudent.metadata?.docs?.no_kk || selectedStudent.metadata?.documents?.no_akta || selectedStudent.metadata?.docs?.no_akta ? (
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                        <div className="col-span-2 sm:col-span-1">
                                            <p className="text-[7px] font-black uppercase text-[var(--color-text-muted)] tracking-widest mb-1">No. Kartu Keluarga</p>
                                            <div className="flex items-center justify-between">
                                                <p className="w-3 h-3 font-bold text-[var(--color-text)] tracking-wider">
                                                    {isPrivacyMode ? maskInfo(selectedStudent.metadata?.documents?.no_kk || selectedStudent.metadata?.docs?.no_kk, 4) : (selectedStudent.metadata?.documents?.no_kk || selectedStudent.metadata?.docs?.no_kk || '---')}
                                                </p>
                                                {(selectedStudent.metadata?.documents?.no_kk || selectedStudent.metadata?.docs?.no_kk) && !isPrivacyMode && (
                                                    <button onClick={() => copyToClipboard(selectedStudent.metadata?.documents?.no_kk || selectedStudent.metadata?.docs?.no_kk, 'No. KK')} className="w-6 h-6 rounded-lg bg-[var(--color-surface-alt)] flex items-center justify-center text-[10px] hover:bg-[var(--color-border)] transition-colors">
                                                        <Copy className="opacity-40" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <p className="text-[7px] font-black uppercase text-[var(--color-text-muted)] tracking-widest mb-1">No. Registrasi Akta</p>
                                            <div className="flex items-center justify-between">
                                                <p className="w-3 h-3 font-bold text-[var(--color-text)] tracking-wider">
                                                    {isPrivacyMode ? maskInfo(selectedStudent.metadata?.documents?.no_akta || selectedStudent.metadata?.docs?.no_akta, 4) : (selectedStudent.metadata?.documents?.no_akta || selectedStudent.metadata?.docs?.no_akta || '---')}
                                                </p>
                                                {(selectedStudent.metadata?.documents?.no_akta || selectedStudent.metadata?.docs?.no_akta) && !isPrivacyMode && (
                                                    <button onClick={() => copyToClipboard(selectedStudent.metadata?.documents?.no_akta || selectedStudent.metadata?.docs?.no_akta, 'No. Akta')} className="w-6 h-6 rounded-lg bg-[var(--color-surface-alt)] flex items-center justify-center text-[10px] hover:bg-[var(--color-border)] transition-colors">
                                                        <Copy className="opacity-40" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <SectionEmptyState label="Dokumen Sipil" icon={SealCheck} />
                                )}
                            </div>

                            {(() => {
                                const entries = Object.entries(selectedStudent.metadata || {})
                                    .filter(([key, val]) => {
                                        const excludedKeys = ['father', 'mother', 'address', 'address_detail', 'docs', 'documents', 'kamar']
                                        return !excludedKeys.includes(key) && val !== null && val !== '' && typeof val !== 'object'
                                    })
                                if (entries.length === 0) return null
                                return (
                                    <div className="p-3.5 rounded-2xl border border-violet-500/10 bg-[var(--color-surface)] shadow-sm space-y-4">
                                        <div className="flex items-center gap-2.5 pt-1 mb-2">
                                            <div className="w-1 h-4 bg-violet-500 rounded-full" />
                                            <Info className="text-violet-500 w-3 h-3 opacity-70" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">Info Khusus</span>
                                            <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--color-border)] to-transparent opacity-40" />
                                        </div>
                                        <div className="flex flex-wrap gap-2 max-h-[120px] overflow-auto custom-scrollbar">
                                            {entries.map(([key, val]) => (
                                                <div key={key} className="px-3 py-1.5 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] flex flex-col min-w-[80px]">
                                                    <span className="text-[7px] font-black uppercase text-[var(--color-text-muted)] tracking-widest mb-0.5">{key.replace(/_/g, ' ')}</span>
                                                    <span className="text-[10px] font-bold text-[var(--color-text)]">{String(val)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })()}
                        </div>
                    )}

                    {profileTab === 'audit' && (
                        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/10 p-1 custom-scrollbar">
                            <AuditTimeline tableName="students" recordId={selectedStudent.id} />
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    )
})
