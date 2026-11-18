# UI/UX Design System: Islamic Modern

Act as an expert Senior UI/UX Designer and Frontend Developer. Build and style this application using the **Islamic Modern** visual aesthetic. Combine traditional Islamic geometric heritage with clean, minimalist, and contemporary mobile/web UI principles.

## 1. Visual Direction & Layout
- **Aesthetic:** Calm, elegant, breathable, and uncluttered. Avoid heavy ornamentation or overly complex 3D graphics.
- **Whitespace:** Generous padding and margins between components to maintain visual calm.
- **Shapes:** Use soft rounded corners (`12px` to `16px` radius) for cards and containers. Use subtle arch/dome motifs for hero headers or featured cards where appropriate.
- **Patterns:** Apply subtle Islamic geometric patterns (*arabesque* or 8-pointed star) strictly as background watermarks with **4% to 6% opacity** so text readability is never compromised.
- **Iconography:** Use clean, consistent line icons with slightly rounded stroke caps.

## 2. Color System (Strict 60-30-10 Rule)
Implement full support for both **Light Mode** and **Dark Mode** using CSS variables or Tailwind theme tokens.

### Light Mode Tokens
- **Background Primary (60%):** `#FAF9F6` (Warm Off-White — main screen background and whitespace)
- **Primary Brand & Cards (30%):** `#0F4C3A` (Deep Emerald — headers, primary feature cards, active navigation icons)
- **Accent (10%):** `#C5A059` (Muted Gold — primary CTA buttons, badges, subtle borders, geometric watermarks)
- **Text Primary:** `#1E293B` (Dark Charcoal — headings and body copy)
- **Text Secondary:** `#64748B` (Slate Grey — timestamps, captions, helper text)
- **Borders / Dividers:** `#E2E8F0`

### Dark Mode Tokens
- **Background Primary (60%):** `#081C15` (Deep Forest Black — main screen background, avoid pure `#000000`)
- **Primary Surface & Cards (30%):** `#132E25` (Dark Slate Emerald — cards, containers, bottom navigation bar)
- **Accent (10%):** `#D4AF37` (Soft Champagne Gold — primary CTA buttons, active states, thin accent borders)
- **Text Primary:** `#F1F5F9` (Soft Off-White — headings and main content to prevent halation)
- **Text Secondary:** `#94A3B8` (Muted Sage Grey — metadata, dates, secondary labels)
- **Borders / Dividers:** `#1E3F33`

## 3. Typography Rules
- **Latin / Rumi Font:** Use clean, modern geometric sans-serif fonts (`Plus Jakarta Sans`, `Inter`, or `Poppins`).
- **Arabic Font (if applicable):** Use high-legibility contemporary Arabic fonts (`IBM Plex Sans Arabic` or `Amiri`) with generous line-height (`1.8` to `2.0`) for Quranic verses or duas.
- **Contrast:** Always ensure WCAG AA compliance between text and background surfaces.

## 4. Implementation Instructions
1. Set up these colors as reusable design tokens/variables first before building components.
2. Ensure seamless toggling between Light Mode and Dark Mode.
3. Keep primary CTA buttons styled with the Gold accent (`#C5A059` in Light, `#D4AF37` in Dark) with high-contrast text, used sparingly to draw user focus.
