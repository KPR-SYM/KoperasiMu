import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@lib/supabase'
import { calculateProgress, validateForm, validateClassName } from '../config/classFormConfig'

const DEBOUNCE_MS = 400

function useDebounce(value, delay = DEBOUNCE_MS) {
    const [debounced, setDebounced] = useState(value)
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(t)
    }, [value, delay])
    return debounced
}

const INITIAL_FORM = {
    name: '',
    level: '7',
    program: 'Boarding',
    gender_type: 'Putra',
    homeroom_teacher_id: '',
    academic_year: '',
}

function buildForm(selectedItem, periodsList, teachersList) {
    if (selectedItem) {
        const teacherIds = teachersList.map(t => t.id)
        const validTeacherId = teacherIds.includes(selectedItem.homeroom_teacher_id)
            ? selectedItem.homeroom_teacher_id
            : ''
        return {
            name: selectedItem.name || '',
            level: selectedItem.grade_level?.toString() || '7',
            program: 'Reguler',
            gender_type: 'Putra',
            homeroom_teacher_id: validTeacherId,
            academic_year: selectedItem.academic_year || periodsList[0]?.academic_year || '',
        }
    }
    return { ...INITIAL_FORM, academic_year: periodsList[0]?.academic_year || '' }
}

async function fetchTeachersLazy() {
    try {
        const { data, error } = await supabase
            .from('teachers')
            .select('id, name')
            .order('name')
        if (error) throw error
        return data || []
    } catch {
        return []
    }
}

async function fetchPeriodsLazy() {
    try {
        const { data, error } = await supabase
            .from('periods')
            .select('id, academic_year, semester')
            .order('academic_year', { ascending: false })
        if (error) throw error
        return (data || []).map(y => ({
            ...y,
            label: [y.academic_year, y.semester].filter(Boolean).join(' ') || '—',
        }))
    } catch {
        return []
    }
}

