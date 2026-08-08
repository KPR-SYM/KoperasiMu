import React, { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Skeleton from "@shared/components/Skeleton";
import { CaretLeft, Spinner } from "@phosphor-icons/react";

import DashboardLayout from "@core/layouts/DashboardLayout";
import { Breadcrumb } from "@shared/components";
import { useToast } from "@context/Toast";
import { usePeriodsCore } from "@features/periods/hooks/usePeriodsCore";
import { usePeriodsModals } from "@features/periods/hooks/usePeriodsModals";
import { usePeriodsImportExport, SYSTEM_COLS } from "@features/periods/hooks/usePeriodsImportExport";
import LazyPeriodImportPanel from "@features/periods/components/PeriodImportPanel";

export default function PeriodImportPage() {
    const { addToast, addUndoToast } = useToast();
    const navigate = useNavigate();

    const {
        years, filtered, selectedIds, canEdit, isSaving, isDeleting, isMutating,
        fetchData, handleError,
    } = usePeriodsCore({ addToast, addUndoToast });

    const {
        isImportModalOpen, setIsImportModalOpen,
    } = usePeriodsModals();

    const {
        importStep, setImportStep, importFileName,
        importRawData, importFileHeaders,
        importColumnMapping, setImportColumnMapping, importPreview,
        importIssues, importLoading, setImportLoading,
        importValidationOpen, setImportValidationOpen, importDragOver, setImportDragOver,
        importing, importProgress,
        importEditCell, setImportEditCell,
        importDiffPreview, setImportDiffPreview,
        importConflictStrategy, setImportConflictStrategy,
        importDetectedDateFormat,
        importColumnAliases, setImportColumnAliases,
        importAliasEditorOpen, setImportAliasEditorOpen,
        lastImportedIds, setLastImportedIds,
        handleUndoImport,
        importReadyRows, hasImportBlockingErrors, importFileInputRef,
        handleImportClick, handleFileChange, processImportFile, buildImportPreview,
        handleImportCellEdit, handleRemoveImportRow, handleDownloadTemplate, handleCommitImport,
    } = usePeriodsImportExport({
        years, filtered, selectedIds, canEdit, fetchData, addToast,
        handleError,
        isImportModalOpen, setIsImportModalOpen,
        isExportModalOpen: false, setIsExportModalOpen: () => {},
    });

    return (
        <DashboardLayout title="Import Tahun Akademik">
            <div className="flex flex-col min-h-[calc(100vh-3.5rem)] -mx-4 sm:-mx-5 lg:-mx-6 -mt-4 lg:-mt-6 ">
                <div className="px-5 pt-5 pb-3 shrink-0">
                    <div className="flex items-center gap-2 mb-3">
                        <button
                            onClick={() => navigate('/master/periods')}
                            className="h-7 w-7 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-all shrink-0"
                            title="Kembali ke Tahun Akademik"
                        >
                            <CaretLeft className="w-3.5 h-3.5" />
                        </button>
                        <Breadcrumb
                            items={[
                                { label: 'Master' },
                                { label: 'Tahun Akademik', onClick: () => navigate('/master/periods') },
                                { label: 'Import' },
                            ]}
                        />
                    </div>
                    <div>
                        <h1 className="text-xl font-black font-heading tracking-tight text-[var(--color-text)] leading-tight">
                            Import Tahun Akademik
                        </h1>
                        <p className="text-[var(--color-text-muted)] text-[10px] mt-0.5 font-medium">
                            Unggah file Excel/CSV, petakan kolom, lalu tinjau sebelum diimport.
                        </p>
                    </div>
                </div>

                <div className="flex-1 min-h-0 px-5">
                    <React.Suspense fallback={
                        <div className="grid gap-4 h-full w-full min-h-0" style={{ gridTemplateColumns: '1fr' }}>
                            <div className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
                                <Skeleton className="h-7 w-44 rounded-lg" />
                                <Skeleton className="h-3.5 w-28 rounded-lg" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {[1,2,3,4].map(i => (
                                        <div key={i} className="p-3 rounded-xl border border-[var(--color-border)] space-y-2">
                                            <Skeleton className="h-3 w-24 rounded" />
                                            <Skeleton className="h-8 w-full rounded-lg" />
                                        </div>
                                    ))}
                                </div>
                                <Skeleton className="h-9 w-32 rounded-xl" />
                            </div>
                        </div>
                    }>
                        <LazyPeriodImportPanel
                            isOpen={true}
                            onClose={() => navigate('/master/periods')}
                            importing={importing}
                            importStep={importStep}
                            setImportStep={setImportStep}
                            importPreview={importPreview}
                            importFileName={importFileName}
                            importFileInputRef={importFileInputRef}
                            importDragOver={importDragOver}
                            setImportDragOver={setImportDragOver}
                            processImportFile={processImportFile}
                            handleDownloadTemplate={handleDownloadTemplate}
                            importFileHeaders={importFileHeaders}
                            SYSTEM_COLS={SYSTEM_COLS}
                            importColumnMapping={importColumnMapping}
                            setImportColumnMapping={setImportColumnMapping}
                            importRawData={importRawData}
                            importLoading={importLoading}
                            setImportLoading={setImportLoading}
                            buildImportPreview={buildImportPreview}
                            importIssues={importIssues}
                            importValidationOpen={importValidationOpen}
                            setImportValidationOpen={setImportValidationOpen}
                            importProgress={importProgress}
                            handleCommitImport={handleCommitImport}
                            handleImportClick={handleImportClick}
                            hasImportBlockingErrors={hasImportBlockingErrors}
                            importReadyRows={importReadyRows}
                            handleImportCellEdit={handleImportCellEdit}
                            importEditCell={importEditCell}
                            setImportEditCell={setImportEditCell}
                            handleRemoveImportRow={handleRemoveImportRow}
                            importConflictStrategy={importConflictStrategy}
                            setImportConflictStrategy={setImportConflictStrategy}
                            importDetectedDateFormat={importDetectedDateFormat}
                            importColumnAliases={importColumnAliases}
                            setImportColumnAliases={setImportColumnAliases}
                            importAliasEditorOpen={importAliasEditorOpen}
                            setImportAliasEditorOpen={setImportAliasEditorOpen}
                            lastImportedIds={lastImportedIds}
                            setLastImportedIds={setLastImportedIds}
                            handleUndoImport={handleUndoImport}
                            importDiffPreview={importDiffPreview}
                            setImportDiffPreview={setImportDiffPreview}
                        />
                    </React.Suspense>
                </div>

                <input
                    type="file"
                    ref={importFileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".csv,.xlsx"
                />
            </div>
        </DashboardLayout>
    );
}
