import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard, ShieldCheck, ArrowRight, Phone, Buildings, House,
  CheckCircle, ShoppingBag, MapPin, Clock, Envelope, Calendar,
  Eye, Headphones, Star, ChatCircle, UserPlus, MagnifyingGlassPlus,
  FileText, Wallet, List, X, ArrowUpRight, Sparkle,
} from '@phosphor-icons/react';
import ThemeToggle from '../components/common/ThemeToggle';
import BillingCheckSection from '../components/features/landing/BillingCheckSection';
import AnnouncementSection from '../components/features/landing/AnnouncementSection';
import FAQSection from '../components/features/landing/FAQSection';
import useScrollReveal from '../hooks/useScrollReveal';
import logoSenyum from '../../../assets/images/logos/logo-senyum.png';

const WHATSAPP_NUMBER = '6285183079329';
const CONTACT_INFO = {
  phone: '0851-8307-9329',
  address: 'Jl. Pemandian, Krajan II No.88, Krajan II, Patemon, Kec. Tanggul, Jember, Jawa Timur 68155',
  email: 'senyummu2024@gmail.com',
};

const STATS = [
  { number: '300+', label: 'Santri Aktif' },
  { number: '2', label: 'Program Tersedia' },
  { number: '100%', label: 'Transparan' },
  { number: '6 hr', label: 'Buka / Minggu' },
];

const PROGRAMS = [
  {
    id: 'boarding',
    icon: <Buildings className="w-5 h-5" />,
    title: 'Program Boarding',
    desc: 'Santri tinggal di asrama dengan pendidikan terpadu 24 jam.',
    items: [
      'Seragam sekolah (putih-putih, batik, olahraga)',
      'Buku paket pelajaran & kitab',
      'Perlengkapan mandi & kamar',
      'Kasur, bantal, selimut',
      'Lemari pakaian (opsional)',
      'Alat tulis & perlengkapan belajar',
    ],
    note: 'Tersedia paket hemat untuk perlengkapan boarding dengan sistem cicilan.',
    color: 'blue',
  },
  {
    id: 'reguler',
    icon: <House className="w-5 h-5" />,
    title: 'Program Reguler',
    desc: 'Santri pulang ke rumah setelah jam sekolah selesai.',
    items: [
      'Seragam sekolah (putih-putih, batik, olahraga)',
      'Buku paket pelajaran & kitab',
      'Tas sekolah',
      'Sepatu & kaos kaki',
      'Alat tulis & perlengkapan belajar',
    ],
    note: 'Perlengkapan dapat dibeli satuan atau paket dengan harga lebih terjangkau.',
    color: 'amber',
  },
];

const BENEFITS = [
  {
    icon: <ShoppingBag className="w-5 h-5" />,
    title: 'Perlengkapan Sekolah',
    desc: 'Seragam, buku pelajaran, kitab, dan alat tulis dengan harga terjangkau dan kualitas terjamin.',
    accent: 'blue',
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    title: 'Cicilan Transparan',
    desc: 'Program cicilan untuk seragam dan perlengkapan awal tahun, meringankan beban wali murid.',
    accent: 'amber',
  },
  {
    icon: <Eye className="w-5 h-5" />,
    title: 'Pantauan Real-time',
    desc: 'Rincian tagihan dan riwayat pembayaran dapat dipantau kapan saja, langsung dari genggaman.',
    accent: 'emerald',
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'Aman & Terpercaya',
    desc: 'Data santri dan transaksi dilindungi enkripsi & PIN pribadi, diawasi langsung Yayasan MBS Tanggul.',
    accent: 'violet',
  },
  {
    icon: <Headphones className="w-5 h-5" />,
    title: 'Layanan Responsif',
    desc: 'Pertanyaan dan keluhan wali murid dilayani cepat melalui WhatsApp.',
    accent: 'rose',
  },
];

