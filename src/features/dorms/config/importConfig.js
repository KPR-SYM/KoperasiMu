import { House, Users, Buildings, Bed, DoorOpen, Key } from '@phosphor-icons/react'

export const dormsImportConfig = {
    moduleName: 'dorms',
    tableName: 'students',
    modalTitle: 'Import Plotting Kamar',
    modalDescription: 'Unggah file Excel/CSV untuk plotting kamar santri secara massal',
    icon: House,
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-600',

    accept: ['.csv', '.xlsx'],

    systemCols: [
        { key: 'student_name', label: 'Nama Siswa', synonyms: ['nama', 'student', 'siswa', 'student_name', 'nama siswa', 'name', 'nama lengkap'], required: true },
        { key: 'class_name', label: 'Nama Kelas', synonyms: ['kelas', 'class', 'class_name', 'rombongan belajar', 'rombel', 'nama kelas'] },
        { key: 'room_name', label: 'Nama Kamar', synonyms: ['kamar', 'room', 'room_name', 'nama kamar', 'asrama', 'kamar asrama'], required: true },
    ],

    requiredKeys: ['student_name', 'room_name'],

    editableColumnTypes: {
        room_id: { type: 'searchable_fk', listKey: 'dorms', labelKey: 'name' },
    },

    bulkFixConfig: {
        field: 'room_id',
        fieldLabel: 'Kamar',
        message: 'Santri dengan kamar tidak valid',
        options: [],
        labelKey: 'name',
    },

    templateColumns: [
        { l: 'A', k: 'Nama Siswa', n: 'Nama Siswa', w: 'w-[40%]' },
        { l: 'B', k: 'Kelas', n: 'Kelas', w: 'w-[20%]' },
        { l: 'C', k: 'Nama Kamar', n: 'Nama Kamar', w: 'w-[20%]' },
    ],

    templateSampleRows: [
        { 'Nama Siswa': 'Ahmad Rizki', Kelas: 'XII IPA 1', 'Nama Kamar': 'Kamar A-101' },
        { 'Nama Siswa': 'Siti Aminah', Kelas: 'XI IPS 2', 'Nama Kamar': 'Kamar B-202' },
    ],

    templateFileName: 'Template Import Plotting Kamar.xlsx',
    templateSheetName: 'Template Import',
    templateColWidths: [
        { wch: 30 }, { wch: 15 }, { wch: 20 },
    ],

    referenceData: null,
    referenceLabel: 'Data Referensi',
    referenceIcon: Buildings,

    columns: [
        { key: 'student_name', label: 'Nama Santri' },
        { key: 'class_name', label: 'Kelas' },
        { key: 'room_name', label: 'Kamar' },
    ],

    getDisplayValue: (value, colKey) => value,
}