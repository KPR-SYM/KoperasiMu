import { useState, useCallback } from "react";

export function usePeriodsModals() {
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isLockModalOpen, setIsLockModalOpen] = useState(false);
    const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [isCompareOpen, setIsCompareOpen] = useState(false);
    const [itemToDuplicate, setItemToDuplicate] = useState(null);
    const [compareItems, setCompareItems] = useState([]);
    const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
    const [batchCount, setBatchCount] = useState(1);
    const [isActivateConfirmOpen, setIsActivateConfirmOpen] = useState(false);
    const [activateTarget, setActivateTarget] = useState(null);

    const openCompare = useCallback((items) => {
        setCompareItems(items);
        setIsCompareOpen(true);
    }, []);

    const openActivateConfirm = useCallback((target) => {
        setActivateTarget(target);
        setIsActivateConfirmOpen(true);
    }, []);

    const closeActivateConfirm = useCallback(() => {
        setIsActivateConfirmOpen(false);
        setActivateTarget(null);
    }, []);

    const resetBatchCount = useCallback(() => setBatchCount(1), []);

    return {
        isImportModalOpen, setIsImportModalOpen,
        isExportModalOpen, setIsExportModalOpen,
        isLockModalOpen, setIsLockModalOpen,
        isUnlockModalOpen, setIsUnlockModalOpen,
        isShiftModalOpen, setIsShiftModalOpen,
        isCompareOpen, setIsCompareOpen,
        itemToDuplicate, setItemToDuplicate,
        compareItems, setCompareItems,
        isBulkEditOpen, setIsBulkEditOpen,
        batchCount, setBatchCount,
        isActivateConfirmOpen, setIsActivateConfirmOpen,
        activateTarget, setActivateTarget,
        openCompare,
        openActivateConfirm,
        closeActivateConfirm,
        resetBatchCount,
    };
}
