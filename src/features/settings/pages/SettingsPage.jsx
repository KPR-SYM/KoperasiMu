import { useState, useEffect, useRef, useMemo } from 'react'
import { Warning, SealCheck, Bell, Camera, Check, Clock, Eye, EyeSlash, Spinner, Envelope, ChatCircle, Moon, Sun, Monitor, Shield, Trash, X, Palette, User, PaintBrush, Key, Globe, CaretDown, ArrowClockwise, Rows, SquaresFour, Sidebar } from '@phosphor-icons/react'

import DashboardLayout from '@core/layouts/DashboardLayout'
import { useTheme, useLanguage, useCustomize } from '@context'
import { useToast } from '@context/Toast'
import { useAuth } from '@context/Auth'
import { supabase } from '@lib/supabase'
import { logAudit } from '@utils/auditLogger'
import { useErrorHandler } from '@hooks'

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLE_META = {
    developer: { label: 'Developer', color: 'text-rose-600', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    admin: { label: 'Admin', color: 'text-purple-600', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    pimpinan: { label: 'Pimpinan', color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    teacher: { label: 'Teacher', color: 'text-indigo-600', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    staff: { label: 'Staff', color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
}

const COLOR_PRESETS = [
    { id: 'blue', label: 'Blue', color: 'bg-blue-500' },
    { id: 'emerald', label: 'Emerald', color: 'bg-emerald-500' },
    { id: 'violet', label: 'Violet', color: 'bg-violet-500' },
    { id: 'rose', label: 'Rose', color: 'bg-rose-500' },
    { id: 'orange', label: 'Orange', color: 'bg-orange-500' },
    { id: 'slate', label: 'Slate', color: 'bg-slate-500' },
]

const NAV_SECTIONS = [
    {
        label: 'Account',
        items: [
            { id: 'profile', label: 'My Profile', icon: User },
        ],
    },
    {
        label: 'Appearance',
        items: [
            { id: 'appearance', label: 'Appearance', icon: PaintBrush },
        ],
    },
    {
        label: 'Security',
        items: [
            { id: 'password', label: 'Password', icon: Key },
        ],
    },
    {
        label: 'Notifications',
        items: [
            { id: 'notifications', label: 'Notifications', icon: Bell },
        ],
    },
]

// ─── Pure Helpers ────────────────────────────────────────────────────────────

function formatDate(dateString, options = {}) {
    if (!dateString) return '—'
    try { return new Date(dateString).toLocaleDateString('id-ID', options) }
    catch { return '—' }
}

function computePwStrength(password) {
    if (!password) return { label: '', color: '', bars: 0 }
    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSymbol = /[^A-Za-z0-9]/.test(password)
    const varietyScore = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length
    if (password.length >= 12 && varietyScore === 4) return { label: 'Kuat', color: 'bg-emerald-400', bars: 4 }
    if (password.length >= 10 && varietyScore >= 3) return { label: 'Cukup', color: 'bg-amber-400', bars: 3 }
    if (password.length >= 6 && varietyScore >= 2) return { label: 'Lemah', color: 'bg-red-400', bars: 2 }
    return { label: 'Sangat Lemah', color: 'bg-red-600', bars: 1 }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Divider() {
    return <div className="h-px bg-[var(--color-border)] my-5" />
}

function Toggle({ checked, onChange, disabled = false }) {
    return (
        <button
            onClick={() => !disabled && onChange(!checked)}
            type="button"
            disabled={disabled}
            className={`w-12 h-7 rounded-full transition-colors shrink-0 relative shadow-inner cursor-pointer 
                ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
                ${checked ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}
        >
            <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 
                ${checked ? 'translate-x-5' : 'translate-x-0'}`}
            />
        </button>
    )
}

function FieldLabel({ children }) {
    return (
        <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-2 ml-0.5">
            {children}
        </label>
    )
}

function PwInput({ label, value, onChange }) {
    const [show, setShow] = useState(false)
    return (
        <div>
            <FieldLabel>{label}</FieldLabel>
            <div className="relative">
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    placeholder="••••••••"
                    className="w-full h-10 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] font-bold placeholder:text-[var(--color-text-muted)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all"
                />
                <button
                    type="button"
                    onClick={() => setShow(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                    {show ? <EyeSlash className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
            </div>
        </div>
    )
}

function ConfirmPwModal({ onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 w-full max-w-sm shadow-2xl">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <Warning />
                    </div>
                    <p className="font-bold text-sm text-[var(--color-text)]">Konfirmasi Ubah Password</p>
                </div>
                <p className="text-[11px] text-[var(--color-text-muted)] mb-5 leading-relaxed">
                    Kamu akan mengubah password akun ini. Pastikan kamu mengingat password baru sebelum melanjutkan.
                </p>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={onCancel}
                        className="h-9 px-4 rounded-lg border border-[var(--color-border)] text-[11px] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        className="h-9 px-4 rounded-lg bg-[var(--color-primary)] text-white text-[11px] font-semibold hover:opacity-90 transition-all"
                    >
                        Ya, Ubah
                    </button>
                </div>
            </div>
        </div>
    )
}

function AvatarUpload({ profile, onAvatarChange }) {
    const { addToast } = useToast()
    const { handleError } = useErrorHandler('AvatarUpload')
    const fileRef = useRef(null)
    const [uploading, setUploading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null)
    const [imgError, setImgError] = useState(false)
    const letter = profile?.name?.charAt(0)?.toUpperCase() || 'U'
    const showImg = avatarUrl && !imgError

    useEffect(() => {
        setAvatarUrl(profile?.avatar_url || null)
        setImgError(false)
    }, [profile?.avatar_url])

    const handleFile = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) { addToast('File harus berupa gambar', 'error'); return }
        if (file.size > 2 * 1024 * 1024) { addToast('Ukuran maksimal 2MB', 'error'); return }

        setUploading(true)
        try {
            const ext = file.name.split('.').pop()
            const path = `${profile.id}/avatar.${ext}`
            const { error: uploadError } = await supabase.storage.from('user-photo').upload(path, file, { upsert: true, contentType: file.type })
            if (uploadError) throw uploadError
            const { data: { publicUrl } } = supabase.storage.from('user-photo').getPublicUrl(path)
            const url = `${publicUrl}?t=${Date.now()}`
            const { error: profileError } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile.id)
            if (profileError) throw profileError
            setAvatarUrl(url)
            setImgError(false)
            onAvatarChange?.(url)
            addToast('Foto profil berhasil diupdate', 'success')
            await logAudit({ action: 'UPDATE', tableName: 'profiles', recordId: profile.id, source: 'SECURITY', newData: { avatar_url: url } })
        } catch (err) { handleError(err, { context: 'Gagal upload: ' }) }
        finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
    }

    const handleDelete = async () => {
        if (!avatarUrl) return
        setDeleting(true)
        try {
            const { data: files } = await supabase.storage.from('user-photo').list(profile.id)
            if (files?.length) {
                const paths = files.map(f => `${profile.id}/${f.name}`)
                await supabase.storage.from('user-photo').remove(paths)
            }
            const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', profile.id)
            if (error) throw error
            setAvatarUrl(null)
            setImgError(false)
            onAvatarChange?.(null)
            addToast('Foto profil dihapus', 'success')
            await logAudit({ action: 'UPDATE', tableName: 'profiles', recordId: profile.id, source: 'SECURITY', newData: { avatar_url: null } })
        } catch (err) { handleError(err, { context: 'Gagal menghapus: ' }) }
        finally { setDeleting(false) }
    }

    const busy = uploading || deleting

    return (
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
                <div className={`w-20 h-20 rounded-xl overflow-hidden border border-[var(--color-border)] shadow-sm flex items-center justify-center font-bold text-white
                    ${showImg ? 'bg-[var(--color-surface-alt)]' : 'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]'}`}>
                    {showImg
                        ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" onError={() => setImgError(true)} />
                        : <span className="text-2xl">{letter}</span>
                    }
                </div>
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={busy}
                    className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center shadow-md hover:brightness-110 transition-all disabled:opacity-60"
                >
                    {uploading ? <Spinner className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                </button>
            </div>
            <div>
                <p className="text-sm font-bold text-[var(--color-text)]">Foto Profil</p>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">JPG, PNG, WebP · Maks 2MB</p>
                <div className="mt-2 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={busy}
                        className="h-7 px-3 rounded-lg border border-[var(--color-border)] text-[10px] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all disabled:opacity-50"
                    >
                        {uploading ? 'Mengupload...' : 'Ganti Foto'}
                    </button>
                    {avatarUrl && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={busy}
                            className="h-7 px-3 rounded-lg border border-red-500/30 bg-red-500/10 text-[10px] font-semibold text-red-500 hover:bg-red-500/20 transition-all disabled:opacity-50"
                        >
                            Hapus
                        </button>
                    )}
                </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
    )
}

// ─── Section Components ──────────────────────────────────────────────────────

function ProfileSection() {
    const { addToast } = useToast()
    const { handleError } = useErrorHandler('SettingsPage')
    const { profile, user, refreshProfile, updateProfile } = useAuth()
    const [name, setName] = useState('')
    const [savingProfile, setSavingProfile] = useState(false)
    const [profileDirty, setProfileDirty] = useState(false)

    useEffect(() => {
        if (profile?.name) { setName(profile.name); setProfileDirty(false) }
    }, [profile?.name])

    const roleMeta = ROLE_META[profile?.role] || { label: profile?.role || 'Unknown', color: 'text-gray-600', bg: 'bg-gray-500/10', border: 'border-gray-500/20' }

    const handleSaveProfile = async () => {
        if (!name.trim()) { addToast('Nama tidak boleh kosong', 'warning'); return }
        setSavingProfile(true)
        try {
            const { error } = await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', profile.id)
            if (error) throw error
            updateProfile?.({ full_name: name.trim() })
            refreshProfile?.()
            addToast('Nama berhasil diupdate', 'success')
            setProfileDirty(false)
            await logAudit({ action: 'UPDATE', tableName: 'profiles', recordId: profile.id, source: 'SECURITY', oldData: { full_name: profile.full_name }, newData: { full_name: name.trim() } })
        } catch (err) { handleError(err, { context: 'Gagal menyimpan: ' }) }
        finally { setSavingProfile(false) }
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-[var(--color-text)]">My Profile</h3>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Kelola informasi profil kamu.</p>
            </div>

            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30">
                <AvatarUpload
                    profile={profile}
                    onAvatarChange={(url) => { updateProfile?.({ avatar_url: url }); refreshProfile?.() }}
                />
            </div>

            <div className="space-y-4">
                <div>
                    <FieldLabel>Nama Tampilan</FieldLabel>
                    <div className="relative">
                        <input
                            type="text"
                            value={name}
                            onChange={e => { setName(e.target.value); setProfileDirty(true) }}
                            className="w-full h-10 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] font-bold placeholder:text-[var(--color-text-muted)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all"
                            placeholder="Nama lengkap"
                        />
                        {profileDirty && name !== profile?.name && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400" />
                        )}
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                        <FieldLabel>Email</FieldLabel>
                        <div className="h-10 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)]/50 flex items-center gap-2">
                            <Envelope className="text-[var(--color-text-muted)] w-3 h-3 shrink-0" />
                            <span className="text-[11px] font-semibold text-[var(--color-text-muted)] truncate">{user?.email || '—'}</span>
                        </div>
                    </div>
                    <div>
                        <FieldLabel>Role</FieldLabel>
                        <div className="h-10 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)]/50 flex items-center gap-2">
                            <SealCheck className="text-[var(--color-text-muted)] w-3 h-3 shrink-0" />
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleMeta.color} ${roleMeta.bg} ${roleMeta.border}`}>
                                {roleMeta.label}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {profileDirty && (
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--color-border)]">
                    <button
                        onClick={() => { setName(profile?.name || ''); setProfileDirty(false) }}
                        className="h-9 px-4 rounded-lg border border-[var(--color-border)] text-[11px] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="h-9 px-4 rounded-lg bg-[var(--color-primary)] text-white text-[11px] font-semibold hover:opacity-90 transition-all disabled:opacity-60"
                    >
                        {savingProfile ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            )}

            <Divider />

            <div className="space-y-3">
                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Info Akun</p>
                <div className="divide-y divide-[var(--color-border)]">
                    <div className="flex items-center justify-between py-3">
                        <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">User ID</span>
                        <span className="text-[11px] font-bold text-[var(--color-text)] font-mono">{profile?.id ? profile.id.slice(0, 8) + '...' : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">Terdaftar</span>
                        <span className="text-[11px] font-bold text-[var(--color-text)] font-mono">{formatDate(user?.created_at, { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">Login Terakhir</span>
                        <span className="text-[11px] font-bold text-[var(--color-text)] font-mono">
                            {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

function AppearanceSection() {
    const { isDark, toggleTheme, themeMode, setThemeMode } = useTheme()
    const { language, setLanguage } = useLanguage()
    const { colorPreset, density, container, layoutMode, setColorPreset, setDensity, setContainer, setLayoutMode, resetDefaults } = useCustomize()

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-bold text-[var(--color-text)]">Appearance</h3>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Personalize your dashboard experience.</p>
            </div>

            {/* Theme */}
            <div className="space-y-3">
                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Theme</p>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { id: 'light', label: 'Light', icon: Sun },
                        { id: 'dark', label: 'Dark', icon: Moon },
                        { id: 'system', label: 'System', icon: Monitor },
                    ].map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => setThemeMode(opt.id)}
                            className={`flex flex-col items-center gap-1.5 p-3 md:p-4 rounded-xl border text-center transition-all
                                ${(!isDark && opt.id === 'light') || (isDark && opt.id === 'dark')
                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]/30 hover:text-[var(--color-text)]'}`}
                            type="button"
                        >
                            <opt.icon className="w-5 h-5" />
                            <span className="text-[11px] font-semibold">{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Color */}
            <div className="space-y-3">
                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Color</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {COLOR_PRESETS.map(preset => (
                        <button
                            key={preset.id}
                            onClick={() => setColorPreset(preset.id)}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all
                                ${colorPreset === preset.id
                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                                    : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]/30'}`}
                            type="button"
                        >
                            <div className={`w-8 h-8 rounded-full ${preset.color} ${colorPreset === preset.id ? 'ring-2 ring-offset-2 ring-[var(--color-primary)]/30' : ''}`} />
                            <span className="text-[9px] font-semibold text-[var(--color-text-muted)]">{preset.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Density */}
            <div className="space-y-3">
                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Density</p>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { id: 'compact', label: 'Compact', icon: Rows },
                        { id: 'comfortable', label: 'Comfortable', icon: Rows },
                        { id: 'spacious', label: 'Spacious', icon: Rows },
                    ].map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => setDensity(opt.id)}
                            className={`flex flex-col items-center gap-1.5 p-3 md:p-4 rounded-xl border text-center transition-all
                                ${density === opt.id
                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]/30 hover:text-[var(--color-text)]'}`}
                            type="button"
                        >
                            <opt.icon className="w-5 h-5" />
                            <span className="text-[11px] font-semibold">{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Container */}
            <div className="space-y-3">
                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Container</p>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { id: 'fluid', label: 'Fluid', desc: 'Full width', icon: SquaresFour },
                        { id: 'boxed', label: 'Boxed', desc: 'Max 1280px', icon: SquaresFour },
                    ].map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => setContainer(opt.id)}
                            className={`flex items-center gap-2.5 p-3 md:p-4 rounded-xl border text-left transition-all
                                ${container === opt.id
                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]/30 hover:text-[var(--color-text)]'}`}
                            type="button"
                        >
                            <opt.icon className="w-5 h-5 shrink-0" />
                            <div>
                                <span className="text-[11px] font-semibold block">{opt.label}</span>
                                <span className="text-[9px] text-[var(--color-text-muted)]">{opt.desc}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Layout Mode */}
            <div className="space-y-3">
                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Layout Mode</p>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { id: 'sidebar', label: 'Sidebar', desc: 'Vertical navigation', icon: Sidebar },
                        { id: 'horizontal', label: 'Horizontal', desc: 'Top navigation bar', icon: SquaresFour },
                    ].map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => setLayoutMode(opt.id)}
                            className={`flex items-center gap-2.5 p-3 md:p-4 rounded-xl border text-left transition-all
                                ${layoutMode === opt.id
                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]/30 hover:text-[var(--color-text)]'}`}
                            type="button"
                        >
                            <opt.icon className="w-5 h-5 shrink-0" />
                            <div>
                                <span className="text-[11px] font-semibold block">{opt.label}</span>
                                <span className="text-[9px] text-[var(--color-text-muted)]">{opt.desc}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Language */}
            <div className="space-y-3">
                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Language</p>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { id: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
                        { id: 'en', label: 'English', flag: '🇬🇧' },
                    ].map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => setLanguage(opt.id)}
                            className={`flex items-center gap-2.5 p-3 md:p-4 rounded-xl border text-left transition-all
                                ${language === opt.id
                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]/30 hover:text-[var(--color-text)]'}`}
                            type="button"
                        >
                            <span className="text-lg">{opt.flag}</span>
                            <span className="text-[11px] font-semibold">{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={resetDefaults}
                className="h-9 px-4 rounded-lg border border-[var(--color-border)] text-[11px] font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] transition-all flex items-center gap-1.5"
                type="button"
            >
                <ArrowClockwise className="w-3 h-3" />
                Reset to Defaults
            </button>
        </div>
    )
}

