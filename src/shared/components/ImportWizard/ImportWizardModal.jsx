import React, { memo, useState, useCallback } from 'react'
import { CaretLeft, CaretRight, CheckCircle, WarningCircle, Spinner, UploadSimple, FileText, MagnifyingGlass, X } from '@phosphor-icons/react'
import Modal from '@shared/components/Modal'
import Select from '@shared/components/Select'
import { Dropzone } from '@shared/components'
import StepIndicator from './StepIndicator'
import StepUpload from './StepUpload'
import StepMapping from './StepMapping'
import StepReview from './StepReview'

const ImportWizardModal = memo(function ImportWizardModal({
    isOpen,
    onClose,
    config,
    wizard,
}) {
    const [showValidation, setShowValidation] = useState(false)
    const [filterIssuesOnly, setFilterIssuesOnly] = useState(false)
    const [showClassesDropdown, setShowClassesDropdown] = useState(false)
    const classesDropdownRef = React.useRef(null)

    const {
        importStep,
        setImportStep,
        importFileName,
        importFileHeaders,
        importColumnMapping,
        setImportColumnMapping,
        importPreview,
        setImportPreview,
        importIssues,
        importDuplicates,
        importLoading,
        importing,
        importProgress,
        importDragOver,
        setImportDragOver,
        importValidationOpen,
        setImportValidationOpen,
        importEditCell,
        setImportEditCell,
        importSkipDupes,
        setImportSkipDupes,
        importFileInputRef,
        importReadyRows,
        hasImportBlockingErrors,
        processImportFile,
        buildImportPreview,
        handleImportCellEdit,
        handleRemoveImportRow,
        handleBulkFix,
        handleCommitImport,
        handleDownloadTemplate,
        handleImportClick,
        editableColumnTypes,
    } = wizard

    const handleMappingChange = useCallback((sysKey, headerValue) => {
        setImportColumnMapping(prev => ({ ...prev, [sysKey]: headerValue }))
    }, [setImportColumnMapping])

    const handleProceedToMapping = useCallback(() => {
        buildImportPreview(importColumnMapping)
        setImportStep(2)
    }, [buildImportPreview, importColumnMapping, setImportStep])

    const handleBackToUpload = useCallback(() => {
        setImportStep(1)
    }, [setImportStep])

    const handleBackToMapping = useCallback(() => {
        setImportStep(2)
    }, [setImportStep])

    const requiredKeys = config?.systemCols?.filter(c => c.required).map(c => c.key) || []
    const allMapped = requiredKeys.every(k => importColumnMapping[k])

    const displayedPreview = filterIssuesOnly
        ? importPreview.filter((_, i) => importIssues.some(issue => issue.row === i + 2 && issue.level === 'error'))
        : importPreview

    if (!isOpen) return null

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={config.modalTitle || 'Import Data'}
            description={config.modalDescription}
            size="full"
            className="max-w-6xl max-h-[90vh]"
        >
            <div className="flex flex-col h-full">
                <StepIndicator
                    activeStep={importStep}
                    completedSteps={importStep > 1 ? [1] : importStep > 2 ? [1, 2] : []}
                />

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {importStep === 1 && (
                        <StepUpload
                            file={importFileName}
                            loading={importLoading}
                            dragOver={importDragOver}
                            setDragOver={setImportDragOver}
                            onFileSelect={processImportFile}
                            onDownloadTemplate={handleDownloadTemplate}
                            referenceData={config.referenceData}
                            referenceLabel={config.referenceLabel}
                            templateColumns={config.templateColumns}
                            templateSampleRows={config.templateSampleRows}
                        />
                    )}

                    {importStep === 2 && (
                        <StepMapping
                            systemCols={config.systemCols}
                            importColumnMapping={importColumnMapping}
                            setImportColumnMapping={setImportColumnMapping}
                            importFileHeaders={importFileHeaders}
                            importRawData={wizard.importRawData}
                            setImportStep={setImportStep}
                            buildImportPreview={buildImportPreview}
                            handleMappingChange={handleMappingChange}
                            allMapped={allMapped}
                        />
                    )}

                    {importStep === 3 && (
                        <StepReview
                            importPreview={importPreview}
                            importIssues={importIssues}
                            importDuplicates={importDuplicates}
                            importValidationOpen={importValidationOpen}
                            setImportValidationOpen={setImportValidationOpen}
                            importEditCell={importEditCell}
                            setImportEditCell={setImportEditCell}
                            importSkipDupes={importSkipDupes}
                            setImportSkipDupes={setImportSkipDupes}
                            importReadyRows={importReadyRows}
                            hasImportBlockingErrors={hasImportBlockingErrors}
                            importing={importing}
                            importProgress={importProgress}
                            filterIssuesOnly={filterIssuesOnly}
                            setFilterIssuesOnly={setFilterIssuesOnly}
                            showValidation={showValidation}
                            setShowValidation={setShowValidation}
                            handleImportCellEdit={handleImportCellEdit}
                            handleRemoveImportRow={handleRemoveImportRow}
                            handleBulkFix={handleBulkFix}
                            handleCommitImport={handleCommitImport}
                            config={config}
                            wizard={wizard}
                            displayedPreview={displayedPreview}
                            editableColumnTypes={editableColumnTypes}
                        />
                    )}
                </div>
            </div>
        </Modal>
    )
})

ImportWizardModal.displayName = 'ImportWizardModal'

export default ImportWizardModal