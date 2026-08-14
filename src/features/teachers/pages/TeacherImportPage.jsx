import React from "react"
import { useNavigate } from "react-router-dom"
import { Spinner } from "@phosphor-icons/react"

import DashboardLayout from "@core/layouts/DashboardLayout"
import { useToast } from "@context/Toast"
import { useTeachersCore } from "@features/teachers/hooks/useTeachersCore"
import { useTeachersModals } from "@features/teachers/hooks/useTeachersModals"
import { useTeachersImportExport } from "@features/teachers/hooks/useTeachersImportExport"
import LazyTeacherImportPanel from "@features/teachers/components/TeacherImportPanel"
import { STATUS_CONFIG } from "@features/teachers/constants/teacherConstants"

export default function TeacherImportPage() {
    const { addToast } = useToast()
    const navigate = useNavigate()

    const {
        teachers, selectedIds,
        filterStatus, filterGender, filterSubject, filterType,
        subjectsList, fetchData, fetchStats,
    } = useTeachersCore({ addToast })

    const {
        setIsImportModalOpen,
    } = useTeachersModals()

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
        processImportFile, buildImportPreview,
        handleImportCellEdit, handleRemoveImportRow, handleDownloadTemplate, handleCommitImport,
        SYSTEM_COLS,
    } = useTeachersImportExport({
        teachers, selectedIds,
        filterStatus, filterGender, filterSubject, filterType,
        fetchData, fetchStats,
        addToast,
        setIsImportModalOpen,
        setIsExportModalOpen: () => {},
    })

    return (
        <DashboardLayout title="Import Data Guru">
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
                        <LazyTeacherImportPanel
                            isOpen={true}
                            onClose={() => navigate('/master/teachers')}
                            importing={importing}
                            importStep={importStep}
                            setImportStep={setImportStep}
                            importPreview={importPreview}
                            importFileName={importFileName}
                            importFileInputRef={importFileInputRef}
                            importDragOver={importDragOver}
                            setImportDragOver={setImportDragOver}
                            processImportFile={processImportFile}
                            subjectsList={subjectsList}
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
                            hasImportBlockingErrors={hasImportBlockingErrors}
                            importReadyRows={importReadyRows}
                            handleImportCellEdit={handleImportCellEdit}
                            importEditCell={importEditCell}
                            setImportEditCell={setImportEditCell}
                            handleRemoveImportRow={handleRemoveImportRow}
                            importSkipDupes={importSkipDupes}
                            setImportSkipDupes={setImportSkipDupes}
                            STATUS_CONFIG={STATUS_CONFIG}
                        />
                    </React.Suspense>
                </div>
            </div>
        </DashboardLayout>
    )
}
