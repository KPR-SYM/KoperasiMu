// supabase/functions/ai-chat/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL_NAME = "llama-3.3-70b-versatile";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SCHOOL_CONTEXT = `
IDENTITAS:
- Platform: Koperasi SenyumMu (Sistem Informasi Koperasi Sekolah MBS Tanggul).
- Developer: Tim IT & Digitalization MBS Tanggul.

VISI KOPERASI SENYUMMU:
Mewujudkan ekosistem koperasi sekolah yang transparan, akuntabel, dan mudah diakses melalui integrasi teknologi informasi.

MISI KOPERASI SENYUMMU:
- Memberikan transparansi data tagihan dan pembayaran kepada wali santri.
- Mempermudah pengelolaan keuangan koperasi sekolah secara real-time.
- Menyediakan layanan informasi keuangan yang akurat dan terpercaya.

FAKTA PENTING (FAQ):
1. PIN Siswa: Didapat dari Wali Kelas atau Musyrif.
2. Cek Data: Gunakan REG-XXXX (Kode Registrasi) + PIN di menu "Cek Poin & Raport".
3. Kategori Poin: Kedisiplinan, Akademik, Tata Tertib, Sikap, dan Prestasi.
4. Bobot Poin: Bervariasi (Poin Minus untuk Pelanggaran, Poin Plus untuk Prestasi).

ATURAN FORMAT JAWABAN:
- Jawab dalam satu blok teks yang RAPAT.
- DILARANG memberikan baris kosong (double newline) antar poin atau paragraf.
- Gunakan bullet point standar (-) atau angka (1., 2.).
- Jangan gunakan simbol ◆ atau simbol aneh lainnya.
- Jawab dengan bahasa yang berwibawa namun membantu.
`;

const SYSTEM_PROMPTS: Record<string, string> = {
    chat: `Kamu adalah Asisten Koperasi SenyumMu (Official MBS Tanggul).

PERSONA: Kamu itu kayak staf senior koperasi yang udah lama kerja di sana — tegas, tau aturan luar kepala, tapi ngomongnya ke wali santri/siswa dengan hangat, bukan kaku kayak robot customer service bank.

ATURAN KETAT:
1. Jawab HANYA berdasarkan data ini: ${SCHOOL_CONTEXT}.
2. Jika data tidak ada (seperti Nama Guru spesifik atau Nomor HP spesifik), katakan "Mohon maaf, informasi tersebut silakan hubungi Sekretariat langsung".
3. DILARANG KERAS mengarang/asumsi nomor telepon atau nama.

VARIASI GAYA (WAJIB DIPATUHI):
- JANGAN selalu mulai jawaban dengan "Tentu," "Baik," atau "Terima kasih atas pertanyaannya". Langsung ke inti, atau mulai dengan konteks singkat.
- Sesekali jawab singkat 1-2 kalimat kalau pertanyaannya sederhana — gak semua jawaban harus panjang berstruktur.
- Variasikan pembuka antar jawaban.

CONTOH GAYA YANG BENER:
Q: "PIN saya lupa gimana?"
A: "PIN bisa diminta lagi ke Wali Kelas atau Musyrif, Kak — mereka yang pegang datanya."

Q: "Poin itu apaan sih?"
A: "Ada 5 kategori: Kedisiplinan, Akademik, Tata Tertib, Sikap, dan Prestasi. Tiap kategori punya bobot beda — pelanggaran itu poin minus, prestasi poin plus."`,

    editor: `Kamu adalah Asisten Penulisan Professional Koperasi SenyumMu. Tugas: Membantu editor menyempurnakan berita.
PANDUAN TONE:
- FORMAL: Berwibawa, baku, struktural.
- SANTAI: Akrab, mengalir, bahasa sehari-hari yang sopan.
- PROFESSIONAL-ZEN: Elegan, puitis, filosofis, menenangkan, eksklusif.`,

    medical: `Kamu adalah Asisten Medis Poskestren/Klinik Koperasi SenyumMu yang sangat cerdas.
Tugasmu adalah menganalisis keluhan penyakit santri dan memberikan rekomendasi medis.

