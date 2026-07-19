import { memo } from "react";
import { Calendar, CheckCircle, Lock, LockOpen } from "@phosphor-icons/react";
import { Modal } from "@shared/components";

const PeriodComparisonModal = memo(function PeriodComparisonModal({
    isOpen,
    onClose,
    itemA,
    itemB,
    formatDate,
    getDuration,
    getPeriodStats,
}) {
    if (!itemA || !itemB) return null;

    const Row = ({ label, renderA, renderB }) => (
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
            <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-bold text-[var(--color-text)]">
                {renderA}
            </div>
            <div className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-muted)] opacity-40 text-center min-w-[36px]">{label}</div>
            <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-bold text-[var(--color-text)]">
                {renderB}
            </div>
        </div>
    );

    const statsA = getPeriodStats?.(itemA.start_date, itemA.end_date, itemA.registration_start, itemA.registration_end);
    const statsB = getPeriodStats?.(itemB.start_date, itemB.end_date, itemB.registration_start, itemB.registration_end);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Bandingkan Periode" size="full" mobileVariant="bottom-sheet">
            <div className="space-y-4 pb-2">
                {/* Header cards */}
                <div className="grid grid-cols-2 gap-3">
                    {[itemA, itemB].map((item, i) => (
                        <div key={i} className={`p-4 rounded-2xl border ${i === 0 ? "border-blue-500/20 bg-blue-500/5" : "border-purple-500/20 bg-purple-500/5"} flex items-start justify-between gap-3`}>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                                    {i === 0 ? "Pertama" : "Kedua"}
                                </p>
                                <h4 className="text-lg font-black text-[var(--color-text)] leading-tight truncate mt-0.5">
                                    {item.academic_year}
                                </h4>
                                <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${item.semester === "Ganjil" ? "bg-blue-500/10 text-blue-600" : "bg-purple-500/10 text-purple-600"}`}>
                                    {item.semester}
                                </span>
                            </div>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-[var(--color-surface)] text-[var(--color-text-muted)]"}`}>
                                {item.is_active ? <CheckCircle weight="fill" className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Comparison rows */}
                <div className="space-y-2">
                    <Row
                        label="Mulai"
                        renderA={formatDate(itemA.start_date)}
                        renderB={formatDate(itemB.start_date)}
                    />
                    <Row
                        label="Selesai"
                        renderA={formatDate(itemA.end_date)}
                        renderB={formatDate(itemB.end_date)}
                    />
                    <Row
                        label="Durasi"
                        renderA={getDuration(itemA.start_date, itemA.end_date)}
                        renderB={getDuration(itemB.start_date, itemB.end_date)}
                    />
                    {statsA && statsB && (
                        <Row
                            label="Hari"
                            renderA={<>{statsA.elapsed}/{statsA.totalDays} · {statsA.remaining} lg</>}
                            renderB={<>{statsB.elapsed}/{statsB.totalDays} · {statsB.remaining} lg</>}
                        />
                    )}
                    {itemA.registration_start && itemB.registration_start && (
                        <Row
                            label="Daftar"
                            renderA={<>{formatDate(itemA.registration_start)} — {formatDate(itemA.registration_end)}</>}
                            renderB={<>{formatDate(itemB.registration_start)} — {formatDate(itemB.registration_end)}</>}
                        />
                    )}
                    <Row
                        label="Aktif"
                        renderA={itemA.is_active ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle weight="fill" className="w-3 h-3" /> Aktif</span> : "Tidak"}
                        renderB={itemB.is_active ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle weight="fill" className="w-3 h-3" /> Aktif</span> : "Tidak"}
                    />
                    <Row
                        label="Kunci"
                        renderA={itemA.is_locked ? <span className="text-rose-500 flex items-center gap-1"><Lock weight="fill" className="w-3 h-3" /> Terkunci</span> : <span className="text-emerald-500 flex items-center gap-1"><LockOpen className="w-3 h-3" /> Bisa Edit</span>}
                        renderB={itemB.is_locked ? <span className="text-rose-500 flex items-center gap-1"><Lock weight="fill" className="w-3 h-3" /> Terkunci</span> : <span className="text-emerald-500 flex items-center gap-1"><LockOpen className="w-3 h-3" /> Bisa Edit</span>}
                    />
                </div>
            </div>
        </Modal>
    );
});

export default PeriodComparisonModal;