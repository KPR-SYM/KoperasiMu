import { memo } from "react"
import { Fingerprint } from "@phosphor-icons/react"
import { Modal, AuditTimeline } from "@shared/components"

const PeriodsHistoryModal = memo(function PeriodsHistoryModal({
    isOpen,
    onClose,
    item,
}) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Riwayat · ${item?.academic_year || ""}`}
            description="Audit log untuk rekaman ini."
            icon={Fingerprint}
            iconBg="bg-purple-500/10"
            iconColor="text-purple-500"
            size="md"
            mobileVariant="bottom-sheet"
            noPadding
        >
            {item && (
                <AuditTimeline
                    tableName="periods"
                    recordId={item.id}
                    limit={30}
                    theme="purple"
                    showSearch
                    stickyHeader
                />
            )}
        </Modal>
    )
})

export default PeriodsHistoryModal
