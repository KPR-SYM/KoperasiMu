import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'

const STORAGE_KEY = 'koperasimu_customize'

const DEFAULTS = {
    colorPreset: 'blue',
    density: 'comfortable',
    container: 'fluid',
}

function loadSettings() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
    } catch { /* ignore */ }
    return { ...DEFAULTS }
}

function saveSettings(settings) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)) }
    catch { /* ignore */ }
}

// ─── Density CSS (injected as <style> to override Tailwind utilities) ──────
const DENSITY_CSS = {
    compact: `
        body.density-compact .space-y-4 > * + * { margin-top: 0.625rem !important; }
        body.density-compact .space-y-5 > * + * { margin-top: 0.75rem !important; }
        body.density-compact .space-y-6 > * + * { margin-top: 0.75rem !important; }
        body.density-compact .gap-2 { gap: 0.5rem !important; }
        body.density-compact .gap-3 { gap: 0.5rem !important; }
        body.density-compact .gap-4 { gap: 0.625rem !important; }
        body.density-compact .gap-6 { gap: 0.75rem !important; }
        body.density-compact .p-4 { padding: 0.875rem !important; }
        body.density-compact .p-5 { padding: 0.875rem !important; }
        body.density-compact .p-6 { padding: 1rem !important; }
        body.density-compact .px-3 { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
        body.density-compact .px-4 { padding-left: 0.625rem !important; padding-right: 0.625rem !important; }
        body.density-compact .px-5 { padding-left: 0.75rem !important; padding-right: 0.75rem !important; }
        body.density-compact .px-6 { padding-left: 0.875rem !important; padding-right: 0.875rem !important; }
        body.density-compact .py-2 { padding-top: 0.375rem !important; padding-bottom: 0.375rem !important; }
        body.density-compact .py-3 { padding-top: 0.375rem !important; padding-bottom: 0.375rem !important; }
        body.density-compact .py-4 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
        body.density-compact .pt-4 { padding-top: 0.5rem !important; }
        body.density-compact .pb-4 { padding-bottom: 0.5rem !important; }
        body.density-compact .mb-2 { margin-bottom: 0.25rem !important; }
        body.density-compact .mb-3 { margin-bottom: 0.375rem !important; }
        body.density-compact .mb-4 { margin-bottom: 0.5rem !important; }
        body.density-compact .mb-5 { margin-bottom: 0.625rem !important; }
        body.density-compact .mb-6 { margin-bottom: 0.75rem !important; }
        body.density-compact .mt-4 { margin-top: 0.5rem !important; }
        body.density-compact .mt-6 { margin-top: 0.75rem !important; }
        body.density-compact .h-8 { height: 1.75rem !important; }
        body.density-compact .h-9 { height: 2rem !important; }
        body.density-compact .h-10 { height: 2.25rem !important; }
        body.density-compact .h-11 { height: 2.5rem !important; }
        body.density-compact .min-h-\[600px\] { min-height: 480px !important; }
    `,
    spacious: `
        body.density-spacious .space-y-3 > * + * { margin-top: 1rem !important; }
        body.density-spacious .space-y-4 > * + * { margin-top: 1.25rem !important; }
        body.density-spacious .space-y-5 > * + * { margin-top: 1.375rem !important; }
        body.density-spacious .space-y-6 > * + * { margin-top: 1.5rem !important; }
        body.density-spacious .gap-2 { gap: 0.75rem !important; }
        body.density-spacious .gap-3 { gap: 1rem !important; }
        body.density-spacious .gap-4 { gap: 1.25rem !important; }
        body.density-spacious .gap-6 { gap: 1.5rem !important; }
        body.density-spacious .p-4 { padding: 1.25rem !important; }
        body.density-spacious .p-5 { padding: 1.5rem !important; }
        body.density-spacious .p-6 { padding: 1.75rem !important; }
        body.density-spacious .px-3 { padding-left: 1rem !important; padding-right: 1rem !important; }
        body.density-spacious .px-4 { padding-left: 1.25rem !important; padding-right: 1.25rem !important; }
        body.density-spacious .px-5 { padding-left: 1.375rem !important; padding-right: 1.375rem !important; }
        body.density-spacious .px-6 { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
        body.density-spacious .py-2 { padding-top: 0.75rem !important; padding-bottom: 0.75rem !important; }
        body.density-spacious .py-3 { padding-top: 0.875rem !important; padding-bottom: 0.875rem !important; }
        body.density-spacious .py-4 { padding-top: 1rem !important; padding-bottom: 1rem !important; }
        body.density-spacious .pt-4 { padding-top: 1rem !important; }
        body.density-spacious .pb-4 { padding-bottom: 1rem !important; }
        body.density-spacious .mb-2 { margin-bottom: 0.75rem !important; }
        body.density-spacious .mb-3 { margin-bottom: 0.875rem !important; }
        body.density-spacious .mb-4 { margin-bottom: 1rem !important; }
        body.density-spacious .mb-5 { margin-bottom: 1.125rem !important; }
        body.density-spacious .mb-6 { margin-bottom: 1.25rem !important; }
        body.density-spacious .mt-4 { margin-top: 1rem !important; }
        body.density-spacious .mt-6 { margin-top: 1.25rem !important; }
        body.density-spacious .h-8 { height: 2.25rem !important; }
        body.density-spacious .h-9 { height: 2.5rem !important; }
        body.density-spacious .h-10 { height: 2.75rem !important; }
        body.density-spacious .h-11 { height: 3rem !important; }
        body.density-spacious .min-h-\[600px\] { min-height: 720px !important; }
    `,
    comfortable: '',
}

