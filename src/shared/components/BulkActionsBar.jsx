import { useState, useEffect, useRef, memo } from 'react'
import { createPortal } from 'react-dom'
import { X, CaretUp, CaretDown, CaretLeft } from '@phosphor-icons/react'
import { useLanguage } from '@context'

const BulkActionsPreview = memo(({
  selectedItems,
  removingItemId,
  setRemovingItemId,
  onRemoveItem,
  maxPreview = 10,
}) => {
  const [activeIdx, setActiveIdx] = useState(0)
  const scrollRef = useRef(null)
  const removeTimeoutRef = useRef(null)

  useEffect(() => {
    return () => clearTimeout(removeTimeoutRef.current)
  }, [])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const count = selectedItems.length
    if (count <= 1) return
    const cardWidth = el.scrollWidth / count
    const idx = Math.round(el.scrollLeft / cardWidth)
    const nextIdx = Math.min(idx, count - 1)
    if (nextIdx !== activeIdx) setActiveIdx(nextIdx)
  }

  const itemsToShow = selectedItems.slice(0, maxPreview)

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold">
            {selectedItems.length}
          </span>
          Terpilih
        </span>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar snap-x snap-mandatory -mx-3 px-3"
      >
        {itemsToShow.map((item) => {
          const isRemoving = removingItemId === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setRemovingItemId(item.id)
                removeTimeoutRef.current = setTimeout(() => {
                  onRemoveItem(item.id)
                  setRemovingItemId(null)
                }, 250)
              }}
              className={`flex-shrink-0 flex flex-col items-start gap-2 p-3 rounded-xl border transition-all duration-300 w-[180px] max-w-[220px] shadow-sm text-left group relative snap-center ${item.statusColor || 'bg-white/5 border-white/10'
                } ${isRemoving ? 'opacity-0 scale-95 blur-md translate-y-2' : 'hover:border-white/30 hover:bg-white/10 active:scale-[0.98]'}`}
            >
              <div className="flex items-center gap-2.5 w-full transition-all duration-300 group-hover:opacity-70 relative">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black overflow-hidden shrink-0 transition-transform duration-300 group-hover:rotate-3 ${item.statusIconBg || 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                  }`}>
                  {item.avatar ? (
                    <img src={item.avatar} alt="" className="w-full h-full object-cover rounded-md" />
                  ) : (
                    item.statusIcon || item.label?.charAt(0) || '?'
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-white truncate leading-tight">{item.label}</p>
                  {item.meta && (
                    <p className="text-[8px] truncate font-medium uppercase tracking-wider mt-0.5 text-white/50 flex items-center gap-1">
                      {item.meta}
                    </p>
                  )}
                </div>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setRemovingItemId(item.id)
                    removeTimeoutRef.current = setTimeout(() => {
                      onRemoveItem(item.id)
                      setRemovingItemId(null)
                    }, 250)
                  }}
                  className="w-6 h-6 rounded-full bg-red-500/90 text-white flex items-center justify-center shadow-lg shadow-red-500/40 scale-90 group-hover:scale-100 transition-transform duration-200"
                  aria-label="Hapus dari seleksi"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            </button>
          )
        })}
        {selectedItems.length > maxPreview && (
          <div className="flex-shrink-0 w-[180px] flex items-center justify-center">
            <div className="w-full h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[9px] font-bold text-white/50 border-dashed">
              +{selectedItems.length - maxPreview}
            </div>
          </div>
        )}
      </div>
      {selectedItems.length > 1 && (
        <div className="flex justify-center gap-1.5 -mt-1">
          {itemsToShow.slice(0, 8).map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${activeIdx === i
                ? 'w-5 h-1.5 bg-white/70'
                : 'w-1.5 h-1.5 bg-white/20'
                }`}
            />
          ))}
          {itemsToShow.length > 8 && (
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
          )}
        </div>
      )}
    </div>
  )
})

BulkActionsPreview.displayName = 'BulkActionsPreview'

