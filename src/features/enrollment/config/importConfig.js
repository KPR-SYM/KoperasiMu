import { UserPlus, Calendar, Phone, Building2, MapPin, User, Tag, School } from 'lucide-react'

export const enrollmentImportConfig = {
    moduleName: 'enrollment',
    tableName: 'enrollments',
    modalTitle: 'Import Data Pendaftar',
    modalDescription: 'Unggah file Excel/CSV untuk menambah pendaftar PSB secara massal',
    icon: UserPlus,
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-600',

    accept: ['.csv', '.xlsx'],

    systemCols: [
        { key: 'name', label: 'Nama Pendaftar', synonyms: ['nama', 'name', 'nama lengkap', 'full name', 'pendaftar', 'nama pendaftar', 'calon santri'], required: true },
        { key: 'gender', label: 'Gender', synonyms: ['gender', 'jk', 'jenis kelamin', 'kelamin', 'sex', 'l/p'] },
        { key: 'phone', label: 'No. HP / WA', synonyms: ['phone', 'no_hp', 'hp', 'whatsapp', 'wa', 'telp', 'telepon', 'phone number', 'no. whatsapp', 'no whatsapp', 'no. hp / wa', 'no. hp', 'whatsapp number'] },
        { key: 'nisn', label: 'NISN', synonyms: ['nisn', 'nomor induk siswa nasional', 'nisn pendaftar'] },
        { key: 'school_origin', label: 'Asal Sekolah', synonyms: ['asal sekolah', 'school_origin', 'school', 'asal_sekolah', 'sd/mi', 'sekolah asal', 'sekolah'] },
        { key: 'program', label: 'Program', synonyms: ['program', 'pilihan program', 'program studi', 'jurusan'] },
        { key: 'wave_name', label: 'Gelombang', synonyms: ['gelombang', 'wave', 'wave_name', 'periode'] },
        { key: 'birth_place', label: 'Tempat Lahir', synonyms: ['tempat lahir', 'birth_place', 'birthplace', 'tmp_lahir'] },
        { key: 'birth_date', label: 'Tanggal Lahir', synonyms: ['tanggal lahir', 'birth_date', 'tgl_lahir', 'tgl lahir'] },
        { key: 'father_name', label: 'Nama Ayah', synonyms: ['nama ayah', 'father_name', 'father name', 'nama bapak'] },
        { key: 'mother_name', label: 'Nama Ibu', synonyms: ['nama ibu', 'mother_name', 'mother name', 'nama mama'] },
        { key: 'address', label: 'Alamat', synonyms: ['alamat', 'address', 'alamat lengkap'] },
    ],

    requiredKeys: ['name'],

    editableColumnTypes: {
        gender: { type: 'static', options: [{ id: 'L', name: 'Laki-laki' }, { id: 'P', name: 'Perempuan' }] },
        program: { type: 'static', options: ['Boarding', 'Reguler'].map(v => ({ id: v, name: v })) },
        wave_id: { type: 'searchable_fk', listKey: 'waves', labelKey: 'name' },
    },

    bulkFixConfig: {
        field: 'wave_id',
        fieldLabel: 'Gelombang',
        message: 'Pendaftar dengan gelombang tidak valid',
        options: [],
        labelKey: 'name',
    },

    templateColumns: [
        { l: 'A', k: 'Nama', n: 'Nama Lengkap', w: 'w-[20%]' },
        { l: 'B', k: 'Jenis Kelamin', n: 'L/P', w: 'w-[8%]' },
        { l: 'C', k: 'No. WhatsApp', n: 'WA', w: 'w-[14%]' },
        { l: 'D', k: 'NISN', n: 'NISN', w: 'w-[14%]' },
        { l: 'E', k: 'Asal Sekolah', n: 'Sekolah', w: 'w-[18%]' },
        { l: 'F', k: 'Program', n: 'Program', w: 'w-[12%]' },
        { l: 'G', k: 'Gelombang', n: 'Gelombang', w: 'w-[12%]' },
        { l: 'H', k: 'Tempat Lahir', n: 'Tempat', w: 'w-[12%]' },
        { l: 'I', k: 'Tanggal Lahir', n: 'Tgl Lahir', w: 'w-[12%]' },
        { l: 'J', k: 'Nama Ayah', n: 'Ayah', w: 'w-[15%]' },
        { l: 'K', k: 'Nama Ibu', n: 'Ibu', w: 'w-[15%]' },
        { l: 'L', k: 'Alamat', n: 'Alamat', w: 'w-[25%]' },
    ],

    templateSampleRows: [
        { Nama: 'Ahmad Rizki', 'Jenis Kelamin': 'L', 'No. WhatsApp': '081234567890', NISN: '1234567890', 'Asal Sekolah': 'SDN 01 Jakarta', Program: 'Boarding', Gelombang: 'Gelombang 1', 'Tempat Lahir': 'Jakarta', 'Tanggal Lahir': '2008-05-15', 'Nama Ayah': 'Budi Rizki', 'Nama Ibu': 'Siti Maryam', Alamat: 'Jl. Merdeka No. 123' },
        { Nama: 'Siti Aminah', 'Jenis Kelamin': 'P', 'No. WhatsApp': '081234567891', NISN: '0987654321', 'Asal Sekolah': 'SDN 02 Bandung', Program: 'Reguler', Gelombang: 'Gelombang 1', 'Tempat Lahir': 'Bandung', 'Tanggal Lahir': '2009-02-20', 'Nama Ayah': 'Mulyono', 'Nama Ibu': 'Aminah', Alamat: 'Jl. Kenanga No. 45' },
    ],

    templateFileName: 'Template Import Pendaftar PSB.xlsx',
    templateSheetName: 'Template Import',
    templateColWidths: [
        { wch: 25 }, { wch: 8 }, { wch: 15 }, { wch: 14 },
        { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 12 },
        { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 30 },
    ],

    referenceData: null,
    referenceLabel: 'Daftar Gelombang',
    referenceIcon: Calendar,

    columns: [
        { key: 'name', label: 'Nama' },
        { key: 'gender', label: 'L/P' },
        { key: 'phone', label: 'No. WA' },
        { key: 'nisn', label: 'NISN' },
        { key: 'school_origin', label: 'Asal Sekolah' },
        { key: 'program', label: 'Program' },
        { key: 'wave_name', label: 'Gelombang' },
        { key: 'birth_place', label: 'Tempat Lahir' },
        { key: 'birth_date', label: 'Tgl Lahir' },
        { key: 'father_name', label: 'Ayah' },
        { key: 'mother_name', label: 'Ibu' },
        { key: 'address', label: 'Alamat' },
    ],

    getDisplayValue: (value, colKey) => {
        if (colKey === 'gender') return value === 'L' ? 'L' : value === 'P' ? 'P' : value
        return value
    },
}