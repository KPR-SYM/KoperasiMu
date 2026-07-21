import { memo, useState } from "react";
import { FloppyDisk, Trash, Copy, Star } from "@phosphor-icons/react";
import Modal from "@shared/components/Modal";

const DURATION_PRESETS = [
    { label: "1 Bulan", days: 30 },
    { label: "3 Bulan", days: 90 },
    { label: "6 Bulan (Semester)", days: 180 },
    { label: "9 Bulan", days: 270 },
    { label: "1 Tahun", days: 365 },
];

const PeriodTemplateModal = memo(function PeriodTemplateModal({
    isOpen,
    onClose,
    templates,
    onSave,
    onDelete,
    onApply,
}) {
    const [name, setName] = useState("");
    const [durationDays, setDurationDays] = useState(180);
    const [semester, setSemester] = useState("Ganjil");
    const [isLocked, setIsLocked] = useState(false);

    const handleSave = () => {
        if (!name.trim()) return;
        onSave({ name: name.trim(), durationDays, semester, isLocked });
        setName("");
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Template Periode" size="md">
            <div className="space-y-4">
                {/* Save new template */}
                <div className="rounded-2xl border border-[var(--color-border)] p-4 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                        Simpan Template Baru
                    </p>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nama template (contoh: Semester Ganjil)"
                        className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[12px] font-bold text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all"
                    />
                    <div className="flex flex-wrap gap-2">
                        {DURATION_PRESETS.map((p) => (
                            <button
                                key={p.days}
                                onClick={() => setDurationDays(p.days)}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all ${durationDays === p.days ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white" : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/30"}`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            className="h-8 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[10px] font-bold text-[var(--color-text)] outline-none"
                        >
                            <option value="Ganjil">Ganjil</option>
                            <option value="Genap">Genap</option>
                        </select>
                        <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--color-text-muted)] cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isLocked}
                                onChange={(e) => setIsLocked(e.target.checked)}
                                className="rounded border-[var(--color-border)]"
                            />
                            Terkunci
                        </label>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={!name.trim()}
                        className="h-8 px-4 rounded-lg bg-[var(--color-primary)] text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all hover:brightness-110 disabled:opacity-40"
                    >
                        <FloppyDisk className="w-3 h-3" />
                        Simpan Template
                    </button>
                </div>

                {/* Saved templates list */}
                <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                        Template Tersimpan ({templates.length})
                    </p>
                    {templates.length === 0 ? (
                        <p className="text-[11px] text-[var(--color-text-muted)] py-4 text-center">
                            Belum ada template. Simpan template pertama Anda.
                        </p>
                    ) : (
                        templates.map((tpl) => (
                            <div
                                key={tpl.id}
                                className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                    <Star className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold text-[var(--color-text)] truncate">
                                        {tpl.name}
                                    </p>
                                    <p className="text-[9px] text-[var(--color-text-muted)]">
                                        {tpl.semester} · {tpl.durationDays} hari{tpl.isLocked ? " · Terkunci" : ""}
                                    </p>
                                </div>
                                <button
                                    onClick={() => onApply(tpl)}
                                    className="w-7 h-7 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all opacity-0 group-hover:opacity-100"
                                    title="Terapkan template"
                                >
                                    <Copy className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => onDelete(tpl.id)}
                                    className="w-7 h-7 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-500 hover:border-red-500/30 transition-all opacity-0 group-hover:opacity-100"
                                    title="Hapus template"
                                >
                                    <Trash className="w-3 h-3" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Modal>
    );
});

export default PeriodTemplateModal;
