import { useState, useEffect, useCallback, useRef, memo } from 'react'
import { ArrowDown, ArrowLeft, ArrowUp, ChartBar, BookOpenText, Buildings, Calendar, Check, CaretDown, CaretUp, ClipboardText, CreditCard, FileText, IdentificationCard, Key, Translate, Link as LinkIcon, Spinner, ChatCircle, Moon, Phone, MagnifyingGlass, ShieldCheck, Star, Sun, Trophy, User } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'


import toast from 'react-hot-toast'
import { useTheme } from '@context'
import { supabase } from '@lib/supabase'
import mbsLogo from '@assets/images/logos/logo-mbs.png'

import ThemeToggle from '../../public/components/common/ThemeToggle'
import logoSenyum from '../../../assets/images/logos/logo-senyum.png'

// ─── Constants & Utils ───────────────────────────────────────────────────────

// FIX #15: Helper withTimeout agar generatePDFBlob tidak hang selamanya
const withTimeout = (promise, ms, label = 'Operasi') =>
    Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout setelah ${ms / 1000}s`)), ms)),
    ])

// Ganti ke `true` jika fitur unduh PDF raport sudah siap diaktifkan kembali
const ENABLE_PDF_DOWNLOAD = false

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

// Fallback school settings — sama persis dengan SchoolSettingsContext
const DEFAULT_SETTINGS = {
    school_name_id: 'Muhammadiyah Boarding Buildings (MBS) Tanggul',
    school_name_ar: 'معهد محمدي&copy; الإسلامي تانجول',
    school_subtitle_ar: 'المجلس التعليمي للمرحلتين الابتدائي&copy; والمتوسط&copy; التابع للرئاس&copy; الفرعي&copy; للجمعي&copy; المحمدي&copy;',
    school_address: 'Jl. Pemandian no. 88 RT 002 RW 003 Patemon, Tanggul, Jember 68155',
    logo_url: '/src/assets/mbs.png',
    headmaster_title_id: 'Direktur MBS Tanggul',
    headmaster_name_id: 'KH. Muhammad Ali Maksum, Lc',
    headmaster_title_ar: 'مدير معهد محمدي&copy; الإسلامي تانجول',
    headmaster_name_ar: 'كياهي الحاج محمد علي معصوم، ليسانس',
    report_color_primary: '#1a5c35',
    report_color_secondary: '#c8a400',
    wa_footer: 'MBS Tanggul · Koperasi SenyumMu',
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

// Satu baris riwayat perilaku (pelanggaran / prestasi) — dipakai di dua daftar
// agar markup tidak duplikat. `positive` menentukan skema warna & tanda "+".
const BehaviorItem = memo(function BehaviorItem({ item, positive }) {
    const badgeWrap = positive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'
    const badgeText = positive ? 'text-emerald-500' : 'text-red-500'
    const hoverBorder = positive ? 'hover:border-emerald-500/30' : 'hover:border-red-500/30'

    return (
        <div className={`glass rounded-2xl px-5 py-4 flex justify-between items-center gap-4 ${hoverBorder} transition-all group`}>
            <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl ${badgeWrap} flex items-center justify-center shrink-0`}>
                    <span className={`text-xs font-black ${badgeText}`}>{item.teacher[0]?.toUpperCase() || '?'}</span>
                </div>
                <div className="min-w-0">
                    <p className="font-bold text-[var(--color-text)] leading-tight truncate mb-1">{item.type}</p>
                    <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-widest opacity-60">
                        <span className="tabular-nums">{item.date}</span>
                        <span className="w-1 h-1 rounded-full bg-[var(--color-border)]"></span>
                        <span className="truncate">{item.teacher}</span>
                    </div>
                </div>
            </div>
            <div className={`shrink-0 flex items-center justify-center px-3 py-1.5 rounded-lg ${badgeWrap} ${badgeText} font-black font-mono w-4 h-4 shadow-sm`}>
                {positive ? '+' : ''}{item.points}
            </div>
        </div>
    )
})

