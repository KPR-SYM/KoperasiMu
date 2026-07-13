import { Moon, Sun } from '@phosphor-icons/react'
import { useTheme } from '@core/context/Theme'

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="w-10 h-10 rounded-xl flex items-center justify-center
                 bg-gray-100 dark:bg-white/10
                 text-gray-500 dark:text-white/50
                 hover:bg-gray-200 dark:hover:bg-white/15
                 hover:text-gray-700 dark:hover:text-white
                 border border-gray-200 dark:border-white/10
                 transition-all duration-200"
      aria-label={isDark ? 'Mode Terang' : 'Mode Gelap'}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
