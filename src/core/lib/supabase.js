import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const checkDemoMode = () => {
    if (!supabaseUrl || !supabaseAnonKey) return true
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        if (params.get('demo') === 'true') {
            localStorage.setItem('koperasimu_force_demo', 'true')
            return true
        }
        if (params.get('demo') === 'false') {
            localStorage.removeItem('koperasimu_force_demo')
            return false
        }
        return localStorage.getItem('koperasimu_force_demo') === 'true'
    }
    return false
}

export const isDemoMode = checkDemoMode()

if (isDemoMode) {
    console.warn('[Koperasi SenyumMu] Supabase env tidak ditemukan — berjalan dalam Demo Mode.')
    console.info('[Koperasi SenyumMu] Set VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY untuk koneksi real.')
}

const makeMockChain = (data = []) => {
    let isSingle = false
    const builder = () => {};
    
    const proxy = new Proxy(builder, {
        get(target, prop) {
            if (prop === 'then') {
                return (onFulfilled) => {
                    const resultData = isSingle ? (data[0] || null) : data
                    return Promise.resolve({ data: resultData, error: null, count: data.length }).then(onFulfilled)
                }
            }
            if (prop === 'single') {
                isSingle = true
                return proxy
            }
            if (prop === 'getPublicUrl') {
                return () => ({ data: { publicUrl: 'https://via.placeholder.com/150' } })
            }
            return proxy;
        },
        apply(target, thisArg, argumentsList) {
            return proxy;
        }
    })
    
    return proxy
}

const MOCK_DATA = {
    students: [
        { id: 's1', name: 'Budi Santoso', class_id: 'c1', registration_code: 'REG001', gender: 'L', status: 'aktif' },
        { id: 's2', name: 'Siti Maryam', class_id: 'c2', registration_code: 'REG002', gender: 'P', status: 'aktif' },
        { id: 's3', name: 'Muhammad Ali', class_id: 'c1', registration_code: 'REG003', gender: 'L', status: 'aktif' },
        { id: 's4', name: 'Fatima Zahra', class_id: 'c2', registration_code: 'REG004', gender: 'P', status: 'aktif' },
        { id: 's5', name: 'Ahmad Faiz', class_id: 'c1', registration_code: 'REG005', gender: 'L', status: 'aktif' }
    ],
    classes: [
        { id: 'c1', name: '10A Boarding Putra' },
        { id: 'c2', name: '10B Boarding Putri' },
        { id: 'c3', name: '11A Boarding Putra' }
    ],
    gate_logs: [
        { id: 'g1', visitor_name: 'Budi Santoso', visitor_type: 'siswa', check_in: new Date().toISOString(), check_out: null },
        { id: 'g2', visitor_name: 'Siti Maryam', visitor_type: 'siswa', check_in: new Date(Date.now() - 3600000).toISOString(), check_out: null }
    ],
    profiles: [
        { id: 'demo-dev', email: 'dev@koperasisenyummu.id', role: 'developer', name: 'Developer' },
        { id: 'demo-admin', email: 'admin@koperasisenyummu.id', role: 'admin', name: 'Administrator' },
        { id: 'demo-pimpinan', email: 'pimpinan@koperasisenyummu.id', role: 'pimpinan', name: 'Kepala Sekolah' },
        { id: 'demo-teacher', email: 'teacher@koperasisenyummu.id', role: 'teacher', name: 'Budi Santoso' },
        { id: 'demo-staff', email: 'staff@koperasisenyummu.id', role: 'staff', name: 'Staf Administrasi' }
    ]
}

const demoGuard = new Proxy({}, {
    get(_, prop) {
        if (prop === 'auth') {
            return {
                getSession: () => {
                    const demoSession = localStorage.getItem('koperasimu_demo_session') || sessionStorage.getItem('koperasimu_demo_session')
                    const user = demoSession ? JSON.parse(demoSession) : null
                    return Promise.resolve({ data: { session: user ? { user } : null } })
                },
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
                signOut: () => {
                    localStorage.removeItem('koperasimu_demo_session')
                    sessionStorage.removeItem('koperasimu_demo_session')
                    return Promise.resolve()
                },
                signInWithPassword: () => Promise.resolve({ data: { user: null }, error: null }),
                getUser: () => {
                    const demoSession = localStorage.getItem('koperasimu_demo_session') || sessionStorage.getItem('koperasimu_demo_session')
                    const user = demoSession ? JSON.parse(demoSession) : null
                    return Promise.resolve({ data: { user }, error: null })
                }
            }
        }
        if (prop === 'storage') {
            return makeMockChain([])
        }
        if (prop === 'from') {
            return (table) => makeMockChain(MOCK_DATA[table] || [])
        }
        return makeMockChain([])
    }
})

export const supabase = isDemoMode
    ? demoGuard
    : createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        }
    })