const ACCENT_COLORS = {
  blue:    { bg: 'bg-blue-500/15',   text: 'text-blue-400',   glow: 'bg-blue-500/10'   },
  amber:   { bg: 'bg-amber-500/15',  text: 'text-amber-400',  glow: 'bg-amber-500/10'  },
  emerald: { bg: 'bg-emerald-500/15',text: 'text-emerald-400',glow: 'bg-emerald-500/10'},
  violet:  { bg: 'bg-violet-500/15', text: 'text-violet-400', glow: 'bg-violet-500/10' },
  rose:    { bg: 'bg-rose-500/15',   text: 'text-rose-400',   glow: 'bg-rose-500/10'   },
};

const PROGRAM_ACCENT = {
  blue: {
    iconBg: 'bg-blue-500/15', iconText: 'text-blue-400',
    badge: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
    checkBg: 'bg-blue-500/15', checkText: 'text-blue-400',
    noteBg: 'bg-blue-500/8 border-blue-500/20', noteText: 'text-blue-300',
    glow: 'from-blue-600/20',
    border: 'border-blue-500/40',
  },
  amber: {
    iconBg: 'bg-amber-500/15', iconText: 'text-amber-400',
    badge: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
    checkBg: 'bg-amber-500/15', checkText: 'text-amber-400',
    noteBg: 'bg-amber-500/8 border-amber-500/20', noteText: 'text-amber-300',
    glow: 'from-amber-600/20',
    border: 'border-amber-500/40',
  },
};

const STEPS = [
  { icon: <UserPlus className="w-5 h-5" />,         title: 'Masukkan Data Santri',   desc: 'Isi No. Registrasi dan PIN 6 digit yang tertera pada kartu santri.',       num: '01' },
  { icon: <MagnifyingGlassPlus className="w-5 h-5" />, title: 'Verifikasi Otomatis',    desc: 'Sistem mencocokkan data secara real-time dan aman.',                        num: '02' },
  { icon: <FileText className="w-5 h-5" />,          title: 'Lihat Rincian Tagihan',  desc: 'Tagihan, riwayat pembayaran, dan sisa saldo langsung tampil.',              num: '03' },
  { icon: <Wallet className="w-5 h-5" />,            title: 'Bayar via Virtual Account', desc: 'Transfer ke No. VA yang tertera, tanpa perlu datang ke koperasi.',       num: '04' },
];

const TESTIMONIALS = [
  { name: 'S.A', role: 'Wali Santri Kelas 8',  rating: 5, quote: 'Cek tagihan jadi lebih praktis, tidak perlu telepon bendahara satu-satu.' },
  { name: 'R.H', role: 'Wali Santri Kelas 10', rating: 4, quote: 'Rincian pembayaran terlihat jelas, jadi lebih tenang memantau dari rumah.' },
  { name: 'M.F', role: 'Wali Santri Kelas 7',  rating: 4, quote: 'Tampilannya sederhana dan mudah dipahami meski baru pertama kali pakai.' },
];

const NAV_LINKS = [
  ['#services',       'Layanan'],
  ['#how-it-works',   'Cara Kerja'],
  ['#check-billing',  'Cek Tagihan'],
  ['#announcements',  'Pengumuman'],
  ['#programs',       'Program'],
  ['#faq',            'FAQ'],
  ['#contact',        'Kontak'],
];

