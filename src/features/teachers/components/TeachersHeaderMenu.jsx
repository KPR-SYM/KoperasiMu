import { memo } from 'react'
import { Archive, FileArrowDown, FileArrowUp } from '@phosphor-icons/react'
import { createPortal } from 'react-dom'

function getPortalContainer(id) {
    let el = document.getElementById(id)
    if (!el) {
        el = document.createElement('div')
        el.id = id
        document.body.appendChild(el)
    }
    return el
}

const TeachersHeaderMenu = memo(function TeachersHeaderMenu({
    isOpen, rect, mounted, onClose,
    onImportClick, onExportClick, onArchivedClick,
}) {
    if (!mounted || !rect) return null

    return createPortal(
        <>
            <div
                className={`fixed inset-0 z-[9990] bg-black/5 backdrop-blur-[1px] transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />
            <div
                className={`fixed z-[9991] w-56 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl p-2 transition-all duration-200 ease-out origin-top-right
                ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'}`}
                style={{
                    top: rect.bottom + 8,
                    left: Math.max(10, rect.right - 224)
                }}
            >
                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] px-3 py-2">Data</p>
                <button onClick={() => { onClose(); onImportClick() }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-surface-alt)] text-[var(--color-text)] transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileArrowDown className="w-3 h-3" />
                    </div>
                    <div className="text-left">
                        <p className="text-[11px] font-black leading-tight">Import CSV / Excel</p>
                        <p className="text-[9px] opacity-60 font-medium leading-tight mt-0.5">Unggah data guru masal dari file Excel/CSV</p>
                    </div>
                </button>
                <button onClick={() => { onClose(); onExportClick() }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-surface-alt)] text-[var(--color-text)] transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileArrowUp className="w-3 h-3" />
                    </div>
                    <div className="text-left">
                        <p className="text-[11px] font-black leading-tight">Export Data</p>
                        <p className="text-[9px] opacity-60 font-medium leading-tight mt-0.5">Cadangkan seluruh database ke format Excel</p>
                    </div>
                </button>
                <div className="h-px bg-[var(--color-border)] my-1 mx-2" />
                <p className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Manajemen</p>
                <button onClick={() => { onClose(); onArchivedClick() }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-surface-alt)] text-[var(--color-text)] transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Archive className="w-3 h-3" />
                    </div>
                    <div className="text-left">
                        <p className="text-[11px] font-black leading-tight">Arsip Guru</p>
                        <p className="text-[9px] opacity-60 font-medium leading-tight mt-0.5">Lihat & pulihkan data guru tidak aktif</p>
                    </div>
                </button>
            </div>
        </>,
        getPortalContainer('portal-teacher-header-menu')
    )
})

export default TeachersHeaderMenu
