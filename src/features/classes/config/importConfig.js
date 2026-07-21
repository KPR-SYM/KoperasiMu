import { Users, Buildings, User, Calendar, SealCheck, Tag } from '@phosphor-icons/react'

export const classesImportConfig = {
    moduleName: 'classes',
    tableName: 'classes',
    modalTitle: 'Import Data Kelas',
    modalDescription: 'Unggah file Excel/CSV untuk menambah kelas secara massal',
    icon: Users,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-600',

    accept: ['.csv', '.xlsx'],

    systemCols: [
        { key: 'name', label: 'Nama Kelas', synonyms: ['nama kelas', 'kelas', 'name', 'nama', 'class'], required: true },
        { key: 'grade', label: 'Tingkat', synonyms: ['tingkat', 'grade', 'level'], required: true },
        { key: 'program', label: 'Program', synonyms: ['program', 'major', 'boarding', 'reguler'] },
        { key: 'gender_type', label: 'Tipe Gender', synonyms: ['tipe gender', 'gender', 'putra', 'putri', 'l/p', 'jenis kelamin'] },
        { key: 'teacher', label: 'Wali Kelas', synonyms: ['wali kelas', 'wali', 'teacher', 'guru', 'nama guru'] },
        { key: 'year', label: 'Tahun Ajaran', synonyms: ['tahun ajaran', 'tahun', 'year', 'akademik', 'academic year'] },
    ],

    requiredKeys: ['name', 'grade'],

    editableColumnTypes: {
        grade: { type: 'static', options: ['7', '8', '9', '10', '11', '12'].map(v => ({ id: v, name: v })) },
        program: { type: 'static', options: ['Boarding', 'Reguler'].map(v => ({ id: v, name: v })) },
        gender_type: { type: 'static', options: ['Putra', 'Putri'].map(v => ({ id: v, name: v })) },
        homeroom_teacher_id: { type: 'searchable_fk', listKey: 'teachersList', labelKey: 'name' },
        academic_year_id: { type: 'searchable_fk', listKey: 'periodsList', labelKey: 'name' },
    },

    templateColumns: [
        { l: 'A', k: 'Nama Kelas', n: 'Nama Kelas', w: 'w-[25%]' },
        { l: 'B', k: 'Tingkat', n: 'Tingkat', w: 'w-[10%]' },
        { l: 'C', k: 'Program', n: 'Program', w: 'w-[12%]' },
        { l: 'D', k: 'Tipe Gender', n: 'Gender', w: 'w-[12%]' },
        { l: 'E', k: 'Wali Kelas', n: 'Wali Kelas', w: 'w-[20%]' },
        { l: 'F', k: 'Tahun Ajaran', n: 'Tahun Ajaran', w: 'w-[15%]' },
    ],

    templateSampleRows: [
        { 'Nama Kelas': 'XII IPA 1', Tingkat: '12', Program: 'Boarding', 'Tipe Gender': 'Putra', 'Wali Kelas': 'Budi Santoso', 'Tahun Ajaran': '2024/2025' },
        { 'Nama Kelas': 'XI IPS 2', Tingkat: '11', Program: 'Reguler', 'Tipe Gender': 'Putri', 'Wali Kelas': 'Siti Rahayu', 'Tahun Ajaran': '2024/2025' },
    ],

    templateFileName: 'Template Import Kelas.xlsx',
    templateSheetName: 'Template Import',
    templateColWidths: [
        { wch: 25 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 15 },
    ],

    referenceData: null,
    referenceLabel: 'Data Referensi',
    referenceIcon: Buildings,

    columns: [
        { key: 'name', label: 'Nama Kelas' },
        { key: 'grade', label: 'Tingkat' },
        { key: 'program', label: 'Program' },
        { key: 'gender_type', label: 'Tipe Gender' },
        { key: 'teacher', label: 'Wali Kelas' },
        { key: 'year', label: 'Tahun Ajaran' },
    ],

    getDisplayValue: (value, colKey) => value,
}