/* ─── Shared animated wrapper ─────────────────────────────── */
function Reveal({ children, index = 0, direction = 'up', className = '' }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.12 });
  const hidden = { up: 'translate-y-8', left: '-translate-x-8', right: 'translate-x-8' }[direction];
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className}
        ${isVisible ? 'opacity-100 translate-x-0 translate-y-0' : `opacity-0 ${hidden}`}`}
      style={{ transitionDelay: isVisible ? `${index * 100}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5 mb-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? 'fill-amber-400 text-amber-400' : 'fill-white/10 text-white/10'}`}
        />
      ))}
    </div>
  );
}

/* ─── Floating particles for hero ────────────────────────── */
function HeroParticles() {
  const particles = Array.from({ length: 18 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 4,
    dur: Math.random() * 6 + 6,
  }));
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full bg-white/20"
          style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            animation: `float-particle ${p.dur}s ease-in-out ${p.delay}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-[#080c18] text-[#18181b] dark:text-white font-sans overflow-x-hidden">

      {/* ── Keyframe style injection ── */}
      <style>{`
        @keyframes float-particle {
          from { transform: translateY(0px) scale(1); opacity: 0.15; }
          to   { transform: translateY(-24px) scale(1.4); opacity: 0.45; }
        }
        @keyframes hero-glow-pulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50%       { opacity: 0.55; transform: scale(1.08); }
        }
        @keyframes hero-glow-pulse-slow {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50%       { opacity: 0.4;  transform: scale(1.06); }
        }
        @keyframes badge-ping {
          0%   { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .hero-glow-1 { animation: hero-glow-pulse 8s ease-in-out infinite; }
        .hero-glow-2 { animation: hero-glow-pulse-slow 11s ease-in-out 2s infinite; }
        .badge-dot::after {
          content: ''; position: absolute; inset: 0; border-radius: 9999px;
          background: currentColor; animation: badge-ping 1.8s ease-out infinite;
        }
      `}</style>

      {/* ──────────────────────────────────────────────────────
          FLOATING NAVBAR (appears on scroll)
      ────────────────────────────────────────────────────── */}
      <nav
        className={`fixed top-3 left-1/2 -translate-x-1/2 z-50
          w-[min(1200px,calc(100%-32px))] px-5 sm:px-7 py-2.5
          flex items-center justify-between rounded-full border
          transition-all duration-500 ease-out
          ${scrolled
            ? 'opacity-100 pointer-events-auto translate-y-0 border-white/15 bg-white/12 dark:bg-[#0d1526]/80 backdrop-blur-2xl shadow-[0_4px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.12)]'
            : 'opacity-0 pointer-events-none -translate-y-5 border-transparent bg-transparent'
          }`}
      >
        <div className="flex items-center gap-2">
          <img src={logoSenyum} alt="Koperasi Senyum" className="w-7 h-7 rounded-lg object-contain" />
          <span className="text-sm font-bold text-gray-900 dark:text-white">Koperasi Senyum</span>
        </div>

        <div className="hidden md:flex items-center gap-5">
          {NAV_LINKS.slice(0, 5).map(([href, label]) => (
            <a key={href} href={href}
              className="text-[13px] text-gray-600 dark:text-white/55 hover:text-gray-900 dark:hover:text-white transition-colors">
              {label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <Link to="/login"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full
              bg-gray-900 dark:bg-white text-white dark:text-gray-900
              text-[13px] font-semibold hover:-translate-y-px transition-transform">
            Login Staff
          </Link>
        </div>
      </nav>

      {/* ──────────────────────────────────────────────────────
          HERO
      ────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col overflow-hidden
          bg-gradient-to-b from-[#060d1f] via-[#0a1428] to-[#0d1a35]"
      >
        {/* Background layer: mesh grid */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Glow orbs */}
        <div className="hero-glow-1 pointer-events-none absolute -top-32 right-[10%] w-[640px] h-[640px] rounded-full
          bg-gradient-radial from-blue-600/30 to-transparent blur-[120px]" />
        <div className="hero-glow-2 pointer-events-none absolute bottom-0 left-[5%] w-[500px] h-[500px] rounded-full
          bg-gradient-radial from-indigo-700/20 to-transparent blur-[100px]" />
        <div className="pointer-events-none absolute top-1/3 right-0 w-[360px] h-[360px] rounded-full
          bg-gradient-radial from-amber-500/10 to-transparent blur-[90px]" />

        {/* Particles */}
        <HeroParticles />

        {/* Hero nav */}
        <nav className="relative z-20 flex items-center justify-between
          w-full max-w-[1240px] mx-auto px-6 sm:px-10 lg:px-14 py-5 sm:py-6">

          {/* Left nav links (desktop) */}
          <div className="hidden lg:flex items-center gap-6 text-[13.5px] text-white/55">
            {NAV_LINKS.slice(0, 4).map(([href, label]) => (
              <a key={href} href={href} className="hover:text-white transition-colors">{label}</a>
            ))}
          </div>

          {/* Center logo */}
          <a href="/" className="flex items-center gap-2.5 lg:absolute lg:left-1/2 lg:-translate-x-1/2">
            <img src={logoSenyum} alt="Koperasi Senyum" className="w-9 h-9 object-contain" />
            <span className="text-[15px] font-bold text-white lg:hidden">Koperasi Senyum</span>
          </a>

          {/* Right */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-6 text-[13.5px] text-white/55 mr-2">
              {NAV_LINKS.slice(4).map(([href, label]) => (
                <a key={href} href={href} className="hover:text-white transition-colors">{label}</a>
              ))}
            </div>
            <ThemeToggle />
            <Link to="/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full
                bg-white/10 border border-white/15 backdrop-blur-sm text-white
                text-[14px] font-medium hover:bg-white/18 hover:-translate-y-px transition-all">
              Login Staff
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full
                border border-white/20 bg-white/10 text-white"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={17} /> : <List size={17} />}
            </button>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-start justify-center flex-1
          w-full max-w-[1240px] mx-auto px-6 sm:px-10 lg:px-14 pb-40 pt-6 sm:pt-8">

          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-8 sm:mb-10
            bg-white/[0.07] border border-white/15 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="badge-dot relative flex h-2 w-2 rounded-full bg-emerald-400 text-emerald-400" />
            </span>
            <span className="text-[12px] font-semibold text-white/80 tracking-wide">
              Portal Informasi Koperasi Sekolah
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-[52px] sm:text-[72px] lg:text-[90px] xl:text-[104px]
            font-black leading-[0.94] tracking-[-0.04em] text-white mb-6 sm:mb-8 max-w-[860px]">
            Tagihan Santri,
            <br />
            <span className="bg-gradient-to-r from-[#60a5fa] via-[#a78bfa] to-[#fbbf24] bg-clip-text text-transparent">
              Transparan
            </span>
            <span className="text-white"> & </span>
            <span className="bg-gradient-to-r from-[#fbbf24] to-[#f97316] bg-clip-text text-transparent">
              Mudah
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-[16px] sm:text-[19px] leading-[1.55] text-white/50 mb-10 sm:mb-12 max-w-[520px]">
            Cek tagihan seragam, buku, dan tabungan santri kapan saja —
            langsung dari genggaman wali murid.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              onClick={() => document.getElementById('check-billing')?.scrollIntoView({ behavior: 'smooth' })}
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full
                bg-white text-[#0a1020] text-[15px] font-bold
                hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(255,255,255,0.2)]
                transition-all duration-200"
            >
              Cek Tagihan Sekarang
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <a href="#programs"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full
                bg-white/8 border border-white/15 text-white text-[15px] font-medium
                hover:bg-white/15 hover:-translate-y-0.5 transition-all duration-200">
              Informasi Program
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center gap-6 mt-12 sm:mt-14">
            {[
              { icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />, label: 'Data Terenkripsi' },
              { icon: <Eye className="w-4 h-4 text-blue-400" />,           label: 'Real-time Update' },
              { icon: <Sparkle className="w-4 h-4 text-amber-400" />,      label: 'Mudah Digunakan' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                {icon}
                <span className="text-[13px] text-white/45 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 w-full border-t border-white/[0.08] bg-white/[0.03] backdrop-blur-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 max-w-[1240px] mx-auto">
            {STATS.map(({ number, label }, i) => (
              <div key={label}
                className={`py-6 sm:py-7 px-4 text-center
                  ${i < STATS.length - 1 ? 'border-r border-white/[0.07]' : ''}`}>
                <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1"
                  style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {number}
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-white/35">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mobile Menu ── */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileOpen(false)}
        />
        <div className={`absolute top-0 right-0 h-full w-72 max-w-[85vw]
          bg-[#0d1526]/95 backdrop-blur-2xl border-l border-white/[0.08]
          shadow-2xl transition-transform duration-300 ease-out
          ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
            <span className="text-sm font-bold text-white">Menu</span>
            <button onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center w-8 h-8 rounded-full text-white/60 hover:bg-white/10 transition-colors">
              <X size={17} />
            </button>
          </div>
          <nav className="px-3 py-3 space-y-0.5">
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-[15px] text-white/60 hover:bg-white/8 hover:text-white transition-colors">
                {label}
              </a>
            ))}
          </nav>
          <div className="px-3 pt-2 border-t border-white/[0.08]">
            <Link to="/login" onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center w-full py-3 rounded-full
                bg-white text-gray-900 text-[15px] font-bold">
              Login Staff
            </Link>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────
          SECTION: Layanan & Keunggulan
      ────────────────────────────────────────────────────── */}
      <section id="services" className="py-24 sm:py-32 scroll-mt-16
        bg-[#f0f2f5] dark:bg-[#080c18]">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-10 lg:px-14">

          <Reveal>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14 sm:mb-20">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400 mb-3">
                  Layanan & Keunggulan
                </p>
                <h2 className="text-[40px] sm:text-[52px] lg:text-[64px] font-black leading-[1.0] tracking-[-0.03em]
                  text-gray-900 dark:text-white">
                  Solusi Lengkap<br />
                  <span className="text-gray-400 dark:text-white/30">Koperasi Sekolah</span>
                </h2>
              </div>
              <p className="text-[15px] text-gray-500 dark:text-white/40 max-w-xs leading-relaxed sm:text-right">
                Semua kebutuhan santri terpenuhi dalam satu platform yang transparan dan mudah diakses.
              </p>
            </div>
          </Reveal>

          {/* Bento grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

            {/* Card 0: tall (spans 2 rows) */}
            <Reveal index={0} className="sm:row-span-2 h-full">
              <BentoCard benefit={BENEFITS[0]} tall />
            </Reveal>

            {/* Card 1: wide */}
            <Reveal index={1} className="lg:col-span-2 h-full">
              <div className="relative overflow-hidden rounded-2xl h-full min-h-[200px]
                bg-[#111827] dark:bg-white/[0.03]
                border border-gray-800 dark:border-white/[0.06]
                p-7 sm:p-8 flex flex-col sm:flex-row gap-8">
                <BentoCardInner benefit={BENEFITS[1]} />
                <div className="w-px bg-white/[0.06] hidden sm:block" />
                <BentoCardInner benefit={BENEFITS[2]} />
                <div className="pointer-events-none absolute top-0 right-0 w-48 h-48
                  bg-amber-500/6 rounded-full blur-[80px]" />
              </div>
            </Reveal>

            {/* Card 3 */}
            <Reveal index={2} className="h-full">
              <BentoCard benefit={BENEFITS[3]} />
            </Reveal>

            {/* Card 4 */}
            <Reveal index={3} className="h-full">
              <BentoCard benefit={BENEFITS[4]} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────
          SECTION: Cara Kerja
      ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 sm:py-32 scroll-mt-16
        bg-white dark:bg-[#0a0f1e] border-y border-gray-100 dark:border-white/[0.05]">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-10 lg:px-14">

          <Reveal>
            <div className="mb-14 sm:mb-20">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400 mb-3">
                Alur Layanan
              </p>
              <h2 className="text-[40px] sm:text-[52px] lg:text-[64px] font-black leading-[1.0] tracking-[-0.03em]
                text-gray-900 dark:text-white">
                Cara Kerja
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} index={i} direction="up">
                <div className="relative rounded-2xl p-6 sm:p-7 h-full
                  border border-gray-100 dark:border-white/[0.07]
                  bg-gray-50 dark:bg-white/[0.02]
                  hover:border-blue-200 dark:hover:border-blue-500/30
                  hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/5
                  transition-all duration-300 group">

                  {/* Step number */}
                  <div className="text-[64px] font-black leading-none tracking-tight
                    text-gray-100 dark:text-white/[0.04] select-none mb-4
                    group-hover:text-blue-100 dark:group-hover:text-blue-500/10 transition-colors">
                    {step.num}
                  </div>

                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4
                    bg-blue-600 text-white shadow-lg shadow-blue-500/25">
                    {step.icon}
                  </div>

                  <h3 className="text-[17px] font-bold text-gray-900 dark:text-white mb-2 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-[14px] text-gray-500 dark:text-white/40 leading-relaxed">
                    {step.desc}
                  </p>

                  {/* connector line */}
                  {i < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-12 -right-5 w-10 h-px
                      bg-gradient-to-r from-gray-200 to-transparent dark:from-white/10 z-10" />
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────
          SECTION: Cek Tagihan
      ────────────────────────────────────────────────────── */}
      <div className="py-8 bg-[#f0f2f5] dark:bg-[#080c18]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10">
          <BillingCheckSection />
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────
          SECTION: Pengumuman
      ────────────────────────────────────────────────────── */}
      <div className="bg-[#f0f2f5] dark:bg-[#080c18]">
        <AnnouncementSection />
      </div>

      {/* ──────────────────────────────────────────────────────
          SECTION: Testimoni
      ────────────────────────────────────────────────────── */}
      <section className="py-24 sm:py-32
        bg-white dark:bg-[#0a0f1e] border-y border-gray-100 dark:border-white/[0.05]">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-10 lg:px-14">

          <Reveal>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14 sm:mb-20">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400 mb-3">
                  Kata Wali Murid
                </p>
                <h2 className="text-[40px] sm:text-[52px] lg:text-[64px] font-black leading-[1.0] tracking-[-0.03em]
                  text-gray-900 dark:text-white">
                  Testimoni
                </h2>
              </div>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} index={i}>
                <div className="rounded-2xl p-7 h-full flex flex-col
                  border border-gray-100 dark:border-white/[0.06]
                  bg-gray-50 dark:bg-white/[0.02]
                  hover:border-gray-200 dark:hover:border-white/10
                  hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5
                  transition-all duration-300">
                  <StarRating rating={t.rating} />
                  <p className="text-[15px] text-gray-600 dark:text-white/55 leading-relaxed mb-6 flex-1 italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-black
                      bg-gradient-to-br from-blue-500 to-violet-600 text-white">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <span className="text-[14px] font-bold text-gray-900 dark:text-white block">{t.name}</span>
                      <span className="text-[12px] text-gray-400 dark:text-white/35">{t.role}</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────
          SECTION: Program
      ────────────────────────────────────────────────────── */}
      <section id="programs" className="py-24 sm:py-32 scroll-mt-16
        bg-[#0a0f1e] dark:bg-[#080c18]">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-10 lg:px-14">

          <Reveal>
            <div className="mb-14 sm:mb-20">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-400 mb-3">Program</p>
              <h2 className="text-[40px] sm:text-[52px] lg:text-[64px] font-black leading-[1.0] tracking-[-0.03em] text-white">
                Informasi Program
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-4">
            {PROGRAMS.map((prog, i) => {
              const c = PROGRAM_ACCENT[prog.color];
              return (
                <Reveal key={prog.id} index={i} direction={i % 2 === 0 ? 'left' : 'right'}>
                  <div className={`relative rounded-2xl p-7 sm:p-8 h-full flex flex-col overflow-hidden
                    border ${c.border} bg-[#111827]
                    hover:-translate-y-1 transition-all duration-300`}>

                    {/* Top glow */}
                    <div className={`pointer-events-none absolute top-0 left-0 right-0 h-48
                      bg-gradient-to-b ${c.glow} to-transparent`} />

                    <div className="relative z-10">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${c.iconBg} ${c.iconText}`}>
                        {prog.icon}
                      </div>

                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full
                        text-[10px] font-bold uppercase tracking-wider border mb-4 ${c.badge}`}>
                        {prog.title}
                      </span>

                      <p className="text-[15px] text-white/50 mb-7 leading-relaxed">{prog.desc}</p>

                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30 mb-3.5">
                        Kebutuhan Perlengkapan
                      </p>
                      <ul className="space-y-2.5 mb-7 flex-1">
                        {prog.items.map((item) => (
                          <li key={item} className="flex items-start gap-2.5 text-[14px] text-white/65">
                            <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center
                              ${c.checkBg} ${c.checkText}`}>
                              <CheckCircle className="w-2.5 h-2.5" />
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>

                      <div className={`rounded-xl p-4 border text-[13px] leading-relaxed mt-auto
                        ${c.noteBg} ${c.noteText}`}>
                        {prog.note}
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────
          SECTION: FAQ
      ────────────────────────────────────────────────────── */}
      <div className="bg-[#f0f2f5] dark:bg-[#080c18]">
        <FAQSection />
      </div>

      {/* ──────────────────────────────────────────────────────
          SECTION: CTA WhatsApp
      ────────────────────────────────────────────────────── */}
      <section className="py-8 sm:py-10 bg-[#f0f2f5] dark:bg-[#080c18]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl
              bg-gradient-to-br from-[#060d1f] via-[#0a1530] to-[#060e20]
              border border-white/[0.08] p-10 sm:p-16 lg:p-20 text-center">

              {/* BG glows */}
              <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2
                w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-[100px]" />
              <div className="pointer-events-none absolute bottom-0 right-0
                w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[80px]" />

              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.07] border border-white/12
                  flex items-center justify-center mx-auto mb-8">
                  <ChatCircle className="w-7 h-7 text-blue-300" />
                </div>
                <h3 className="text-[32px] sm:text-[44px] font-black tracking-[-0.03em] text-white mb-4">
                  Masih ada pertanyaan?
                </h3>
                <p className="text-[15px] sm:text-[17px] text-white/45 mb-10 max-w-md mx-auto leading-relaxed">
                  Tim kami siap membantu wali murid melalui WhatsApp, langsung dan responsif.
                </p>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank" rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full
                    bg-white text-gray-900 text-[15px] font-bold
                    hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(255,255,255,0.15)]
                    transition-all duration-200">
                  <ChatCircle className="w-4.5 h-4.5" />
                  Hubungi via WhatsApp
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────
          FOOTER
      ────────────────────────────────────────────────────── */}
      <footer id="contact" className="relative overflow-hidden
        bg-[#050810] border-t border-white/[0.05]
        px-6 sm:px-10 lg:px-14 pt-16 sm:pt-20 pb-10">

        {/* Watermark */}
        <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 select-none overflow-hidden w-full text-center">
          <span className="text-[80px] sm:text-[130px] lg:text-[200px] font-black tracking-tighter text-white/[0.025] whitespace-nowrap">
            KoperasiMu
          </span>
        </div>

        {/* Footer glow */}
        <div className="pointer-events-none absolute top-0 left-1/4 w-[500px] h-[300px]
          bg-blue-600/[0.06] rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-[1240px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-14 lg:gap-24 mb-14">

            {/* Brand */}
            <div className="max-w-sm">
              <div className="flex items-center gap-3 mb-5">
                <img src={logoSenyum} alt="Koperasi Senyum"
                  className="w-10 h-10 rounded-xl bg-white p-1 object-contain" />
                <span className="text-lg font-black text-white">Koperasi Senyum</span>
              </div>
              <p className="text-[15px] text-white/40 leading-relaxed mb-7">
                Melayani kebutuhan santri dengan sepenuh hati.
                Jujur, Amanah, dan Profesional.
              </p>
              <div className="flex gap-2.5">
                {[
                  { href: `https://wa.me/${WHATSAPP_NUMBER}`, icon: <Phone size={17} />, label: 'WhatsApp' },
                  { href: `mailto:${CONTACT_INFO.email}`,    icon: <Envelope size={17} />, label: 'Email' },
                  { href: `https://maps.google.com/?q=${encodeURIComponent(CONTACT_INFO.address)}`, icon: <MapPin size={17} />, label: 'Maps' },
                ].map(({ href, icon, label }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                    title={label}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full
                      border border-white/[0.08] bg-white/[0.04] text-white/45
                      hover:bg-white/[0.1] hover:text-white hover:-translate-y-0.5
                      hover:border-white/15 transition-all">
                    {icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-col sm:flex-row gap-10 sm:gap-20 lg:gap-32">
              <div>
                <h4 className="text-[11px] font-bold text-white/25 uppercase tracking-[0.18em] mb-5">Kontak</h4>
                <ul className="space-y-3.5 text-[14px] text-white/45">
                  <li className="flex items-center gap-2.5">
                    <Phone size={13} className="text-blue-400 flex-shrink-0" />
                    {CONTACT_INFO.phone}
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Envelope size={13} className="text-blue-400 flex-shrink-0" />
                    {CONTACT_INFO.email}
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-white/25 uppercase tracking-[0.18em] mb-5">Jam Operasional</h4>
                <ul className="space-y-3.5 text-[14px] text-white/45">
                  <li className="flex items-start gap-2.5">
                    <Calendar size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="block text-white/70">Setiap Hari</span>
                      <span className="text-[12px] text-white/30">(Kecuali Kamis)</span>
                    </div>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Clock size={13} className="text-blue-400 flex-shrink-0" />
                    <span className="text-white/70">08.00 – 14.00 WIB</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/[0.06] pt-7 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[13px] text-white/25">
              © {new Date().getFullYear()} Koperasi Senyum. All rights reserved.
            </p>
            <div className="flex gap-5 text-[13px] text-white/25">
              <Link to="/check" className="hover:text-white/55 transition-colors">Cek Data Santri</Link>
              <Link to="/" className="hover:text-white/55 transition-colors">Beranda</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Bento card helpers ─────────────────────────────────── */
function BentoCard({ benefit, tall = false }) {
  const c = ACCENT_COLORS[benefit.accent];
  return (
    <div className={`relative overflow-hidden rounded-2xl
      bg-[#111827] dark:bg-white/[0.025]
      border border-gray-800 dark:border-white/[0.06]
      p-7 sm:p-8 h-full ${tall ? 'min-h-[320px] sm:min-h-0' : 'min-h-[200px]'}
      flex flex-col
      hover:border-gray-700 dark:hover:border-white/10
      hover:-translate-y-0.5 transition-all duration-300 group`}>

      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-6 ${c.bg} ${c.text}
        group-hover:scale-105 transition-transform`}>
        {benefit.icon}
      </div>
      <h3 className="text-[17px] font-bold text-white mb-2.5">{benefit.title}</h3>
      <p className="text-[14px] leading-relaxed text-white/45 flex-1">{benefit.desc}</p>

      {/* Glow */}
      <div className={`pointer-events-none absolute bottom-0 right-0 w-40 h-40 ${c.glow} rounded-full blur-[60px]`} />
    </div>
  );
}

function BentoCardInner({ benefit }) {
  const c = ACCENT_COLORS[benefit.accent];
  return (
    <div className="flex-1 group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${c.bg} ${c.text}
        group-hover:scale-105 transition-transform`}>
        {benefit.icon}
      </div>
      <h3 className="text-[16px] font-bold text-white mb-2">{benefit.title}</h3>
      <p className="text-[13.5px] leading-relaxed text-white/45">{benefit.desc}</p>
    </div>
  );
}
