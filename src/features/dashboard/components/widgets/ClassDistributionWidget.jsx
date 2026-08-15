import React, { memo } from 'react'
import { Users, ArrowRight } from '@phosphor-icons/react'

export const ClassDistributionWidget = memo(function ClassDistributionWidget({ items, loading, onViewAll }) {
    const max = Math.max(...(items || []).map(s => s.count), 1)
    const visible = (items || []).slice(0, 6)

    return (
        <div className="glass rounded-[1.5rem] p-5 flex flex-col h-full min-h-[280px] relative overflow-hidden group hover:shadow-2xl hover:shadow-[var(--color-primary)]/5 transition-all duration-500">
            <div className="absolute -left-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />

            <div className="relative z-10 flex items-center justify-between mb-4">
                <div className="min-w-0">
                    <p className="text-[13px] font-black text-[var(--color-text)]">Santri per Kelas</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] opacity-70 mt-0.5">Distribusi rombongan belajar</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 ml-3">
                    <Users className="w-4 h-4" />
                </div>
            </div>

            <div className="relative z-10 flex-1">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="h-2.5 w-20 bg-[var(--color-border)]/40 animate-pulse rounded" />
                                    <div className="h-2.5 w-6 bg-[var(--color-border)]/40 animate-pulse rounded" />
                                </div>
                                <div className="h-2 w-full bg-[var(--color-border)]/20 animate-pulse rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : visible.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                        <Users className="w-8 h-8 text-[var(--color-text-muted)]/40 mb-3" />
                        <p className="text-[11px] font-bold text-[var(--color-text-muted)]">Belum ada data kelas</p>
                    </div>
                ) : (
                    <div className="space-y-3.5">
                        {visible.map(s => (
                            <div key={s.name}>
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="text-[11px] font-bold text-[var(--color-text)] truncate">{s.name}</span>
                                    <span className="text-[11px] font-black text-[var(--color-text-muted)] tabular-nums shrink-0">{s.count}</span>
                                </div>
                                <div className="h-1.5 w-full bg-[var(--color-border)]/30 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                                        style={{ width: `${Math.round((s.count / max) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {onViewAll && (
                <button
                    type="button"
                    onClick={onViewAll}
                    className="relative z-10 w-full mt-4 pt-3 border-t border-[var(--color-border)]/60 flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)] hover:opacity-80 active:scale-[0.99] transition-all"
                >
                    Lihat Semua Kelas
                    <ArrowRight className="w-3 h-3" />
                </button>
            )}
        </div>
    )
})