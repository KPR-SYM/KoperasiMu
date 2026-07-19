import { useState } from 'react';
import { checkPublicBilling } from '../../../services/studentService';
import { Spinner, MagnifyingGlass, WarningCircle, CheckCircle, CreditCard, Calendar, Info, ShieldCheck, Eye, EyeSlash, Clock, Wallet, TrendUp, Sparkle, ChatCircle, ShoppingBag, Receipt } from '@phosphor-icons/react';
import { EmptyState } from '@shared/components';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const DEMO_REG = 'REG-2026-0001';
const DEMO_PIN = '123456';

const DEMO_RESULT = {
    student: {
        name: 'Ahmad Raihan',
        registrationNumber: DEMO_REG,
        className: 'Kelas 8B',
        program: 'Reguler',
    },
    billing: {
        balance: 900000,
        totalPaid: 2100000,
        totalLiabilities: 3000000,
        lastPaymentDate: '2026-06-20',
    },
    liabilities: [
        { id: 1, description: 'SPP Bulan Juni 2026', amount: 300000, dueDate: '2026-06-10', isPaid: true },
        { id: 2, description: 'SPP Bulan Juli 2026', amount: 300000, dueDate: '2026-07-10', isPaid: false },
        { id: 3, description: 'Iuran Kegiatan Semester', amount: 600000, dueDate: '2026-07-15', isPaid: false },
    ],
    recentPayments: [
        { id: 1, amount: 300000, method: 'Transfer', paymentDate: '2026-06-20', note: 'SPP Juni' },
        { id: 2, amount: 300000, method: 'Tunai', paymentDate: '2026-05-18', note: 'SPP Mei' },
    ],
    purchases: [
        { id: 1, itemName: 'Buku Tulis & Alat Tulis', qty: 3, amount: 45000, purchaseDate: '2026-07-05' },
        { id: 2, itemName: 'Snack Kantin', qty: 1, amount: 15000, purchaseDate: '2026-07-03' },
    ],
};

