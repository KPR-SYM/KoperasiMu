import React, { memo, useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
    GraduationCap,
    MagnifyingGlass,
} from "@phosphor-icons/react";
import { Checkbox, EmptyState } from "@shared/components";
import { PeriodDesktopRow, PeriodMobileRow, COL_LABELS, renderColHeader } from "./PeriodRow";

const PeriodsTable = memo(function PeriodsTable({
    paged,
    years,
    emptyState,
    selectedIds,
    visibleCols,
    columnOrder,
    isPrivacyMode,
    canEdit,
    colMenuRef,
    isColMenuOpen,
    setIsColMenuOpen,
    setColMenuPos,
    toggleSelect,
    toggleSelectAll,
    maskValue,
    formatDate,
    getDuration,
    getPeriodStats,
    handleInlineSave,
    inlineEditCell,
    setInlineEditCell,
    handleEdit,
    handleOpenHistory,
    handleToggleLock,
    onQuickToggleActive,
    onQuickDuplicate,
    onTogglePin,
    pinnedIds,
    handleOpenReadOnlyDetail,
    setItemToDelete,
    setIsDeleteModalOpen,
    onQuickFilterYear,
}) {
    const orderedCols = columnOrder.filter(k => visibleCols[k] && COL_LABELS[k]);

    const rowProps = {
        orderedCols,
        selectedIds,
        toggleSelect,
        isPrivacyMode,
        maskValue,
        formatDate,
        getDuration,
        getPeriodStats,
        handleInlineSave,
        inlineEditCell,
        setInlineEditCell,
        onQuickFilterYear,
        years,
        pinnedIds,
        canEdit,
        handleOpenReadOnlyDetail,
        handleEdit,
        onTogglePin,
        onQuickDuplicate,
        handleOpenHistory,
        handleToggleLock,
        onQuickToggleActive,
        setItemToDelete,
        setIsDeleteModalOpen,
    };

    return (
        <>
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm" style={{ tableLayout: "auto" }}>
                    <thead className="bg-[var(--color-surface-alt)] sticky top-0 z-10">
                        <tr className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                            <th className="px-6 py-4 text-center w-12">
                                <Checkbox
                                    checked={selectedIds.length === paged.length && paged.length > 0}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            {orderedCols.map(key => (
                                <React.Fragment key={key}>{renderColHeader(key)}</React.Fragment>
                            ))}
                            <th className="px-6 py-4 relative">
                                <div className="flex items-center justify-center">
                                    <span>Aksi</span>
                                </div>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <button
                                        ref={colMenuRef}
                                        onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const menuHeight = 220;
                                            const spaceBelow = window.innerHeight - rect.bottom;
                                            const showUp = spaceBelow < menuHeight && rect.top > menuHeight;
                                            setColMenuPos({
                                                top: showUp ? rect.top + window.scrollY - menuHeight - 8 : rect.bottom + window.scrollY + 8,
                                                right: window.innerWidth - rect.right - window.scrollX,
                                                showUp,
                                            });
                                            setIsColMenuOpen((p) => !p);
                                        }}
                                        title="Atur tampilan kolom"
                                        className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${isColMenuOpen ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"}`}
                                    >
                                        <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
                                            <rect x="0" y="0" width="5" height="5" rx="1" />
                                            <rect x="7" y="0" width="5" height="5" rx="1" />
                                            <rect x="0" y="7" width="5" height="5" rx="1" />
                                            <rect x="7" y="7" width="5" height="5" rx="1" />
                                        </svg>
                                    </button>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paged.length === 0 ? (
                            <tr>
                                <td colSpan={2 + orderedCols.length} className="text-center">
                                    {emptyState || (
                                        <EmptyState
                                            icon={years.length === 0 ? GraduationCap : MagnifyingGlass}
                                            title={years.length === 0 ? "Belum Ada Tahun Akademik" : "Tidak ada data ditemukan"}
                                            description={years.length === 0 ? "Tambahkan periode akademik pertama untuk mulai menggunakan modul ini." : "Sesuaikan filter atau kata kunci pencarian Anda"}
                                            color={years.length === 0 ? "primary" : "slate"}
                                            variant="plain"
                                        />
                                    )}
                                </td>
                            </tr>
                        ) : (
                            paged.map((year) => (
                                <PeriodDesktopRow
                                    key={year.id}
                                    year={year}
                                    {...rowProps}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="md:hidden divide-y divide-[var(--color-border)]">
                {paged.length === 0 ? (
                    <div className="p-8 text-center">
                        {emptyState || (
                            <EmptyState
                                icon={years.length === 0 ? GraduationCap : MagnifyingGlass}
                                title={years.length === 0 ? "Belum Ada Tahun Akademik" : "Tidak ada data ditemukan"}
                                description={years.length === 0 ? "Tambahkan periode akademik pertama." : "Sesuaikan filter atau kata kunci pencarian Anda"}
                                color={years.length === 0 ? "primary" : "slate"}
                                variant="plain"
                            />
                        )}
                    </div>
                ) : (
                    paged.map((year) => (
                        <PeriodMobileRow
                            key={year.id}
                            year={year}
                            {...rowProps}
                        />
                    ))
                )}
            </div>
        </>
    );
});

export default PeriodsTable;
