import { useState, useEffect } from 'react'
import { supabase } from '@lib/supabase'

export default function useAnnouncements(limit = 10) {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetch() {
      try {
        setLoading(true)
        setError(null)

        const { data, error: supabaseError } = await supabase
          .from('news')
          .select('id, title, body:excerpt, tag, type:tag, image_url, published_at:created_at')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (cancelled) return
        if (supabaseError) throw supabaseError

        const mapped = (data || []).map(item => ({
          ...item,
          type: mapTagToType(item.tag),
        }))

        setAnnouncements(mapped)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Gagal memuat pengumuman')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetch()

    return () => { cancelled = true }
  }, [limit])

  return { announcements, loading, error }
}

function mapTagToType(tag) {
  const lower = (tag || '').toLowerCase()
  if (lower.includes('penting') || lower.includes('urgent') || lower.includes('pengumuman')) return 'penting'
  if (lower.includes('event') || lower.includes('kegiatan') || lower.includes('acara')) return 'event'
  return 'info'
}
