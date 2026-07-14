import { supabase } from '@lib/supabase'

// ─── Throttle sederhana ───────────────────────────────────────────────────
const THROTTLE_WINDOW_MS = 60_000 // 1 menit
const recentlyLogged = new Map()  // key -> timestamp terakhir kelog

function shouldThrottle(key) {
    const lastLogged = recentlyLogged.get(key)
    const now = Date.now()

    if (lastLogged && now - lastLogged < THROTTLE_WINDOW_MS) {
        return true // masih dalam window, skip
    }

    recentlyLogged.set(key, now)
    return false
}

// ─── Main logger ────────────────────────────────────────────────────────────

export async function logErrorToSupabase(error, errorInfo, errorId, options = {}) {
    const errorType = error?.constructor?.name ?? 'Error'
    const message = error?.message ?? 'Unknown error'
    const throttleKey = `${errorType}:${message}`

    if (shouldThrottle(throttleKey)) {
        if (import.meta.env.DEV) {
            console.info('[errorLogger] Throttled duplicate error:', throttleKey)
        }
        return
    }

    try {
        const { data: { user } } = await supabase.auth.getUser()

        const payload = {
            error_id: errorId,
            error_type: errorType,
            message,
            stack: error?.stack ?? null,
            component_stack: errorInfo?.componentStack ?? null,
            route: window.location.pathname,
            user_agent: navigator.userAgent,
            user_id: user?.id ?? null,
            retry_count: options.retryCount ?? 0,
            is_offline: !navigator.onLine,
        }

        const { error: insertError } = await supabase
            .from('error_logs')
            .insert(payload)

        if (insertError && import.meta.env.DEV) {
            console.error('[errorLogger] Gagal insert ke Supabase:', insertError)
        }
    } catch (loggingError) {
        // Jangan biarkan logging error justru bikin app crash lagi.
        // Cukup log ke console, jangan re-throw.
        if (import.meta.env.DEV) {
            console.error('[errorLogger] Unexpected failure while logging:', loggingError)
        }
    }
}