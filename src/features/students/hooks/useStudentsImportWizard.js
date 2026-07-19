import { useImportWizard } from '@shared/components/ImportWizard'
import { studentsImportConfig } from '@features/students/config/importConfig'
import { useStudentsCore } from '@features/students/hooks/useStudentsCore'
import { useToast, useLanguage } from '@context'
import { supabase } from '@lib/supabase'
import { logAudit } from '@utils/auditLogger'
import { useErrorHandler } from '@hooks'

export function useStudentsImportWizard({
    students,
    classesList,
    fetchData,
    fetchStats,
    addToast,
    closeModal,
    importFileInputRef,
    generateCode,
}) {
    const { profile } = useStudentsCore()
    const { t } = useLanguage()
    const { handleError } = useErrorHandler('StudentsImportWizard')

    const config = {
        ...studentsImportConfig,
        referenceData: classesList,
        classesList,
    }

    const wizard = useImportWizard({
        ...config,
        addToast,
        onSuccess: () => {
            fetchData()
            fetchStats()
            closeModal?.()
        },
        dbTable: 'students',
        mapRowForInsert: (row) => {
            const { _className, _isDupe, _hasError, _hasWarn, ...cleanRow } = row
            return {
                ...cleanRow,
                registration_code: generateCode(),
                pin: String(Math.floor(1000 + Math.random() * 9000)),
            }
        },
        validateRow: (row, idx, ctx) => {
            const issues = []
            if (!row.full_name) issues.push({ level: 'error', message: 'Nama tidak boleh kosong' })
            if (!row.class_id) issues.push({ level: 'error', message: 'Kelas tidak valid atau tidak ditemukan' })
            if (row.phone && !/^(\+?62|08)\d{8,11}$/.test(row.phone)) {
                issues.push({ level: 'warn', message: 'Format No. HP mungkin salah (cek lagi jika ragu)' })
            }
            return issues
        },
        parseRow: (raw, getVal, { systemCols }) => {
            const sanitizeText = (s) => String(s ?? '').replace(/[<>]/g, '').trim()
            const pick = (obj, keys) => {
                for (const k of keys) {
                    const v = obj?.[k]
                    if (v !== undefined && v !== null && String(v).trim() !== '') return v
                }
                return ''
            }
            const normalizePhone = (raw) => {
                const v = String(raw ?? '').trim()
                if (!v) return ''
                const cleaned = v.replace(/[\s-]/g, '')
                const keepPlus = cleaned.startsWith('+') ? '+' : ''
                const digits = cleaned.replace(/[^\d]/g, '')
                return keepPlus ? `+${digits}` : digits
            }
            const normalizeDate = (raw) => {
                if (!raw) return null
                if (raw instanceof Date) return raw.toISOString().split('T')[0]
                const d = new Date(raw)
                if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
                return raw
            }

            const name = getVal('full_name')
            const className = getVal('class_name')
            const genderRaw = getVal('gender')
            const nis = getVal('nis')
            const nik = getVal('nik')
            const phone = normalizePhone(getVal('phone'))
            const birthPlace = getVal('birth_place')
            const birthDate = normalizeDate(getVal('birth_date'))
            const religion = getVal('religion')
            const address = getVal('address')
            const fatherName = getVal('father_name')
            const motherName = getVal('mother_name')
            const guardianName = getVal('guardian_name')
            const guardianRelation = getVal('guardian_relation')

            let gender = genderRaw
            if (genderRaw) {
                const l = genderRaw.toLowerCase()
                if (l.startsWith('l') || l === 'pria' || l === 'cowok' || l === 'laki') gender = 'L'
                else if (l.startsWith('p') || l === 'wanita' || l === 'cewek' || l === 'perempuan') gender = 'P'
                else gender = 'L'
            } else {
                gender = 'L'
            }

            const classObj = classesList?.find(c => c.name.toLowerCase() === (className || '').toLowerCase())

            return {
                full_name: name,
                gender,
                phone,
                nis: nis || null,
                nik: nik || null,
                birth_place: birthPlace || null,
                birth_date: birthDate || null,
                religion: religion || null,
                address: address || null,
                class_id: classObj?.id || '',
                guardian_name: guardianName || null,
                guardian_relation: guardianRelation || 'Ayah',
                photo_url: null,
                metadata: {
                    father: { name: fatherName || '' },
                    mother: { name: motherName || '' },
                    address_detail: { street: address || '' },
                },
                _className: className || '',
                _isDupe: false,
                _hasError: false,
                _hasWarn: false,
            }
        },
    })

    return {
        ...wizard,
        handleImportClick: wizard.handleImportClick,
    }
}