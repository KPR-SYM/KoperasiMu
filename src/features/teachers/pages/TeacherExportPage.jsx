import React from "react"
import { useNavigate } from "react-router-dom"
import { Spinner } from "@phosphor-icons/react"

import DashboardLayout from "@core/layouts/DashboardLayout"
import { useToast } from "@context/Toast"
import { useTeachersCore } from "@features/teachers/hooks/useTeachersCore"
import { useTeachersModals } from "@features/teachers/hooks/useTeachersModals"
import { useTeachersImportExport } from "@features/teachers/hooks/useTeachersImportExport"
import LazyTeacherExportPanel from "@features/teachers/components/TeacherExportPanel"

export default function TeacherExportPage() {
    const { addToast } = useToast()
    const navigate = useNavigate()

    const {
        teachers, selectedIds,
        filterStatus, filterGender, filterSubject, filterType,
        fetchData, fetchStats,
    } = useTeachersCore({ addToast })

    const {
        setIsExportModalOpen,
    } = useTeachersModals()

    const {
        exportScope, setExportScope, exportColumns, setExportColumns, exporting,
        handleExportCSV, handleExportExcel, handleExportPDF,
        getExportData,
    } = useTeachersImportExport({
        teachers, selectedIds,
        filterStatus, filterGender, filterSubject, filterType,
        fetchData, fetchStats,
        addToast,
        setIsImportModalOpen: () => {},
        setIsExportModalOpen,
    })

    return (
        <DashboardLayout title="Export Data Guru">
            <div className="flex flex-col min-h-[calc(100vh-3.5rem)] -mx-4 sm:-mx-5 lg:-mx-6 -mt-4 lg:-mt-6">
                <React.Suspense fallback={
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <Spinner className="w-6 h-6 text-[var(--color-primary)] animate-spin" />
                            <span className="text-[11px] font-bold text-[var(--color-text-muted)]">Memuat panel export...</span>
                        </div>
                    </div>
                }>
                    <LazyTeacherExportPanel
                        isOpen={true}
                        onClose={() => navigate('/master/teachers')}
                        teachers={teachers}
                        selectedTeacherIds={selectedIds}
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
