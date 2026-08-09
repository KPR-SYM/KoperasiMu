import React from "react"
import { useNavigate } from "react-router-dom"
import { Spinner } from "@phosphor-icons/react"

import DashboardLayout from "@core/layouts/DashboardLayout"
import { useToast } from "@context/Toast"
import { useClassesCore } from "@features/classes/hooks/useClassesCore"
import { useClassesModals } from "@features/classes/hooks/useClassesModals"
import { useClassesImportExport } from "@features/classes/hooks/useClassesImportExport"
import LazyClassExportPanel from "@features/classes/components/ClassExportPanel"

export default function ClassExportPage() {
    const { addToast } = useToast()
    const navigate = useNavigate()

    const {
        classes, filtered, selectedIds, canEdit, isSaving, isDeleting, isMutating,
        teachersList, periodsList,
        fetchData, handleError,
    } = useClassesCore({ addToast })

    const {
        isExportModalOpen, setIsExportModalOpen,
    } = useClassesModals()

    const {
        exportScope, setExportScope, exportColumns, setExportColumns, exporting,
        handleExportCSV, handleExportExcel, handleExportPDF,
        getExportData,
    } = useClassesImportExport({
        classes, filtered, selectedIds, canEdit, fetchData, addToast,
        handleError,
        teachersList, periodsList,
        isImportModalOpen: false, setIsImportModalOpen: () => {},
        isExportModalOpen, setIsExportModalOpen,
    })

    return (
        <DashboardLayout title="Export Data Kelas">
            <div className="flex flex-col min-h-[calc(100vh-3.5rem)] -mx-4 sm:-mx-5 lg:-mx-6 -mt-4 lg:-mt-6">
                <React.Suspense fallback={
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <Spinner className="w-6 h-6 text-[var(--color-primary)] animate-spin" />
                            <span className="text-[11px] font-bold text-[var(--color-text-muted)]">Memuat panel export...</span>
                        </div>
                    </div>
                }>
                    <LazyClassExportPanel
                        isOpen={true}
                        onClose={() => navigate('/master/classes')}
                        classes={classes}
                        selectedClassIds={selectedIds}
                        exportScope={exportScope}
                        setExportScope={setExportScope}
                        exportColumns={exportColumns}
                        setExportColumns={setExportColumns}
                        exporting={exporting}
                        handleExportCSV={handleExportCSV}
                        handleExportExcel={handleExportExcel}
                        handleExportPDF={handleExportPDF}
                        getExportData={getExportData}
                    />
                </React.Suspense>
            </div>
        </DashboardLayout>
    )
}
