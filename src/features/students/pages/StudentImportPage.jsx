import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CaretLeft, UploadSimple } from '@phosphor-icons/react'
import useLanguage from '@shared/hooks/useLanguage'

export default function StudentImportPage() {
    const navigate = useNavigate()
    const { tNav } = useLanguage()
    const [file, setFile] = useState(null)

    return (
        <div className="flex flex-col min-h-screen bg-[var(--color-surface)]">
            <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="h-7 px-2 rounded-lg border border-[var(--color-border)] flex items-center gap-1 text-[10px] font-black">
                    <CaretLeft className="w-3 h-3" /> <span>{tNav({ label: 'Siswa' })}</span>
                </button>
                <h1 className="text-sm font-black uppercase tracking-widest">Import Siswa</h1>
            </div>
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto">
                        <UploadSimple className="w-8 h-8 text-[var(--color-primary)]" />
                    </div>
                    <h2 className="text-lg font-black uppercase tracking-widest">Upload File</h2>
                    <p className="text-xs text-[var(--color-text-muted)]">Format: .xlsx atau .csv</p>
                    <input
                        type="file"
                        accept=".xlsx,.csv"
                        onChange={(e) => setFile(e.target.files?.[0])}
                        className="w-full text-sm"
                    />
                </div>
            </div>
        </div>
    )
}