export default function ParentCheckPage() {
    const [code, setCode] = useState('')
    const [pin, setPin] = useState('')
    const [loading, setLoading] = useState(false)
    const [autoChecking, setAutoChecking] = useState(false)
    const [student, setStudent] = useState(null)
    const [errorMessage, setErrorMessage] = useState('')
    const [activeTab, setActiveTab] = useState('perilaku')
    const [raportHistory, setRaportHistory] = useState([])
    const [raportLoading, setRaportLoading] = useState(false)
    const [expandedRaport, setExpandedRaport] = useState(null)
    const [linkCopied, setLinkCopied] = useState(false)
    const [pdfLoading, setPdfLoading] = useState(null)
    const [settings, setSettings] = useState({})
    const [printQueue, setPrintQueue] = useState([])
    const [printRenderedCount, setPrintRenderedCount] = useState(0)
    const [printRaportData, setPrintRaportData] = useState(null)
    const [isShaking, setIsShaking] = useState(false)
    // Rate limiting — cooldown counter (detik tersisa)
    const [mounted, setMounted] = useState(false)
    const [loginCooldown, setLoginCooldown] = useState(0)
    const printContainerRef = useRef(null)
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

            // Batasi 200 riwayat terbaru — wali santri tidak perlu lebih dari itu,
            // dan mencegah silent truncation di Supabase (default limit 1000)
            const { data: historyData } = await supabase
                .from('behavior_reports')
                .select('id, created_at, type, points, teacher_name')
                .eq('student_id', studentData.id)
                .order('created_at', { ascending: false })
                .limit(200)

            const reports = (historyData || []).filter(h => h.points < 0).map(h => ({
                id: h.id,
                date: new Date(h.created_at).toLocaleDateString('id-ID'),
                type: h.type,
                points: h.points,
                teacher: h.teacher_name || 'Staff Sekolah'
            }))

            const achievements = (historyData || []).filter(h => h.points >= 0).map(h => ({
                id: h.id,
                date: new Date(h.created_at).toLocaleDateString('id-ID'),
                type: h.type,
                points: h.points,
                teacher: h.teacher_name || 'Staff Sekolah'
            }))

            setStudent({
                ...studentData,
                class: studentData.classes?.name || '-',
                points: studentData.total_points || 0,
                homeroomTeacher: {
                    name: studentData.classes?.teachers?.name || null,
                    phone: studentData.classes?.teachers?.phone || null,
                },
                reports,
                achievements
            })

            toast.success('Data siswa berhasil ditemukan!')

            // Fetch raport bulanan — blok terpisah agar error di sini
            // tidak menimpa pesan error login, dan raportLoading SELALU
            // di-reset lewat finally meski query gagal / timeout.
            setRaportLoading(true)
            try {
                const { data: raportData, error: raportError } = await supabase
                    .from('student_monthly_reports')
                    .select('*')
                    .eq('student_id', studentData.id)
                    .order('year', { ascending: false })
                    .order('month', { ascending: false })
                if (raportError) throw raportError
                setRaportHistory(raportData || [])
            } catch (raportErr) {
                console.error('Gagal memuat raport history:', raportErr)
                toast.error('Gagal memuat riwayat raport. Coba muat ulang halaman.')
                setRaportHistory([])
            } finally {
                // FIX MAJOR: raportLoading SELALU di-reset di sini.
                // Sebelumnya hanya di-reset di happy path sehingga
                // spinner bisa stuck selamanya jika query error.
                setRaportLoading(false)
            }
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

    // Fetch school settings — sama persis dengan SchoolSettingsContext
    useEffect(() => {
        supabase.from('school_settings').select('*').eq('id', 1).maybeSingle()
            .then(({ data }) => setSettings(data ? { ...DEFAULT_SETTINGS, ...data } : DEFAULT_SETTINGS))
            .catch(() => setSettings(DEFAULT_SETTINGS))
    }, [])

    // handlePrintRaport — IDENTIK dengan RaportPage generatePDFBlob
    //
    // 'Amiri' di-load secara eksplisit untuk memastikan font tersedia sebelum render.
    const handlePrintRaport = async (r) => {
        setPdfLoading(r.id)
        try {
            const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
                import('html2canvas'),
                import('jspdf')
            ])

            // Wait for fonts
            await document.fonts.ready

            // Set data → trigger JSX render
            setPrintRaportData({ r, student })
            setPrintRenderedCount(0)
            setPrintQueue([r.id])
            // Poll sampai card ada di DOM
            let cardEl = null
            await new Promise(resolve => {
                let t = 0
                const timer = setInterval(() => {
                    const card = printContainerRef.current?.querySelector(`.raport-card[data-student-id="${student.id}"]`)
                    if (card) { cardEl = card; clearInterval(timer); resolve() }
                    if (++t > 50) { clearInterval(timer); resolve() }
                }, 100)
            })
            if (!cardEl) throw new Error('Gagal render raport card')

            // Preload images inside cardEl
            const cardImgs = cardEl.querySelectorAll('img')
            await Promise.allSettled(Array.from(cardImgs).map(img => new Promise(res => {
                if (img.complete && img.naturalWidth > 0) return res()
                img.onload = res; img.onerror = res
            })))
            await new Promise(res => setTimeout(res, 300))

            // Snapshot — identik RaportPage
            const rootStyles = getComputedStyle(document.documentElement)
            const cssVars = ['--color-border', '--color-surface', '--color-surface-alt', '--color-text', '--color-text-muted'].map(v => `${v}: ${rootStyles.getPropertyValue(v).trim() || '#ccc'};`).join(' ')
            const A4W = 794, A4H = 1123, wrapper = document.createElement('div')
            wrapper.style.cssText = `position:fixed;left:-9999px;top:0;width:${A4W}px;height:${A4H}px;background:white;overflow:hidden;display:flex;align-items:flex-start;justify-content:center;font-family:'Times New Roman',serif;`
            wrapper.innerHTML = `<style>:root{${cssVars}}*{box-sizing:border-box;-webkit-print-color-adjust:exact!important}img{mix-blend-mode:multiply}.raport-card{width:${A4W}px!important;min-width:${A4W}px!important;height:${A4H}px!important;overflow:hidden!important;background:white!important;margin:0!important}</style>${cardEl.outerHTML}`
            document.body.appendChild(wrapper)
            await new Promise(res => setTimeout(res, 700))
            try {
                const canvas = await withTimeout(
                    html2canvas(wrapper, {
                        scale: 3,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        width: A4W,
                        height: A4H,
                        scrollX: 0,
                        scrollY: 0,
                        logging: false,
                    }),
                    15000, 'Render PDF'
                )
                const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true })
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297)
                const bulanObj = BULAN.find(b => b.id === r.month)
                const bulanStr = bulanObj?.id_str || String(r.month)
                const safeName = student.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
                const safeClass = (student.class || '').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
                pdf.save(`Raport_${safeName}_${safeClass}_${bulanStr}_${r.year}.pdf`)
                toast.success('PDF berhasil diunduh!')
            } finally {
                if (document.body.contains(wrapper)) document.body.removeChild(wrapper)
                // Cleanup SETELAH snapshot — bukan sebelum (Bug #3 fix dari sesi sebelumnya)
                setPrintQueue([])
                setPrintRenderedCount(0)
                setPrintRaportData(null)
            }
        } catch (err) {
            console.error(err)
            toast.error('Gagal membuat PDF. Coba lagi.')
            setPrintQueue([])
            setPrintRenderedCount(0)
            setPrintRaportData(null)
        } finally {
            setPdfLoading(null)
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
        const latestRaport = raportHistory[0] || null
        const now = new Date()
        const currentMonth = now.getMonth() + 1
        const currentYear = now.getFullYear()

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

                        {/* Stats */}
                        <div className="grid grid-cols-3 mt-6 bg-[var(--color-surface-alt)]/50 border-t border-[var(--color-border)] divide-x divide-[var(--color-border)]">
                            <div className="p-4 text-center">
                                <p className={`text-2xl font-bold font-heading mb-0.5 ${student.points >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {student.points > 0 ? '+' : ''}{student.points}
                                </p>
                                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Total Poin</p>
                            </div>
                            <div className="p-4 text-center">
                                <p className="text-2xl font-bold font-heading text-red-500 mb-0.5">{student.reports.length}</p>
                                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Pelanggaran</p>
                            </div>
                            <div className="p-4 text-center">
                                <p className="text-2xl font-bold font-heading text-emerald-500 mb-0.5">{raportHistory.length}</p>
                                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Raport</p>
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
                                    `Assalamu'alaikum, berikut link raport ${student.name} di Pondok:\n${window.location.origin}/check?code=${student.registration_code}&pin=${pin}`
                                )
                                // Jika nomor Whatsapp tersedia → langsung buka chat ke nomor wali santri
                                // Jika tidak → buka Whatsapp tanpa nomor (wali santri pilih sendiri)
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
                        {/* Catatan keamanan untuk wali santri */}
                        <p className="px-4 pb-3 text-[10px] text-amber-600 font-medium leading-relaxed flex items-start gap-1.5">
                            <ShieldCheck className="mt-0.5 shrink-0" />
                            Link ini mengandung PIN pribadi Anda. Jangan bagikan ke orang lain selain anggota keluarga yang Anda percaya.
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="glass rounded-2xl p-1.5 flex gap-1">
                        <button onClick={() => setActiveTab('perilaku')}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5
                                ${activeTab === 'perilaku' ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}>
                            <ChartBar className="w-3 h-3" /> Perilaku
                        </button>
                        <button onClick={() => { setActiveTab('raport'); localStorage.setItem('raport_last_viewed_month', `${currentYear}-${currentMonth}`) }}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 relative
                                ${activeTab === 'raport' ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}>
                            <ClipboardText className="w-3 h-3" /> Raport Bulanan
                            {raportHistory.length > 0 && (
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${activeTab === 'raport' ? 'bg-white/20 border-white/30 text-white' : 'bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-muted)]'}`}>
                                    {raportHistory.length}
                                </span>
                            )}
                            {latestRaport && latestRaport.month === currentMonth && latestRaport.year === currentYear &&
                                localStorage.getItem('raport_last_viewed_month') !== `${currentYear}-${currentMonth}` && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-[var(--color-surface)]" />
                                )}
                        </button>
                    </div>

                    {/* ── TAB: PERILAKU ── */}
                    {activeTab === 'perilaku' && (
                        <div className="space-y-4">
                            {/* Reports */}
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest px-2 flex items-center gap-2">
                                    <span className="flex h-2.5 w-2.5 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                    </span>
                                    Riwayat Pelanggaran
                                </p>
                                {student.reports.length > 0 ? (
                                    <div className="space-y-2">
                                        {student.reports.map((report) => (
                                            <BehaviorItem key={report.id} item={report} positive={false} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 bg-[var(--color-surface-alt)]/50 rounded-2xl border border-[var(--color-border)] text-center flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in duration-500">
                                        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                            <ShieldCheck className="text-2xl text-emerald-500 opacity-20" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-[var(--color-text)]">Nihil Pelanggaran</p>
                                            <p className="text-[11px] text-[var(--color-text-muted)] mt-1 opacity-60">Santri berlaku sangat baik sejauh ini.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Achievements */}
                            <div className="space-y-3 pt-2">
                                <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest px-2 flex items-center gap-2">
                                    <span className="flex h-2.5 w-2.5 relative">
                                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                    </span>
                                    Riwayat Prestasi
                                </p>
                                {student.achievements.length > 0 ? (
                                    <div className="space-y-2">
                                        {student.achievements.map((item) => (
                                            <BehaviorItem key={item.id} item={item} positive={true} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 bg-[var(--color-surface-alt)]/50 rounded-2xl border border-[var(--color-border)] text-center flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in duration-500">
                                        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                            <Trophy className="text-2xl text-amber-500 opacity-20" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-[var(--color-text)]">Belum Ada Prestasi</p>
                                            <p className="text-[11px] text-[var(--color-text-muted)] mt-1 opacity-60 px-6">Setiap pencapaian positif santri akan muncul di sini.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── TAB: RAPORT BULANAN ── */}
                    {activeTab === 'raport' && (
                        <div className="space-y-3">
                            {raportLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-24 rounded-2xl bg-[var(--color-surface-alt)] animate-pulse border border-[var(--color-border)]" />
                                    ))}
                                </div>
                            ) : raportHistory.length === 0 ? (
                                <div className="py-14 bg-[var(--color-surface-alt)]/50 rounded-2xl border border-[var(--color-border)] text-center flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in duration-500">
                                    <div className="w-16 h-16 rounded-3xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center">
                                        <Calendar className="text-2xl text-[var(--color-primary)] opacity-20" />
                                    </div>
                                    <div className="px-6">
                                        <p className="text-sm font-black text-[var(--color-text)]">Raport Belum Tersedia</p>
                                        <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5 opacity-60 leading-relaxed">
                                            Raport bulan <span className="font-bold">{BULAN_STR[currentMonth]} {currentYear}</span> belum diisi oleh musyrif.
                                        </p>
                                    </div>
                                    {student.homeroomTeacher?.phone && (
                                        <a
                                            href={`https://wa.me/${toWaNumber(student.homeroomTeacher.phone)}`}
                                            target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 text-xs font-black hover:bg-emerald-500/20 transition-all"
                                        >
                                            <ChatCircle className="w-4 h-4" />
                                            Hubungi {student.homeroomTeacher.name || 'Wali Kelas'}
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* ── Mini Trend Chart rata-rata bulanan ── */}
                                    {raportHistory.length >= 2 && (() => {
                                        const chronological = [...raportHistory].reverse()
                                        const avgs = chronological.map(r => {
                                            const vals = KRITERIA_LIST.map(k => r[k.key]).filter(v => v !== null && v !== undefined && v !== '')
                                            return vals.length ? vals.reduce((a, b) => a + Number(b), 0) / vals.length : null
                                        }).filter(v => v !== null)
                                        if (avgs.length < 2) return null
                                        const W = 260, H = 52, pad = 6
                                        const minV = Math.min(...avgs), maxV = Math.max(...avgs)
                                        const range = maxV - minV || 0.5
                                        const pts = avgs.map((v, i) => {
                                            const x = pad + (i / (avgs.length - 1)) * (W - pad * 2)
                                            const y = H - pad - ((v - minV) / range) * (H - pad * 2)
                                            return `${x},${y}`
                                        }).join(' ')
                                        const last = avgs[avgs.length - 1], prev = avgs[avgs.length - 2]
                                        const trendColor = last > prev ? '#10b981' : last < prev ? '#ef4444' : '#6366f1'
                                        const trendLabel = last > prev ? '↑ Naik' : last < prev ? '↓ Turun' : '→ Stabil'
                                        return (
                                            <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Tren Rata-rata Nilai</p>
                                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: trendColor + '20', color: trendColor }}>{trendLabel} · {last.toFixed(1)}</span>
                                                </div>
                                                <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} aria-hidden="true" style={{ overflow: 'visible' }}>
                                                    {[0.25, 0.5, 0.75].map((sc, i) => (
                                                        <line key={i} x1={pad} y1={pad + sc * (H - pad * 2)} x2={W - pad} y2={pad + sc * (H - pad * 2)} stroke="var(--color-border)" strokeWidth="0.8" strokeDasharray="3,3" />
                                                    ))}
                                                    <defs>
                                                        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor={trendColor} stopOpacity="0.18" />
                                                            <stop offset="100%" stopColor={trendColor} stopOpacity="0.02" />
                                                        </linearGradient>
                                                    </defs>
                                                    <polygon points={`${pad},${H - pad} ${pts} ${W - pad},${H - pad}`} fill="url(#trendFill)" />
                                                    <polyline points={pts} fill="none" stroke={trendColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                                                    {avgs.map((v, i) => {
                                                        const x = pad + (i / (avgs.length - 1)) * (W - pad * 2)
                                                        const y = H - pad - ((v - minV) / range) * (H - pad * 2)
                                                        const label = BULAN_STR[chronological[i]?.month]?.slice(0, 3) || ''
                                                        return (
                                                            <g key={i}>
                                                                <circle cx={x} cy={y} r={i === avgs.length - 1 ? 4 : 2.5} fill={i === avgs.length - 1 ? trendColor : 'var(--color-surface)'} stroke={trendColor} strokeWidth="1.5" />
                                                                <text x={x} y={H} textAnchor="middle" fontSize="7" fontWeight="700" fill="var(--color-text-muted)">{label}</text>
                                                            </g>
                                                        )
                                                    })}
                                                </svg>
                                            </div>
                                        )
                                    })()}
                                    {raportHistory.map((r, idx) => {
                                        const avg = calcAvg(r)
                                        const g = avg ? getGrade(avg) : null
                                        const isLatest = r.month === currentMonth && r.year === currentYear
                                        const isExpanded = expandedRaport === r.id
                                        const allFilled = KRITERIA_LIST.every(k => r[k.key] !== null && r[k.key] !== undefined && r[k.key] !== '')
                                        const prevR = raportHistory[idx + 1] || null

                                        return (
                                            <div key={r.id}
                                                className="glass rounded-2xl border overflow-hidden transition-all"
                                                style={{ borderColor: isLatest ? 'rgba(16,185,129,0.3)' : 'var(--color-border)', background: isLatest ? 'rgba(16,185,129,0.03)' : undefined }}>
                                                {/* Card Header — always visible */}
                                                <button className="w-full px-5 py-4 flex items-center gap-3 text-left"
                                                    onClick={() => setExpandedRaport(isExpanded ? null : r.id)}>
                                                    <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border"
                                                        style={{ background: g ? g.bg : 'var(--color-surface-alt)', borderColor: g ? g.border : 'var(--color-border)' }}>
                                                        <ClipboardText className="w-4 h-4" style={{ color: g ? g.color : 'var(--color-text-muted)' }} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="text-sm font-black text-[var(--color-text)]">
                                                                {BULAN_STR[r.month]} {r.year}
                                                            </p>
                                                            {isLatest && (
                                                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                                                                    ✦ Terbaru
                                                                </span>
                                                            )}
                                                            {!allFilled && (
                                                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/20">
                                                                    Belum lengkap
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            {r.musyrif && (
                                                                <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
                                                                    <User className="w-2 h-2" /> {r.musyrif}
                                                                </span>
                                                            )}
                                                            {avg && g && (
                                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-md" style={{ background: g.bg, color: g.color }}>
                                                                    Rata-rata {avg} — {g.label}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {isExpanded ? <CaretUp className="w-3 h-3 text-[var(--color-text-muted)] shrink-0" /> : <CaretDown className="w-3 h-3 text-[var(--color-text-muted)] shrink-0" />}
                                                </button>

                                                {/* Expanded detail */}
                                                {isExpanded && (
                                                    <div className="px-5 pb-5 pt-1 border-t border-[var(--color-border)] space-y-4">
                                                        {/* Nilai 5 kriteria + delta arrow */}
                                                        <div className="grid grid-cols-5 gap-2 pt-3">
                                                            {KRITERIA_LIST.map(k => {
                                                                const val = r[k.key]
                                                                const vNum = val !== null && val !== undefined && val !== '' ? Number(val) : null
                                                                const kg = vNum !== null ? getGrade(vNum) : null
                                                                const prevVal = prevR?.[k.key]
                                                                const prevNum = prevVal !== null && prevVal !== undefined && prevVal !== '' ? Number(prevVal) : null
                                                                const delta = (vNum !== null && prevNum !== null) ? vNum - prevNum : null
                                                                return (
                                                                    <div key={k.key} className="flex flex-col items-center gap-1">
                                                                        <k.icon className="text-[10px]" style={{ color: k.color }} />
                                                                        <span className="text-[8px] font-black text-center leading-tight" style={{ color: k.color }}>
                                                                            {k.label}
                                                                        </span>
                                                                        <div className="w-full h-9 rounded-xl flex items-center justify-center text-[14px] font-black border"
                                                                            style={{
                                                                                background: kg ? kg.bg : 'var(--color-surface-alt)',
                                                                                color: kg ? kg.color : 'var(--color-text-muted)',
                                                                                borderColor: kg ? kg.border : 'var(--color-border)'
                                                                            }}>
                                                                            {vNum !== null ? vNum : '—'}
                                                                        </div>
                                                                        {delta !== null && delta !== 0 && (
                                                                            <span className={`text-[8px] font-black flex items-center gap-0.5 ${delta > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                                                                                {delta > 0 ? <ArrowUp className="w-2 h-2" /> : <ArrowDown className="w-2 h-2" />}
                                                                                {Math.abs(delta)}
                                                                            </span>
                                                                        )}
                                                                        {delta === 0 && prevNum !== null && (
                                                                            <span className="text-[8px] text-[var(--color-text-muted)]">—</span>
                                                                        )}
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>

                                                        {/* Data tambahan jika ada */}
                                                        {(r.ziyadah || r.murojaah || r.hari_sakit || r.hari_izin || r.hari_alpa || r.berat_badan || r.tinggi_badan) && (
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {r.ziyadah && (
                                                                    <div className="px-3 py-2 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)]">
                                                                        <p className="text-[8px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Ziyadah</p>
                                                                        <p className="font-black text-emerald-500">{r.ziyadah}</p>
                                                                    </div>
                                                                )}
                                                                {r.murojaah && (
                                                                    <div className="px-3 py-2 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)]">
                                                                        <p className="text-[8px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Muroja'ah</p>
                                                                        <p className="font-black text-indigo-500">{r.murojaah}</p>
                                                                    </div>
                                                                )}
                                                                {(r.hari_sakit !== null && r.hari_sakit !== undefined) && (
                                                                    <div className="px-3 py-2 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)]">
                                                                        <p className="text-[8px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Hari Sakit</p>
                                                                        <p className="font-black text-red-400">{r.hari_sakit} hari</p>
                                                                    </div>
                                                                )}
                                                                {(r.hari_izin !== null && r.hari_izin !== undefined) && (
                                                                    <div className="px-3 py-2 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)]">
                                                                        <p className="text-[8px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Hari Izin</p>
                                                                        <p className="font-black text-amber-500">{r.hari_izin} hari</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Catatan musyrif */}
                                                        {r.catatan && (
                                                            <div className="px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
                                                                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Catatan Musyrif</p>
                                                                <p className="text-sm text-[var(--color-text)] leading-relaxed">{r.catatan}</p>
                                                            </div>
                                                        )}

                                                        {/* Tombol Unduh PDF — dikontrol oleh ENABLE_PDF_DOWNLOAD di atas
                                                         Ubah konstanta tersebut menjadi `true` untuk mengaktifkan kembali */}
                                                        {ENABLE_PDF_DOWNLOAD && (
                                                            <button
                                                                onClick={() => handlePrintRaport(r)}
                                                                disabled={pdfLoading === r.id}
                                                                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[11px] font-black transition-all mt-1
                                                                ${pdfLoading === r.id
                                                                        ? 'bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-muted)] opacity-60 cursor-not-allowed'
                                                                        : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/20'
                                                                    }`}
                                                            >
                                                                {pdfLoading === r.id ? <Spinner className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                                                                {pdfLoading === r.id ? 'Membuat PDF...' : `Unduh PDF — ${BULAN_STR[r.month]} ${r.year}`}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </>
                            )}
                        </div>
                    )}

                    {/* Hidden container untuk render PDF — dikontrol oleh ENABLE_PDF_DOWNLOAD */}
                    {ENABLE_PDF_DOWNLOAD && printQueue.length > 0 && printRaportData && (
                        <div ref={printContainerRef} style={{ position: 'fixed', left: '-9999px', top: 0, width: '1000px', visibility: 'hidden', pointerEvents: 'none' }}>
                            <RaportPrintCard
                                student={printRaportData.student}
                                scores={{
                                    nilai_akhlak: printRaportData.r.nilai_akhlak,
                                    nilai_ibadah: printRaportData.r.nilai_ibadah,
                                    nilai_kebersihan: printRaportData.r.nilai_kebersihan,
                                    nilai_quran: printRaportData.r.nilai_quran,
                                    nilai_bahasa: printRaportData.r.nilai_bahasa,
                                }}
                                extra={{
                                    berat_badan: printRaportData.r.berat_badan,
                                    tinggi_badan: printRaportData.r.tinggi_badan,
                                    ziyadah: printRaportData.r.ziyadah,
                                    murojaah: printRaportData.r.murojaah,
                                    hari_sakit: printRaportData.r.hari_sakit,
                                    hari_izin: printRaportData.r.hari_izin,
                                    hari_alpa: printRaportData.r.hari_alpa,
                                    hari_pulang: printRaportData.r.hari_pulang,
                                    catatan: printRaportData.r.catatan,
                                }}
                                bulanObj={BULAN.find(b => b.id === printRaportData.r.month)}
                                tahun={printRaportData.r.year}
                                musyrif={printRaportData.r.musyrif}
                                className={printRaportData.student.class}
                                lang="id"
                                settings={settings}
                                onRendered={() => setPrintRenderedCount(c => c + 1)}
                                reportType="bulanan"
                            />
                        </div>
                    )}

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