export default function BulkActionsBar({
  selectedCount,
  onClear,
  title = 'Terpilih',
  subtitle = 'Aksi massal',
  children,
  // Preview props
  selectedItems = [],
  showPreview = true,
  onRemoveItem,
  // Action props
  primaryAction,
  secondaryActions = [],
  // Undo
  onUndo,
  // Layout
  position = 'bottom', // 'bottom' | 'top'
  maxPreviewItems = 10,
}) {
  const { dir } = useLanguage()
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [removingItemId, setRemovingItemId] = useState(null)
  const [compact, setCompact] = useState(false)
  const actionsRef = useRef(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const el = actionsRef.current
    if (!el) return
    const check = () => setCompact(el.scrollWidth > el.clientWidth)
    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [secondaryActions, primaryAction])

  if (selectedCount <= 0) return null

  const hasPreview = showPreview && selectedItems.length > 0
  const hasPrimary = !!primaryAction
  const hasSecondary = secondaryActions.length > 0

  const bottomPos = isMobile
    ? 'max(80px, calc(12px + env(safe-area-inset-bottom)))'
    : '16px'

  const allActions = [...secondaryActions, primaryAction].filter(Boolean)
  const actionCount = allActions.length

  return createPortal(
    <div
      className={`fixed -translate-x-1/2 z-[250] w-[95%] max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${position === 'top' ? 'top-16' : 'bottom-0'
        }`}
      style={{
        left: isMobile
          ? '50%'
          : dir === 'rtl'
            ? 'calc(50vw - (var(--sidebar-width, 0px) / 2))'
            : 'calc(50vw + (var(--sidebar-width, 0px) / 2))',
        bottom: position === 'top' ? 'auto' : bottomPos,
        top: position === 'top' ? bottomPos : 'auto',
      }}
    >
      <div className="relative">
        <div className="relative bg-[#0f172a]/95 backdrop-blur-3xl border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden text-white">
          {/* Animated scanline */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />

          {/* Main Bar */}
          <div className="px-3 py-2 flex items-center gap-3">
            {/* Count Indicator */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)] flex items-center justify-center font-black text-xs shadow-lg shadow-[var(--color-primary)]/30 shrink-0">
                {selectedCount}
              </div>
              <div className="hidden sm:block">
                <p className="text-[8px] font-black uppercase tracking-widest opacity-60 leading-none">{title}</p>
                <p className="text-[10px] font-bold leading-none mt-0.5">{subtitle}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-7 bg-white/10 mx-1 hidden sm:block shrink-0" />

            {/* Actions Area */}
            <div ref={actionsRef} className="flex items-center gap-1.5 flex-1 justify-center overflow-hidden">
              {secondaryActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  title={compact ? action.title || action.label : action.title}
                  className={`h-8 ${compact ? 'w-8 px-0 justify-center' : 'px-3'} rounded-lg text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1 whitespace-nowrap ${action.variant === 'destructive'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                    : action.variant === 'primary'
                      ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/30'
                      : 'bg-white/5 text-white/80 border border-white/10 hover:bg-white/10'
                    } ${action.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  {action.icon && <span className="w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">{action.icon}</span>}
                  <span className={compact ? 'hidden' : ''}>{action.label}</span>
                </button>
              ))}
              {hasPrimary && (
                <button
                  onClick={primaryAction.onClick}
                  disabled={primaryAction.disabled || primaryAction.loading}
                  title={compact ? primaryAction.title || primaryAction.label : primaryAction.title}
                  className={`h-8 ${compact ? 'w-8 px-0 justify-center' : 'px-4'} rounded-lg text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap shadow-lg ${primaryAction.variant === 'destructive'
                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/40'
                    : 'bg-[var(--color-primary)] text-white hover:brightness-110 shadow-[var(--color-primary)]/40'
                    } ${primaryAction.disabled || primaryAction.loading ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {primaryAction.loading ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
                  ) : (
                    <>
                      {primaryAction.icon && <span className="w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">{primaryAction.icon}</span>}
                      <span className={compact ? 'hidden' : ''}>{primaryAction.label}</span>
                    </>
                  )}
                </button>
              )}
              {!hasPrimary && !hasSecondary && children && (
                <div className="flex items-center gap-1.5">{children}</div>
              )}
            </div>


            {/* Right Controls Group: Preview Toggle + Close */}
            <div className="flex items-center gap-1 shrink-0">
              {hasPreview && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all flex items-center justify-center shrink-0"
                  title={isExpanded ? 'Sembunyikan preview' : 'Tampilkan item terpilih'}
                >
                  {isExpanded ? <CaretUp className="w-4 h-4" /> : <CaretDown className="w-4 h-4" />}
                </button>
              )}

              {/* Divider */}
              <div className="w-px h-7 bg-white/10 mx-1 hidden sm:block shrink-0" />

              <button
                onClick={onClear}
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all flex items-center justify-center active:scale-90"
                title={dir === 'rtl' ? 'إلغاء وإغلاق' : 'Batal & Tutup'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Expandable Preview Panel */}
          {hasPreview && isExpanded && (
            <div className="border-t border-white/10 bg-white/5 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <BulkActionsPreview
                selectedItems={selectedItems}
                removingItemId={removingItemId}
                setRemovingItemId={setRemovingItemId}
                onRemoveItem={onRemoveItem}
                maxPreview={maxPreviewItems}
              />
              {onUndo && (
                <div className="border-t border-white/10 px-3 py-2.5 flex items-center justify-between">
                  <span className="text-[9px] font-medium text-white/60">Tekan Escape atau klik Batal untuk membatalkan seleksi</span>
                  <button
                    onClick={onUndo}
                    className="text-[9px] font-black text-[var(--color-primary)] hover:underline flex items-center gap-1"
                  >
                    <CaretLeft className="w-3.5 h-3.5" />
                    Urungkan
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}