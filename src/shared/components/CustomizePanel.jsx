import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Sun, Moon, Monitor, Rows, SquaresFour, ArrowClockwise, Palette } from '@phosphor-icons/react'
import { useTheme, useLanguage } from '@context'
import { useCustomize } from '@context/Customize'

const COLOR_PRESETS = [
    { id: 'blue', label: 'Blue', color: 'bg-blue-500', ring: 'ring-blue-500/30' },
    { id: 'emerald', label: 'Emerald', color: 'bg-emerald-500', ring: 'ring-emerald-500/30' },
    { id: 'violet', label: 'Violet', color: 'bg-violet-500', ring: 'ring-violet-500/30' },
    { id: 'rose', label: 'Rose', color: 'bg-rose-500', ring: 'ring-rose-500/30' },
    { id: 'orange', label: 'Orange', color: 'bg-orange-500', ring: 'ring-orange-500/30' },
    { id: 'slate', label: 'Slate', color: 'bg-slate-500', ring: 'ring-slate-500/30' },
]

const DENSITY_OPTIONS = [
    { id: 'compact', label: 'Compact', icon: Rows, desc: 'Lebih rapat' },
    { id: 'comfortable', label: 'Comfortable', icon: Rows, desc: 'Default' },
    { id: 'spacious', label: 'Spacious', icon: Rows, desc: 'Lebih longgar' },
]

const CONTAINER_OPTIONS = [
    { id: 'fluid', label: 'Fluid', icon: SquaresFour, desc: 'Full width' },
    { id: 'boxed', label: 'Boxed', icon: SquaresFour, desc: 'Max width' },
]

function Section({ title, children }) {
    return (
        <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[var(--color-text)]">{title}</h3>
            {children}
        </div>
    )
}

function OptionGrid({ children, cols = 3 }) {
    return (
        <div className={`grid grid-cols-${cols} gap-2`}>
            {children}
        </div>
    )
}

function OptionButton({ active, onClick, children, className = '' }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all
                ${active
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]/30 text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
            type="button"
        >
            {children}
            {className && <span className="text-[10px] font-semibold">{className}</span>}
        </button>
    )
}

export default function CustomizePanel({ isOpen, onClose }) {
    const { isDark, toggleTheme, themeMode, setThemeMode } = useTheme()
    const { language, setLanguage, t } = useLanguage()
    const { colorPreset, density, container, setColorPreset, setDensity, setContainer, resetDefaults } = useCustomize()

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex justify-end animate-in fade-in duration-200">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div className="relative w-full max-w-sm bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
                    <div>
                        <h2 className="text-sm font-bold text-[var(--color-text)]">Customize</h2>
                        <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Personalize your dashboard experience.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] transition"
                        type="button"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

                    {/* Theme */}
                    <Section title="Theme">
                        <OptionGrid cols={3}>
                            <OptionButton active={!isDark} onClick={() => setThemeMode && setThemeMode('light')}>
                                <Sun className="w-4 h-4" />
                                <span className="text-[10px] font-semibold">Light</span>
                            </OptionButton>
                            <OptionButton active={isDark} onClick={() => setThemeMode && setThemeMode('dark')}>
                                <Moon className="w-4 h-4" />
                                <span className="text-[10px] font-semibold">Dark</span>
                            </OptionButton>
                            <OptionButton active={false} onClick={() => {
                                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                                if (setThemeMode) setThemeMode(prefersDark ? 'dark' : 'light')
                            }}>
                                <Monitor className="w-4 h-4" />
                                <span className="text-[10px] font-semibold">System</span>
                            </OptionButton>
                        </OptionGrid>
                    </Section>

                    {/* Color */}
                    <Section title="Color">
                        <OptionGrid cols={3}>
                            {COLOR_PRESETS.map(preset => (
                                <OptionButton key={preset.id} active={colorPreset === preset.id} onClick={() => setColorPreset(preset.id)}>
                                    <div className={`w-6 h-6 rounded-full ${preset.color} ${colorPreset === preset.id ? `ring-2 ${preset.ring}` : ''}`} />
                                    <span className="text-[10px] font-semibold">{preset.label}</span>
                                </OptionButton>
                            ))}
                        </OptionGrid>
                    </Section>

                    {/* Density */}
                    <Section title="Density">
                        <OptionGrid cols={3}>
                            {DENSITY_OPTIONS.map(opt => (
                                <OptionButton key={opt.id} active={density === opt.id} onClick={() => setDensity(opt.id)}>
                                    <opt.icon className="w-4 h-4" />
                                    <span className="text-[10px] font-semibold">{opt.label}</span>
                                </OptionButton>
                            ))}
                        </OptionGrid>
                    </Section>

                    {/* Container */}
                    <Section title="Container">
                        <OptionGrid cols={2}>
                            {CONTAINER_OPTIONS.map(opt => (
                                <OptionButton key={opt.id} active={container === opt.id} onClick={() => setContainer(opt.id)}>
                                    <opt.icon className="w-4 h-4" />
                                    <span className="text-[10px] font-semibold">{opt.label}</span>
                                </OptionButton>
                            ))}
                        </OptionGrid>
                    </Section>

                    {/* Language */}
                    <Section title="Language">
                        <OptionGrid cols={2}>
                            <OptionButton active={language === 'id'} onClick={() => setLanguage('id')}>
                                <span className="text-sm">🇮🇩</span>
                                <span className="text-[10px] font-semibold">Indonesia</span>
                            </OptionButton>
                            <OptionButton active={language === 'en'} onClick={() => setLanguage('en')}>
                                <span className="text-sm">🇬🇧</span>
                                <span className="text-[10px] font-semibold">English</span>
                            </OptionButton>
                        </OptionGrid>
                    </Section>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-[var(--color-border)]">
                    <button
                        onClick={resetDefaults}
                        className="w-full h-9 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] text-[10px] font-semibold hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] transition flex items-center justify-center gap-1.5"
                        type="button"
                    >
                        <ArrowClockwise className="w-3 h-3" />
                        Reset to Defaults
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
