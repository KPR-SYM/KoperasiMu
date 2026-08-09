import React, { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Spinner } from "@phosphor-icons/react"

import DashboardLayout from "@core/layouts/DashboardLayout"
import { useToast } from "@context/Toast"
import { useClassesCore } from "@features/classes/hooks/useClassesCore"
import { useClassesModals } from "@features/classes/hooks/useClassesModals"
import { useClassesImportExport, SYSTEM_COLS } from "@features/classes/hooks/useClassesImportExport"
import LazyClassImportPanel from "@features/classes/components/ClassImportPanel"

export default function ClassImportPage() {
    const { addToast } = useToast()
    const navigate = useNavigate()

    const {
        classes, filtered, selectedIds, canEdit, isSaving, isDeleting, isMutating,
        teachersList, periodsList,
        fetchData, handleError,
    } = useClassesCore({ addToast })

    const {
        isImportModalOpen, setIsImportModalOpen,
    } = useClassesModals()

    const {
        importStep, setImportStep, importFileName,
        importRawData, importFileHeaders,
        importColumnMapping, setImportColumnMapping, importPreview,
        importIssues, importLoading, setImportLoading,
        importValidationOpen, setImportValidationOpen, importDragOver, setImportDragOver,
        importing, importProgress,
        importEditCell, setImportEditCell,
        importReadyRows, hasImportBlockingErrors, importFileInputRef,
        importSkipDupes, setImportSkipDupes,
        handleImportClick, processImportFile, buildImportPreview,
        handleImportCellEdit, handleRemoveImportRow, handleDownloadTemplate, handleCommitImport,
    } = useClassesImportExport({
        classes, filtered, selectedIds, canEdit, fetchData, addToast,
        handleError,
        teachersList, periodsList,
        isImportModalOpen, setIsImportModalOpen,
        isExportModalOpen: false, setIsExportModalOpen: () => {},
    })

    return (
        <DashboardLayout title="Import Data Kelas">
            <div className="flex flex-col min-h-[calc(100vh-3.5rem)] -mx-4 sm:-mx-5 lg:-mx-6 -mt-4 lg:-mt-6">
                <div className="flex-1 min-h-0">
                    <React.Suspense fallback={
                        <div className="flex-1 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <Spinner className="w-6 h-6 text-[var(--color-primary)] animate-spin" />
                                <span className="text-[11px] font-bold text-[var(--color-text-muted)]">Memuat panel import...</span>
                            </div>
                        </div>
                    }>
                        <LazyClassImportPanel
                            isOpen={true}
                            onClose={() => navigate('/master/classes')}
                            importing={importing}
                            importStep={importStep}
                            setImportStep={setImportStep}
                            importPreview={importPreview}
                            importFileName={importFileName}
                            importDragOver={importDragOver}
                            setImportDragOver={setImportDragOver}
                            processImportFile={processImportFile}
                            teachersList={teachersList}
                            periodsList={periodsList}
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
                            importSkipDupes={importSkipDupes}
                            setImportSkipDupes={setImportSkipDupes}
                            importFileInputRef={importFileInputRef}
                        />
                    </React.Suspense>
                </div>
            </div>
        </DashboardLayout>
    )
}
