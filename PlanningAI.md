# ChatAssistant Redesign Planning

## Status: PLANNING

## Current State Analysis

### File: `src/core/layouts/ChatAssistant.jsx` (314 lines)

**Current Implementation:**
- Floating FAB button (indigo solid, Robot icon)
- Chat panel: header + messages + quick chips + input
- Basic indigo/slate color scheme
- Simple markdown rendering (bold, italic, lists)
- Role-based quick action chips (parent, staff, teacher, default)
- Message persistence (sessionStorage)
- Auto-scroll, auto-focus, auto-invite after 12s

**Problems Identified:**
1. **Header terlalu plain** — hanya icon + nama + online status
2. **Messages area monotone** — semua bubble sama, tidak ada varian
3. **Quick chips membosankan** — generic, tidak kontekstual
4. **Input area basic** — hanya input + send button
5. **Tidak ada feature discovery** — user tidak tahu fitur apa yang tersedia
6. **Tidak ada page context awareness** — assistant tidak tahu user di halaman apa
7. **Tidak ada typing indicator yang menarik** — hanya 3 dot bounce
8. **Tidak ada message actions** — copy, share, thumbs up/down
9. **Tidak ada suggested questions** — user harus tau mau tanya apa
10. **Tidak ada visual hierarchy** — semua pesan sama pentingnya

---

## Redesign Goals

1. **Enterprise-level UI** — seperti Intercom, Drift, atau Freshdesk
2. **Context-aware** — tahu user di halaman apa, bisa kasih saran relevan
3. **Feature discovery** — bantu user explore fitur aplikasi
4. **Visual richness** — gradient, shadow, animation yang sophisticated
5. **Interaction depth** — message actions, reactions, quick replies
6. **Performance** — virtual scrolling untuk chat panjang

---

## Proposed Changes

### 1. Header Redesign
**Current:**
```
[Robot] Asisten ✓
● Online
```

**Proposed:**
```
[Avatar] Asisten AI ✓          [Minimize] [Close]
         Online • Siap bantu
─────────────────────────────
Context: Tahun Akademik
```

- Gradient header (indigo → purple)
- Context badge showing current page
- Minimize + Close buttons (bukan CaretDown doang)
- Subtitle: "Online • Siap bantu"

### 2. Welcome Message Redesign
**Current:**
```
Halo Kak! 😊 Saya Asisten. Ada yang ingin ditanyakan seputar aturan sekolah atau fitur aplikasi?
```

**Proposed:**
```
┌─────────────────────────────────┐
│  👋 Halo, Muhammad!             │
│                                 │
│  Saya Asisten AI KoperasiMu.   │
│  Saya bisa bantu kamu dengan:  │
│                                 │
│  📊 Cek data & statistik       │
│  🔍 Cari informasi             │
│  📝 Input & edit data          │
│  ❓ Tanya aturan aplikasi      │
│                                 │
│  [Mulai Bertanya]              │
└─────────────────────────────────┘
```

- Personalized greeting (nama user)
- Feature preview cards
- CTA button

### 3. Quick Actions Redesign
**Current:**
```
[Cek Poin] [Daftar Guru] [Aturan Sekolah] [Fitur API]
```

**Proposed:**
```
┌─────────────────────────────────────────┐
│  💡 Pertanyaan Populer                  │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │ 📊 Lihat │  │ 📅 Cek   │            │
│  │ Statistik│  │ Jadwal   │            │
│  └──────────┘  └──────────┘            │
│  ┌──────────┐  ┌──────────┐            │
│  │ 💰 Cek   │  │ 📋 Lihat │            │
│  │ Tagihan  │  │ Nilai    │            │
│  └──────────┘  └──────────┘            │
│                                         │
│  Atau ketik pertanyaan Anda...          │
└─────────────────────────────────────────┘
```

- Grid layout (2x2)
- Icon + label yang lebih informatif
- Section header "Pertanyaan Populer"

### 4. Message Bubble Redesign
**Current:**
```
User: [Blue bubble]
Bot:  [Gray bubble]
```

**Proposed:**
```
User: [Gradient bubble indigo→purple, rounded-tr-none]
Bot:  [Card-like bubble dengan shadow, avatar, timestamp]

      [Bot Avatar] Asisten AI
      ┌─────────────────────┐
      │ Jawaban di sini...  │
      │                     │
      │ ┌─────┐ ┌─────┐   │
      │ │ 👍  │ │ 👎  │   │
      │ └─────┘ └─────┘   │
      │ [Salin] [Bagikan]  │
      └─────────────────────┘
```

- Bot avatar di samping bubble
- Timestamp di bawah bubble
- Message actions: like/dislike, copy, share
- Card-like appearance dengan shadow

### 5. Typing Indicator Redesign
**Current:**
```
[• • •] (3 dot bounce)
```

