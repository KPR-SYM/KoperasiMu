import { useEffect, useRef, useCallback } from "react";

const CHECK_INTERVAL = 60000;

export function usePeriodsNotifications({ years, reminderDays, addToast }) {
    const notifiedRef = useRef(new Set());

    const checkAndNotify = useCallback(() => {
        if (!years?.length || !reminderDays) return;

        const now = new Date();
        const threshold = reminderDays * 24 * 60 * 60 * 1000;

        for (const year of years) {
            if (!year.start_date || !year.end_date) continue;

            const startDate = new Date(year.start_date);
            const endDate = new Date(year.end_date);
            const diffStart = startDate.getTime() - now.getTime();
            const diffEnd = endDate.getTime() - now.getTime();
            const label = `${year.academic_year} ${year.semester}`;

            // Mendekati mulai
            if (diffStart > 0 && diffStart <= threshold) {
                const key = `start-${year.id}`;
                if (!notifiedRef.current.has(key)) {
                    notifiedRef.current.add(key);
                    const daysLeft = Math.ceil(diffStart / 86400000);
                    const msg = `"${label}" akan mulai dalam ${daysLeft} hari (${formatDateShort(startDate)})`;
                    addToast(msg, "info", 8000);
                    sendBrowserNotification("Periode Akan Mulai", msg);
                }
            }

            // Mendekati berakhir
            if (diffEnd > 0 && diffEnd <= threshold) {
                const key = `end-${year.id}`;
                if (!notifiedRef.current.has(key)) {
                    notifiedRef.current.add(key);
                    const daysLeft = Math.ceil(diffEnd / 86400000);
                    const msg = `"${label}" akan berakhir dalam ${daysLeft} hari (${formatDateShort(endDate)})`;
                    addToast(msg, "warning", 8000);
                    sendBrowserNotification("Periode Akan Berakhir", msg);
                }
            }

            // Baru mulai hari ini (toleransi 1 jam)
            const diffStartAbs = Math.abs(diffStart);
            if (diffStartAbs <= 3600000 && year.is_active) {
                const key = `started-${year.id}`;
                if (!notifiedRef.current.has(key)) {
                    notifiedRef.current.add(key);
                    const msg = `"${label}" sedang berjalan sekarang`;
                    addToast(msg, "success", 6000);
                    sendBrowserNotification("Periode Sedang Berjalan", msg);
                }
            }

            // Baru berakhir hari ini
            if (Math.abs(diffEnd) <= 3600000) {
                const key = `ended-${year.id}`;
                if (!notifiedRef.current.has(key)) {
                    notifiedRef.current.add(key);
                    const msg = `"${label}" telah berakhir hari ini`;
                    addToast(msg, "info", 6000);
                    sendBrowserNotification("Periode Berakhir", msg);
                }
            }
        }
    }, [years, reminderDays, addToast]);

    useEffect(() => {
        checkAndNotify();
        const interval = setInterval(checkAndNotify, CHECK_INTERVAL);
        return () => clearInterval(interval);
    }, [checkAndNotify]);

    // Reset notifikasi yg sudah ditampilkan ketika years/reminderDays berubah
    useEffect(() => {
        notifiedRef.current = new Set();
    }, [reminderDays]);
}

function formatDateShort(date) {
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function sendBrowserNotification(title, body) {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/favicon.ico" });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((perm) => {
            if (perm === "granted") {
                new Notification(title, { body, icon: "/favicon.ico" });
            }
        });
    }
}
