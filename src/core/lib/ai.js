import { supabase } from '@lib/supabase';

/**
 * Main function to call AI — sekarang lewat Supabase Edge Function,
 * API key Groq gak pernah nyentuh browser.
 */
export async function askAi(prompt, type = "chat", history = []) {
    let cleanHistory = history.filter(h => h.role === 'user' || h.role === 'assistant');
    while (cleanHistory.length > 0 && cleanHistory[0].role !== 'user') {
        cleanHistory.shift();
    }

    try {
        const { data, error } = await supabase.functions.invoke('ai-chat', {
            body: { prompt, type, history: cleanHistory },
        });

        if (error) {
            return `Gagal terhubung ke AI: ${error.message}`;
        }

        return data?.reply || "AI tidak memberikan respon.";
    } catch (err) {
        return "Gagal terhubung ke AI. Cek koneksi internet!";
    }
}