import { memo, useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Warning, Trash, X } from "@phosphor-icons/react";

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

const ConfirmModal = memo(function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Hapus", loading = false }) {
    const [visible, setVisible] = useState(false);
    const closeRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setVisible(true);
            requestAnimationFrame(() => closeRef.current?.focus());
        } else {
            setVisible(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const container = getPortalContainer("portal-class-confirm-modals");

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/20" onClick={onClose} />
            <div
                className={`relative z-10 w-full max-w-[420px] bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-2xl shadow-black/10 p-6 transition-all duration-150 ${visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-[0.98] -translate-y-1"}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start gap-3 mb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 shrink-0">
                        <Icon className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-[var(--color-text)]">{title}</h3>
                        <p className="text-sm text-[var(--color-text-muted)] mt-1 leading-relaxed">{message}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex items-center justify-end gap-2 mt-6">
                    <button
                        ref={closeRef}
                        onClick={onClose}
                        className="px-3.5 py-1.5 rounded-lg bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                        {loading ? (
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Icon className="w-3.5 h-3.5" />
                        )}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        container
    );
});

export const ClassDeleteModal = memo(function ClassDeleteModal({ isOpen, onClose, onConfirm, loading, itemName = "" }) {
    return (
        <ConfirmModal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title="Hapus Kelas?"
            message={`Kelas "${itemName}" akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`}
            confirmText="Hapus"
            confirmIcon={Trash}
            loading={loading}
        />
    );
});

export const ClassLockModal = memo(function ClassLockModal({ isOpen, onClose, onConfirm, loading, itemName = "" }) {
    return (
        <ConfirmModal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title="Kunci Kelas?"
            message={`Kelas "${itemName}" akan dikunci. Semua pengeditan terkait data kelas ini akan dibatalkan.`}
            confirmText="Kunci"
            confirmIcon={Warning}
            loading={loading}
        />
    );
});

export const ClassUnlockModal = memo(function ClassUnlockModal({ isOpen, onClose, onConfirm, loading, itemName = "" }) {
    return (
        <ConfirmModal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title="Buka Kunci Kelas?"
            message={`Kelas "${itemName}" akan dibuka kuncinya. Pengeditan data akan diaktifkan kembali.`}
            confirmText="Buka Kunci"
            confirmIcon={Warning}
            loading={loading}
        />
    );
});

export const ClassBulkDeleteModal = memo(function ClassBulkDeleteModal({ isOpen, onClose, onConfirm, loading, count = 0 }) {
    return (
        <ConfirmModal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title={`Hapus ${count} Kelas?`}
            message={`${count} kelas yang dipilih akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`}
            confirmText="Hapus Semua"
            confirmIcon={Trash}
            loading={loading}
        />
    );
});

export const ClassBulkLockModal = memo(function ClassBulkLockModal({ isOpen, onClose, onConfirm, loading, count = 0 }) {
    return (
        <ConfirmModal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title={`Kunci ${count} Kelas?`}
            message={`${count} kelas yang dipilih akan dikunci. Semua pengeditan terkait data kelas ini akan dibatalkan.`}
            confirmText="Kunci Semua"
            confirmIcon={Warning}
            loading={loading}
        />
    );
});

export const ClassBulkUnlockModal = memo(function ClassBulkUnlockModal({ isOpen, onClose, onConfirm, loading, count = 0 }) {
    return (
        (
            <ConfirmModal
                isOpen={isOpen}
                onClose={onClose}
                onConfirm={onConfirm}
                title={`Buka Kunci ${count} Kelas?`}
                message={`${count} kelas yang dipilih akan dibuka kuncinya. Pengeditan data akan diaktifkan kembali.`}
                confirmText="Buka Kunci Semua"
                confirmIcon={Warning}
                loading={loading}
            />
        )
    );
});
