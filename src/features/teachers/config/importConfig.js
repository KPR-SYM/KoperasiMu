import { UserCheck, Buildings, Envelope, Phone, Calendar, MapPin, IdentificationCard, Briefcase, BookOpenText, GraduationCap, Clock, User, Shield } from '@phosphor-icons/react'

export const teachersImportConfig = {
    moduleName: 'teachers',
    tableName: 'teachers',
    modalTitle: 'Import Data Guru',
    modalDescription: 'Unggah file Excel/CSV untuk menambah guru secara massal',
    icon: UserCheck,
    iconBg: 'bg-indigo-500/10',
    iconColor: 'text-indigo-600',

    accept: ['.csv', '.xlsx'],

    systemCols: [
        { key: 'name', label: 'Nama Lengkap', synonyms: ['nama', 'name', 'nama lengkap', 'nama guru', 'guru'], required: true },
        { key: 'subject', label: 'Mata Pelajaran', synonyms: ['mapel', 'mata pelajaran', 'subject', 'bidang studi'] },
        { key: 'gender', label: 'Jenis Kelamin', synonyms: ['gender', 'jk', 'jenis kelamin', 'kelamin', 'sex', 'l/p', 'jenis kelamin (l/p)'] },
        { key: 'phone', label: 'No. WhatsApp', synonyms: ['wa', 'no. hp/wa', 'phone', 'whatsapp', 'no hp', 'no telp'] },
        { key: 'status', label: 'Status', synonyms: ['status', 'aktif', 'status aktif', 'status (active/inactive/cuti)'] },
        { key: 'type', label: 'Jenis Pegawai', synonyms: ['jenis', 'type', 'jenis pegawai', 'tipe', 'peran', 'jenis pegawai (guru/karyawan)'] },
    ],

    requiredKeys: ['name'],

    editableColumnTypes: {
        gender: { type: 'static', options: [{ id: 'L', name: 'Laki-laki' }, { id: 'P', name: 'Perempuan' }] },
        status: { type: 'static', options: [{ id: 'active', name: 'Aktif' }, { id: 'inactive', name: 'Non-Aktif' }, { id: 'leave', name: 'Cuti' }] },
        type: { type: 'static', options: [{ id: 'guru', name: 'Guru' }, { id: 'karyawan', name: 'Karyawan' }] },
    },

    templateColumns: [
        { l: 'A', k: 'Nama Lengkap', n: 'Nama', w: 'w-[25%]' },
        { l: 'B', k: 'Mata Pelajaran', n: 'Mapel', w: 'w-[18%]' },
        { l: 'C', k: 'Jenis Kelamin', n: 'L/P', w: 'w-[8%]' },
        { l: 'D', k: 'No. WhatsApp', n: 'WA', w: 'w-[15%]' },
        { l: 'E', k: 'Status', n: 'Status', w: 'w-[10%]' },
        { l: 'F', k: 'Jenis Pegawai', n: 'Jenis', w: 'w-[10%]' },
    ],

    templateSampleRows: [
        { 'Nama Lengkap': 'Budi Santoso', 'Mata Pelajaran': 'Matematika', 'Jenis Kelamin': 'L', 'No. WhatsApp': '081234567890', Status: 'active', 'Jenis Pegawai': 'guru' },
        { 'Nama Lengkap': 'Siti Rahayu', 'Mata Pelajaran': 'Bahasa Indonesia', 'Jenis Kelamin': 'P', 'No. WhatsApp': '081234567891', Status: 'active', 'Jenis Pegawai': 'guru' },
    ],

    templateFileName: 'Template Import Guru.xlsx',
    templateSheetName: 'Template Import',
    templateColWidths: [
        { wch: 25 }, { wch: 18 }, { wch: 8 },
        { wch: 15 }, { wch: 10 }, { wch: 10 },
    ],

    referenceData: null,
    referenceLabel: 'Data Referensi Guru',
    referenceIcon: UserCheck,

    columns: [
        { key: 'name', label: 'Nama Lengkap' },
        { key: 'subject', label: 'Mata Pelajaran' },
        { key: 'gender', label: 'L/P' },
        { key: 'phone', label: 'No. WA' },
        { key: 'status', label: 'Status' },
        { key: 'type', label: 'Jenis' },
    ],

    getDisplayValue: (value, colKey) => {
        if (colKey === 'gender') return value === 'L' ? 'L' : value === 'P' ? 'P' : value
        if (colKey === 'status') return value === 'active' ? 'Aktif' : value === 'inactive' ? 'Non-Aktif' : value === 'leave' ? 'Cuti' : value
        if (colKey === 'type') return value === 'guru' ? 'Guru' : value === 'karyawan' ? 'Karyawan' : value
        return value
    },
}