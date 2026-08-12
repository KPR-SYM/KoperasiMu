import { memo } from "react"
import { Fingerprint } from "@phosphor-icons/react"
import { Modal, AuditTimeline } from "@shared/components"

const ClassesHistoryModal = memo(function ClassesHistoryModal({
    isOpen,
    onClose,
    item,
}) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Riwayat · ${item?.name || ""}`}
            description="Audit log untuk rekaman ini."
            icon={Fingerprint}
            iconBg="bg-blue-500/10"
            iconColor="text-blue-500"
            size="md"
            mobileVariant="bottom-sheet"
            noPadding
        >
            {item && (
                <AuditTimeline
                    tableName="classes"
                    recordId={item.id}
                    limit={30}
                    theme="blue"
                    showSearch
                    stickyHeader
                />
            )}
        </Modal>
    )
})

export default ClassesHistoryModal