export function useClassForm({ isOpen, selectedItem, onSubmit, teachersList: propsTeachers, periodsList: propsPeriods }) {
    const [teachers, setTeachers] = useState(propsTeachers || [])
    const [periods, setPeriods] = useState(propsPeriods || [])

    const [form, setForm] = useState(INITIAL_FORM)
    const [touched, setTouched] = useState({})
    const [attemptedSubmit, setAttemptedSubmit] = useState(false)
    const [fieldErrors, setFieldErrors] = useState({})
    const [formError, setFormError] = useState('')
    const [isDirty, setIsDirty] = useState(false)
    const [saveState, setSaveState] = useState('idle')
    const [sectionsOpen, setSectionsOpen] = useState({ identity: true, details: true })
    const [existingNames, setExistingNames] = useState([])
    const [nameStatus, setNameStatus] = useState('idle')

    const hasTeachers = useMemo(() => (teachers?.length || 0) > 0, [teachers])

    const debouncedName = useDebounce(form.name)

    // Lazy load data when modal opens
    useEffect(() => {
        if (!isOpen) return
        if (propsTeachers?.length && propsPeriods?.length) {
            setTeachers(propsTeachers)
            setPeriods(propsPeriods)
            return
        }
        let cancelled = false
        const load = async () => {
            const [t, p] = await Promise.all([fetchTeachersLazy(), fetchPeriodsLazy()])
            if (!cancelled) {
                setTeachers(t)
                setPeriods(p)
            }
        }
        load()
        return () => { cancelled = true }
    }, [isOpen])

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            const periodsToUse = propsPeriods?.length ? propsPeriods : periods
            const teachersToUse = propsTeachers?.length ? propsTeachers : teachers
            setForm(buildForm(selectedItem, periodsToUse, teachersToUse))
            setFormError('')
            setFieldErrors({})
            setTouched({})
            setAttemptedSubmit(false)
            setIsDirty(false)
            setSaveState('idle')
        }
    }, [isOpen, selectedItem])

    // Fetch existing class names for duplicate check
    useEffect(() => {
        if (!isOpen) return
        const fetchNames = async () => {
            try {
                const { data } = await supabase.from('classes').select('name')
                setExistingNames((data || []).map(d => d.name))
            } catch {
                setExistingNames([])
            }
        }
        fetchNames()
    }, [isOpen])

    // Real-time name validation
    const validateName = useCallback((name, names) => {
        if (!name || !name.trim()) {
            setNameStatus('idle')
            setFieldErrors(prev => { const n = { ...prev }; delete n.name; return n })
            return
        }
        setNameStatus('checking')
        const result = validateClassName(name, names)
        setNameStatus(result.valid ? 'valid' : 'invalid')
        setFieldErrors(prev => {
            const next = { ...prev }
            if (!result.valid) next.name = result.error
            else delete next.name
            return next
        })
    }, [])

    useEffect(() => {
        const t = setTimeout(() => validateName(debouncedName, existingNames), 100)
        return () => clearTimeout(t)
    }, [debouncedName, existingNames, validateName])

    const setField = useCallback((key, val) => {
        setForm(p => ({ ...p, [key]: val }))
        setIsDirty(true)
    }, [])

    const setFieldTouched = useCallback((field) => {
        setTouched(prev => ({ ...prev, [field]: true }))
    }, [])

    const toggleSection = useCallback((section) => {
        setSectionsOpen(prev => ({ ...prev, [section]: !prev[section] }))
    }, [])

    const progress = useMemo(() => calculateProgress(form), [form.name, form.homeroom_teacher_id, form.academic_year])

    const isValid = useMemo(() => {
        return validateForm(form, hasTeachers, existingNames).valid
    }, [form, hasTeachers, existingNames])

    const hasChanges = useMemo(() => {
        if (!selectedItem) return isDirty
        return isDirty && JSON.stringify(form) !== JSON.stringify({
            name: selectedItem.name || '',
            level: selectedItem.grade_level?.toString() || '7',
            program: 'Reguler',
            gender_type: 'Putra',
            homeroom_teacher_id: selectedItem.homeroom_teacher_id || '',
            academic_year: selectedItem.academic_year || '',
        })
    }, [form, selectedItem, isDirty])

    const handleSubmit = useCallback(async (e) => {
        e?.preventDefault()
        setAttemptedSubmit(true)

        const validation = validateForm(form, hasTeachers, existingNames)
        if (!validation.valid) {
            setFieldErrors(validation.errors)
            const firstError = Object.values(validation.errors)[0]
            setFormError(firstError || 'Mohon lengkapi semua field yang wajib diisi')
            return
        }

        setFormError('')
        setFieldErrors({})
        setSaveState('saving')

        const sanitized = {
            ...form,
            name: form.name.trim(),
            homeroom_teacher_id: form.homeroom_teacher_id || null,
            academic_year: form.academic_year || null,
        }

        const result = await onSubmit(sanitized)
        if (result?.error) {
            setFormError(result.message || 'Gagal menyimpan data kelas.')
            setSaveState('error')
            return false
        }

        setSaveState('saved')
        setIsDirty(false)
        return true
    }, [form, hasTeachers, existingNames, onSubmit])

    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
    const [pendingClose, setPendingClose] = useState(null)

    const handleDiscardConfirm = useCallback(() => {
        setShowDiscardConfirm(false)
        setForm(INITIAL_FORM)
        setFormError('')
        setFieldErrors({})
        setTouched({})
        setAttemptedSubmit(false)
        setIsDirty(false)
        setSaveState('idle')
        if (pendingClose) {
            pendingClose()
            setPendingClose(null)
        }
    }, [pendingClose])

    const handleDiscardCancel = useCallback(() => {
        setShowDiscardConfirm(false)
        setPendingClose(null)
    }, [])

    const handleClose = useCallback(() => {
        if (!hasChanges) {
            setForm(INITIAL_FORM)
            setFormError('')
            setFieldErrors({})
            setTouched({})
            setAttemptedSubmit(false)
            setIsDirty(false)
            setSaveState('idle')
            return true
        }
        setShowDiscardConfirm(true)
        return false
    }, [hasChanges])

    const handleCloseWithCallback = useCallback((onClose) => {
        if (!hasChanges) {
            setForm(INITIAL_FORM)
            setFormError('')
            setFieldErrors({})
            setTouched({})
            setAttemptedSubmit(false)
            setIsDirty(false)
            setSaveState('idle')
            onClose()
            return
        }
        setPendingClose(() => onClose)
        setShowDiscardConfirm(true)
    }, [hasChanges])

    return {
        form,
        setField,
        setFieldTouched,
        touched,
        attemptedSubmit,
        fieldErrors,
        formError,
        setFormError,
        isDirty,
        saveState,
        sectionsOpen,
        toggleSection,
        progress,
        isValid,
        hasChanges,
        hasTeachers,
        nameStatus,
        handleSubmit,
        handleClose,
        handleCloseWithCallback,
        showDiscardConfirm,
        handleDiscardConfirm,
        handleDiscardCancel,
    }
}