const CustomizeContext = createContext(null)

export function CustomizeProvider({ children }) {
    const [settings, setSettings] = useState(loadSettings)

    // Persist to localStorage
    useEffect(() => {
        saveSettings(settings)
    }, [settings])

    // Apply color preset to CSS variables
    useEffect(() => {
        const root = document.documentElement
        const presets = {
            blue:    { h: 217, s: 91 },
            emerald: { h: 160, s: 84 },
            violet:  { h: 262, s: 83 },
            rose:    { h: 346, s: 77 },
            orange:  { h: 24, s: 95 },
            slate:   { h: 215, s: 14 },
        }
        const p = presets[settings.colorPreset] || presets.blue
        root.style.setProperty('--color-primary', `hsl(${p.h}, ${p.s}%, 50%)`)
        root.style.setProperty('--color-primary-dark', `hsl(${p.h}, ${p.s}%, 42%)`)
    }, [settings.colorPreset])

    // Apply density: class on body + injected <style> tag
    useEffect(() => {
        const body = document.body
        body.classList.remove('density-compact', 'density-comfortable', 'density-spacious')
        body.classList.add(`density-${settings.density}`)

        // Inject/replace density <style> tag
        let styleEl = document.getElementById('density-styles')
        if (!styleEl) {
            styleEl = document.createElement('style')
            styleEl.id = 'density-styles'
            document.head.appendChild(styleEl)
        }
        styleEl.textContent = DENSITY_CSS[settings.density] || ''

        return () => {
            // Clean up on unmount
            const el = document.getElementById('density-styles')
            if (el) el.remove()
        }
    }, [settings.density])

    // Apply container mode
    useEffect(() => {
        const root = document.documentElement
        root.classList.remove('container-fluid', 'container-boxed')
        root.classList.add(`container-${settings.container}`)
    }, [settings.container])

    const setColorPreset = useCallback((colorPreset) => {
        setSettings(prev => ({ ...prev, colorPreset }))
    }, [])

    const setDensity = useCallback((density) => {
        setSettings(prev => ({ ...prev, density }))
    }, [])

    const setContainer = useCallback((container) => {
        setSettings(prev => ({ ...prev, container }))
    }, [])

    const resetDefaults = useCallback(() => {
        setSettings({ ...DEFAULTS })
    }, [])

    const value = useMemo(() => ({
        ...settings,
        setColorPreset,
        setDensity,
        setContainer,
        resetDefaults,
    }), [settings, setColorPreset, setDensity, setContainer, resetDefaults])

    return (
        <CustomizeContext.Provider value={value}>
            {children}
        </CustomizeContext.Provider>
    )
}

export function useCustomize() {
    const ctx = useContext(CustomizeContext)
    if (!ctx) throw new Error('useCustomize must be used within CustomizeProvider')
    return ctx
}
