import { GraduationCap, Users, Buildings, Phone, Calendar, MapPin, User, FileText, IdentificationCard, Envelope, Tag, Hash, Shield } from '@phosphor-icons/react'

export const studentsImportConfig = {
    moduleName: 'students',
    tableName: 'students',
    modalTitle: 'Import Data Siswa',
    modalDescription: 'Unggah file Excel/CSV untuk menambah siswa secara massal',
    icon: Users,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600',

    accept: ['.csv', '.xlsx'],

    systemCols: [
        { key: 'full_name', label: 'Nama', synonyms: ['nama', 'name', 'nama lengkap', 'full name', 'student name', 'siswa', 'nama siswa'], required: true },
        { key: 'class_name', label: 'Kelas', synonyms: ['kelas', 'class', 'class_name', 'rombel', 'rombongan belajar'], required: true },
        { key: 'gender', label: 'Gender', synonyms: ['gender', 'jk', 'jenis kelamin', 'kelamin', 'sex', 'l/p'] },
        { key: 'nis', label: 'NIS', synonyms: ['nis', 'nomor induk siswa', 'no induk'] },
        { key: 'nik', label: 'NIK', synonyms: ['nik', 'nomor induk kependudukan', 'no ktp'] },
        { key: 'phone', label: 'No. HP / WA', synonyms: ['phone', 'no_hp', 'hp', 'whatsapp', 'wa', 'telp', 'telepon', 'phone number', 'wali_phone', 'no. whatsapp', 'no whatsapp', 'no. hp / wa', 'no. hp', 'whatsapp number'] },
        { key: 'birth_place', label: 'Tempat Lahir', synonyms: ['tempat lahir', 'birth_place', 'birthplace', 'tmp_lahir'] },
        { key: 'birth_date', label: 'Tanggal Lahir', synonyms: ['tanggal lahir', 'birth_date', 'tgl_lahir', 'tgl lahir'] },
        { key: 'religion', label: 'Agama', synonyms: ['agama', 'religion'] },
        { key: 'address', label: 'Alamat', synonyms: ['alamat', 'address', 'alamat lengkap'] },
        { key: 'father_name', label: 'Nama Ayah', synonyms: ['nama ayah', 'father_name', 'father name', 'nama bapak'] },
        { key: 'mother_name', label: 'Nama Ibu', synonyms: ['nama ibu', 'mother_name', 'mother name', 'nama mama'] },
        { key: 'guardian_name', label: 'Nama Wali', synonyms: ['guardian_name', 'nama_wali', 'wali', 'parent name', 'nama orang tua', 'nama wali', 'wali murid', 'nama ayah/ibu'] },
        { key: 'guardian_relation', label: 'Hubungan Wali', synonyms: ['hubungan wali', 'guardian_relation', 'relasi wali', 'status wali', 'hubungan'] },
    ],

    requiredKeys: ['full_name', 'class_name'],

    editableColumnTypes: {
        gender: { type: 'static', options: [{ id: 'L', name: 'Laki-laki' }, { id: 'P', name: 'Perempuan' }] },
        class_id: { type: 'searchable_fk', listKey: 'classesList', labelKey: 'name' },
    },

    bulkFixConfig: {
        field: 'class_id',
        fieldLabel: 'Kelas',
        message: 'Siswa dengan kelas tidak valid',
        options: [],
        labelKey: 'name',
    },

    templateColumns: [
        { l: 'A', k: 'Nama', n: 'Nama Lengkap', w: 'w-[20%]' },
        { l: 'B', k: 'Jenis Kelamin', n: 'L/P', w: 'w-[10%]' },
        { l: 'C', k: 'No. WhatsApp', n: 'Nomor HP', w: 'w-[15%]' },
        { l: 'D', k: 'Kelas', n: 'Nama Kelas', w: 'w-[15%]' },
        { l: 'E', k: 'NIS', n: 'NIS', w: 'w-[12%]' },
        { l: 'F', k: 'NISN', n: 'NISN', w: 'w-[12%]' },
        { l: 'G', k: 'NIK', n: 'NIK', w: 'w-[15%]' },
        { l: 'H', k: 'Tempat Lahir', n: 'Tempat Lahir', w: 'w-[12%]' },
        { l: 'I', k: 'Tanggal Lahir', n: 'Tgl Lahir', w: 'w-[12%]' },
        { l: 'J', k: 'Agama', n: 'Agama', w: 'w-[10%]' },
        { l: 'K', k: 'Alamat', n: 'Alamat Lengkap', w: 'w-[20%]' },
        { l: 'L', k: 'Nama Ayah', n: 'Nama Ayah', w: 'w-[15%]' },
        { l: 'M', k: 'Nama Ibu', n: 'Nama Ibu', w: 'w-[15%]' },
        { l: 'N', k: 'Nama Wali', n: 'Nama Wali', w: 'w-[15%]' },
        { l: 'O', k: 'Hubungan Wali', n: 'Hubungan', w: 'w-[12%]' },
    ],

    templateSampleRows: [
        { Nama: 'Ahmad Rizki', 'Jenis Kelamin': 'L', 'No. WhatsApp': '081234567890', Kelas: 'XII IPA 1', NIS: '2024001', NISN: '1234567890', NIK: '320101XXXXXXXXXX', 'Tempat Lahir': 'Jakarta', 'Tanggal Lahir': '2008-05-15', Agama: 'Islam', Alamat: 'Jl. Merdeka No. 123', 'Nama Ayah': 'Budi Rizki', 'Nama Ibu': 'Siti Maryam', 'Nama Wali': 'Budi Rizki', 'Hubungan Wali': 'Ayah' },
        { Nama: 'Siti Aminah', 'Jenis Kelamin': 'P', 'No. WhatsApp': '081234567891', Kelas: 'XI IPS 2', NIS: '2024002', NISN: '0987654321', NIK: '320101XXXXXXXXXY', 'Tempat Lahir': 'Bandung', 'Tanggal Lahir': '2009-02-20', Agama: 'Islam', Alamat: 'Jl. Kenanga No. 45', 'Nama Ayah': 'Mulyono', 'Nama Ibu': 'Aminah', 'Nama Wali': 'Aminah', 'Hubungan Wali': 'Ibu' },
    ],

    templateFileName: 'Template Import Siswa.xlsx',
    templateSheetName: 'Template Import',
    templateColWidths: [
        { wch: 25 }, { wch: 12 }, { wch: 18 }, { wch: 15 },
        { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 15 },
        { wch: 15 }, { wch: 12 }, { wch: 30 }, { wch: 20 },
        { wch: 20 }, { wch: 20 }, { wch: 15 },
    ],

    referenceData: null,
    referenceLabel: 'Daftar Kelas Valid',
    referenceIcon: Buildings,

    columns: [
        { key: 'full_name', label: 'Nama Lengkap' },
        { key: 'class_name', label: 'Kelas' },
        { key: 'gender', label: 'L/P' },
        { key: 'phone', label: 'No. WA' },
        { key: 'nis', label: 'NIS' },
        { key: 'nik', label: 'NIK' },
        { key: 'birth_place', label: 'Tempat Lahir' },
        { key: 'birth_date', label: 'Tgl Lahir' },
        { key: 'religion', label: 'Agama' },
        { key: 'address', label: 'Alamat' },
        { key: 'father_name', label: 'Ayah' },
        { key: 'mother_name', label: 'Ibu' },
        { key: 'guardian_name', label: 'Wali' },
        { key: 'guardian_relation', label: 'Hubungan' },
    ],

    getDisplayValue: (value, colKey) => {
        if (colKey === 'gender') return value === 'L' ? 'L' : value === 'P' ? 'P' : value
        return value
    },
}