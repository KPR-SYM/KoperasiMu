import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@lib/supabase'

export function useLazyPeriods(isOpen) {
    const [periods, setPeriods] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const fetchedRef = useRef(false)

    const fetchPeriods = useCallback(async () => {
        if (fetchedRef.current) return
        setLoading(true)
        setError(null)
        try {
            const { data, error: fetchError } = await supabase
                .from('periods')
                .select('id, academic_year, semester')
                .order('academic_year', { ascending: false })
            if (fetchError) throw fetchError
            const mapped = (data || []).map(y => ({
                ...y,
                label: [y.academic_year, y.semester].filter(Boolean).join(' ') || '—',
            }))
            setPeriods(mapped)
            fetchedRef.current = true
        } catch (err) {
            setError(err.message)
            setPeriods([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (isOpen && !fetchedRef.current) {
            fetchPeriods()
        }
    }, [isOpen, fetchPeriods])

    const refetch = useCallback(() => {
        fetchedRef.current = false
        fetchPeriods()
    }, [fetchPeriods])

    return { periods, loading, error, refetch }
}
