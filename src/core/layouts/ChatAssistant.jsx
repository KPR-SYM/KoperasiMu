import { useState, useRef, useEffect } from 'react'
import { Robot, CheckCircle, CaretDown, TelegramLogo, Shield, UserCheck, X, Lightning, ArrowClockwise, Money } from '@phosphor-icons/react'

import { askAi } from '@lib/ai'

const STORAGE_KEY = 'chatAssistant:history'

const DEFAULT_GREETING = 'Halo Kak! 😊 Saya **Asisten**. Ada yang ingin ditanyakan seputar aturan sekolah atau fitur aplikasi?'

// Role-aware quick action chips. Falls back to a generic set if role is unknown.
const CHIPS_BY_ROLE = {
    parent: [
        { icon: Money, label: 'Cek Tagihan' },
        { icon: UserCheck, label: 'Info Wali Kelas' },
        { icon: Shield, label: 'Aturan Sekolah' },
    ],
    staff: [
        { icon: Lightning, label: 'Cek Stok Koperasi' },
        { icon: CheckCircle, label: 'Fitur API' },
        { icon: Shield, label: 'Aturan Sekolah' },
    ],
    teacher: [
        { icon: UserCheck, label: 'Daftar Guru' },
        { icon: Lightning, label: 'Cek Poin' },
        { icon: Shield, label: 'Aturan Sekolah' },
    ],
    default: [
        { icon: Lightning, label: 'Cek Poin' },
        { icon: UserCheck, label: 'Daftar Guru' },
        { icon: Shield, label: 'Aturan Sekolah' },
        { icon: CheckCircle, label: 'Fitur API' },
    ],
}

// Minimal HTML escape so raw AI output can never inject markup/scripts
// before our own markdown-lite formatting runs on top of it.
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

function loadHistory() {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
        return null
    } catch {
        return null
    }
}

function saveHistory(messages) {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch {
        // sessionStorage unavailable (private mode, quota, etc) — fail silently
    }
}

