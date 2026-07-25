import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { flushSync } from 'react-dom'

const ThemeContext = createContext({})

const STORAGE_KEY = 'koperasimu_theme'

function getSystemDark() {
    try { return window.matchMedia('(prefers-color-scheme: dark)').matches }
    catch { return false }
}

function getInitialMode() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved === 'dark' || saved === 'light') return saved
        if (saved === 'system') return 'system'
    } catch { /* ignore */ }
    return 'system'
}

export function ThemeProvider({ children }) {
    const [themeMode, setThemeModeRaw] = useState(getInitialMode)
    const [isDark, setIsDark] = useState(() => {
        const mode = getInitialMode()
        return mode === 'dark' || (mode === 'system' && getSystemDark())
    })

    // Listen for system theme changes when in system mode
    useEffect(() => {
        if (themeMode !== 'system') return
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = (e) => setIsDark(e.matches)
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [themeMode])

    // Sync dark class + localStorage
    useEffect(() => {
        const root = document.documentElement
        if (isDark) {
            root.classList.add('dark')
        } else {
            root.classList.remove('dark')
        }
        try {
            localStorage.setItem(STORAGE_KEY, themeMode)
        } catch { /* ignore */ }
    }, [isDark, themeMode])

    const setThemeMode = useCallback((mode) => {
        if (!document.startViewTransition) {
            setThemeModeRaw(mode)
            if (mode === 'dark') setIsDark(true)
            else if (mode === 'light') setIsDark(false)
            else setIsDark(getSystemDark())
            return
        }
        document.startViewTransition(() => {
            flushSync(() => {
                setThemeModeRaw(mode)
                if (mode === 'dark') setIsDark(true)
                else if (mode === 'light') setIsDark(false)
                else setIsDark(getSystemDark())
            })
        })
    }, [])

    const toggleTheme = useCallback(() => {
        setThemeMode(isDark ? 'light' : 'dark')
    }, [isDark, setThemeMode])

    const value = useMemo(() => ({ isDark, toggleTheme, themeMode, setThemeMode }), [isDark, toggleTheme, themeMode, setThemeMode])

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider')
    }
    return context
}
