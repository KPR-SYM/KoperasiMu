import { Calendar, CalendarCheck, CalendarBlank } from '@phosphor-icons/react'

export const periodsImportConfig = {
    moduleName: 'periods',
    tableName: 'periods',
    modalTitle: 'Import Periode Akademik',
    modalDescription: 'Unggah file Excel/CSV untuk menambah periode akademik secara massal',
    icon: Calendar,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600',

    accept: ['.csv', '.xlsx'],

    systemCols: [
        { key: 'academic_year', label: 'Tahun Pelajaran (e.g. 2024/2025)', synonyms: ['tahun pelajaran', 'tahun akademik', 'academic year', 'tahun', 'year'] },
        { key: 'semester', label: 'Semester (Ganjil / Genap)', synonyms: ['semester', 'ganjil', 'genap', 'term'] },
        { key: 'start_date', label: 'Tanggal Mulai (YYYY-MM-DD)', synonyms: ['tanggal mulai', 'start date', 'mulai', 'tgl mulai'] },
        { key: 'end_date', label: 'Tanggal Selesai (YYYY-MM-DD)', synonyms: ['tanggal selesai', 'end date', 'selesai', 'tgl selesai'] },
    ],

    requiredKeys: ['academic_year', 'semester', 'start_date', 'end_date'],

    editableColumnTypes: {
        semester: { type: 'static', options: [{ id: 'Ganjil', name: 'Ganjil' }, { id: 'Genap', name: 'Genap' }] },
    },

    templateColumns: [
        { l: 'A', k: 'Tahun Pelajaran', n: 'Tahun Pelajaran', w: 'w-[30%]' },
        { l: 'B', k: 'Semester', n: 'Semester', w: 'w-[15%]' },
        { l: 'C', k: 'Tanggal Mulai', n: 'Tgl Mulai', w: 'w-[20%]' },
        { l: 'D', k: 'Tanggal Selesai', n: 'Tgl Selesai', w: 'w-[20%]' },
    ],

    templateSampleRows: [
        { 'Tahun Pelajaran': '2024/2025', Semester: 'Ganjil', 'Tanggal Mulai': '2024-07-01', 'Tanggal Selesai': '2024-12-31' },
        { 'Tahun Pelajaran': '2024/2025', Semester: 'Genap', 'Tanggal Mulai': '2025-01-01', 'Tanggal Selesai': '2025-06-30' },
    ],

    templateFileName: 'Template Import Periode -- KoperasiMu.xlsx',
    templateSheetName: 'Template Import',
    templateColWidths: [
        { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 18 },
    ],

    referenceData: null,
    referenceLabel: 'Data Referensi',
    referenceIcon: CalendarCheck,

    columns: [
        { key: 'academic_year', label: 'Tahun Pelajaran' },
        { key: 'semester', label: 'Semester' },
        { key: 'start_date', label: 'Tgl Mulai' },
        { key: 'end_date', label: 'Tgl Selesai' },
    ],

    getDisplayValue: (value, colKey) => {
        if (colKey === 'semester') return value === 'Ganjil' ? 'Ganjil' : value === 'Genap' ? 'Genap' : value
        return value
    },
}