import { memo, useState, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'

const EditableCell = memo(function EditableCell({
    rowIdx,
    colKey,
    value,
    preview,
    config,
    onEdit,
    onClose,
    isEditing,
    getDisplayValue,
}) {
    const [searchTerm, setSearchTerm] = useState('')
    const cellRef = useRef(null)
    const [coords, setCoords] = useState(null)

    const colConfig = config?.editableColumnTypes?.[colKey]

    useLayoutEffect(() => {
        if (isEditing && cellRef.current) {
            const rect = cellRef.current.getBoundingClientRect()
            setCoords({
                anchorTop: rect.top,
                left: rect.left,
                width: rect.width,
            })
        } else {
            setCoords(null)
        }
    }, [isEditing])

    const renderDropdown = (content) => {
        if (!coords) return null
        return createPortal(
            <div
                className="fixed z-[9999]"
                style={{
                    bottom: window.innerHeight - coords.anchorTop + 8,
                    left: coords.left,
                    minWidth: coords.width,
                }}
            >
                {content}
            </div>,
            document.body
        )
    }

    if (isEditing && colConfig?.type === 'searchable_fk') {
        const listKey = colConfig.listKey
        const list = config?.[listKey] || []
        const labelKey = colConfig.labelKey || 'name'
        const filtered = list.filter(item =>
            String(item[labelKey] || '').toLowerCase().includes(searchTerm.toLowerCase())
        )

        return renderDropdown(
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1 min-w-[200px] max-h-64 overflow-y-auto">
                <div className="p-1 mb-1">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari..."
                        className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-700"
                        autoFocus
                    />
                </div>
                {filtered.map(item => (
                    <div
                        key={item.id}
                        onClick={() => {
                            onEdit(item.id)
                            onClose()
                        }}
                        className="px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                        {item[labelKey]}
                    </div>
                ))}
            </div>
        )
    }

    if (isEditing && colConfig?.type === 'static' && colConfig.options) {
        return renderDropdown(
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1 min-w-[160px]">
                {colConfig.options.map(opt => (
                    <div
                        key={opt.id}
                        onClick={() => {
                            onEdit(opt.id)
                            onClose()
                        }}
                        className="px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                        {opt.name || opt.label}
                    </div>
                ))}
            </div>
        )
    }

    const display = getDisplayValue ? getDisplayValue(value, colKey) : value

    return (
        <td className="relative">
            <div
                ref={cellRef}
                className={`px-2 py-1 cursor-pointer transition-colors ${isEditing ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                onClick={() => onEdit ? onEdit() : null}
            >
                {display !== undefined && display !== null && display !== '' ? (
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        {typeof display === 'object' ? (display.name || display.label || display.id) : String(display)}
                    </span>
                ) : (
                    <span className="text-sm text-gray-400 italic">—</span>
                )}
            </div>
            {isEditing && colConfig?.type === 'text' && renderDropdown(
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1 min-w-[150px]">
                    <input
                        type="text"
                        autoFocus
                        defaultValue={value || ''}
                        onBlur={(e) => {
                            onEdit(e.target.value)
                            onClose()
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onEdit(e.target.value)
                                onClose()
                            }
                            if (e.key === 'Escape') onClose()
                        }}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            )}
        </td>
    )
})

EditableCell.displayName = 'EditableCell'

export default EditableCell