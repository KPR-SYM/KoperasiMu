export function formatTeacherName(name) {
    return name || '—'
}

export function formatPhone(phone) {
    if (!phone) return '—'
    return phone.replace(/^0/, '62')
}
