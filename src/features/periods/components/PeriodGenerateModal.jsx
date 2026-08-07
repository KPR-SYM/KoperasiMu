import React, { useState, useMemo } from 'react'
import { ArrowClockwise, Warning, Spinner, Plus, Minus } from '@phosphor-icons/react'
import { ConfirmDialog } from '@shared/components'

function weeksBetween(start, end) {
    const ms = new Date(end) - new Date(start)
    return Math.round(ms / (1000 * 60 * 60 * 24 * 7))
}

export default function PeriodGenerateModal({
    isOpen,
    onClose,
    onConfirm,
    years,
    batchCount,
    setBatchCount,
    resetBatchCount,
    submitting,
}) {
    const generatePreview = useMemo(() => {
        if (!years || years.length === 0 || batchCount < 1) return { items: [], conflicts: 0, newCount: 0 }
        const sorted = [...years].sort((a, b) => {
            if (a.academic_year !== b.academic_year) return b.academic_year.localeCompare(a.academic_year)
            return b.semester === 'Genap' ? 1 : -1
        })
        const existingSet = new Set(years.map(y => `${y.academic_year}|${y.semester}`))
        const items = []
        let conflicts = 0
        let latest = sorted[0]?.academic_year || ''
        for (let c = 0; c < batchCount; c++) {
            const match = latest.match(/(\d{4})\/(\d{4})/)
            if (!match) break
            const nextStart = parseInt(match[1]) + 1
            const nextEnd = parseInt(match[2]) + 1
            const yearStr = `${nextStart}/${nextEnd}`
            const sy = parseInt(nextStart)
            const ganjilExists = existingSet.has(`${yearStr}|Ganjil`)
            const genapExists = existingSet.has(`${yearStr}|Genap`)
            if (ganjilExists && genapExists) { conflicts++; latest = yearStr; continue }
            if (!ganjilExists) items.push({ academic_year: yearStr, semester: 'Ganjil', start: `${sy}-07-01`, end: `${sy}-12-31`, isNew: true })
            else { items.push({ academic_year: yearStr, semester: 'Ganjil', start: `${sy}-07-01`, end: `${sy}-12-31`, isNew: false }); conflicts++ }
            if (!genapExists) items.push({ academic_year: yearStr, semester: 'Genap', start: `${sy + 1}-01-01`, end: `${sy + 1}-06-30`, isNew: true })
            else { items.push({ academic_year: yearStr, semester: 'Genap', start: `${sy + 1}-01-01`, end: `${sy + 1}-06-30`, isNew: false }); conflicts++ }
            latest = yearStr
        }
        return { items, conflicts, newCount: items.filter(i => i.isNew).length }
    }, [years, batchCount])

    const handleClose = () => {
        resetBatchCount?.()
        onClose()
    }

    const handleConfirm = () => {
        onConfirm(batchCount)
        resetBatchCount?.()
    }

    if (!isOpen) return null

    return (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={handleClose}
            onConfirm={handleConfirm}
            title="Generate Tahun Pelajaran Baru"
            description={`Buat ${batchCount * 2} periode (${batchCount} tahun × Ganjil + Genap) baru secara otomatis.`}
            icon={ArrowClockwise}
            iconBg="bg-blue-500/10"
            iconColor="text-blue-500"
            size="md"
            confirmText={generatePreview.newCount > 0 ? `Generate ${generatePreview.newCount} Periode` : 'Generate'}
            confirmIcon={ArrowClockwise}
            confirmColor="primary"
            confirmDisabled={generatePreview.newCount === 0}
            submitting={submitting}
        >
            <div className="space-y-3">
                <p className="text-[11px] font-medium text-[var(--color-text-muted)] leading-relaxed">
                    Sistem akan membuat{' '}
                    <span className="font-black text-[var(--color-text)]">{generatePreview.newCount} periode baru</span>
                    {generatePreview.conflicts > 0 && (
                        <span className="text-amber-500"> · {generatePreview.conflicts} dilewati (sudah ada)</span>
                    )}.
                </p>

                {/* ── Jumlah Tahun ── */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-alt)]/40 border border-[var(--color-border)]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Jumlah Tahun</span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setBatchCount(Math.max(1, batchCount - 1))}
                            disabled={batchCount <= 1}
                            className="w-8 h-8 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] font-black text-sm flex items-center justify-center hover:bg-[var(--color-surface-alt)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-black text-[var(--color-text)] tabular-nums">{batchCount}</span>
                        <button
                            type="button"
                            onClick={() => setBatchCount(Math.min(10, batchCount + 1))}
                            disabled={batchCount >= 10}
                            className="w-8 h-8 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] font-black text-sm flex items-center justify-center hover:bg-[var(--color-surface-alt)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* ── Conflict Warning ── */}
                {generatePreview.conflicts > 0 && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <Warning className="text-amber-500 w-4 h-4 shrink-0" />
                        <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                            {generatePreview.conflicts} periode sudah ada dan tidak akan dibuat ulang.
                        </p>
                    </div>
                )}

                {/* ── Preview List ── */}
                {generatePreview.items.length > 0 && (
                    <div className="border border-[var(--color-border)] rounded-xl overflow-hidden divide-y divide-[var(--color-border)]">
                        <div className="flex items-center px-3 py-2 bg-[var(--color-surface-alt)]/60">
                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] w-[42%] shrink-0">Periode</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] w-[38%] shrink-0 hidden sm:block">Rentang</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] w-[20%] text-right shrink-0 hidden sm:block">Durasi</span>
                        </div>
                        <div className="max-h-52 overflow-y-auto">
                            {generatePreview.items.map((item, i) => (
                                <div
                                    key={i}
                                    className={`flex items-center px-3 py-2 transition-colors ${item.isNew ? 'hover:bg-[var(--color-surface-alt)]/30' : 'bg-[var(--color-surface-alt)]/20 opacity-60'}`}
                                >
                                    <div className="w-[42%] shrink-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-[var(--color-text)] tabular-nums">{item.academic_year}</span>
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${item.semester === 'Ganjil' ? 'bg-blue-500/10 text-blue-600' : 'bg-purple-500/10 text-purple-600'}`}>
                                                {item.semester === 'Ganjil' ? 'Ganjil' : 'Genap'}
                                            </span>
                                        </div>
                                        <p className="text-[9px] text-[var(--color-text-muted)] font-mono mt-0.5 sm:hidden">
                                            {item.start} → {item.end}
                                        </p>
                                    </div>
                                    <div className="hidden sm:flex items-center w-[38%] shrink-0">
                                        <span className="text-[10px] text-[var(--color-text-muted)] font-mono tabular-nums whitespace-nowrap">
                                            {item.start} → {item.end}
                                        </span>
                                    </div>
                                    <div className="hidden sm:flex items-center w-[20%] justify-end shrink-0">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--color-surface-alt)]/60 text-[9px] font-bold text-[var(--color-text-muted)] tabular-nums">
                                            {weeksBetween(item.start, item.end)} <span className="font-medium opacity-60">minggu</span>
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </ConfirmDialog>
    )
}
