import { useCallback } from 'react'
import { useToast } from '@context/Toast'
import { logErrorToSupabase } from '@shared/utils/errorLogger'

const DEV_STYLES = {
    label: 'font-weight:bold;font-size:11px;color:#fff;background:#ef4444;padding:2px 8px;border-radius:4px',
    context: 'font-weight:600;color:#f97316',
    muted: 'color:#94a3b8;font-size:11px',
    dim: 'color:#64748b;font-size:10px',
    divider: 'color:#334155;font-size:10px',
}

export function useErrorHandler(component = 'Unknown') {
    const { addToast } = useToast()

    const handleError = useCallback((error, options = {}) => {
        const {
            toast = true,
            level = 'error',
            report = false,
            context: ctx,
        } = options

        const errorType = error?.constructor?.name ?? 'Error'
        const message = error?.message ?? 'Unknown error'
        const errorId = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

        if (import.meta.env.DEV) {
            console.groupCollapsed(
                `%c[${component}]%c ${errorType}: ${message}`,
                DEV_STYLES.label,
                'font-weight:bold'
            )
            console.error('Error   :', error)
            if (ctx) console.log('%cContext :%c %s', DEV_STYLES.context, '', ctx)
            console.log('%cError ID:%c %s', DEV_STYLES.dim, '', errorId)
            console.log('%cComponent:%c %s', DEV_STYLES.dim, '', component)
            if (error?.stack) {
                console.log('%cStack   :', DEV_STYLES.muted)
                console.log(error.stack.split('\n').slice(0, 6).join('\n'))
            }
            console.groupEnd()
        }

        if (toast) {
            const toastMsg = ctx || message || 'Terjadi kesalahan'
            addToast(toastMsg, level)
        }

        if (report) {
            logErrorToSupabase(error, null, errorId, {
                component,
                retryCount: options.retryCount ?? 0,
                ...(ctx ? { context: ctx } : {}),
            })
        }

        return { errorId, message, errorType }
    }, [addToast, component])

    return { handleError }
}
