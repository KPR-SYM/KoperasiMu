import React, { useState } from 'react'
import { Check, ArrowLeft, ArrowRight, DownloadSimple, UploadSimple, Spinner, Shield, List } from '@phosphor-icons/react'

export default function PeriodImportSplitPanel({
    importStep,
    STEPS,
    handleGoToStep,
    importFileName,
    importFileHeaders,
    importRawData,
    importDetectedDateFormat,
    statValues,
    STAT_DEFS,
    importConflictStrategy,
    setImportConflictStrategy,
    importing,
    importProgress,
    importEta,
    hasImportBlockingErrors,
    importReadyRows,
    importSummary,
    handleCommitWithConfirmation,
    handleDownloadTemplate,
    handleReviewPreview,
    isMappingComplete,
    importColumnMapping,
    onBack,
    children,
}) {
    const [showSidebar, setShowSidebar] = useState(true)

    return (
        <div className="grid gap-5 h-full w-full min-h-0 items-start" style={{ gridTemplateColumns: showSidebar ? '230px 1fr' : '1fr' }}>
            {/* Step Panel (Sidebar Card) */}
            {showSidebar && (
                <div className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 h-full">
                    {/* Step Navigation */}
                    <div className="flex flex-col gap-0">
                        {STEPS.map((s, idx) => {
                            const isActive = importStep === s.step
                            const isDone = s.step < importStep
                            const isClickable = s.step < importStep || (s.step === 2 && importStep === 2)

                            return (
                                <div key={s.step} className="flex gap-2.5 relative" style={{ paddingBottom: idx < STEPS.length - 1 ? 18 : 0 }}>
                                    {/* Connecting Line */}
                                    {idx < STEPS.length - 1 && (
                                        <div
                                            className={`absolute left-[11px] top-[24px] bottom-0 w-0.5 ${
                                                isDone ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                                            }`}
                                        />
                                    )}

                                    {/* Step Dot */}
                                    <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 z-10 transition-all ${
                                            isDone
                                                ? 'bg-[var(--color-primary)] text-white'
                                                : isActive
                                                    ? 'bg-[var(--color-primary)] text-white shadow-[0_0_0_3px_var(--color-primary-soft,var(--color-primary)/10)]'
                                                    : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]'
                                        }`}
                                    >
                                        {isDone ? <Check className="w-2.5 h-2.5" weight="bold" /> : s.step}
                                    </div>

                                    {/* Step Text */}
                                    <div className="pt-px">
                                        <div className={`text-[11px] font-bold ${
                                            isActive || isDone ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'
                                        }`}>
                                            {s.label}
                                        </div>
                                        <div className={`text-[9px] mt-px ${
                                            isActive ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-muted)] opacity-60'
                                        }`}>
                                            {s.step === 1 && 'Unggah file'}
                                            {s.step === 2 && 'Petakan kolom'}
                                            {s.step === 3 && 'Tinjau data'}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Checklist Box */}
                    <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                        <div className="text-[9px] font-extrabold uppercase tracking-wide text-[var(--color-text-muted)] mb-2">
                            Yang Perlu Disiapkan
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-start gap-1.5">
                                <div className="w-3.5 h-3.5 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                                    <Check className="w-2 h-2" weight="bold" />
                                </div>
                                <div className="text-[10px] text-[var(--color-text-muted)] leading-snug">
                                    Kolom wajib: <strong className="font-bold text-[var(--color-text)]">Tahun Pelajaran, Semester, Tanggal Mulai, Tanggal Selesai</strong>
                                </div>
                            </div>
                            <div className="flex items-start gap-1.5">
                                <div className="w-3.5 h-3.5 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                                    <Check className="w-2 h-2" weight="bold" />
                                </div>
                                <div className="text-[10px] text-[var(--color-text-muted)] leading-snug">
                                    Format tanggal <strong className="font-bold text-[var(--color-text)]">YYYY-MM-DD</strong> (contoh: 2026-07-14)
                                </div>
                            </div>
                            <div className="flex items-start gap-1.5">
                                <div className="w-3.5 h-3.5 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                                    <Check className="w-2 h-2" weight="bold" />
                                </div>
                                <div className="text-[10px] text-[var(--color-text-muted)] leading-snug">
                                    Format file <strong className="font-bold text-[var(--color-text)]">.xlsx</strong> atau <strong className="font-bold text-[var(--color-text)]">.csv</strong>, maks <strong className="font-bold text-[var(--color-text)]">5MB</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notice Box */}
                    <div className="mt-3 flex gap-1.5 bg-amber-500/10 rounded-lg p-2.5">
                        <Shield className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" weight="fill" />
                        <p className="text-[9px] text-amber-700 leading-relaxed m-0">
                            Data belum tersimpan ke database sampai kamu menekan "Selesaikan Import".
                        </p>
                    </div>

                    {/* Toggle Sidebar Button */}
                    <button
                        onClick={() => setShowSidebar(false)}
                        className="mt-3 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] text-[9px] font-bold hover:bg-[var(--color-surface-alt)] transition-all"
                    >
                        <List className="w-2.5 h-2.5" />
                        Sembunyikan
                    </button>
                </div>
            )}

            {/* Main Panel */}
            <div className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden min-h-0">
                {/* Panel Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    {children}
                </div>

                {/* Footer Bar */}
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-[var(--color-border)] bg-[var(--color-surface-alt)]/30">
                    <div className="flex items-center gap-3">
                        {importStep > 1 && !importing && (
                            <button
                                onClick={() => handleGoToStep(v => v - 1)}
                                className="h-[38px] px-4 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] text-[12.5px] font-bold hover:bg-[var(--color-surface-alt)] transition-all flex items-center gap-2"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Kembali
                            </button>
                        )}
                        {importStep === 1 && (
                            <button
                                onClick={handleDownloadTemplate}
                                className="h-[38px] px-4 rounded-[10px] border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-[12.5px] font-bold hover:bg-emerald-500/20 transition-all flex items-center gap-2"
                            >
                                <DownloadSimple className="w-3.5 h-3.5" />
                                Template
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {!showSidebar && (
                            <button
                                onClick={() => setShowSidebar(true)}
                                className="h-[38px] px-4 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] text-[12.5px] font-bold hover:bg-[var(--color-surface-alt)] transition-all flex items-center gap-2"
                            >
                                <List className="w-3.5 h-3.5" />
                                Langkah
                            </button>
                        )}
                        {importStep === 1 ? (
                            <button
                                onClick={() => (importRawData.length > 0 && importFileName) ? handleGoToStep(2) : document.querySelector('[data-upload-trigger]')?.click()}
                                className="h-[38px] px-5 rounded-[10px] bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-[12.5px] font-bold shadow-md shadow-[var(--color-primary)]/20 transition-all flex items-center gap-2"
                            >
                                {(importRawData.length > 0 && importFileName) ? (
                                    <>Lanjutkan <ArrowRight className="w-3.5 h-3.5" /></>
                                ) : (
                                    <>Pilih File <UploadSimple className="w-3.5 h-3.5" /></>
                                )}
                            </button>
                        ) : importStep === 2 ? (
                            <button
                                onClick={handleReviewPreview}
                                disabled={!isMappingComplete(importColumnMapping)}
                                className="h-[38px] px-5 rounded-[10px] bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-[12.5px] font-bold disabled:opacity-40 shadow-md shadow-[var(--color-primary)]/20 transition-all flex items-center gap-2"
                            >
                                Review Data <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleCommitWithConfirmation}
                                disabled={importing || hasImportBlockingErrors || importReadyRows.length === 0}
                                className="h-[38px] px-5 rounded-[10px] bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-[12.5px] font-bold disabled:opacity-40 shadow-md shadow-[var(--color-primary)]/20 transition-all flex items-center gap-2"
                            >
                                {importing
                                    ? <><Spinner className="animate-spin w-3.5 h-3.5" /> Mengimport...</>
                                    : <><Check className="w-3.5 h-3.5" weight="bold" /> Selesaikan Import</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function isMappingComplete(mapping) {
    return mapping.academic_year && mapping.semester && mapping.start_date && mapping.end_date
}