function PasswordSection() {
    const { addToast } = useToast()
    const { handleError } = useErrorHandler('SettingsPage')
    const { user } = useAuth()
    const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
    const [savingPw, setSavingPw] = useState(false)
    const [showPwConfirm, setShowPwConfirm] = useState(false)
    const pwStrength = useMemo(() => computePwStrength(pw.next), [pw.next])
    const pwFormReady = pw.current.length > 0 && pw.next.length >= 12 && pw.next === pw.confirm

    const handleSavePw = async () => {
        setSavingPw(true)
        setShowPwConfirm(false)
        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({ email: user?.email, password: pw.current })
            if (signInError) { addToast('Password saat ini tidak benar', 'error'); return }
            const { error } = await supabase.auth.updateUser({ password: pw.next })
            if (error) throw error
            addToast('Password berhasil diubah', 'success')
            setPw({ current: '', next: '', confirm: '' })
            await logAudit({ action: 'UPDATE', tableName: 'auth.users', recordId: user.id, source: 'SECURITY', newData: { password_change: true } })
        } catch (err) { handleError(err, { context: 'Gagal mengubah password: ' }) }
        finally { setSavingPw(false) }
    }

    return (
        <div className="space-y-6">
            {showPwConfirm && <ConfirmPwModal onConfirm={handleSavePw} onCancel={() => setShowPwConfirm(false)} />}

            <div>
                <h3 className="text-lg font-bold text-[var(--color-text)]">Password</h3>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Ubah password akun kamu.</p>
            </div>

            <div className="space-y-4">
                <PwInput label="Password Saat Ini" value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} />
                <div className="grid sm:grid-cols-2 gap-4">
                    <PwInput label="Password Baru" value={pw.next} onChange={e => setPw(p => ({ ...p, next: e.target.value }))} />
                    <PwInput label="Konfirmasi" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} />
                </div>

                {pw.next && (
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= pwStrength.bars ? pwStrength.color : 'bg-[var(--color-border)]'}`} />
                            ))}
                            <span className="text-[10px] font-bold text-[var(--color-text-muted)] w-20 text-right shrink-0">{pwStrength.label}</span>
                        </div>
                        {pw.next.length < 12 && <p className="text-[10px] text-amber-500 font-semibold">Minimal 12 karakter ({12 - pw.next.length} lagi)</p>}
                        {pw.confirm && pw.next !== pw.confirm && <p className="text-[10px] text-red-500 font-semibold">Password tidak cocok</p>}
                        {pw.confirm && pw.next === pw.confirm && pw.confirm.length > 0 && <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1"><Check className="w-2 h-2" /> Password cocok</p>}
                    </div>
                )}

                <div className="flex justify-end pt-2">
                    <button
                        onClick={() => setShowPwConfirm(true)}
                        disabled={savingPw || !pwFormReady}
                        className="h-10 px-6 rounded-lg bg-[var(--color-primary)] text-white text-[11px] font-semibold hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {savingPw ? <Spinner className="w-3 h-3 animate-spin" /> : <Key className="w-3 h-3" />}
                        Ubah Password
                    </button>
                </div>
            </div>

            <Divider />

            <div className="space-y-3">
                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Tips Keamanan</p>
                <ul className="space-y-2">
                    {['Gunakan minimal 12 karakter', 'Kombinasikan huruf besar, kecil, angka & simbol', 'Jangan pakai password yang sama di tempat lain', 'Logout dari perangkat yang tidak dikenali'].map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-[var(--color-text-muted)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]/40 mt-1.5 shrink-0" />
                            {tip}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

function NotificationsSection() {
    const { addToast } = useToast()

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-[var(--color-text)]">Notifications</h3>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Atur notifikasi yang kamu terima.</p>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                <Clock className="text-amber-500 w-3 h-3" />
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Fitur notifikasi sedang dalam pengembangan.</p>
            </div>

            <div className="space-y-3 opacity-70">
                <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/50 cursor-not-allowed">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center"><Bell /></div>
                        <div>
                            <p className="text-[12px] font-bold text-[var(--color-text)]">Email</p>
                            <p className="text-[10px] text-[var(--color-text-muted)]">Ringkasan otomatis</p>
                        </div>
                    </div>
                    <Toggle checked={false} onChange={() => { }} disabled={true} />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/50 cursor-not-allowed">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center"><ChatCircle /></div>
                        <div>
                            <p className="text-[12px] font-bold text-[var(--color-text)]">WhatsApp</p>
                            <p className="text-[10px] text-[var(--color-text-muted)]">Peringatan instan via WA</p>
                        </div>
                    </div>
                    <Toggle checked={false} onChange={() => { }} disabled={true} />
                </div>
            </div>
        </div>
    )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SettingsPage() {
    const [activeSection, setActiveSection] = useState('profile')

    const SECTIONS = {
        profile: <ProfileSection />,
        appearance: <AppearanceSection />,
        password: <PasswordSection />,
        notifications: <NotificationsSection />,
    }

    return (
        <DashboardLayout title="Pengaturan">
            <div className="p-4 md:p-6 max-w-[1800px] mx-auto">
                <div className="flex flex-col md:flex-row rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden min-h-[60vh] md:min-h-[600px]">

                    {/* ── Sidebar Navigation ── */}
                    <div className="w-60 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 p-3 hidden md:block">
                        <div className="space-y-4">
                            {NAV_SECTIONS.map(section => (
                                <div key={section.label}>
                                    <p className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest px-3 mb-1">{section.label}</p>
                                    <div className="space-y-0.5">
                                        {section.items.map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => setActiveSection(item.id)}
                                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all text-[12px] font-semibold
                                                    ${activeSection === item.id
                                                        ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]'}`}
                                                type="button"
                                            >
                                                <item.icon className="w-4 h-4 shrink-0" />
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Mobile Tab Bar ── */}
                    <div className="md:hidden flex w-full shrink-0 border-b border-[var(--color-border)] overflow-x-auto scrollbar-hide">
                        {NAV_SECTIONS.flatMap(s => s.items).map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
                                className={`flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-semibold whitespace-nowrap border-b-2 transition-all
                                    ${activeSection === item.id
                                        ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                                        : 'border-transparent text-[var(--color-text-muted)]'}`}
                                type="button"
                            >
                                <item.icon className="w-3.5 h-3.5" />
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* ── Content ── */}
                    <div className="flex-1 min-w-0 p-4 md:p-6 overflow-y-auto">
                        {SECTIONS[activeSection]}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