export default function BillingCheckSection() {
    const [formData, setFormData] = useState({
        registrationNumber: '',
        pin: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [showPin, setShowPin] = useState(false);
    const [checkedAt, setCheckedAt] = useState(null);
    const [activeTab, setActiveTab] = useState('tagihan');

    const isFormValid = formData.registrationNumber.trim().length > 0 && formData.pin.length === 6;

    const handleAutoFillDemo = () => {
        setFormData({
            registrationNumber: DEMO_REG,
            pin: DEMO_PIN
        });
        toast.success('Data demo dimasukkan! Klik "Cek Data"');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setResult(null);

        if (!formData.registrationNumber || !formData.pin) {
            setError('Mohon lengkapi No. Registrasi dan PIN');
            return;
        }

        if (formData.pin.length !== 6) {
            setError('PIN harus 6 karakter');
            return;
        }

        // Demo credentials use a local mock result so the "try demo" flow
        // always works, even if this exact record isn't seeded in the backend.
        if (formData.registrationNumber === DEMO_REG && formData.pin === DEMO_PIN) {
            setLoading(true);
            setTimeout(() => {
                setResult(DEMO_RESULT);
                setCheckedAt(new Date());
                setActiveTab('tagihan');
                toast.success('Data ditemukan!');
                setLoading(false);
            }, 500);
            return;
        }

        try {
            setLoading(true);
            const response = await checkPublicBilling(formData);
            setResult(response);
            setCheckedAt(new Date());
            toast.success('Data ditemukan!');
        } catch (err) {
            console.error(err);
            setError(err.message || 'Data tidak ditemukan atau PIN salah');
            toast.error('Gagal memuat data');
        } finally {
            setLoading(false);
        }
    };

    const paidPercentage = result
        ? Math.min(
            100,
            Math.round(
                (result.billing.totalPaid / Math.max(result.billing.totalLiabilities, 1)) * 100
            )
        )
        : 0;

    const getInitials = (name = '') =>
        name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

    const RESULT_TABS = [
        { key: 'tagihan', label: 'Rincian Tagihan', icon: CreditCard },
        { key: 'pembayaran', label: 'Riwayat Pembayaran', icon: Calendar },
        { key: 'pembelian', label: 'Pembelian di Koperasi', icon: ShoppingBag },
    ];

    return (
        <section
            id="check-billing"
            className="relative z-10 py-6 lg:py-8 scroll-mt-16
                       bg-blue-50/60 dark:bg-transparent
                       border-y border-blue-100 dark:border-white/[0.05]"
        >
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {(
                    <div className="text-center mb-5">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">
                            Layanan Wali Murid
                        </p>
                        <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-2">
                            Cek Status Pembayaran
                        </h2>
                        <p className="text-gray-500 dark:text-white/40 max-w-md mx-auto text-sm leading-relaxed">
                            Pantau tagihan dan riwayat pembayaran santri secara real-time.
                        </p>
                    </div>
                )}

                <div className="rounded-2xl overflow-hidden
                                border border-gray-200 dark:border-white/[0.07]
                                bg-white dark:bg-white/[0.03]
                                shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_40px_-16px_rgba(15,23,42,0.18)] dark:shadow-none">

                    <div className={`grid ${result ? '' : 'lg:grid-cols-12'}`}>

                        {/* Dark trust / brand panel — hidden once a result is shown */}
                        {!result && (
                            <div className="relative lg:col-span-5 overflow-hidden
                                            bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900
                                            dark:from-[#0b1220] dark:via-blue-950/50 dark:to-[#0b1220]
                                            border-r border-blue-500/10 dark:border-blue-500/15
                                            px-6 py-6 lg:py-7 flex flex-col justify-between">

                                {/* Decorative coin/orbit motif */}
                                <svg
                                    className="absolute -top-10 -right-14 w-56 h-56 opacity-40 pointer-events-none"
                                    viewBox="0 0 200 200"
                                    fill="none"
                                >
                                    <circle cx="100" cy="100" r="90" stroke="#3B82F6" strokeOpacity="0.25" strokeWidth="1.5" />
                                    <circle cx="100" cy="100" r="65" stroke="#3B82F6" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="4 6" />
                                    <circle cx="150" cy="60" r="22" fill="#3B82F6" fillOpacity="0.18" />
                                    <circle cx="150" cy="60" r="22" stroke="#60A5FA" strokeOpacity="0.5" strokeWidth="1.5" />
                                    <circle cx="150" cy="60" r="10" fill="#60A5FA" fillOpacity="0.3" />
                                </svg>
                                <svg
                                    className="absolute -bottom-16 -left-10 w-48 h-48 opacity-30 pointer-events-none"
                                    viewBox="0 0 200 200"
                                    fill="none"
                                >
                                    <circle cx="60" cy="140" r="18" fill="#F59E0B" fillOpacity="0.2" />
                                    <circle cx="60" cy="140" r="18" stroke="#FBBF24" strokeOpacity="0.4" strokeWidth="1.5" />
                                    <circle cx="95" cy="110" r="10" fill="#F59E0B" fillOpacity="0.15" />
                                </svg>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-1.5 mb-4 py-1.5 px-3 rounded-lg
                                                    bg-white/[0.06] border border-white/10 w-fit">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                        <span className="text-[11px] font-semibold text-emerald-300">
                                            Terenkripsi Penuh
                                        </span>
                                    </div>

                                    <h3 className="text-xl lg:text-2xl font-black text-white leading-snug mb-2">
                                        Transparansi penuh untuk setiap transaksi santri.
                                    </h3>
                                    <p className="text-sm text-white/50 leading-relaxed max-w-xs">
                                        Masukkan No. Registrasi dan PIN untuk melihat tagihan, riwayat pembayaran, dan progres pelunasan secara langsung.
                                    </p>
                                </div>

                                <div className="relative z-10 space-y-2.5 mt-5">
                                    {[
                                        { icon: Wallet, text: 'Rincian tagihan & saldo real-time' },
                                        { icon: TrendUp, text: 'Riwayat pembayaran lengkap' },
                                        { icon: Clock, text: 'Update otomatis setiap saat dicek' },
                                    ].map(({ icon: Icon, text }) => (
                                        <div key={text} className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-white/[0.07] border border-white/10 flex items-center justify-center flex-shrink-0">
                                                <Icon className="w-3.5 h-3.5 text-blue-400" />
                                            </div>
                                            <span className="text-xs text-white/60">{text}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="relative z-10 mt-5 pt-4 border-t border-white/10 flex items-center gap-2">
                                    <ChatCircle className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                                    <span className="text-[11px] text-white/40">Butuh bantuan?</span>
                                    <a href="https://wa.me/6285183079329"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                                    >
                                        Hubungi Admin Koperasi
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Form column */}
                        <div className={`flex flex-col justify-center px-6 py-6 lg:py-7 ${result ? '' : 'lg:col-span-7'}`}>
                            {!result && (
                                <div className="max-w-md lg:max-w-lg mx-auto lg:mx-0 w-full">
                                    <div className="mb-4">
                                        <h4 className="text-base font-bold text-gray-900 dark:text-white mb-0.5">
                                            Masuk ke Akun Wali Murid
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-white/40">
                                            Isi No. Registrasi dan PIN untuk melanjutkan.
                                        </p>
                                    </div>
                                    <form onSubmit={handleSubmit} className="space-y-3.5 mb-4 w-full">
                                        <div className="space-y-0.5">
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                                                No. Registrasi
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Contoh: REG-2026-0001"
                                                value={formData.registrationNumber}
                                                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() })}
                                                className="w-full pl-3 pr-3 py-2.5 rounded-xl text-sm
                                                       border border-gray-200 dark:border-white/[0.1]
                                                       bg-gray-50 dark:bg-white/[0.04]
                                                       text-gray-900 dark:text-white
                                                       placeholder:text-gray-400 dark:placeholder:text-white/30
                                                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                                       outline-none transition-all"
                                            />
                                        </div>

                                        <div className="space-y-0.5">
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                                                PIN Siswa
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPin ? 'text' : 'password'}
                                                    inputMode="numeric"
                                                    maxLength={6}
                                                    placeholder="6 Digit PIN"
                                                    value={formData.pin}
                                                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                                                    className="w-full pl-3 pr-10 py-2.5 rounded-xl text-sm
                                                           border border-gray-200 dark:border-white/[0.1]
                                                           bg-gray-50 dark:bg-white/[0.04]
                                                           text-gray-900 dark:text-white
                                                           placeholder:text-gray-400 dark:placeholder:text-white/30
                                                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                                           outline-none transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPin((v) => !v)}
                                                    tabIndex={-1}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2
                                                           text-gray-400 dark:text-white/30
                                                           hover:text-gray-600 dark:hover:text-white/60
                                                           transition-colors"
                                                    aria-label={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                                                >
                                                    {showPin ? <EyeSlash className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading || !isFormValid}
                                            className="w-full px-6 py-2.5 rounded-xl font-bold text-sm text-white
                                                   bg-blue-600 hover:bg-blue-700
                                                   shadow-lg shadow-blue-500/25 dark:shadow-blue-500/10
                                                   hover:-translate-y-px
                                                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
                                                   transition-all duration-200
                                                   flex items-center justify-center gap-2"
                                        >
                                            {loading ? <Spinner className="w-4 h-4 animate-spin" /> : <MagnifyingGlass className="w-4 h-4" />}
                                            {loading ? 'Mengecek...' : 'Cek Data'}
                                        </button>

                                        {error && (
                                            <div className="p-3 rounded-xl flex items-center gap-2
                                                        bg-red-50 dark:bg-red-500/10
                                                        text-red-600 dark:text-red-400">
                                                <WarningCircle className="w-4 h-4 flex-shrink-0" />
                                                <p className="font-medium text-xs">{error}</p>
                                            </div>
                                        )}

                                        <p className="text-[10px] text-gray-400 dark:text-white/30 flex items-start gap-1.5 leading-relaxed pt-1">
                                            <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-px" />
                                            <span>
                                                No. Registrasi dan PIN tertera pada struk registrasi yang diterima saat mendaftar di koperasi.{' '}
                                                <button
                                                    type="button"
                                                    onClick={handleAutoFillDemo}
                                                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
                                                >
                                                    <Sparkle className="w-3 h-3" /> Coba data demo
                                                </button>
                                            </span>
                                        </p>
                                    </form>

                                    <div className="flex items-center gap-4 pt-3 mt-3 border-t border-dashed border-gray-200 dark:border-white/10">
                                        {[
                                            { icon: ShieldCheck, text: 'Data Aman' },
                                            { icon: Clock, text: 'Real-time' },
                                            { icon: Sparkle, text: 'Mudah Dicek' },
                                        ].map(({ icon: Icon, text }) => (
                                            <div key={text} className="flex items-center gap-1.5">
                                                <Icon className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                                                <span className="text-[10px] font-medium text-gray-500 dark:text-white/40">{text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Result Display */}
                            {result && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4">
                                    {/* Student Profile Header */}
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3
                                                    p-4 rounded-xl bg-gradient-to-br from-blue-50 to-white
                                                    dark:from-blue-500/[0.06] dark:to-transparent
                                                    border border-blue-100 dark:border-white/[0.07]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center
                                                            text-sm font-bold text-white
                                                            bg-gradient-to-br from-blue-500 to-blue-700">
                                                {getInitials(result.student.name)}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{result.student.name}</h3>
                                                <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-white/40 mt-1">
                                                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider
                                                                     bg-blue-100 dark:bg-blue-500/10
                                                                     text-blue-700 dark:text-blue-400">
                                                        {result.student.registrationNumber}
                                                    </span>
                                                    <span className="text-xs self-center">{result.student.className}</span>
                                                    <span className="text-xs self-center">•</span>
                                                    <span className="text-xs self-center">{result.student.program}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right w-full md:w-auto pl-14 md:pl-0">
                                            <p className="text-xs text-gray-500 dark:text-white/40">Total Tagihan Belum Lunas</p>
                                            <p className="text-xl font-bold text-red-600 dark:text-red-400">
                                                {formatCurrency(result.billing.balance)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Payment Summary: donut + quick stats */}
                                    <div className="p-4 rounded-xl border
                                                    bg-gray-50 dark:bg-white/[0.03]
                                                    border-gray-100 dark:border-white/[0.07]
                                                    flex flex-col sm:flex-row items-center gap-4">
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <svg width="64" height="64" viewBox="0 0 64 64">
                                                <circle cx="32" cy="32" r="27" fill="none" strokeWidth="7"
                                                    className="stroke-gray-200 dark:stroke-white/10" />
                                                <circle
                                                    cx="32" cy="32" r="27" fill="none" strokeWidth="7"
                                                    strokeLinecap="round"
                                                    strokeDasharray={2 * Math.PI * 27}
                                                    strokeDashoffset={2 * Math.PI * 27 * (1 - paidPercentage / 100)}
                                                    transform="rotate(-90 32 32)"
                                                    className="stroke-blue-600 dark:stroke-blue-400 transition-all duration-700 ease-out"
                                                />
                                                <text x="32" y="37" textAnchor="middle" className="fill-gray-800 dark:fill-white text-[13px] font-bold">
                                                    {paidPercentage}%
                                                </text>
                                            </svg>
                                            <div>
                                                <p className="text-[11px] font-semibold text-gray-600 dark:text-white/50">Progres Pembayaran</p>
                                                <p className="text-[10px] text-gray-400 dark:text-white/30">
                                                    {formatCurrency(result.billing.totalPaid)} dari {formatCurrency(result.billing.totalLiabilities)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 w-full sm:flex-1">
                                            <div className="p-2.5 rounded-lg border border-l-4 border-l-gray-400
                                                            bg-white dark:bg-white/[0.02] border-gray-100 dark:border-white/[0.07]">
                                                <p className="text-[9px] text-gray-400 dark:text-white/30 uppercase tracking-wider mb-0.5">Kewajiban</p>
                                                <p className="font-bold text-gray-900 dark:text-white text-xs">{formatCurrency(result.billing.totalLiabilities)}</p>
                                            </div>
                                            <div className="p-2.5 rounded-lg border border-l-4 border-l-blue-500
                                                            bg-white dark:bg-white/[0.02] border-gray-100 dark:border-white/[0.07]">
                                                <p className="text-[9px] text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-0.5">Dibayar</p>
                                                <p className="font-bold text-blue-700 dark:text-blue-400 text-xs">{formatCurrency(result.billing.totalPaid)}</p>
                                            </div>
                                            <div className="p-2.5 rounded-lg border border-l-4 border-l-amber-500
                                                            bg-white dark:bg-white/[0.02] border-gray-100 dark:border-white/[0.07]">
                                                <p className="text-[9px] text-amber-500 dark:text-amber-400 uppercase tracking-wider mb-0.5">Terakhir Bayar</p>
                                                <p className="font-bold text-amber-700 dark:text-amber-400 text-xs">
                                                    {result.billing.lastPaymentDate ? formatDate(result.billing.lastPaymentDate) : '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tab Switcher: Tagihan / Pembayaran / Pembelian POS */}
                                    <div>
                                        <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-white/[0.04] w-full sm:w-fit overflow-x-auto">
                                            {RESULT_TABS.map(({ key, label, icon: Icon }) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setActiveTab(key)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
                                                        ${activeTab === key
                                                            ? 'bg-white dark:bg-white/[0.09] text-blue-600 dark:text-blue-400 shadow-sm'
                                                            : 'text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60'}`}
                                                >
                                                    <Icon className="w-3.5 h-3.5" />
                                                    {label}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="mt-3 space-y-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                                            {activeTab === 'tagihan' && (
                                                result.liabilities.length > 0 ? (
                                                    result.liabilities.map((item) => (
                                                        <div key={item.id} className="p-2.5 rounded-lg border
                                                                                      bg-white dark:bg-white/[0.03]
                                                                                      border-gray-100 dark:border-white/[0.07]">
                                                            <div className="flex justify-between items-start mb-0.5">
                                                                <span className="font-medium text-xs text-gray-800 dark:text-white/80">{item.description}</span>
                                                                <span className={`text-xs font-bold ${item.isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                    {formatCurrency(item.amount)}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-[10px]">
                                                                <span className="text-gray-500 dark:text-white/30">Jatuh Tempo: {formatDate(item.dueDate)}</span>
                                                                {item.isPaid ? (
                                                                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border
                                                                                     text-emerald-600 dark:text-emerald-400
                                                                                     bg-emerald-50 dark:bg-emerald-500/10
                                                                                     border-emerald-200 dark:border-emerald-500/20">
                                                                        <CheckCircle className="w-2.5 h-2.5" /> Lunas
                                                                    </span>
                                                                ) : (
                                                                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border
                                                                                     text-red-600 dark:text-red-400
                                                                                     bg-red-50 dark:bg-red-500/10
                                                                                     border-red-200 dark:border-red-500/20">
                                                                        <WarningCircle className="w-2.5 h-2.5" /> Belum Lunas
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <EmptyState icon={Receipt} title="Tidak Ada Data Tagihan" variant="plain" color="slate" />
                                                )
                                            )}

                                            {activeTab === 'pembayaran' && (
                                                result.recentPayments.length > 0 ? (
                                                    result.recentPayments.map((payment) => (
                                                        <div key={payment.id} className="p-2.5 rounded-lg border
                                                                                          bg-white dark:bg-white/[0.02]
                                                                                          border-gray-100 dark:border-white/[0.07]">
                                                            <div className="flex justify-between items-start mb-0.5">
                                                                <span className="font-medium text-xs text-gray-800 dark:text-white/80">{formatCurrency(payment.amount)}</span>
                                                                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded
                                                                                 text-gray-500 dark:text-white/40
                                                                                 bg-gray-100 dark:bg-white/[0.06]">
                                                                    {payment.method}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-[10px] text-gray-500 dark:text-white/30">
                                                                <span>{formatDate(payment.paymentDate)}</span>
                                                                {payment.note && <span className="max-w-[160px] truncate text-[10px]" title={payment.note}>{payment.note}</span>}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <EmptyState icon={Clock} title="Belum Ada Riwayat Pembayaran" variant="plain" color="slate" />
                                                )
                                            )}

                                            {activeTab === 'pembelian' && (
                                                result.purchases && result.purchases.length > 0 ? (
                                                    result.purchases.map((purchase) => (
                                                        <div key={purchase.id} className="p-2.5 rounded-lg border
                                                                                          bg-white dark:bg-white/[0.02]
                                                                                          border-gray-100 dark:border-white/[0.07]">
                                                            <div className="flex justify-between items-start mb-0.5">
                                                                <span className="font-medium text-xs text-gray-800 dark:text-white/80">{purchase.itemName}</span>
                                                                <span className="text-xs font-bold text-gray-800 dark:text-white/80">{formatCurrency(purchase.amount)}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-[10px] text-gray-500 dark:text-white/30">
                                                                <span>{formatDate(purchase.purchaseDate)}</span>
                                                                {purchase.qty && <span>{purchase.qty}x</span>}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <EmptyState icon={ShoppingBag} title="Belum Ada Transaksi" description="Belum ada transaksi pembelian di koperasi." variant="plain" color="slate" />
                                                )
                                            )}
                                        </div>
                                    </div>

                                    {/* Last Checked Timestamp */}
                                    {checkedAt && (
                                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 dark:text-white/30 pt-1">
                                            <Clock className="w-2.5 h-2.5" />
                                            <span>
                                                Data diperbarui otomatis · terakhir dicek{' '}
                                                {checkedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
