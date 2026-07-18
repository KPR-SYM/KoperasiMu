import { memo } from "react";
import {
    Calendar,
    ClockCounterClockwise,
    Fingerprint,
} from "@phosphor-icons/react";
import { Modal, AuditTimeline } from "@shared/components";

const PeriodsReadOnlyDetail = memo(function PeriodsReadOnlyDetail({
    isOpen,
    onClose,
    item,
    formatDate,
    getDuration,
    onOpenHistory,
}) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Detail Tahun Pelajaran"
            size="full"
            mobileVariant="bottom-sheet"
        >
            {item &&
                (() => {
                    return (
                        <div className="space-y-4 pb-2">
                            <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                                        Tahun Pelajaran
                                    </p>
                                    <h4 className="w-5 h-5 font-black text-[var(--color-text)] leading-tight truncate">
                                        {item.academic_year}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <span
                                            className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.semester === "Ganjil" ? "bg-blue-500/10 text-blue-600 border border-blue-500/20" : "bg-purple-500/10 text-purple-600 border border-purple-500/20"}`}
                                        >
                                            Semester {item.semester}
                                        </span>
                                    </div>
                                </div>
                                <div
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 ${item.is_active ? "bg-[var(--color-primary)] text-white shadow-md" : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)]"}`}
                                >
                                    <Calendar className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2">
                                        Periode
                                    </p>
                                    <div className="font-bold">
                                        {formatDate(item.start_date)} —{" "}
                                        {formatDate(item.end_date)}
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2">
                                        Durasi
                                    </p>
                                    <div className="font-black">
                                        {getDuration(
                                            item.start_date,
                                            item.end_date,
                                        )}
                                    </div>
                                </div>
                                {item.registration_start && (
                                    <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2">
                                            Pendaftaran
                                        </p>
                                        <div className="font-bold">
                                            {formatDate(item.registration_start)} —{" "}
                                            {formatDate(item.registration_end)}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    onClose();
                                    onOpenHistory(item);
                                }}
                                className="w-full h-12 rounded-xl bg-indigo-500/10 text-indigo-600 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-indigo-500/20"
                            >
                                <ClockCounterClockwise />
                                Riwayat Perubahan
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full h-12 rounded-xl bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] font-black text-[10px] uppercase tracking-widest transition-all"
                            >
                                Tutup
                            </button>
                        </div>
                    );
                })()}
        </Modal>
    );
});

const PeriodsHistoryModal = memo(function PeriodsHistoryModal({
    isOpen,
    onClose,
    item,
}) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Riwayat · ${item?.academic_year || ""}`}
            description="Audit log untuk rekaman ini."
            icon={Fingerprint}
            iconBg="bg-orange-500/10"
            iconColor="text-orange-500"
            size="md"
        >
            {item && (
                <div className="h-[40vh] min-h-[200px] overflow-auto">
                    <AuditTimeline
                        tableName="periods"
                        recordId={item.id}
                        limit={30}
                    />
                </div>
            )}
        </Modal>
    );
});

export default PeriodsReadOnlyDetail;
export { PeriodsHistoryModal };
