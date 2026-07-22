import { Component } from 'react'
import { WarningCircle, Warning, Bug, Copy, House, ArrowClockwise, X } from '@phosphor-icons/react'


// ─── Helpers ──────────────────────────────────────────────────────────────────

function genErrorId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }
    return `err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function getTimestamp() {
    return new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
}

function parseStackLine(line) {
    const match = line.match(/at\s+(.+?)\s*\((.+?):(\d+):(\d+)\)/)
    if (match) return { fn: match[1], file: match[2], line: match[3], col: match[4] }
    const match2 = line.match(/at\s+(.+?):(\d+):(\d+)/)
    if (match2) return { fn: '<anonymous>', file: match2[1], line: match2[2], col: match2[3] }
    return null
}

// ─── DevErrorOverlay — Next.js-style terminal overlay ──────────────────────────

function DevErrorOverlay({ error, errorInfo, errorId, timestamp, onReset, retryCount, maxRetries }) {
    const errorType = error?.constructor?.name ?? 'Error'
    const isModuleError = error?.message?.includes('Failed to fetch') || error?.message?.includes('dynamically imported module')
    const canRetry = retryCount < maxRetries
    const stackLines = (errorInfo?.componentStack || error?.stack || '')
        .trim().split('\n').filter(Boolean)
    const parsedLines = stackLines.map(parseStackLine).filter(Boolean)

    const handleCopy = () => {
        const lines = [
            `Error ID  : ${errorId}`,
            `Waktu     : ${timestamp}`,
            `Tipe      : ${errorType}`,
            `Pesan     : ${error?.message ?? '—'}`,
            errorInfo?.componentStack ? `\nStack trace:\n${errorInfo.componentStack.trim()}` : '',
        ]
        navigator.clipboard?.writeText(lines.filter(Boolean).join('\n'))
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            backgroundColor: '#0a0a0f',
            color: '#e2e8f0',
            fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, monospace",
            fontSize: 13,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
        }}>
            {/* ── Header Bar ── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 20px',
                borderBottom: '1px solid #1e293b',
                background: 'linear-gradient(180deg, #0f172a 0%, #0a0a0f 100%)',
                flexShrink: 0,
            }}>
                <div style={{
                    width: 28, height: 28, borderRadius: 6,
                    background: '#ef4444', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700,
                }}>
                    <Warning weight="bold" size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#f8fafc', lineHeight: 1.3 }}>
                        Unhandled Runtime Error
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 1, lineHeight: 1.3 }}>
                        {errorId} · {timestamp}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{
                        padding: '3px 10px', borderRadius: 4,
                        background: '#1e293b', color: '#94a3b8',
                        fontSize: 10, fontWeight: 600, letterSpacing: '0.05em',
                        border: '1px solid #334155',
                    }}>
                        {errorType}
                    </span>
                    <button onClick={handleCopy} title="Copy error details"
                        style={{
                            width: 30, height: 30, borderRadius: 6,
                            background: 'transparent', border: '1px solid #334155',
                            color: '#64748b', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                        <Copy size={14} />
                    </button>
                </div>
            </div>

            {/* ── Error Message ── */}
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #1e293b',
                background: '#0f172a',
                flexShrink: 0,
            }}>
                <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                    {errorType}
                </div>
                <div style={{
                    fontSize: 14, lineHeight: 1.5, color: '#f8fafc',
                    fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                }}>
                    {error?.message || 'Unknown error'}
                </div>
            </div>

            {/* ── Stack Trace ── */}
            <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
                <div style={{ padding: '4px 20px 8px', fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Call Stack
                </div>
                {parsedLines.length > 0 ? parsedLines.map((p, i) => (
                    <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '6px 20px',
                        borderLeft: '3px solid transparent',
                        borderBottom: '1px solid #0f172a',
                        background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                    }}>
                        <span style={{
                            width: 20, fontSize: 10, color: '#475569',
                            fontVariantNumeric: 'tabular-nums', textAlign: 'right', flexShrink: 0,
                        }}>
                            {i + 1}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, color: '#e879f9', fontWeight: 500, lineHeight: 1.4 }}>
                                {p.fn}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4, marginTop: 1 }}>
                                {p.file}
                                <span style={{ color: '#475569' }}>:{p.line}:{p.col}</span>
                            </div>
                        </div>
                    </div>
                )) : (
                    <pre style={{
                        margin: '0 20px', padding: 12, borderRadius: 6,
                        background: '#0f172a', border: '1px solid #1e293b',
                        fontSize: 11, lineHeight: 1.6, color: '#94a3b8',
                        overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                    }}>
                        {errorInfo?.componentStack?.trim() || error?.stack?.trim() || '(no stack trace)'}
                    </pre>
                )}
            </div>

            {/* ── Footer Actions ── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 20px',
                borderTop: '1px solid #1e293b',
                background: '#0f172a',
                flexShrink: 0,
            }}>
                <button onClick={isModuleError ? () => window.location.reload() : onReset}
                    disabled={!canRetry && !isModuleError}
                    style={{
                        height: 36, padding: '0 20px', borderRadius: 6,
                        background: '#ef4444', color: '#fff', border: 'none',
                        fontSize: 12, fontWeight: 600, cursor: canRetry || isModuleError ? 'pointer' : 'not-allowed',
                        opacity: canRetry || isModuleError ? 1 : 0.4,
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                    <ArrowClockwise size={14} />
                    {isModuleError ? 'Reload' : canRetry ? 'Retry' : 'Retry limit reached'}
                </button>
                <button onClick={() => window.location.href = '/'}
                    style={{
                        height: 36, padding: '0 16px', borderRadius: 6,
                        background: 'transparent', color: '#64748b', border: '1px solid #334155',
                        fontSize: 11, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                    <House size={14} />
                    Home
                </button>
                {!canRetry && (
                    <span style={{ fontSize: 10, color: '#dc2626', marginLeft: 'auto' }}>
                        Max retries ({maxRetries}) reached
                    </span>
                )}
            </div>
        </div>
    )
}

// ─── ProductionErrorFallback ───────────────────────────────────────────────────

function ProductionErrorFallback({
    error, errorInfo, errorId, timestamp,
    retryCount, maxRetries, onReset, isOffline,
}) {
    const isModuleError = error?.message?.includes('Failed to fetch') || error?.message?.includes('dynamically imported module')
    const canRetry = retryCount < maxRetries
    const showRetryWarn = retryCount > 0
    const isAmber = isOffline || isModuleError
    const accent = isAmber ? 'amber' : 'red'

    const handleCopy = () => {
        const lines = [
            `Error ID  : ${errorId}`,
            `Waktu     : ${timestamp}`,
            `Tipe      : ${error?.constructor?.name ?? 'Error'}`,
            `Pesan     : ${error?.message ?? '—'}`,
        ]
        navigator.clipboard?.writeText(lines.filter(Boolean).join('\n'))
    }

    const handleReport = () => {
        const message = encodeURIComponent(
            [
                `*Bug Report*`,
                ``,
                `*Error ID :* ${errorId}`,
                `*Waktu    :* ${timestamp}`,
                `*Pesan    :* ${error?.message ?? '—'}`,
            ].join('\n')
        )
        window.open(`https://wa.me/6281230660013?text=${message}`, '_blank')
    }

    const secondaryBtns = [
        { icon: House, label: 'Beranda', fn: () => { window.location.href = '/' }, aria: 'Kembali ke beranda' },
        { icon: Copy, label: 'Salin', fn: handleCopy, aria: 'Salin detail error ke clipboard' },
        { icon: Bug, label: 'Laporkan', fn: handleReport, aria: 'Laporkan bug via WhatsApp' },
    ]

    return (
        <div
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            className="min-h-screen flex flex-col items-center justify-center px-4 gap-3 bg-[var(--color-surface)]"
            style={{ animation: 'eb-enter 0.25s cubic-bezier(0.16,1,0.3,1) both' }}
        >
            <style>{`
                @keyframes eb-enter {
                    from { opacity:0; transform:translateY(16px) scale(0.98); }
                    to   { opacity:1; transform:translateY(0) scale(1); }
                }
            `}</style>
            <div className={`relative w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm flex flex-col items-center gap-4 px-6 pt-8 pb-6 border-t-4 ${accent === 'amber' ? 'border-t-amber-500' : 'border-t-red-500'}`}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${accent === 'amber' ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
                    {isOffline ? (
                        <WarningCircle weight="bold" className={`text-2xl ${accent === 'amber' ? 'text-amber-500' : 'text-red-500'}`} />
                    ) : (
                        <Warning weight="bold" className={`text-2xl ${accent === 'amber' ? 'text-amber-500' : 'text-red-500'}`} />
                    )}
                </div>
                <div className="text-center max-w-xs">
                    <p className="text-base font-black text-[var(--color-text)] tracking-tight mb-1.5">
                        {isOffline ? 'Tidak ada koneksi' : isModuleError ? 'Gagal memuat modul' : 'Terjadi kesalahan'}
                    </p>
                    <p className="text-[12px] text-[var(--color-text-muted)] leading-relaxed">
                        {isOffline
                            ? 'Periksa koneksi internet kamu, lalu coba lagi.'
                            : isModuleError
                                ? 'Versi aplikasi telah diperbarui. Silakan muat ulang halaman.'
                                : 'Aplikasi menemui masalah yang tidak terduga. Coba lagi atau kembali ke beranda.'}
                    </p>
                </div>

                {showRetryWarn && (
                    <p role="status" aria-live="polite" className={`text-[11px] text-center ${canRetry ? 'text-amber-500' : 'text-red-500'}`}>
                        {canRetry
                            ? `Percobaan ke-${retryCount} dari ${maxRetries}`
                            : `Batas percobaan (${maxRetries}\u00d7) tercapai.`}
                    </p>
                )}

                <div className="flex flex-col gap-2 w-full">
                    <button
                        onClick={isModuleError ? () => window.location.reload() : onReset}
                        disabled={!canRetry}
                        autoFocus
                        className={`w-full h-10 rounded-xl text-white text-[12px] font-black uppercase tracking-wide flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${accent === 'amber' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                        <ArrowClockwise />
                        {isModuleError ? 'Muat Ulang Halaman' : canRetry ? 'Coba Lagi' : 'Batas Tercapai'}
                    </button>
                    <div className="flex gap-2 w-full">
                        {secondaryBtns.map(({ icon: Icon, label, fn, aria }) => (
                            <button key={label} onClick={fn} aria-label={aria}
                                className="flex-1 h-10 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-muted)] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-[var(--color-border)] hover:text-[var(--color-text)] active:scale-95 transition-all duration-150"
                            >
                                <Icon /> {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <p className="text-[10px] font-mono text-[var(--color-text-muted)] opacity-60 text-center tracking-wide">
                <span aria-label={`Error ID: ${errorId}`}>{errorId}</span>
                {' \u00b7 '}
                <time>{timestamp}</time>
            </p>
        </div>
    )
}

// ─── GlobalErrorBoundary ──────────────────────────────────────────────────────
// Taruh di App.jsx / main.jsx sebagai wrapper paling luar.
// Menangkap semua error yang tidak ter-catch oleh boundary yang lebih dalam.
//
// Usage:
//   <GlobalErrorBoundary>
//     <App />
//   </GlobalErrorBoundary>
//
// Props:
//   onError(error, errorInfo, errorId)
//     → Optional callback. Cocok untuk kirim ke Sentry, Datadog, dsb.
//       errorId bisa dijadikan Sentry tag agar mudah dilacak.
//
//   fallback
//     → Optional custom fallback. Bisa berupa:
//       - ReactNode biasa: <MyFallback />
//       - Render function: ({ error, errorInfo, reset }) => <MyFallback />
//
//   maxRetries (default: 3)
//     → Batas maksimal tombol "Coba Lagi" sebelum dinonaktifkan.
//
//   resetKeys (default: [])
//     → Array nilai yang jika berubah akan otomatis mereset boundary.
//       Cocok diisi dengan React Router location agar reset terjadi
//       saat user navigasi ke halaman lain.
//       Contoh: <GlobalErrorBoundary resetKeys={[location.pathname]}>

class GlobalErrorBoundary extends Component {
    static defaultProps = {
        maxRetries: 3,
        resetKeys: [],
    }

    constructor(props) {
        super(props)
        this.state = {
            error: null,
            errorInfo: null,
            errorId: null,
            timestamp: null,
            retryCount: 0,
        }
        this.handleReset = this.handleReset.bind(this)
    }

    static getDerivedStateFromError(error) {
        return {
            error,
            errorId: genErrorId(),
            timestamp: getTimestamp(),
        }
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo })

        if (typeof this.props.onError === 'function') {
            this.props.onError(error, errorInfo, this.state.errorId)
        }

        if (import.meta.env.DEV) {
            console.group('%c[GlobalErrorBoundary]%c ' + (error?.message || ''), 'color:#ef4444;font-weight:bold', '')
            console.error('Error   :', error)
            console.error('Info    :', errorInfo)
            console.error('Error ID:', this.state.errorId)
            console.groupEnd()
        }
    }

    componentDidUpdate(prevProps) {
        if (!this.state.error) return

        const prevKeys = prevProps.resetKeys ?? []
        const nextKeys = this.props.resetKeys ?? []
        const hasChanged = nextKeys.some((key, i) => key !== prevKeys[i])

        if (hasChanged) this.handleReset()
    }

    handleReset() {
        this.setState(prev => ({
            error: null,
            errorInfo: null,
            errorId: null,
            timestamp: null,
            retryCount: prev.retryCount + 1,
        }))
    }

    render() {
        const { error, errorInfo, errorId, timestamp, retryCount } = this.state
        const { fallback, children, maxRetries } = this.props

        if (!error) return children

        if (fallback) {
            return typeof fallback === 'function'
                ? fallback({ error, errorInfo, reset: this.handleReset })
                : fallback
        }

        if (import.meta.env.DEV) {
            return (
                <DevErrorOverlay
                    error={error}
                    errorInfo={errorInfo}
                    errorId={errorId}
                    timestamp={timestamp}
                    retryCount={retryCount}
                    maxRetries={maxRetries}
                    onReset={this.handleReset}
                />
            )
        }

        return (
            <ProductionErrorFallback
                error={error}
                errorInfo={errorInfo}
                errorId={errorId}
                timestamp={timestamp}
                retryCount={retryCount}
                maxRetries={maxRetries}
                onReset={this.handleReset}
                isOffline={!navigator.onLine}
            />
        )
    }
}

export default GlobalErrorBoundary