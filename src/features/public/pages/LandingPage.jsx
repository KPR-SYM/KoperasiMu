import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Phone, Buildings, House, SignIn, CheckCircle, ShoppingBag, MapPin, Clock, Envelope, Calendar, Eye, Headphones, Star, ChatCircle, UserPlus, MagnifyingGlassPlus, FileText, Wallet, X, CaretUp, InstagramLogo, FacebookLogo, List, WhatsappLogo } from '@phosphor-icons/react';
import { supabase } from '@lib/supabase';
import ThemeToggle from '../components/common/ThemeToggle';
import useScrollReveal from '../hooks/useScrollReveal';
import logoSenyum from '../../../assets/images/logos/logo-senyum.png';

const BillingCheckSection = lazy(() => import('../components/features/landing/BillingCheckSection'));
const AnnouncementSection = lazy(() => import('../components/features/landing/AnnouncementSection'));
const FAQSection = lazy(() => import('../components/features/landing/FAQSection'));

const WHATSAPP_NUMBER = '6285183079329';
const CONTACT_INFO = {
  phone: '0851-8307-9329',
  address: 'Jl. Pemandian, Krajan II No.88, Krajan II, Patemon, Kec. Tanggul, Jember, Jawa Timur 68155',
  email: 'senyummu2024@gmail.com',
  instagram: 'https://instagram.com/koperasi.senyum',
  facebook: 'https://facebook.com/koperasisenyum',
};

/* ─── Stats data ─────────────────────────────────────────── */
const STATS = [
  { number: '300+', label: 'Santri Aktif', dynamic: true },
  { number: '2', label: 'Program Tersedia' },
  { number: '100%', label: 'Transparan' },
  { number: '6 hr', label: 'Buka / Minggu' },
];

/* ─── Program data ───────────────────────────────────────── */
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
    color: 'slate',
  },
];

/* ─── Layanan & Keunggulan data ──────────────────────────── */
const BENEFITS = [
  {
    icon: <ShoppingBag className="w-5 h-5" />,
    title: 'Perlengkapan Sekolah',
    desc: 'Seragam, buku pelajaran, kitab, dan alat tulis dengan harga terjangkau dan kualitas terjamin.',
  },
  {
    icon: <Wallet className="w-5 h-5" />,
    title: 'Cicilan Transparan',
    desc: 'Program cicilan untuk seragam dan perlengkapan awal tahun, meringankan beban wali murid.',
  },
  {
    icon: <Eye className="w-5 h-5" />,
    title: 'Pantauan Real-time',
    desc: 'Rincian tagihan dan riwayat pembayaran dapat dipantau kapan saja, langsung dari genggaman.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'Aman & Terpercaya',
    desc: 'Data santri dan transaksi dilindungi enkripsi & PIN pribadi, diawasi langsung Yayasan MBS Tanggul.',
  },
  {
    icon: <Headphones className="w-5 h-5" />,
    title: 'Layanan Responsif',
    desc: 'Pertanyaan dan keluhan wali murid dilayani cepat melalui WhatsApp.',
  },
];

/* ─── How it works data ──────────────────────────────────── */
const STEPS = [
  {
    icon: <UserPlus className="w-5 h-5" />,
    title: 'Masukkan Data Santri',
    desc: 'Isi No. Registrasi dan PIN 6 digit yang tertera pada kartu santri.',
  },
  {
    icon: <MagnifyingGlassPlus className="w-5 h-5" />,
    title: 'Verifikasi Otomatis',
    desc: 'Sistem mencocokkan data secara real-time dan aman.',
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: 'Lihat Rincian Tagihan',
    desc: 'Tagihan, riwayat pembayaran, dan sisa saldo langsung tampil.',
  },
  {
    icon: <Wallet className="w-5 h-5" />,
    title: 'Bayar via Virtual Account',
    desc: 'Transfer ke No. VA yang tertera, tanpa perlu datang ke koperasi.',
  },
];

