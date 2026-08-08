import React from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@phosphor-icons/react";

import DashboardLayout from "@core/layouts/DashboardLayout";
import { useToast } from "@context/Toast";
import { usePeriodsCore } from "@features/periods/hooks/usePeriodsCore";
import { usePeriodsModals } from "@features/periods/hooks/usePeriodsModals";
import { usePeriodsImportExport } from "@features/periods/hooks/usePeriodsImportExport";
import LazyPeriodExportPanel from "@features/periods/components/PeriodExportPanel";

export default function PeriodExportPage() {
    const { addToast, addUndoToast } = useToast();
    const navigate = useNavigate();

    const {
        years, filtered, selectedIds, canEdit, isSaving, isDeleting, isMutating,
        fetchData, handleError,
    } = usePeriodsCore({ addToast, addUndoToast });

    const {
        isExportModalOpen, setIsExportModalOpen,
    } = usePeriodsModals();

    const {
        exportScope, setExportScope, exportColumns, setExportColumns, exporting, exportError,
        handleExportCSV, handleExportExcel, handleExportPDF, handleExportICS,
        getExportData,
    } = usePeriodsImportExport({
        years, filtered, selectedIds, canEdit, fetchData, addToast,
        handleError,
        isImportModalOpen: false, setIsImportModalOpen: () => {},
        isExportModalOpen, setIsExportModalOpen,
    });

    return (
        <DashboardLayout title="Export Tahun Akademik">
            <div className="flex flex-col min-h-[calc(100vh-3.5rem)] -mx-4 sm:-mx-5 lg:-mx-6 -mt-4 lg:-mt-6">
                <React.Suspense fallback={
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <Spinner className="w-6 h-6 text-[var(--color-primary)] animate-spin" />
                            <span className="text-[11px] font-bold text-[var(--color-text-muted)]">Memuat panel export...</span>
                        </div>
                    </div>
                }>
                    <LazyPeriodExportPanel
                        isOpen={true}
                        onClose={() => navigate('/master/periods')}
                        years={years}
                        selectedIds={selectedIds}
                        exportScope={exportScope}
                        setExportScope={setExportScope}
                        exportColumns={exportColumns}
                        setExportColumns={setExportColumns}
                        exporting={exporting}
                        exportError={exportError}
                        handleExportCSV={handleExportCSV}
                        handleExportExcel={handleExportExcel}
                        handleExportPDF={handleExportPDF}
                        handleExportICS={handleExportICS}
                        getExportData={getExportData}
                        addToast={addToast}
                    />
                </React.Suspense>
            </div>
        </DashboardLayout>
    );
}
