import { useState, useCallback } from "react";

const STORAGE_KEY = "periods_templates";

function loadTemplates() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveTemplates(templates) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    } catch { /* ignore */ }
}

let nextId = Date.now();

export function usePeriodTemplates({ addToast }) {
    const [templates, setTemplates] = useState(loadTemplates);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const refresh = useCallback(() => {
        setTemplates(loadTemplates());
    }, []);

    const saveTemplate = useCallback(({ name, durationDays, semester, isActive, isLocked }) => {
        const existing = loadTemplates();
        const newTemplate = {
            id: `tpl_${nextId++}`,
            name,
            durationDays,
            semester: semester || "Ganjil",
            isActive: isActive || false,
            isLocked: isLocked || false,
            createdAt: new Date().toISOString(),
        };
        existing.push(newTemplate);
        saveTemplates(existing);
        setTemplates(existing);
        addToast(`Template "${name}" disimpan`, "success");
    }, [addToast]);

    const deleteTemplate = useCallback((id) => {
        const existing = loadTemplates();
        const filtered = existing.filter((t) => t.id !== id);
        saveTemplates(filtered);
        setTemplates(filtered);
        addToast("Template dihapus", "info");
    }, [addToast]);

    const applyTemplate = useCallback((template, years) => {
        if (!years?.length) return null;
        const last = [...years].sort((a, b) => new Date(b.end_date) - new Date(a.end_date))[0];
        if (!last) return null;
        const endDate = new Date(last.end_date);
        const startNext = new Date(endDate);
        startNext.setDate(startNext.getDate() + 1);
        const endNext = new Date(startNext);
        endNext.setDate(endNext.getDate() + (template.durationDays || 180));
        return {
            academic_year: generateNextYear(last.academic_year),
            semester: template.semester || (last.semester === "Ganjil" ? "Genap" : "Ganjil"),
            start_date: startNext.toISOString().split("T")[0],
            end_date: endNext.toISOString().split("T")[0],
            is_locked: template.isLocked || false,
        };
    }, []);

    return {
        templates,
        isModalOpen,
        setIsModalOpen,
        saveTemplate,
        deleteTemplate,
        applyTemplate,
        refresh,
    };
}

function generateNextYear(academicYear) {
    const match = academicYear?.match(/(\d{4})\/(\d{4})/);
    if (!match) return "";
    const next = parseInt(match[1]) + 1;
    return `${next}/${next + 1}`;
}
