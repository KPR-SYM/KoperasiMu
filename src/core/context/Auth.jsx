
import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { supabase, isDemoMode } from '@lib/supabase'
import { useLanguage } from './Language'

const AuthContext = createContext({})

// ─── Hierarki Peran: Developer > Admin > Pimpinan > Teacher = Staff ───────────
const DEMO_USERS = {
    developer: { id: 'demo-dev', email: 'dev@koperasisenyummu.id', role: 'developer', name: 'Developer' },
    admin: { id: 'demo-admin', email: 'admin@koperasisenyummu.id', role: 'admin', name: 'Administrator' },
    pimpinan: { id: 'demo-pimpinan', email: 'pimpinan@koperasisenyummu.id', role: 'pimpinan', name: 'Kepala Sekolah' },
    teacher: { id: 'demo-teacher', email: 'teacher@koperasisenyummu.id', role: 'teacher', name: 'Budi Santoso' },
    staff: { id: 'demo-staff', email: 'staff@koperasisenyummu.id', role: 'staff', name: 'Staf Administrasi' },
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (isDemoMode) {
            // Periksa LocalStorage Atau SessionStorage Untuk Sesi Demo
            const demoSession = localStorage.getItem('koperasimu_demo_session') || sessionStorage.getItem('koperasimu_demo_session')
            if (demoSession) {
                try {
                    const parsed = JSON.parse(demoSession)
                    setUser(parsed)
                    setProfile(parsed)
                } catch (e) {
                    console.error('Error parsing demo session:', e)
                    localStorage.removeItem('koperasimu_demo_session')
                    sessionStorage.removeItem('koperasimu_demo_session')
                }
            }
            setLoading(false)
            return
        }

        // Cukup Gunakan onAuthStateChange Karena Supabase Akan Otomatis Mentrigger
        // State Inisialisasi Di Awal Dan Pembaruan Di Masa Mendatang.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                await fetchProfile(session.user.id)
            } else {
                setProfile(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    async function fetchProfile(userId) {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
        setProfile(data)
        setLoading(false)
    }

    /** Patch State Profil Secara Langsung Tanpa Fetch Ulang — Untuk Pembaruan Instan Di UI (Navbar, Dll) */
    function updateProfile(patch) {
        setProfile(prev => prev ? { ...prev, ...patch } : prev)
    }

    /** Fetch Ulang Profil Dari Supabase — Untuk Sinkronisasi Keras Setelah Perubahan */
    async function refreshProfile() {
        if (!user?.id || isDemoMode) return
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
        if (data) setProfile(data)
    }

    async function signIn(email, password, rememberMe = false) {
        if (isDemoMode) {
            // Masuk Mode Demo
            const demoUser = Object.values(DEMO_USERS).find(u => u.email === email)
            if (demoUser && password === 'demo123') {
                setUser(demoUser)
                setProfile(demoUser)
                const storage = rememberMe ? localStorage : sessionStorage
                storage.setItem('koperasimu_demo_session', JSON.stringify(demoUser))
                return { error: null }
            }
            return { error: { message: 'Email atau password salah' } }
        }

        // Untuk Autentikasi Supabase Riil, Persistensi Sesi Dikonfigurasi Di Level Client,
        // Tetapi Melewatkan rememberMe Di Sini Adalah Penampung Yang Baik Jika Kita Ingin Mengimplementasikan
        // Logika Penyimpanan Token Kustom Nanti.
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return { error }
    }

    async function signOut() {
        if (isDemoMode) {
            setUser(null)
            setProfile(null)
            localStorage.removeItem('koperasimu_demo_session')
            sessionStorage.removeItem('koperasimu_demo_session')
            localStorage.removeItem('koperasimu_force_demo')
            window.location.reload()
            return
        }
        await supabase.auth.signOut()
    }

    // ─── Helper Role ─────────────────────────────────────────────────────────
    // Urutan Hierarki: Developer(4) > Admin(3) > Pimpinan(3) > Teacher(2) = Staff(2)
    const ROLE_LEVEL = { developer: 4, admin: 3, pimpinan: 3, teacher: 2, staff: 2 }

    /** Periksa Apakah Pengguna Saat Ini Memiliki Salah Satu Peran Yang Diberikan */
    const hasRole = (...roles) => roles.includes(profile?.role?.toLowerCase())

    /** Periksa Apakah Level Pengguna Saat Ini >= Level Peran Yang Diberikan */
    const isAtLeast = (minRole) => {
        const userLevel = ROLE_LEVEL[profile?.role?.toLowerCase()] ?? 0
        const minLevel = ROLE_LEVEL[minRole?.toLowerCase()] ?? 99
        return userLevel >= minLevel
    }

    const { t } = useLanguage()
    const localizedProfile = useMemo(() => {
        if (!profile || !isDemoMode) return profile
        let name = profile.name
        if (profile.role === 'teacher') {
            name = t('auth.demoTeacherName')
        } else if (profile.role === 'staff') {
            name = t('auth.demoStaffName')
        } else if (profile.role === 'developer') {
            name = t('auth.demoDevName')
        } else if (profile.role === 'admin') {
            name = t('auth.demoAdminName')
        } else if (profile.role === 'pimpinan') {
            name = t('auth.demoPimpinanName')
        }
        return { ...profile, name }
    }, [profile, t])

    const value = {
        user,
        profile: localizedProfile,
        loading,
        signIn,
        signOut,
        isDemoMode,

        // Helper Profil
        updateProfile,
        refreshProfile,

        // Helper Izin
        hasRole,
        isAtLeast,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}