**Proposed:**
```
┌─────────────────────┐
│ Asisten sedang      │
│ mengetik...         │
│ ○ ○ ○ (animated)   │
└─────────────────────┘
```

- Card-like container
- "Asisten sedang mengetik..." text
- Animated dots dengan gradient

### 6. Input Area Redesign
**Current:**
```
[Ketik pesan...] [Send]
```

**Proposed:**
```
┌─────────────────────────────────────┐
│ 📎  Ketik pesan Anda...     🎤  ➤  │
│                                     │
│ 💡 Ketik "/" untuk command cepat    │
└─────────────────────────────────────┘
```

- Attach file button (ikon paperclip)
- Voice input button (ikon microphone)
- Command hint: "Ketik / untuk command cepat"
- Send button dengan gradient

### 7. Context-Aware Features
**New Feature:**
```
┌─────────────────────────────────────┐
│ 📍 Kamu sedang di: Tahun Akademik  │
│                                     │
│ Mau tahu tentang halaman ini?      │
│ [Apa itu Tahun Akademik?]          │
│ [Cara tambah periode baru]         │
│ [Status periode saat ini]          │
└─────────────────────────────────────┘
```

- Auto-detect current page
- Show relevant quick questions
- Page-specific help

### 8. Suggested Questions
**New Feature:**
```
┌─────────────────────────────────────┐
│ 💡 Pertanyaan yang mungkin ingin    │
│ kamu tanyakan:                      │
│                                     │
│ 1. Bagaimana cara tambah siswa?     │
│ 2. Kenapa tagihan saya 0?          │
│ 3. Kapan jadwal ujian?             │
└─────────────────────────────────────┘
```

- AI-generated suggestions based on context
- Clickable questions
- Update setiap 5 detik

### 9. Message Actions
**New Feature:**
```
┌─────────────────────┐
│ Jawaban di sini...  │
│                     │
│ 👍 👎 📋 📤 ⋮      │
└─────────────────────┘
```

- Thumbs up/down (feedback ke AI)
- Copy to clipboard
- Share message
- More options (⋮)

### 10. Quick Command System
**New Feature:**
```
Ketik "/" di input:

/cek [nama]       — Cek data
/statistik        — Lihat statistik
/bantuan          — Lihat bantuan
/tagihan          — Cek tagihan
/jadwal           — Lihat jadwal
```

- Slash commands
- Autocomplete dropdown
- Command descriptions

---

## Implementation Plan

### Phase 1: Core UI (Priority: High)
1. Redesign header dengan gradient + context badge
2. Redesign welcome message dengan feature cards
3. Redesign quick actions menjadi grid layout
4. Tambah bot avatar di setiap bot message

### Phase 2: Interactions (Priority: High)
5. Tambah message actions (copy, like/dislike)
6. Redesign typing indicator
7. Tambah timestamp di setiap message
8. Tambah context-aware quick questions

### Phase 3: Advanced Features (Priority: Medium)
9. Implement slash commands
10. Tambah suggested questions (AI-generated)
11. Tambah file attachment button
12. Tambah voice input button

### Phase 4: Polish (Priority: Low)
13. Tambah animations (message appear, hover effects)
14. Tambah dark mode support yang lebih baik
15. Performance optimization (virtual scrolling)
16. Accessibility improvements

---

## File Changes

### Files to Modify:
1. `src/core/layouts/ChatAssistant.jsx` — Main component (314 → ~600 lines)

### New Files:
1. `src/core/layouts/chat/ChatHeader.jsx` — Header component
2. `src/core/layouts/chat/ChatMessage.jsx` — Message bubble component
3. `src/core/layouts/chat/ChatInput.jsx` — Input area component
4. `src/core/layouts/chat/QuickActions.jsx` — Quick action chips
5. `src/core/layouts/chat/ContextPanel.jsx` — Context-aware suggestions
6. `src/core/layouts/chat/SlashCommands.jsx` — Command system

---

## Success Criteria

1. ✅ Header menampilkan context (halaman saat ini)
2. ✅ Welcome message personalized & informatif
3. ✅ Quick actions grid (bukan horizontal scroll)
4. ✅ Bot messages ada avatar & timestamp
5. ✅ Message actions (copy, like/dislike)
6. ✅ Context-aware suggestions muncul otomatis
7. ✅ Slash commands bisa digunakan
8. ✅ UI terlihat enterprise-level (Intercom/Drift-like)

---

## Notes

- **Color scheme:** Indigo → Purple gradient untuk header, indigo untuk user bubble, gray untuk bot bubble
- **Typography:** Font heading untuk nama, font body untuk pesan
- **Spacing:** Lebih lega, tidak terlalu rapat
- **Shadows:** Subtle shadows untuk depth
- **Animations:** Smooth transitions untuk semua interaksi
