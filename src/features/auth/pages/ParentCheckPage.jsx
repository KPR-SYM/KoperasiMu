import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowLeft, Check, CreditCard, IdentificationCard, Key, Link as LinkIcon, Spinner, ChatCircle, Moon, Phone, ShieldCheck, Sun } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'


import toast from 'react-hot-toast'
import { useTheme } from '@context'
import { supabase } from '@lib/supabase'

import ThemeToggle from '../../public/components/common/ThemeToggle'
import logoSenyum from '../../../assets/images/logos/logo-senyum.png'

// ─── Constants & Utils ───────────────────────────────────────────────────────

// Rate limiting login — dipindah ke luar komponen agar tidak dibuat ulang tiap render.
// sessionStorage dipakai agar counter reset otomatis saat tab ditutup.
const RATE_KEY = 'koperasimu_login_attempts' // prefix unik agar tidak konflik jika multi-app di domain sama
const RATE_MAX = 5       // max percobaan sebelum cooldown
const RATE_COOLDOWN = 30 // detik cooldown

const getRateData = () => {
    try { return JSON.parse(sessionStorage.getItem(RATE_KEY) || '{"count":0,"until":0}') }
    catch { return { count: 0, until: 0 } }
}
const setRateData = (data) => {
    try { sessionStorage.setItem(RATE_KEY, JSON.stringify(data)) } catch { }
}

// Format nomor telepon lokal (08xx / +62 / dsb) ke format Whatsapp (62xxxxxxxxxx)
const toWaNumber = (phone) => phone ? phone.replace(/\D/g, '').replace(/^0/, '62') : null

// Format input kode registrasi jadi XXX-XXXX-XXXX sambil mengetik
const formatCode = (value) => {
    const raw = value.replace(/-/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11)
    const part1 = raw.slice(0, 3)
    const part2 = raw.slice(3, 7)
    const part3 = raw.slice(7, 11)
    let formatted = part1
    if (part2) formatted += '-' + part2
    if (part3) formatted += '-' + part3
    return formatted
}