/* ─── Testimonials data ──────────────────────────────────── */
const TESTIMONIALS = [
  {
    name: 'S.A',
    role: 'Wali Santri Kelas 8',
    rating: 5,
    quote: 'Cek tagihan jadi lebih praktis, tidak perlu telepon bendahara satu-satu.',
  },
  {
    name: 'R.H',
    role: 'Wali Santri Kelas 10',
    rating: 4,
    quote: 'Rincian pembayaran terlihat jelas, jadi lebih tenang memantau dari rumah.',
  },
  {
    name: 'M.F',
    role: 'Wali Santri Kelas 7',
    rating: 4,
    quote: 'Tampilannya sederhana dan mudah dipahami meski baru pertama kali pakai.',
  },
];

/* ─── Color maps for Program cards ───────────────────────── */
const accentMap = {
  blue: {
    iconBg: 'bg-blue-100 dark:bg-blue-500/15',
    iconText: 'text-blue-600 dark:text-blue-400',
    cardTop: 'border-t-blue-500 dark:border-t-blue-400',
    checkBg: 'bg-blue-100 dark:bg-blue-500/15',
    checkText: 'text-blue-600 dark:text-blue-400',
    noteBg: 'bg-blue-50 dark:bg-blue-500/10',
    noteBorder: 'border-blue-200 dark:border-blue-500/25',
    noteText: 'text-blue-700 dark:text-blue-300',
  },
  slate: {
    iconBg: 'bg-slate-100 dark:bg-slate-500/15',
    iconText: 'text-slate-600 dark:text-slate-400',
    cardTop: 'border-t-slate-500 dark:border-t-slate-400',
    checkBg: 'bg-slate-100 dark:bg-slate-500/15',
    checkText: 'text-slate-600 dark:text-slate-400',
    noteBg: 'bg-slate-50 dark:bg-slate-500/10',
    noteBorder: 'border-slate-200 dark:border-slate-500/25',
    noteText: 'text-slate-700 dark:text-slate-300',
  },
};

/* ─── Reusable animated bits ─────────────────────────────── */
function StatItem({ number, label, index }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.4 });
  return (
    <div
      ref={ref}
      className={`py-5 px-4 text-center transition-all duration-500
          ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      style={{ transitionDelay: isVisible ? `${index * 100}ms` : '0ms' }}
    >
      <div className="text-2xl font-black tracking-tight text-gray-900 dark:text-white mb-0.5"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {number}
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-white/50">
        {label}
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, desc }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.4 });
  return (
    <div
      ref={ref}
      className={`text-center mb-14 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400 mb-3">
        {eyebrow}
      </p>
      <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-3">
        {title}
      </h2>
      <p className="text-gray-500 dark:text-white/50 max-w-md mx-auto text-sm leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

function RevealCard({ children, index = 0, direction = 'up', className = '' }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.15 });
  const hiddenTransform = {
    up: 'translate-y-10',
    left: '-translate-x-10',
    right: 'translate-x-10',
  }[direction];

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className} h-full
          ${isVisible ? 'opacity-100 translate-x-0 translate-y-0 scale-100' : `opacity-0 scale-95 ${hiddenTransform}`}`}
      style={{ transitionDelay: isVisible ? `${index * 120}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5 mb-3" aria-label={`${rating} dari 5 bintang`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < rating
            ? 'fill-amber-400 text-amber-400'
            : 'fill-gray-200 text-gray-200 dark:fill-white/10 dark:text-white/10'
            }`}
        />
      ))}
    </div>
  );
}

function StepItem({ step, index, isLast }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.3 });
  return (
    <div
      ref={ref}
      className={`relative flex-1 text-center transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      style={{ transitionDelay: isVisible ? `${index * 120}ms` : '0ms' }}
    >
      {!isLast && (
        <div className="hidden sm:block absolute top-6 left-1/2 w-full h-px bg-gray-200 dark:bg-white/10" />
      )}
      <div className="relative inline-flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-white dark:bg-[#0a0e1a] border-2 border-slate-500 dark:border-slate-400 flex items-center justify-center mb-3 relative z-10 text-slate-600 dark:text-slate-400">
          {step.icon}
        </div>
        <span className="text-[10px] font-bold text-slate-500 mb-1"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1.5">
          {step.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-white/50 leading-relaxed">
          {step.desc}
        </p>
      </div>
    </div>
  );
}

