export const LEVELS = ['7', '8', '9', '10', '11', '12']
export const PROGRAMS = ['Boarding', 'Reguler']
export const GENDERS = ['Putra', 'Putri']

export const LEVEL_OPTIONS = LEVELS.map(l => ({ id: l, name: `Kelas ${l}` }))

export const PROGRAM_ICONS = {
    Boarding: 'bed',
    Reguler: 'building',
}

export const GENDER_ICONS = {
    Putra: 'male',
    Putri: 'female',
}

export const getInitials = (name) => {
    if (!name) return '?'
    return name
        .split(/[\s-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase()
}

export const validateClassName = (name, existingNames = []) => {
    const trimmed = (name || '').trim()
    if (!trimmed) return { valid: false, error: 'Nama kelas wajib diisi' }
    if (trimmed.length < 2) return { valid: false, error: 'Minimal 2 karakter' }
    if (trimmed.length > 20) return { valid: false, error: 'Maksimal 20 karakter' }
    if (/\s{2,}/.test(trimmed)) return { valid: false, error: 'Tidak boleh ada spasi ganda' }
    if (existingNames.some(n => n.toLowerCase() === trimmed.toLowerCase())) {
        return { valid: false, error: 'Nama kelas sudah digunakan' }
    }
    return { valid: true, error: null }
}

export const validateForm = (form, hasTeachers, existingNames = []) => {
    const errors = {}
    const nameValidation = validateClassName(form.name, existingNames)
    if (!nameValidation.valid) errors.name = nameValidation.error
    if (!form.academic_year) errors.academic_year = 'Tahun akademik wajib dipilih'
    if (hasTeachers && !form.homeroom_teacher_id) errors.homeroom_teacher_id = 'Pilih wali kelas'
    return {
        valid: Object.keys(errors).length === 0,
        errors,
    }
}

export const calculateProgress = (form) => {
    const fields = ['name', 'homeroom_teacher_id', 'academic_year']
    const filled = fields.filter(f => form[f] && String(form[f]).trim()).length
    return Math.round((filled / fields.length) * 100)
}