export default function ChatAssistant({ isOpen: controlledIsOpen, onOpenChange, currentUser }) {
    const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false)
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : uncontrolledIsOpen

    const setIsOpen = (val) => {
        if (onOpenChange) {
            onOpenChange(val)
        } else {
            setUncontrolledIsOpen(val)
        }
    }

    const [showInvite, setShowInvite] = useState(false)
    const [messages, setMessages] = useState(() => loadHistory() || [
        { role: 'assistant', content: DEFAULT_GREETING }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState(null)
    const [hasUnread, setHasUnread] = useState(false)
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)
    const lastUserMsgRef = useRef(null)

    const chips = CHIPS_BY_ROLE[currentUser?.role] || CHIPS_BY_ROLE.default

    // Auto-Invite handle
    useEffect(() => {
        const timer = setTimeout(() => { if (!isOpen) setShowInvite(true) }, 12000)
        return () => clearTimeout(timer)
    }, [isOpen])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, isOpen])

    // Persist history whenever it changes
    useEffect(() => {
        saveHistory(messages)
    }, [messages])

    // Auto-focus input when panel opens
    useEffect(() => {
        if (isOpen) {
            setHasUnread(false)
            const t = setTimeout(() => inputRef.current?.focus(), 100)
            return () => clearTimeout(t)
        }
    }, [isOpen])

    const renderContent = (text) => {
        if (!text) return ""
        // Escape first so any HTML/script content in the raw text can never execute,
        // then apply our own controlled markdown-lite formatting on top.
        let cleanText = escapeHtml(text.replace(/\n\s*\n/g, '\n').trim())

        let formatted = cleanText
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-indigo-600 dark:text-indigo-400">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="italic opacity-80">$1</em>')
            // Expert Listing — support bullets & numbers
            .replace(/^\d+\.\s+(.*)/gm, '<div class="flex gap-2 ml-1 my-0.5"><span class="font-bold text-indigo-500">$&</span></div>')
            .replace(/^\s*[-•]\s+(.*)/gm, '<div class="flex gap-2 ml-1 my-0.5"><span class="text-indigo-500 opacity-50">•</span> <span>$1</span></div>')
            .replace(/\n/g, '<br />')
        return <div className="prose-compact prose prose-sm max-w-none dark:prose-invert">{<div dangerouslySetInnerHTML={{ __html: formatted }} />}</div>
    }

    const sendMessage = async (userMsg) => {
        if (!userMsg.trim() || isLoading) return
        setErrorMsg(null)

        // Context memory (last 4 msgs)
        const history = messages
            .slice(-4)
            .map(m => ({ role: m.role, content: m.content }))

        lastUserMsgRef.current = userMsg
        setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setInput('')
        setIsLoading(true)
        setShowInvite(false)

        try {
            const botReply = await askAi(userMsg, "chat", history)
            setMessages(prev => [...prev, { role: 'assistant', content: botReply }])
            if (!isOpen) setHasUnread(true)
        } catch (err) {
            setErrorMsg('Gagal mendapat balasan. Coba lagi ya, Kak.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSend = (e) => {
        e.preventDefault()
        sendMessage(input.trim())
    }

    const handleChipClick = (label) => {
        sendMessage(label)
    }

    const handleRetry = () => {
        if (lastUserMsgRef.current) sendMessage(lastUserMsgRef.current)
    }

    if (!isOpen) {
        // If the chat assistant is controlled from the parent layout (e.g., TopBar button),
        // hide the floating FAB bubble to prevent blocking dashboard content.
        if (controlledIsOpen !== undefined) {
            return null
        }

        return (
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3 group">
                {showInvite && (
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-indigo-100 dark:border-white/5 animate-in slide-in-from-right-5 fade-in duration-500 max-w-[200px] relative">
                        <button onClick={() => setShowInvite(false)} className="absolute -top-2 -right-2 w-6 h-6 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-[10px] text-slate-400"><X className="w-3 h-3" /></button>
                        <p className="text-[11px] font-bold text-slate-800 dark:text-white leading-relaxed">Halo! 👋 Ada yang bisa <span className="text-indigo-600">Asisten</span> bantu?</p>
                    </div>
                )}
                <button onClick={() => setIsOpen(true)} className="relative px-6 h-14 bg-indigo-600 text-white shadow-lg rounded-full flex items-center gap-3 hover:scale-105 transition-all group overflow-hidden">
                    <div className="relative">
                        <Robot className="w-5 h-5" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                    </div>
                    <span className="font-bold tracking-tight text-sm">Tanya Aku!</span>
                    {hasUnread && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white" />
                    )}
                </button>
            </div>
        )
    }

    return (
        <div className="fixed bottom-6 right-6 w-[340px] max-w-[calc(100vw-3rem)] h-[480px] max-h-[80vh] bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden z-[100] animate-in zoom-in-95 duration-300 border-t-[3px] border-t-indigo-500">

            {/* Balanced Integrated Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-black/[0.02] dark:border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/10">
                        <Robot className="text-white w-4 h-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-[13.5px] font-bold text-slate-900 dark:text-white font-heading tracking-tight">Asisten</h3>
                            <CheckCircle className="w-3 h-3 text-blue-500" />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Online</span>
                        </div>
                    </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center text-slate-400 transition-colors">
                    <CaretDown className="w-4 h-4" />
                </button>
            </div>

            {/* Tight Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-300`}>
                        <div className={`max-w-[90%] px-4 py-2.5 text-[13px] leading-relaxed relative shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none' : 'bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-none border border-slate-100 dark:border-white/5'}`}>{renderContent(msg.content)}</div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-50 dark:bg-white/5 px-6 py-4 rounded-[1.8rem] rounded-tl-[0.4rem] border border-slate-100 dark:border-white/5">
                            <div className="flex gap-2">
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                            </div>
                        </div>
                    </div>
                )}
                {errorMsg && (
                    <div className="flex justify-start">
                        <div className="max-w-[90%] px-4 py-2.5 text-[12px] leading-relaxed rounded-2xl rounded-tl-none border border-rose-200 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400 flex items-center gap-2">
                            <span>{errorMsg}</span>
                            <button onClick={handleRetry} className="shrink-0 flex items-center gap-1 font-bold underline underline-offset-2 hover:text-rose-700">
                                <ArrowClockwise className="w-3 h-3" /> Coba Lagi
                            </button>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Slim Premium Footer */}
            <div className="px-4 pb-4 pt-3 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-white/5">

                {/* Slim Quick Actions - One Row Indented */}
                <div className="relative mb-4 group/chips">
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1">
                        {chips.map((q, idx) => (
                            <button
                                key={idx}
                                type="button"
                                disabled={isLoading}
                                onClick={() => handleChipClick(q.label)}
                                className="shrink-0 px-3 py-1 rounded-full bg-slate-100/80 dark:bg-white/5 border border-black/[0.03] dark:border-white/5 text-[10.5px] font-bold text-slate-500 dark:text-slate-300 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 snap-start shadow-sm"
                            >
                                <q.icon className="w-3 h-3 opacity-50" />
                                {q.label}
                            </button>
                        ))}
                        <div className="shrink-0 w-8 h-1" />
                    </div>
                    {/* Visual indicators for more chips */}
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-slate-950 to-transparent pointer-events-none" />
                </div>

                {/* WhatsApp Style Input - Compact */}
                <form onSubmit={handleSend} className="flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        disabled={isLoading}
                        placeholder="Ketik pesan..."
                        className="flex-1 h-10 px-4 rounded-full bg-slate-100/80 dark:bg-slate-900 border-none outline-none text-[13px] font-medium focus:ring-2 focus:ring-indigo-500/10 text-slate-900 dark:text-white disabled:opacity-60"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="w-10 h-10 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 transition-all flex items-center justify-center shrink-0"
                    >
                        <TelegramLogo className="w-4 h-4" />
                    </button>
                </form>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
                .prose-compact p { margin-top: 0.1em !important; margin-bottom: 0.1em !important; line-height: 1.4 !important; }
                .prose-compact ul, .prose-compact ol { margin-top: 0.2em !important; margin-bottom: 0.2em !important; }
                .prose-compact li { margin-top: 0 !important; margin-bottom: 0 !important; }
                .prose-compact br { content: ""; display: block; margin: 0.2em 0; }
            `}} />
        </div>
    )
}