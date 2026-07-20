import React, { useState } from "react";
import { Pencil, Warning } from "@phosphor-icons/react";
import { Modal, DatePicker } from "@shared/components";

export default function PeriodBulkEditModal({ isOpen, onClose, selectedCount, onConfirm, submitting }) {
    const [semester, setSemester] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [registrationStart, setRegistrationStart] = useState("");
    const [registrationEnd, setRegistrationEnd] = useState("");

    if (!isOpen) return null;

    const handleSubmit = () => {
        const payload = {};
        if (semester) payload.semester = semester;
        if (startDate) payload.start_date = startDate;
        if (endDate) payload.end_date = endDate;
        if (registrationStart) payload.registration_start = registrationStart;
        if (registrationEnd) payload.registration_end = registrationEnd;
        if (registrationStart || registrationEnd) {
            if (!registrationStart) payload.registration_start = null;
            if (!registrationEnd) payload.registration_end = null;
        }
        onConfirm(payload);
    };

    const hasChanges = semester || startDate || endDate || registrationStart || registrationEnd;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Massal"
            description={`Terapkan perubahan ke ${selectedCount} periode terpilih`}
            icon={Pencil}
            iconBg="bg-indigo-500/10"
            iconColor="text-indigo-600"
            size="md"
            mobileVariant="bottom-sheet"
            footer={
                <div className="flex items-center w-full gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-10 px-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] text-[10px] font-black uppercase tracking-widest transition-all shrink-0 flex items-center justify-center"
                    >
                        Batal
                    </button>
                    <div className="flex-1" />
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!hasChanges || submitting}
                        className="h-10 px-6 rounded-xl bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 shrink-0"
                    >
                        {submitting ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </div>
            }
        >
            <div className="space-y-5">
                <div className="p-3 rounded-2xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[11px] font-bold text-[var(--color-text-muted)] flex items-center gap-2">
                    <Warning className="w-4 h-4 text-amber-500 shrink-0" />
                    Hanya kolom yang diisi yang akan diperbarui. Kolom kosong tidak akan diubah.
                </div>

                <div>
                    <label className="block text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-1.5 ml-1 opacity-60">Semester</label>
                    <div className="flex p-0.5 bg-[var(--color-surface-alt)] rounded-xl border border-[var(--color-border)] h-9">
                        {["", "Ganjil", "Genap"].map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setSemester(s)}
                                className={`flex-1 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${semester === s ? "bg-[var(--color-primary)] text-white shadow-sm" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"}`}
                            >
                                {s || "—"}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-1.5 ml-1 opacity-60">Tanggal Mulai</label>
                        <DatePicker
                            value={startDate}
                            onChange={(val) => setStartDate(val)}
                            placeholder="Pilih tanggal"
                        />
                    </div>
                    <div>
                        <label className="block text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-1.5 ml-1 opacity-60">Tanggal Selesai</label>
                        <DatePicker
                            value={endDate}
                            onChange={(val) => setEndDate(val)}
                            placeholder="Pilih tanggal"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-1.5 ml-1 opacity-60">Pendaftaran Mulai</label>
                        <DatePicker
                            value={registrationStart}
                            onChange={(val) => setRegistrationStart(val)}
                            placeholder="Pilih tanggal"
                        />
                    </div>
                    <div>
                        <label className="block text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-1.5 ml-1 opacity-60">Pendaftaran Selesai</label>
                        <DatePicker
                            value={registrationEnd}
                            onChange={(val) => setRegistrationEnd(val)}
                            placeholder="Pilih tanggal"
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
}