export default function ParentCheckPage() {
    const [code, setCode] = useState('')
    const [pin, setPin] = useState('')
    const [loading, setLoading] = useState(false)
    const [autoChecking, setAutoChecking] = useState(false)
    const [student, setStudent] = useState(null)
    const [errorMessage, setErrorMessage] = useState('')
    const [linkCopied, setLinkCopied] = useState(false)
    const [isShaking, setIsShaking] = useState(false)
    // Rate limiting — cooldown counter (detik tersisa)
    const [mounted, setMounted] = useState(false)
    const [loginCooldown, setLoginCooldown] = useState(0)
    const cooldownTimerRef = useRef(null)
    const { isDark, toggleTheme } = useTheme()

    useEffect(() => {
        document.title = 'Koperasi SenyumMu - Cek Tagihan Santri'
        return () => {
            document.title = 'Koperasi SenyumMu'
        }
    }, [])

    useEffect(() => {
        const timer = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(timer);
    }, []);

    // Bersihkan interval cooldown saat unmount
    useEffect(() => () => { if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current) }, [])

    const startCooldownTimer = (seconds) => {
        setLoginCooldown(seconds)
        if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current)
        cooldownTimerRef.current = setInterval(() => {
            setLoginCooldown(prev => {
                if (prev <= 1) { clearInterval(cooldownTimerRef.current); return 0 }
                return prev - 1
            })
        }, 1000)
    }

    const performCheck = useCallback(async (checkCode, checkPin) => {
        if (!checkCode || !checkPin) {
            setErrorMessage('Kode registrasi dan PIN harus diisi')
            return
        }

        // Cek rate limit sebelum request ke Supabase
        const rateData = getRateData()
        const now = Date.now()
        if (rateData.until > now) {
            const secsLeft = Math.ceil((rateData.until - now) / 1000)
            startCooldownTimer(secsLeft)
            setErrorMessage(`Terlalu banyak percobaan. Coba lagi dalam ${secsLeft} detik.`)
            return
        }

        const normalizedCode = checkCode.trim().toUpperCase()
        const normalizedPin = checkPin.trim()

        setLoading(true)
        setErrorMessage('')

        try {
            const { data: studentData, error: studentError } = await supabase
                .from('students')
                .select(`*, classes (id, name, homeroom_teacher_id, teachers:homeroom_teacher_id(name, phone))`)
                .eq('registration_code', normalizedCode)
                .eq('pin', normalizedPin)
                .single()

            if (studentError || !studentData) {
                // Tambah hitungan percobaan gagal
                const rd = getRateData()
                const newCount = rd.count + 1
                if (newCount >= RATE_MAX) {
                    const until = Date.now() + RATE_COOLDOWN * 1000
                    setRateData({ count: newCount, until })
                    startCooldownTimer(RATE_COOLDOWN)
                    throw new Error(`Terlalu banyak percobaan gagal. Silakan tunggu ${RATE_COOLDOWN} detik.`)
                }
                setRateData({ count: newCount, until: 0 })
                throw new Error(`Kode registrasi atau PIN tidak valid. Pastikan Anda memasukkan data yang benar. (${newCount}/${RATE_MAX})`)
            }

            // Login sukses — reset counter
            setRateData({ count: 0, until: 0 })

            setStudent({
                ...studentData,
                class: studentData.classes?.name || '-',
                homeroomTeacher: {
                    name: studentData.classes?.teachers?.name || null,
                    phone: studentData.classes?.teachers?.phone || null,
                },
            })

            toast.success('Data siswa berhasil ditemukan!')
        } catch (err) {
            // FIX MINOR: Hanya setErrorMessage — tidak perlu addToast juga.
            // Sebelumnya error muncul dua kali (inline form + toast pojok layar).
            // Form login sudah punya inline error area sendiri; toast cocok untuk
            // aksi background yang tidak punya area error di UI.
            setErrorMessage(err.message)
            setIsShaking(true)
            setTimeout(() => setIsShaking(false), 500)
        } finally {
            setLoading(false)
            setAutoChecking(false)
        }
    }, [])

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const urlCode = params.get('code')
        const urlPin = params.get('pin')
        if (urlCode && urlPin) {
            setCode(urlCode)
            setPin(urlPin)
            setAutoChecking(true)
            setTimeout(() => performCheck(urlCode, urlPin), 300)
        }
    }, [performCheck])

    const handleCheck = async (e) => {
        e.preventDefault()
        performCheck(code, pin)
    }

    const handleReset = () => {
        setStudent(null)
        setCode('')
        setPin('')
        setErrorMessage('')
        window.history.replaceState({}, '', '/check')
    }

    const handleCopyLink = () => {
        const url = `${window.location.origin}/check?code=${student?.registration_code}&pin=${pin}`
        const fallback = () => {
            const el = document.createElement('textarea')
            el.value = url
            document.body.appendChild(el)
            el.select()
            document.execCommand('copy')
            document.body.removeChild(el)
            setLinkCopied(true)
            toast.success('Link berhasil disalin!')
            setTimeout(() => setLinkCopied(false), 2500)
        }
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                setLinkCopied(true)
                toast.success('Link berhasil disalin!')
                setTimeout(() => setLinkCopied(false), 2500)
            }).catch(fallback)
        } else {
            fallback()
        }
    }

    // Auto-checking loading
    if (autoChecking) {
        return (
            <div className="min-h-screen bg-white dark:bg-[#0a0e1a] flex items-center justify-center p-4 transition-colors duration-300">
                <div className="text-center p-8 rounded-3xl bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border border-white/50 dark:border-white/[0.07] shadow-xl">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                        <Spinner className="animate-spin text-2xl text-white" />
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center overflow-hidden shadow-sm">
                            <img src={logoSenyum} alt="" className="w-5 h-5 object-contain" />
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">Koperasi Senyum</span>
                    </div>
                    <p className="text-gray-500 dark:text-white/40">Memuat data anak...</p>
                </div>
            </div>
        )
    }

    // Student result view
    if (student) {
        return (
            <div className="min-h-screen bg-[var(--color-surface)] py-8 px-4 relative overflow-x-hidden">
                {/* Ambient Background Glows */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[400px] bg-[var(--color-primary)]/5 rounded-full blur-[100px]" />
                </div>

                <div className="max-w-[480px] mx-auto space-y-6 relative z-10">
                    {/* Nav */}
                    <div className="flex items-center justify-between glass px-5 py-3 rounded-2xl">
                        <button onClick={handleReset} className="text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors flex items-center gap-2 uppercase tracking-wide">
                            <span className="w-7 h-7 rounded-full bg-[var(--color-surface-alt)] flex items-center justify-center border border-[var(--color-border)]"><ArrowLeft className="w-3 h-3" /></span>
                            Kembali
                        </button>
                        <div className="flex items-center gap-3">
                            <Link to="/" className="text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors uppercase tracking-wide">Beranda</Link>
                            <button onClick={toggleTheme} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-all">
                                {isDark ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                            </button>
                        </div>
                    </div>

                    {/* Profile Card */}
                    <div className="glass rounded-[2rem] overflow-hidden border border-[var(--color-border)]">
                        <div className="p-6 pb-0 flex items-center gap-5">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-3xl font-bold text-white shrink-0 overflow-hidden shadow-lg shadow-[var(--color-primary)]/20 shadow-inner">
                                {student.photo_url ? (
                                    <img src={student.photo_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    student.name.charAt(0)
                                )}
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-xl font-bold font-heading text-[var(--color-text)] leading-tight truncate">{student.name}</h2>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                                        {student.class}
                                    </span>
                                    <span className="text-xs font-mono font-medium text-[var(--color-text-muted)]">{student.registration_code}</span>
                                </div>
                            </div>
                        </div>

                        {/* ShareFat row */}
                        <div className="flex gap-2 px-4 py-3 border-t border-[var(--color-border)]">
                            <button
                                onClick={handleCopyLink}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[11px] font-black transition-all
                                    ${linkCopied
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                                        : 'bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30'
                                    }`}
                            >
                                {linkCopied ? <Check className="w-3 h-3" /> : <LinkIcon className="w-3 h-3" />}
                                {linkCopied ? 'Link tersalin!' : 'Salin Link'}
                            </button>
                            {(() => {
                                const waPhone = toWaNumber(student.phone)
                                const waText = encodeURIComponent(
                                    `Assalamu'alaikum, berikut akun tagihan ${student.name}:\n${window.location.origin}/check?code=${student.registration_code}&pin=${pin}`
                                )
                                const waHref = waPhone
                                    ? `https://wa.me/${waPhone}?text=${waText}`
                                    : `https://wa.me/?text=${waText}`
                                return (
                                    <a
                                        href={waHref}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[11px] font-black bg-emerald-500/10 border-emerald-500/25 text-emerald-600 hover:bg-emerald-500/20 transition-all"
                                        title={waPhone ? `Kirim ke ${student.phone}` : 'Nomor Whatsapp tidak tersedia, pilih kontak sendiri'}
                                    >
                                        <ChatCircle className="w-3 h-3" />
                                        {waPhone ? 'Kirim ke Whatsapp Saya' : 'Bagikan Whatsapp'}
                                    </a>
                                )
                            })()}
                        </div>
                        <p className="px-4 pb-3 text-[10px] text-amber-600 font-medium leading-relaxed flex items-start gap-1.5">
                            <ShieldCheck className="mt-0.5 shrink-0" />
                            Link ini mengandung PIN pribadi Anda. Jangan bagikan ke orang lain selain anggota keluarga yang Anda percaya.
                        </p>
                    </div>

                    {/* Support */}
                    {(() => {
                        const htPhone = toWaNumber(student.homeroomTeacher?.phone)
                        const htName = student.homeroomTeacher?.name
                        return (
                            <div className="bg-gradient-to-r from-gray-900 to-slate-800 rounded-2xl p-5 flex items-center justify-between gap-4 mt-2 shadow-xl">
                                <div className="min-w-0">
                                    <p className="font-bold text-white mb-1">Perlu Bantuan?</p>
                                    <p className="text-xs text-slate-300 truncate">
                                        {htName
                                            ? `Hubungi ${htName} — wali kelas ${student.class}`
                                            : 'Konsultasi langsung dengan wali kelas / BK'}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {htPhone ? (
                                        <>
                                            <a
                                                href={`https://wa.me/${htPhone}`}
                                                target="_blank" rel="noopener noreferrer"
                                                title={`Whatsapp ${htName || 'Wali Kelas'}`}
                                                className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-lg hover:bg-emerald-500 hover:text-white transition-all"
                                            >
                                                <ChatCircle />
                                            </a>
                                            <a
                                                href={`tel:+${htPhone}`}
                                                title={`Telepon ${htName || 'Wali Kelas'}`}
                                                className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white text-sm hover:bg-white/20 transition-all"
                                            >
                                                <Phone />
                                            </a>
                                        </>
                                    ) : (
                                        // Nomor wali kelas belum diisi di database — tombol dinonaktifkan
                                        <>
                                            <span className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400/40 text-lg cursor-not-allowed" title="Nomor wali kelas belum tersedia">
                                                <ChatCircle />
                                            </span>
                                            <span className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 text-sm cursor-not-allowed" title="Nomor wali kelas belum tersedia">
                                                <Phone />
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )
                    })()}

                    <p className="text-center text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.2em] pt-4 opacity-70">
                        Koperasi Senyum &copy; 2025
                    </p>
                </div>
            </div>
        )
    }

    // Form view
    return (
        <div className="min-h-screen flex bg-white dark:bg-[#0a0e1a] transition-colors duration-300">

            {/* PANEL KIRI — Branding */}
            <div
                className="hidden lg:flex lg:w-[44%] relative overflow-hidden
                           bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900
                           dark:from-[#0c0f19] dark:via-[#111827] dark:to-[#1e293b]
                           border-r border-blue-500/10 dark:border-white/[0.06]"
            >
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

                <div className="pointer-events-none absolute -top-24 -left-24 w-[420px] h-[420px] bg-blue-500/10 rounded-full blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-[380px] h-[380px] bg-indigo-500/10 rounded-full blur-3xl" />

                <div
                    className={`relative z-10 flex flex-col justify-between p-12 w-full transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-lg overflow-hidden">
                            <img src={logoSenyum} alt="Koperasi Senyum" className="w-8 h-8 object-contain" />
                        </div>
                        <div>
                            <span className="text-white font-bold text-lg tracking-tight block leading-tight">Koperasi Senyum</span>
                            {/* Pembeda portal — biar tidak ketuker dgn halaman login staff yang layout-nya identik */}
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300/70">Portal Wali Santri</span>
                        </div>
                    </div>

                    <div className="max-w-sm my-auto w-full">
                        <h1 className="text-3xl font-black text-white leading-tight mb-4">
                            Cek Tagihan &amp; Pembelian
                        </h1>
                        <p className="text-white/55 leading-relaxed mb-8">
                            Pantau tagihan SPP, riwayat pembayaran, dan transaksi koperasi
                            secara transparan &amp; real-time.
                        </p>

                        <div className="mt-12 relative">
                            <div
                                className={`p-5 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.07] shadow-2xl transition-all duration-1000 delay-[300ms] ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Tagihan Bulan Ini</span>
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-semibold flex items-center gap-1">
                                        <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                                        Rp 900.000
                                    </span>
                                </div>
                                <div className="text-2xl font-bold text-white tracking-tight mb-4">Rp 300.000</div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/60">Progres Pelunasan</span>
                                        <span className="text-white font-medium">70%</span>
                                    </div>
                                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000 delay-700" style={{ width: mounted ? '70%' : '0%' }} />
                                    </div>
                                </div>
                            </div>

                            <div
                                className={`absolute -bottom-8 -right-4 p-3.5 rounded-xl bg-[#1e293b]/95 backdrop-blur-md border border-white/[0.08] shadow-2xl flex items-center gap-3 transition-all duration-1000 delay-[500ms] hover:scale-102 duration-300 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
                            >
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                    <CreditCard className="w-4 h-4 text-blue-400" />
                                </div>
                                <div>
                                    <div className="text-white text-xs font-bold">Pembayaran Terakhir</div>
                                    <div className="text-white/55 text-[10px]">20 Juni 2026 • Rp 300.000</div>
                                </div>
                            </div>

                            <div
                                className={`absolute -top-6 -left-6 p-2.5 rounded-xl bg-white/[0.05] backdrop-blur-md border border-white/[0.08] shadow-lg flex items-center gap-2 transition-all duration-1000 delay-[700ms] hover:scale-102 duration-300 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
                            >
                                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                </div>
                                <div className="text-white text-xs font-semibold whitespace-nowrap">Transparan &amp; Terpercaya</div>
                            </div>
                        </div>

                        {/* Trust indicators — mengisi ruang kosong & menambah kredibilitas.
                            Angka masih placeholder, sambungkan ke data asli (jumlah santri aktif dsb) kalau tersedia. */}
                        <div className="mt-16 flex items-center gap-6">
                            <div>
                                <p className="text-white text-xl font-bold leading-none">500+</p>
                                <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mt-1.5">Santri Terdaftar</p>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div>
                                <p className="text-white text-xl font-bold leading-none">24/7</p>
                                <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mt-1.5">Akses Real-time</p>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div>
                                <p className="text-white text-xl font-bold leading-none">100%</p>
                                <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mt-1.5">Transparan</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-white/40 text-xs">
                        &copy; 2025 Koperasi Senyum. Powered by TechSchool.
                    </p>
                </div>
            </div>

            {/* PANEL KANAN — Form Check */}
            <div className="flex-1 flex items-center justify-center relative overflow-hidden p-4">

                <div className="pointer-events-none absolute inset-0 z-0 hidden dark:block bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px]" />

                <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[800px] h-[800px] bg-blue-50/50 dark:bg-blue-500/3 rounded-full blur-3xl pointer-events-none lg:opacity-30" />
                <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[600px] h-[600px] bg-slate-50/50 dark:bg-indigo-500/2 rounded-full blur-3xl pointer-events-none lg:opacity-30" />

                {/* fixed (bukan absolute) — biar toggle tetap nempel di pojok layar meski card lebih tinggi dari viewport / ter-scroll */}
                <div className="fixed top-4 right-4 z-20">
                    <ThemeToggle />
                </div>

                <div className="w-full max-w-md relative z-10">
                    <div
                        className={`bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border border-white/50 dark:border-white/[0.07] rounded-2xl shadow-xl dark:shadow-none p-8 md:p-10 transition-all duration-700 ease-out ${mounted ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-4'}`}
                    >
                        <div className="text-center mb-10 lg:hidden">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10 bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.08] transform rotate-3 hover:rotate-0 transition-transform duration-300 overflow-hidden">
                                <img src={logoSenyum} alt="Koperasi Senyum" className="w-11 h-11 object-contain" />
                            </div>
                            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Cek Tagihan Santri</h2>
                            <p className="text-gray-500 dark:text-white/40">Gunakan kode registrasi & PIN dari administrasi pondok</p>
                        </div>

                        <div className="hidden lg:block text-left mb-10">
                            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Cek Tagihan Santri</h2>
                            <p className="text-gray-500 dark:text-white/40 text-sm">Masukkan kode registrasi dan PIN dari administrasi.</p>
                        </div>

                        <form onSubmit={handleCheck} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-white/70 ml-1">Kode Registrasi</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <IdentificationCard className="h-5 w-5 text-gray-400 dark:text-white/30 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(formatCode(e.target.value))}
                                        placeholder="REG-XXXX-XXXX"
                                        className="block w-full pl-10 pr-3 py-3 rounded-xl leading-5 border border-gray-200 dark:border-white/[0.1] bg-gray-50 dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:bg-white dark:focus:bg-white/[0.06] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-black uppercase tracking-[0.2em]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-white/70 ml-1">PIN Rahasia</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Key className="h-5 w-5 text-gray-400 dark:text-white/30 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        placeholder="••••"
                                        maxLength={4}
                                        className="block w-full pl-10 pr-3 py-3 rounded-xl leading-5 border border-gray-200 dark:border-white/[0.1] bg-gray-50 dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:bg-white dark:focus:bg-white/[0.06] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg font-bold tracking-[0.5em]"
                                    />
                                </div>
                            </div>

                            {errorMessage && (
                                <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">!</div>
                                    <p className="text-sm font-medium text-red-500">
                                        {errorMessage}
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || loginCooldown > 0}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-transparent shadow-lg shadow-blue-500/25 dark:shadow-blue-500/10 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5"
                            >
                                {loading ? (
                                    <><Spinner className="w-5 h-5 animate-spin" /> Memeriksa...</>
                                ) : loginCooldown > 0 ? (
                                    <><Spinner className="w-5 h-5 animate-spin" /> Tunggu {loginCooldown}s</>
                                ) : (
                                    <>Cek Tagihan</>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/[0.07] text-center">
                            <p className="text-xs text-gray-400 dark:text-white/30">Belum punya kode? Hubungi bagian administrasi atau bendahara pondok.</p>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/[0.07] text-center lg:hidden">
                            <p className="text-xs text-gray-400 dark:text-white/30">
                                &copy; 2025 Koperasi Senyum. Powered by TechSchool.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-4 mt-6 px-2">
                        {/* py-2 -my-2: memperbesar tap area di mobile tanpa mengubah ukuran/jarak visual */}
                        <Link to="/login" className="text-xs font-bold text-gray-400 dark:text-white/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2 -my-2">
                            Guru/Staff Login
                        </Link>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                        <Link to="/" className="text-xs font-bold text-gray-400 dark:text-white/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2 -my-2">
                            Beranda
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}