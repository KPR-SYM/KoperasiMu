import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { supabase } from '@lib/supabase'

const VIRTUAL_THRESHOLD = 50
const ITEM_HEIGHT = 40
const BUFFER = 5

export function useLazyTeachers(isOpen) {
    const [teachers, setTeachers] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const fetchedRef = useRef(false)

    const fetchTeachers = useCallback(async () => {
        if (fetchedRef.current) return
        setLoading(true)
        setError(null)
        try {
            const { data, error: fetchError } = await supabase
                .from('teachers')
                .select('id, name')
                .order('name')
            if (fetchError) throw fetchError
            setTeachers(data || [])
            fetchedRef.current = true
        } catch (err) {
            setError(err.message)
            setTeachers([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (isOpen && !fetchedRef.current) {
            fetchTeachers()
        }
    }, [isOpen, fetchTeachers])

    const refetch = useCallback(() => {
        fetchedRef.current = false
        fetchTeachers()
    }, [fetchTeachers])

    return { teachers, loading, error, refetch }
}

export function useVirtualizedList(items, containerRef, { itemHeight = ITEM_HEIGHT, buffer = BUFFER } = {}) {
    const [scrollTop, setScrollTop] = useState(0)
    const [containerHeight, setContainerHeight] = useState(0)
    const isVirtualized = items.length > VIRTUAL_THRESHOLD

    useEffect(() => {
        const container = containerRef?.current
        if (!container || !isVirtualized) return

        const handleScroll = () => setScrollTop(container.scrollTop)
        const handleResize = () => setContainerHeight(container.clientHeight)

        container.addEventListener('scroll', handleScroll, { passive: true })
        const resizeObserver = new ResizeObserver(handleResize)
        resizeObserver.observe(container)

        handleResize()

        return () => {
            container.removeEventListener('scroll', handleScroll)
            resizeObserver.disconnect()
        }
    }, [containerRef, isVirtualized])

    const virtualizedItems = useMemo(() => {
        if (!isVirtualized) return { items, startIndex: 0, endIndex: items.length, totalHeight: 0, offsetY: 0 }

        const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer)
        const visibleCount = Math.ceil(containerHeight / itemHeight)
        const endIndex = Math.min(items.length, startIndex + visibleCount + buffer * 2)
        const totalHeight = items.length * itemHeight
        const offsetY = startIndex * itemHeight

        return {
            items: items.slice(startIndex, endIndex),
            startIndex,
            endIndex,
            totalHeight,
            offsetY,
        }
    }, [items, scrollTop, containerHeight, itemHeight, buffer, isVirtualized])

    return {
        ...virtualizedItems,
        isVirtualized,
        itemHeight,
    }
}

export function useSearchFilter(items, query, keys = ['name']) {
    return useMemo(() => {
        if (!query || !query.trim()) return items
        const q = query.toLowerCase().trim()
        return items.filter(item =>
            keys.some(key => {
                const val = item[key]
                return val && String(val).toLowerCase().includes(q)
            })
        )
    }, [items, query, keys])
}