const NAV_LINKS = [
  ['#services', 'Layanan'],
  ['#how-it-works', 'Cara Kerja'],
  ['#check-billing', 'Cek Tagihan'],
  ['#announcements', 'Pengumuman'],
  ['#programs', 'Program'],
  ['#faq', 'FAQ'],
  ['#contact', 'Kontak'],
];

const SECTION_IDS = ['hero', 'services', 'how-it-works', 'check-billing', 'announcements', 'programs', 'faq', 'contact'];
const SECTION_TITLES = {
  hero: 'Koperasi Senyum - Portal Informasi Koperasi Sekolah',
  services: 'Layanan & Keunggulan - Koperasi Senyum',
  'how-it-works': 'Cara Kerja - Koperasi Senyum',
  'check-billing': 'Cek Tagihan - Koperasi Senyum',
  announcements: 'Pengumuman - Koperasi Senyum',
  programs: 'Program - Koperasi Senyum',
  faq: 'FAQ - Koperasi Senyum',
  contact: 'Kontak - Koperasi Senyum',
};

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [studentCount, setStudentCount] = useState(null);
  const menuRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const location = useLocation();

  // Fetch active student count
  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null);
      if (count != null) setStudentCount(count);
    };
    fetchCount();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // ESC key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  // Focus trap inside mobile menu
  useEffect(() => {
    if (!mobileOpen || !menuRef.current) return;
    const focusableSelectors = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusableEls = menuRef.current.querySelectorAll(focusableSelectors);
    if (focusableEls.length) focusableEls[0].focus();

    const trapFocus = (e) => {
      if (e.key !== 'Tab') return;
      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    menuRef.current.addEventListener('keydown', trapFocus);
    return () => menuRef.current?.removeEventListener('keydown', trapFocus);
  }, [mobileOpen]);

  // Schema.org JSON-LD
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Koperasi Senyum',
      description: 'Portal Informasi Koperasi Sekolah MBS Tanggul. Cek tagihan seragam, buku, dan tabungan santri.',
      url: 'https://koperasi-senyum.vercel.app',
      telephone: '+6285183079329',
      email: 'senyummu2024@gmail.com',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Jl. Pemandian, Krajan II No.88, Krajan II, Patemon',
        addressLocality: 'Tanggul',
        addressRegion: 'Jember, Jawa Timur',
        postalCode: '68155',
        addressCountry: 'ID',
      },
      areaServed: 'ID',
      brand: {
        '@type': 'Brand',
        name: 'Koperasi Senyum - MBS Tanggul',
      },
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, []);

  // Dynamic document.title
  useEffect(() => {
    const prevTitle = document.title;
    document.title = SECTION_TITLES[activeSection] || 'Koperasi Senyum - MBS Tanggul';
    return () => { document.title = prevTitle; };
  }, [activeSection]);

  // Scroll spy — IntersectionObserver
  useEffect(() => {
    const observers = [];
    const handleIntersect = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(handleIntersect, {
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0,
      });
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // Swipe-to-close mobile menu
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (deltaX > 80 && deltaY < 60) {
      setMobileOpen(false);
    }
  }, []);

  // Debounced scroll handler for back-to-top
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setShowBackToTop(window.scrollY > 400);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToBilling = useCallback(() => {
    document.getElementById('check-billing')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0e1a] transition-colors duration-300 overflow-x-hidden">

      {/* ── Skip to content (a11y) ── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-slate-700 focus:text-white focus:rounded-lg"
      >
        Langsung ke konten
      </a>

      {/* ── Grid background (dark only) ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0 hidden dark:block bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px]"
        aria-hidden="true"
      />

      {/* ── Navbar ── */}
      <nav className="fixed w-full z-50 border-b border-gray-100 dark:border-white/[0.06] bg-white/80 dark:bg-[#0a0e1a]/85 backdrop-blur-md transition-colors duration-300" aria-label="Navigasi utama">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">

            {/* Logo */}
            <a href="#" className="flex items-center gap-2.5" aria-label="Koperasi Senyum - Beranda">
              <img
                src={logoSenyum}
                alt="Koperasi Senyum"
                className="w-9 h-9 rounded-lg object-contain"
                loading="eager"
              />
              <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
                Koperasi Senyum
              </span>
            </a>

            {/* Nav links (desktop) */}
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map(([href, label]) => {
                const isActive = activeSection === href.replace('#', '');
                return (
                  <a
                    key={href}
                    href={href}
                    className={`text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </a>
                );
              })}
            </div>

            {/* CTA + Hamburger */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                to="/login"
                onMouseEnter={() => {
                  import('@features/auth/pages/LoginPage.jsx');
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 dark:shadow-blue-500/10 transition-all duration-200 hover:-translate-y-px min-h-[44px]"
              >
                <SignIn size={15} />
                <span className="hidden md:inline">Login Staff</span>
                <span className="md:hidden">Masuk</span>
              </Link>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X size={20} /> : <List size={20} />}
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* ── Mobile Menu Drawer ── */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!mobileOpen}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileOpen(false)}
        />

        {/* Panel */}
        <div
          ref={menuRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={`absolute top-0 right-0 h-full w-72 max-w-[85vw] bg-white dark:bg-[#0f1425] border-l border-gray-200 dark:border-white/[0.08] shadow-2xl transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
            <span className="text-sm font-bold text-gray-900 dark:text-white">Menu</span>
            <button
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center w-11 h-11 rounded-lg text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              aria-label="Tutup menu"
            >
              <X size={18} />
            </button>
          </div>
          <nav className="px-3 py-3 space-y-0.5" aria-label="Menu mobile">
            {NAV_LINKS.map(([href, label]) => {
              const isActive = activeSection === href.replace('#', '');
              return (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-300'
                      : 'text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {label}
                </a>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Hero ── */}
      <section id="hero" className="relative pt-28 pb-16 lg:pt-40 lg:pb-24 text-center z-10">

        {/* Glow blobs */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-blue-100/60 dark:bg-blue-500/8 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-[500px] h-[500px] rounded-full bg-slate-200/50 dark:bg-slate-400/6 blur-3xl" aria-hidden="true" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-7 bg-slate-100 dark:bg-slate-500/10 border border-slate-200 dark:border-slate-500/25 text-slate-700 dark:text-slate-400">
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-slate-500" />
            </span>
            Portal Informasi Koperasi Sekolah
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] mb-5 text-gray-900 dark:text-white">
            Tagihan Santri,{' '}
            <span className="bg-gradient-to-r from-slate-700 to-blue-600 dark:from-slate-200 dark:to-blue-400 bg-clip-text text-transparent">
              Transparan &amp; Mudah
            </span>
          </h1>

          {/* Sub */}
          <p className="text-sm sm:text-lg text-gray-500 dark:text-white/50 leading-relaxed mb-9 max-w-xl mx-auto">
            Cek tagihan seragam, buku, dan tabungan santri kapan saja — langsung dari genggaman wali murid.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={scrollToBilling}
              className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-500/30 dark:shadow-blue-500/15 transition-all duration-200 hover:-translate-y-0.5 min-h-[44px]"
            >
              Cek Tagihan Sekarang
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <a
              href="#programs"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold border transition-all duration-200 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/10 hover:-translate-y-0.5 min-h-[44px]"
            >
              Informasi Program
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-xs text-gray-500 dark:text-white/40">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <span>Koperasi MBS Tanggul</span>
            </div>
            <span className="hidden sm:inline text-gray-300 dark:text-white/10" aria-hidden="true">·</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
              <span>{studentCount > 0 ? `${studentCount}+` : '—'} Wali Murid Aktif</span>
            </div>
            <span className="hidden sm:inline text-gray-300 dark:text-white/10" aria-hidden="true">·</span>
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <span>Transparan & Real-time</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section id="stats" className="relative z-10 border-y border-gray-100 dark:border-white/[0.06] bg-gray-50/70 dark:bg-white/[0.02]" aria-label="Statistik utama">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 dark:divide-white/[0.06]">
            {STATS.map(({ number, label, dynamic }, index) => (
              <StatItem key={label} number={dynamic ? (studentCount > 0 ? `${studentCount}+` : '—') : number} label={label} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <main id="main-content">

        {/* ── Layanan & Keunggulan ── */}
        <section id="services" className="relative z-10 py-20 lg:py-28 scroll-mt-16 bg-white dark:bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Layanan &amp; Keunggulan"
              title="Solusi Lengkap Koperasi Sekolah"
              desc="Memenuhi kebutuhan perlengkapan santri dengan sistem transparan dan terpercaya."
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              {BENEFITS.map((f, index) => (
                <RevealCard key={f.title} index={index} direction="up">
                  <div className="rounded-2xl p-6 border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_20px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_16px_32px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 h-full flex flex-col items-center text-center">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-slate-100 dark:bg-slate-500/15 text-slate-600 dark:text-slate-400">
                      {f.icon}
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                      {f.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-white/50 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </RevealCard>
              ))}
            </div>
          </div>
        </section>

        {/* ── Cara Kerja ── */}
        <section id="how-it-works" className="relative z-10 py-20 lg:py-28 scroll-mt-16 bg-gray-50 dark:bg-white/[0.015] border-y border-gray-100 dark:border-white/[0.05]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Alur Layanan"
              title="Cara Kerja"
              desc="Empat langkah mudah untuk memantau tagihan santri Anda."
            />
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-4">
              {STEPS.map((step, index) => (
                <StepItem key={step.title} step={step} index={index} isLast={index === STEPS.length - 1} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Cek Tagihan ── */}
        <div className="relative z-10" id="check-billing">
          <Suspense fallback={<div className="py-20 text-center text-gray-400 dark:text-white/30 text-sm">Memuat...</div>}>
            <BillingCheckSection />
          </Suspense>
        </div>

        {/* ── Pengumuman ── */}
        <div id="announcements">
          <Suspense fallback={<div className="py-20 text-center text-gray-400 dark:text-white/30 text-sm">Memuat...</div>}>
            <AnnouncementSection />
          </Suspense>
        </div>

        {/* ── Testimoni ── */}
        <section className="relative z-10 py-20 lg:py-28 bg-white dark:bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Kata Wali Murid"
              title="Testimoni"
              desc="Pengalaman wali murid menggunakan layanan cek tagihan."
            />
            {/* Desktop grid */}
            <div className="hidden sm:grid sm:grid-cols-3 gap-5">
              {TESTIMONIALS.map((t, index) => (
                <RevealCard key={t.name} index={index} direction="up">
                  <div className="rounded-2xl p-6 border border-gray-200 dark:border-white/[0.07]
                              bg-white dark:bg-white/[0.03]
                              shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_20px_-6px_rgba(0,0,0,0.08)]
                              hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_16px_32px_-8px_rgba(0,0,0,0.12)]
                              transition-shadow duration-300 h-full">
                    <StarRating rating={t.rating} />
                    <p className="text-sm text-gray-600 dark:text-white/60 leading-relaxed mb-4">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">{t.name}</span>
                      <span className="text-xs text-gray-400 dark:text-white/40">·</span>
                      <span className="text-xs text-gray-500 dark:text-white/50">{t.role}</span>
                    </div>
                  </div>
                </RevealCard>
              ))}
            </div>
            {/* Mobile horizontal scroll */}
            <div className="sm:hidden flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-hide">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="snap-center shrink-0 w-[85vw] max-w-sm">
                  <div className="rounded-2xl p-6 border border-gray-200 dark:border-white/[0.07]
                              bg-white dark:bg-white/[0.03]
                              shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_20px_-6px_rgba(0,0,0,0.08)] h-full">
                    <StarRating rating={t.rating} />
                    <p className="text-sm text-gray-600 dark:text-white/60 leading-relaxed mb-4">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">{t.name}</span>
                      <span className="text-xs text-gray-400 dark:text-white/40">·</span>
                      <span className="text-xs text-gray-500 dark:text-white/50">{t.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Informasi Program ── */}
        <section id="programs" className="relative z-10 py-20 lg:py-28 scroll-mt-16 bg-white dark:bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            <SectionHeader
              eyebrow="Program"
              title="Informasi Program"
              desc="Pilihan jalur pendidikan dan kebutuhan perlengkapan untuk santri MBS Tanggul."
            />

            <div className="grid md:grid-cols-2 gap-5">
              {PROGRAMS.map((prog, index) => {
                const c = accentMap[prog.color];
                return (
                  <RevealCard key={prog.id} index={index} direction={index % 2 === 0 ? 'left' : 'right'}>
                    <div
                      className={`
                        group relative rounded-2xl p-7 h-full flex flex-col
                        shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_20px_-6px_rgba(0,0,0,0.08)]
                        hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_16px_32px_-8px_rgba(0,0,0,0.12)]
                        border border-gray-200 dark:border-white/[0.07] border-t-2 ${c.cardTop}
                        bg-white dark:bg-white/[0.03]
                        hover:border-gray-300 dark:hover:border-white/[0.12]
                          hover:-translate-y-1
                          transition-all duration-300
                        `}
                    >
                      <div className="flex items-center gap-3 mb-5">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.iconBg} ${c.iconText}`}>
                          {prog.icon}
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                          {prog.title}
                        </h3>
                      </div>

                      <p className="text-sm text-gray-500 dark:text-white/50 mb-5 leading-relaxed">
                        {prog.desc}
                      </p>

                      <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/40 mb-3">
                        Kebutuhan Perlengkapan
                      </p>
                      <ul className="space-y-2 mb-6 flex-1">
                        {prog.items.map((item) => (
                          <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-white/60">
                            <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${c.checkBg} ${c.checkText}`}>
                              <CheckCircle className="w-3 h-3" />
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>

                      <div className={`rounded-xl p-3.5 border text-xs leading-relaxed mt-auto ${c.noteBg} ${c.noteBorder} ${c.noteText}`}>
                        {prog.note}
                      </div>
                    </div>
                  </RevealCard>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <div id="faq">
          <Suspense fallback={<div className="py-20 text-center text-gray-400 dark:text-white/30 text-sm">Memuat...</div>}>
            <FAQSection />
          </Suspense>
        </div>

        {/* ── CTA WhatsApp ── */}
        <section className="relative z-10 py-10 px-4">
          <div className="max-w-5xl mx-auto">
            <RevealCard>
              <div className="rounded-2xl p-10 sm:p-12 text-center shadow-sm
                        bg-slate-50 dark:bg-slate-500/10
                        border border-slate-200 dark:border-slate-500/25">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-500/15
                          flex items-center justify-center mx-auto mb-5
                          text-slate-600 dark:text-slate-400">
                  <ChatCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Masih ada pertanyaan?
                </h3>
                <p className="text-sm text-gray-500 dark:text-white/50 mb-6 max-w-sm mx-auto">
                  Tim kami siap membantu wali murid melalui WhatsApp.
                </p>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl
                       bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold
                       shadow-lg shadow-slate-500/25 dark:shadow-slate-500/10
                       transition-all duration-200 hover:-translate-y-0.5 min-h-[44px]"
                >
                  <ChatCircle className="w-4 h-4" />
                  Hubungi via WhatsApp
                </a>
              </div>
            </RevealCard>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer id="contact" className="relative z-10 py-8 bg-white dark:bg-[#0a0e1a] border-t border-gray-100 dark:border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col sm:flex-row flex-wrap gap-6 sm:gap-0 sm:divide-x sm:divide-gray-100 dark:sm:divide-white/[0.06] mb-6">

            {/* Brand */}
            <div className="sm:pr-6 sm:flex-1">
              <a href="#" className="flex items-center gap-2 mb-2" aria-label="Koperasi Senyum">
                <img
                  src={logoSenyum}
                  alt="Koperasi Senyum"
                  className="w-6 h-6 rounded-md object-contain"
                  loading="lazy"
                />
                <span className="text-sm font-bold text-gray-900 dark:text-white">Koperasi Senyum</span>
              </a>
              <p className="text-xs text-gray-500 dark:text-white/50 leading-relaxed">
                Melayani kebutuhan santri dengan sepenuh hati. Jujur, Amanah, dan Profesional.
              </p>
              {/* Social media */}
              <div className="flex items-center gap-3 mt-4">
                <a
                  href={CONTACT_INFO.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/40 hover:bg-pink-100 dark:hover:bg-pink-500/10 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                  aria-label="Instagram Koperasi Senyum"
                >
                  <InstagramLogo size={16} weight="fill" />
                </a>
                <a
                  href={CONTACT_INFO.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/40 hover:bg-blue-100 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  aria-label="Facebook Koperasi Senyum"
                >
                  <FacebookLogo size={16} weight="fill" />
                </a>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/40 hover:bg-green-100 dark:hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                  aria-label="WhatsApp Koperasi Senyum"
                >
                  <ChatCircle size={16} weight="fill" />
                </a>
              </div>
            </div>

            {/* Kontak & Alamat */}
            <div className="sm:px-6 sm:flex-[2]">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/40 mb-3">
                Kontak &amp; Alamat
              </h4>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-white/50">
                  <Phone size={13} className="text-blue-500 flex-shrink-0" />
                  <span>{CONTACT_INFO.phone}</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-gray-600 dark:text-white/50 leading-relaxed">
                  <MapPin size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>{CONTACT_INFO.address}</span>
                </li>
                <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-white/50">
                  <Envelope size={13} className="text-blue-500 flex-shrink-0" />
                  <span>{CONTACT_INFO.email}</span>
                </li>
              </ul>
            </div>

            {/* Jam Operasional */}
            <div className="sm:pl-6 sm:flex-1">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/40 mb-3">
                Jam Operasional
              </h4>
              <ul className="space-y-2.5 text-xs text-gray-600 dark:text-white/50">
                <li className="flex items-start gap-2 leading-relaxed">
                  <Calendar size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-gray-800 dark:text-white/80">Jadwal</span>
                    <span>Setiap Hari (Kecuali Kamis)</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 leading-relaxed">
                  <Clock size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-gray-800 dark:text-white/80">Waktu</span>
                    <span>08.00 – 14.00 WIB</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-white/[0.05] pt-4 text-center">
            <p className="text-[11px] text-gray-500 dark:text-white/40">
              &copy; {new Date().getFullYear()} Koperasi Senyum. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* ── Sticky Mobile CTA ── */}
      <div className="no-print fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-gray-200 dark:border-white/[0.08] bg-white/90 dark:bg-[#0a0e1a]/90 backdrop-blur-md px-4 py-3 safe-area-pb">
        <button
          onClick={scrollToBilling}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-500/25 transition-all min-h-[44px]"
        >
          Cek Tagihan Sekarang
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── WhatsApp Floating Button (desktop) ── */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=Halo%20Koperasi%20Senyum`}
        target="_blank"
        rel="noopener noreferrer"
        className="no-print fixed bottom-6 right-6 z-50 hidden md:flex items-center gap-2.5 pl-4 pr-5 py-3 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg shadow-[#25D366]/25 hover:shadow-xl hover:shadow-[#25D366]/30 transition-all duration-300 hover:-translate-y-0.5 group"
        aria-label="Chat via WhatsApp"
      >
        <WhatsappLogo className="w-5 h-5" weight="fill" />
        <span className="text-sm font-semibold">Chat Kami</span>
      </a>

      {/* ── Back to Top ── */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-24 md:bottom-20 right-6 z-50 w-11 h-11 rounded-full bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 shadow-lg text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/15 transition-all duration-300 flex items-center justify-center ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        aria-label="Kembali ke atas"
      >
        <CaretUp className="w-5 h-5" />
      </button>

    </div>
  );
}
