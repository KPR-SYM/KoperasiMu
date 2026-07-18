import { memo } from "react";
import { createPortal } from "react-dom";
import {
    Archive,
    ArrowClockwise,
    FileArrowDown,
    FileArrowUp,
    SlidersHorizontal,
} from "@phosphor-icons/react";

function getPortalContainer(id) {
    if (typeof document === "undefined") return null;
    let el = document.getElementById(id);
    if (!el) {
        el = document.createElement("div");
        el.id = id;
        document.body.appendChild(el);
    }
    return el;
}

const PeriodsHeaderMenu = memo(function PeriodsHeaderMenu({
    isOpen,
    rect,
    mounted,
    canEdit,
    isMutating,
    years,
    onClose,
    onImportClick,
    onOpenExport,
    onGenerate,
    onOpenArchived,
    fetchArchived,
}) {
    if (!mounted || !rect) return null;

    return createPortal(
        <>
            <div
                className={`fixed inset-0 z-[9990] bg-black/5 backdrop-blur-[1px] transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0"}`}
                onClick={onClose}
            />
            <div
                className={`fixed z-[9991] w-56 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl p-2 transition-all duration-200 ease-out origin-top-right
                ${isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2"}`}
                style={{
                    top: rect.bottom + 8,
                    left: Math.max(10, rect.right - 224),
                }}
            >
                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] px-3 py-2">
                    Data
                </p>
                <button
                    onClick={() => {
                        if (!canEdit) return;
                        onClose();
                        onImportClick();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${canEdit ? 'hover:bg-[var(--color-surface-alt)] text-[var(--color-text)]' : 'opacity-40 cursor-not-allowed text-[var(--color-text-muted)]'}`}
                >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileArrowDown className="w-3 h-3" />
                    </div>
                    <div className="text-left">
                        <p className="text-[11px] font-black leading-tight">
                            Import CSV / Excel
                        </p>
                        <p className="text-[9px] opacity-60 font-medium leading-tight mt-0.5">
                            Unggah data periode masal dari file Excel/CSV
                        </p>
                    </div>
                </button>
                <button
                    onClick={() => {
                        onClose();
                        onOpenExport();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-surface-alt)] text-[var(--color-text)] transition-all group"
                >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileArrowUp className="w-3 h-3" />
                    </div>
                    <div className="text-left">
                        <p className="text-[11px] font-black leading-tight">
                            Export Data
                        </p>
                        <p className="text-[9px] opacity-60 font-medium leading-tight mt-0.5">
                            Cadangkan seluruh database ke format Excel
                        </p>
                    </div>
                </button>
                <div className="h-px bg-[var(--color-border)] my-1 mx-2" />
                <p className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                    Manajemen
                </p>
                <button
                    onClick={() => {
                        onClose();
                        onGenerate();
                    }}
                    disabled={!canEdit || isMutating || years.length === 0}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-surface-alt)] text-[var(--color-text)] transition-all group disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ArrowClockwise className="w-3 h-3" />
                    </div>
                    <div className="text-left">
                        <p className="text-[11px] font-black leading-tight">
                            Generate Tahun Baru
                        </p>
                        <p className="text-[9px] opacity-60 font-medium leading-tight mt-0.5">
                            Buat Ganjil + Genap tahun depan otomatis
                        </p>
                    </div>
                </button>
                <button
                    onClick={() => {
                        onClose();
                        fetchArchived();
                        onOpenArchived();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-surface-alt)] text-[var(--color-text)] transition-all group"
                >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Archive className="w-3 h-3" />
                    </div>
                    <div className="text-left">
                        <p className="text-[11px] font-black leading-tight">
                            Arsip Periode
                        </p>
                        <p className="text-[9px] opacity-60 font-medium leading-tight mt-0.5">
                            Lihat & pulihkan data periode tidak aktif
                        </p>
                    </div>
                </button>
            </div>
        </>,
        getPortalContainer("portal-periods-header-menu"),
    );
});

export default PeriodsHeaderMenu;
