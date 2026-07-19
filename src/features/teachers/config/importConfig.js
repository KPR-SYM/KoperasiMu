import { UserCheck, Building2, Mail, Phone, Calendar, MapPin, IdCard, Briefcase, BookOpen, GraduationCap, Clock, User, Shield } from 'lucide-react'

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
        { key: 'nbm', label: 'NBM', synonyms: ['nbm', 'nomor baku muhammadiyah', 'no. btm', 'btm'] },
        { key: 'subject', label: 'Mata Pelajaran', synonyms: ['mapel', 'mata pelajaran', 'subject', 'bidang studi'] },
        { key: 'gender', label: 'Jenis Kelamin', synonyms: ['gender', 'jk', 'jenis kelamin', 'kelamin', 'sex', 'l/p', 'jenis kelamin (l/p)'] },
        { key: 'phone', label: 'No. WhatsApp', synonyms: ['wa', 'no. hp/wa', 'phone', 'whatsapp', 'no hp', 'no telp'] },
        { key: 'email', label: 'Email', synonyms: ['email', 'surel', 'e-mail'] },
        { key: 'status', label: 'Status', synonyms: ['status', 'aktif', 'status aktif', 'status (active/inactive/cuti)'] },
        { key: 'type', label: 'Jenis Pegawai', synonyms: ['jenis', 'type', 'jenis pegawai', 'tipe', 'peran', 'jenis pegawai (guru/karyawan)'] },
        { key: 'nik', label: 'NIK', synonyms: ['nik', 'nomor induk kependudukan', 'no ktp', 'ktp'] },
        { key: 'nip', label: 'NIP', synonyms: ['nip', 'nomor induk pegawai'] },
        { key: 'nuptk', label: 'NUPTK', synonyms: ['nuptk'] },
        { key: 'birth_place', label: 'Tempat Lahir', synonyms: ['tempat lahir', 'birth_place', 'birthplace', 'tmp lahir'] },
        { key: 'birth_date', label: 'Tanggal Lahir', synonyms: ['tanggal lahir', 'birth_date', 'tgl lahir', 'tanggal_lahir', 'tanggal lahir (yyyy-mm-dd)'] },
        { key: 'address', label: 'Alamat', synonyms: ['alamat', 'address', 'alamat tinggal'] },
        { key: 'employment_status', label: 'Status Kepegawaian', synonyms: ['status kepegawaian', 'status pegawai', 'kepegawaian', 'status kerja'] },
        { key: 'teaching_hours', label: 'Jam Mengajar', synonyms: ['jam mengajar', 'teaching_hours', 'jam', 'teaching hours'] },
        { key: 'last_education', label: 'Pendidikan Terakhir', synonyms: ['pendidikan terakhir', 'pendidikan', 'last_education', 'last education', 'pendidikan_terakhir'] },
        { key: 'major', label: 'Jurusan', synonyms: ['jurusan', 'major', 'program studi', 'prodi'] },
        { key: 'graduation_year', label: 'Tahun Lulus', synonyms: ['tahun lulus', 'graduation_year', 'tahun_lulus', 'lulus tahun'] },
    ],

    requiredKeys: ['name'],

    editableColumnTypes: {
        gender: { type: 'static', options: [{ id: 'L', name: 'Laki-laki' }, { id: 'P', name: 'Perempuan' }] },
        status: { type: 'static', options: [{ id: 'active', name: 'Aktif' }, { id: 'inactive', name: 'Non-Aktif' }, { id: 'leave', name: 'Cuti' }] },
        type: { type: 'static', options: [{ id: 'guru', name: 'Guru' }, { id: 'karyawan', name: 'Karyawan' }] },
    },

    templateColumns: [
        { l: 'A', k: 'Nama Lengkap', n: 'Nama', w: 'w-[25%]' },
        { l: 'B', k: 'NBM', n: 'NBM', w: 'w-[12%]' },
        { l: 'C', k: 'Mata Pelajaran', n: 'Mapel', w: 'w-[18%]' },
        { l: 'D', k: 'Jenis Kelamin', n: 'L/P', w: 'w-[8%]' },
        { l: 'E', k: 'No. WhatsApp', n: 'WA', w: 'w-[15%]' },
        { l: 'F', k: 'Email', n: 'Email', w: 'w-[18%]' },
        { l: 'G', k: 'Status', n: 'Status', w: 'w-[10%]' },
        { l: 'H', k: 'Jenis Pegawai', n: 'Jenis', w: 'w-[10%]' },
        { l: 'I', k: 'NIK', n: 'NIK', w: 'w-[18%]' },
        { l: 'J', k: 'NIP', n: 'NIP', w: 'w-[15%]' },
        { l: 'K', k: 'NUPTK', n: 'NUPTK', w: 'w-[15%]' },
        { l: 'L', k: 'Tempat Lahir', n: 'Tempat', w: 'w-[12%]' },
        { l: 'M', k: 'Tanggal Lahir', n: 'Tgl Lahir', w: 'w-[12%]' },
        { l: 'N', k: 'Alamat', n: 'Alamat', w: 'w-[25%]' },
        { l: 'O', k: 'Status Kepegawaian', n: 'Status Peg.', w: 'w-[12%]' },
        { l: 'P', k: 'Jam Mengajar', n: 'Jam', w: 'w-[8%]' },
        { l: 'Q', k: 'Pendidikan Terakhir', n: 'Pendidikan', w: 'w-[18%]' },
        { l: 'R', k: 'Jurusan', n: 'Jurusan', w: 'w-[18%]' },
        { l: 'S', k: 'Tahun Lulus', n: 'Th Lulus', w: 'w-[10%]' },
    ],

    templateSampleRows: [
        { 'Nama Lengkap': 'Budi Santoso', NBM: 'NBM001', 'Mata Pelajaran': 'Matematika', 'Jenis Kelamin': 'L', 'No. WhatsApp': '081234567890', Email: 'budi@sekolah.sch.id', Status: 'active', 'Jenis Pegawai': 'guru', NIK: '320101XXXXXXXXXX', NIP: '198001012005011001', NUPTK: '1234567890123456', 'Tempat Lahir': 'Jakarta', 'Tanggal Lahir': '1980-01-01', Alamat: 'Jl. Merdeka No. 10', 'Status Kepegawaian': 'PNS', 'Jam Mengajar': '24', 'Pendidikan Terakhir': 'S1', Jurusan: 'Pendidikan Matematika', 'Tahun Lulus': '2003' },
        { 'Nama Lengkap': 'Siti Rahayu', NBM: 'NBM002', 'Mata Pelajaran': 'Bahasa Indonesia', 'Jenis Kelamin': 'P', 'No. WhatsApp': '081234567891', Email: 'siti@sekolah.sch.id', Status: 'active', 'Jenis Pegawai': 'guru', NIK: '320101XXXXXXXXXY', NIP: '198502022010012002', NUPTK: '1234567890123457', 'Tempat Lahir': 'Bandung', 'Tanggal Lahir': '1985-02-02', Alamat: 'Jl. Kenanga No. 20', 'Status Kepegawaian': 'GTT', 'Jam Mengajar': '20', 'Pendidikan Terakhir': 'S1', Jurusan: 'Pendidikan Bahasa Indonesia', 'Tahun Lulus': '2008' },
    ],

    templateFileName: 'Template Import Guru.xlsx',
    templateSheetName: 'Template Import',
    templateColWidths: [
        { wch: 25 }, { wch: 12 }, { wch: 18 }, { wch: 8 },
        { wch: 15 }, { wch: 18 }, { wch: 10 }, { wch: 10 },
        { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
        { wch: 12 }, { wch: 25 }, { wch: 12 }, { wch: 8 },
        { wch: 18 }, { wch: 18 }, { wch: 10 },
    ],

    referenceData: null,
    referenceLabel: 'Data Referensi Guru',
    referenceIcon: UserCheck,

    columns: [
        { key: 'name', label: 'Nama Lengkap' },
        { key: 'nbm', label: 'NBM' },
        { key: 'subject', label: 'Mata Pelajaran' },
        { key: 'gender', label: 'L/P' },
        { key: 'phone', label: 'No. WA' },
        { key: 'email', label: 'Email' },
        { key: 'status', label: 'Status' },
        { key: 'type', label: 'Jenis' },
        { key: 'nik', label: 'NIK' },
        { key: 'nip', label: 'NIP' },
        { key: 'nuptk', label: 'NUPTK' },
        { key: 'birth_place', label: 'Tempat Lahir' },
        { key: 'birth_date', label: 'Tgl Lahir' },
        { key: 'address', label: 'Alamat' },
        { key: 'employment_status', label: 'Status Peg.' },
        { key: 'teaching_hours', label: 'Jam' },
        { key: 'last_education', label: 'Pendidikan' },
        { key: 'major', label: 'Jurusan' },
        { key: 'graduation_year', label: 'Th Lulus' },
    ],

    getDisplayValue: (value, colKey) => {
        if (colKey === 'gender') return value === 'L' ? 'L' : value === 'P' ? 'P' : value
        if (colKey === 'status') return value === 'active' ? 'Aktif' : value === 'inactive' ? 'Non-Aktif' : value === 'leave' ? 'Cuti' : value
        if (colKey === 'type') return value === 'guru' ? 'Guru' : value === 'karyawan' ? 'Karyawan' : value
        return value
    },
}