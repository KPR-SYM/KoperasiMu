import { useState, useEffect, useRef } from 'react'

export function useCountUp(target, duration = 1000, loading = false) {
    const [count, setCount] = useState(0)
    const rafRef = useRef(null)

    useEffect(() => {
        if (loading) {
            setCount(0)
            return
        }

        const targetValue = parseFloat(target)
        if (isNaN(targetValue)) {
            setCount(target)
            return
        }

        let start = 0
        const end = targetValue
        if (start === end) {
            setCount(end)
            return
        }

        let startTimestamp = null
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp
            const progress = Math.min((timestamp - startTimestamp) / duration, 1)
            
            const easing = 1 - Math.pow(2, -10 * progress)
            const current = Math.floor(easing * (end - start) + start)
            
            setCount(current)
            if (progress < 1) {
                rafRef.current = window.requestAnimationFrame(step)
            } else {
                setCount(end)
            }
        }
        rafRef.current = window.requestAnimationFrame(step)
        return () => cancelAnimationFrame(rafRef.current)
    }, [target, duration, loading])

    return count
}
    }, [target, duration, loading])

    return count
}