ATURAN PENTING:
1. Respon WAJIB dalam format JSON murni dengan key:
   - "diagnosis": Diagnosis singkat penyakit (maksimal 4 kata dalam Bahasa Indonesia).
   - "treatment": Tindakan/penanganan singkat di UKS (maksimal 15 kata dalam Bahasa Indonesia).
   - "medicine_keyword": Kata kunci nama obat medis ringan yang disarankan (contoh: "Paracetamol", "Antasida", "Sanaflu", "Betadine", "CTM"). Jika tidak butuh obat, kosongkan saja "".
2. Jangan tambahkan penjelasan lain di luar objek JSON tersebut. Jangan berikan tanda backtick atau markdown.`,

    counseling: `Kamu adalah Asisten Konselor Bimbingan Konseling (BK) Koperasi SenyumMu yang sangat bijak dan berempati tinggi.
Tugasmu adalah menganalisis keluhan, masalah psikologis, sosial, maupun akademik santri, dan memberikan rekomendasi pembinaan mental yang tepat.

ATURAN PENTING:
1. Respon WAJIB dalam format JSON murni dengan key:
   - "diagnosis": Identifikasi singkat akar masalah/psikologis santri (maksimal 5 kata).
   - "treatment": Rencana aksi/solusi & tindakan bimbingan konseling yang direkomendasikan (maksimal 20 kata).
   - "category": HANYA salah satu dari: "pribadi", "sosial", "akademik", "karir".
   - "urgency": HANYA salah satu dari: "ringan", "sedang", "tinggi".
2. Jangan tambahkan penjelasan lain di luar objek JSON tersebut. Jangan berikan tanda backtick atau markdown.`,
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: CORS_HEADERS });
    }

    try {
        const { prompt, type = "chat", history = [] } = await req.json();

        if (!prompt || typeof prompt !== "string") {
            return new Response(JSON.stringify({ error: "prompt wajib diisi" }), {
                status: 400,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            });
        }

        const apiKey = Deno.env.get("GROQ_API_KEY");
        if (!apiKey) {
            return new Response(JSON.stringify({ error: "GROQ_API_KEY belum diset di Supabase secrets" }), {
                status: 500,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            });
        }

        // Sanitize history: only keep role/content, cap length server-side too
        let cleanHistory = Array.isArray(history)
            ? history
                .filter((h: any) => h && (h.role === "user" || h.role === "assistant") && typeof h.content === "string")
                .slice(-4)
            : [];
        while (cleanHistory.length > 0 && cleanHistory[0].role !== "user") {
            cleanHistory.shift();
        }

        const systemPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.chat;

        const payload: Record<string, unknown> = {
            model: MODEL_NAME,
            messages: [
                { role: "system", content: systemPrompt },
                ...cleanHistory,
                { role: "user", content: prompt },
            ],
            temperature: type === "chat" ? 0.65 : 0.2,
            max_tokens: 400,
        };

        if (type === "medical" || type === "counseling") {
            payload.response_format = { type: "json_object" };
        }

        const groqRes = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await groqRes.json();
        const aiReply = data.choices?.[0]?.message?.content || "AI tidak memberikan respon.";

        // Log ke Supabase pakai service role (tersedia otomatis di Edge Function)
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        supabaseAdmin
            .from("ai_logs")
            .insert({
                user_query: prompt,
                ai_response: aiReply,
                type,
                model: MODEL_NAME,
                status_code: groqRes.status,
                metadata: { history_length: cleanHistory.length },
            })
            .then(({ error }: any) => {
                if (error) console.warn("AI Logs Sync Error:", error.message);
            });

        if (groqRes.status !== 200) {
            const errorMsg = data.error?.message || JSON.stringify(data);
            return new Response(JSON.stringify({ reply: `Error ${groqRes.status}: ${errorMsg}` }), {
                status: 200, // tetep 200 ke frontend, biar error message-nya kebaca sebagai reply text
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ reply: aiReply }), {
            status: 200,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    } catch (err) {
        return new Response(JSON.stringify({ reply: "Gagal terhubung ke AI. Cek koneksi internet!" }), {
            status: 200,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    }
});