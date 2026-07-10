# Rimal Digital Presence — Project Overview

> A complete, code-grounded explanation of the Rimal Trading Group frontend project, intended to bring a new developer or AI tool up to speed without needing to re-read the entire codebase.

---

# 1. Project Summary

**Rimal Trading Group** ("RIMAL") is a diversified holding/trading company based in Doha, Qatar (Lusail, Zone 69). The website is a **corporate/company portfolio site** — not an e-commerce store, not a SaaS product, not a blog. It's a brochure-style marketing site whose job is to establish credibility, communicate the group's mission/vision/values, introduce leadership, and funnel visitors toward contact.

From the copy in `src/data/company.ts` and the page structure, Rimal presents itself as:

- A **strategic trading & investment group** ("Built to Lead"), founded in 2025 (per `AboutHeroSection.tsx`: "Established on 07/07/2025").
- Active or planned across multiple sectors: Retail & Fashion, Food & Beverage, Real Estate, Services & Holdings, Manufacturing, Technology (`siteContent.sectors`), though the live "Our Businesses" page currently shows a **"Coming Soon"** placeholder (`BusinessesSectorsSection.tsx`), meaning the sector detail content isn't built out yet.
- Targeting the **Qatar/GCC market primarily**, MENA secondarily, with global expansion as a stated ambition (`siteContent.markets`).

**Target audience**: likely a mix of prospective business partners, brand principals looking for regional representation, investors, and potential hires/vendors — i.e., a B2B/partnership audience rather than B2C shoppers.

**Primary calls to action** across the site:

- "Explore Partnership" (Hero → `/partners`, though this route doesn't currently exist in the router — see §12)
- "Download Corporate Profile" (PDF download in the Hero)
- "Contact Us" / "Schedule Discussion" (repeated CTA leading to `/contact`)
- "Explore More" (About teaser → `/about`)
- "Explore Strategic Opportunities" (Leadership page footer CTA → `/contact`)

This is a **trust-building, lead-generation site**: almost every page ends by nudging the visitor toward the contact form.

---

# 2. Tech Stack and Frontend Architecture

**Core stack** (from `package.json`):

- **Build tool**: Vite 7, using `@vitejs/plugin-react-swc` for fast SWC-based React compilation.
- **Framework**: React 18.3 with TypeScript 5.8.
- **Routing**: React Router DOM 6 (`BrowserRouter`, `Routes`, `Route`), with **route-level code splitting** via `React.lazy` + `Suspense` (implemented in `App.tsx` — every page is a lazy import).
- **Styling**: Tailwind CSS 3.4 with a custom design-token layer (CSS variables in `src/index.css`), `tailwind-merge` + `clsx` combined in the `cn()` utility (`src/lib/utils.ts`), and `tailwindcss-animate` plugin for keyframe utilities.
- **Component primitives**: shadcn/ui-style components built on Radix UI (`@radix-ui/react-tooltip`, `@radix-ui/react-dialog`), configured via `components.json` (default style, no RSC, `@/components/ui` alias).
- **Animation**: Framer Motion 12 (`motion`, `AnimatePresence`, `useScroll`, `useTransform`) used extensively for scroll-reveal, hero parallax, and modal transitions. A shared variants module (`src/lib/animations.ts`) centralizes the common `fadeUpVariant`/`fadeInVariant`.
- **Smooth scrolling**: Lenis (`lenis` package), wired through a custom `LenisProvider` + `useLenis` hook, plus a `ScrollToTop` component that resets scroll position on route change.
- **Forms & validation**: React Hook Form 7 + Zod 4 + `@hookform/resolvers` — used specifically in `ContactFormSection.tsx` with a shared schema (`src/schemas/contactSchema.ts`).
- **Data fetching / async state**: TanStack React Query 5 (`QueryClientProvider` wraps the whole app in `App.tsx`; `useMutation` is used for the contact form submission flow).
- **HTTP layer**: Axios, wrapped in a small typed `httpClient` (`src/services/httpClient.ts`) that reads a `VITE_API_URL` env var and falls back gracefully when unset.
- **Notifications**: Two toast systems are present — Sonner (`sonner` package, actively used via `toast.success/toast.error` in the contact form) and a shadcn-style `use-toast` hook/`Toaster` (`src/components/ui/use-toast.ts`, unused in current pages).
- **Icons**: `lucide-react`.

**Architectural approach**: This is a fairly conventional **Vite + React SPA** with page-level route components (`src/pages/*.tsx`) that each compose a `Layout` wrapper plus a sequence of self-contained "section" components (`src/components/sections/*.tsx`). Sections are largely presentational, pulling their copy either from inline literals or from a shared static content module (`src/data/company.ts`, `src/data/team.ts`). There is a light **services layer** already scaffolded (`src/services/httpClient.ts`, `src/services/contactService.ts`) that abstracts the one real network call in the app (contact form submission) behind a function that transparently mocks itself out when no backend URL is configured — this is the one part of the frontend explicitly written with future backend integration in mind.

Routing, data fetching, and smooth-scroll are each initialized once at the top of the tree in `App.tsx`, wrapped in this provider order: `LenisProvider` → `QueryClientProvider` → `TooltipProvider` → `Sonner` (toaster) → `BrowserRouter` → `ScrollToTop` → `Suspense`-wrapped `Routes`.

---

# 3. Project Structure Overview

```
index.html                  Vite entry HTML; mounts #root, loads /src/main.tsx
vite.config.ts               Vite config: React SWC plugin, dev server on port 8080, "@" → src alias
tailwind.config.ts            Tailwind theme extension: brand colors, fonts, custom keyframes
postcss.config.js             Tailwind + autoprefixer
components.json               shadcn/ui config (aliases, css var mode, base color "slate")
tsconfig*.json                 TS project references (app config strict, node config for vite.config.ts)
eslint.config.js              Flat ESLint config: JS/TS recommended + react-hooks + react-refresh rules
vercel.json                    SPA rewrite rule (all non-asset routes → index.html) for Vercel hosting
.env.example                  Documents VITE_API_URL for backend wiring

src/
  main.tsx                    App bootstrap: createRoot(...).render(<App />)
  App.tsx                     Provider tree + lazy-loaded route table (code-splitting entry point)
  index.css                   Tailwind directives + CSS custom properties (brand color tokens) + a few
                               reusable utility classes (.section-padding, .section-spacing, .bg-burgundy, etc.)
  vite-env.d.ts                Vite client type reference

  pages/                       One file per route; each composes Layout + section components
    Index.tsx                  "/" — homepage
    About.tsx                  "/about"
    Businesses.tsx              "/businesses"
    Leadership.tsx               "/leadership"
    Contact.tsx                  "/contact"
    NotFound.tsx                 "*" — 404 fallback

  components/
    Layout.tsx                  Shared page shell: Header + <main> + Footer
    Header.tsx                    Sticky nav bar with scroll-aware styling, desktop links, mobile drawer
    Footer.tsx                    Site-wide footer: contact block, quick links, social, legal line
    ScrollToTop.tsx                Resets Lenis scroll position on route change
    ProfileModal.tsx                 Full-bio modal used by TeamSection (Framer Motion AnimatePresence)
    common/
      PageHero.tsx                  Shared parallax hero header used by About/Businesses/Leadership/Contact
    sections/                    ~30 page-section components (see §5 for full inventory)
    ui/                          shadcn/ui primitives: tooltip.tsx, sonner.tsx, use-toast.ts (+ implied
                                  broader shadcn set not shown in full but referenced via aliases)

  hooks/
    useLenis.ts                 Hook exposing scrollTo/scrollToTop/scrollToBottom/stop/start/destroy,
                                 backed by a module-level singleton Lenis instance

  providers/
    LenisProvider.tsx             Instantiates Lenis, drives its RAF loop, registers the global instance
                                   consumed by useLenis()

  lib/
    utils.ts                    cn() — clsx + tailwind-merge helper used throughout for conditional classNames
    animations.ts                 Centralized Framer Motion variants (fadeUpVariant, fadeInVariant) to avoid
                                   re-creating variant objects on every render

  data/
    company.ts                  Single source of truth for static company copy: name, tagline, mission,
                                 vision, values, stats, sectors, markets, footer tagline, contact info
    team.ts                     Array of leadership/team member profiles (name, role, department, email,
                                 photo, description, expertise[], linkedin) — explicitly commented as a
                                 stand-in for a future CMS/API-backed team service

  schemas/
    contactSchema.ts            Zod schema + inferred TS type (ContactFormData) for the contact form:
                                 name, email, phone, message with length/format constraints

  services/
    httpClient.ts                Axios wrapper (get/post/put/patch/delete) reading VITE_API_URL
    contactService.ts             submitContact(data) — posts to /contact if VITE_API_URL is set,
                                   otherwise mocks a 600ms delayed success for local dev

  types/
    profile.ts                  ProfileData type shared by team data and ProfileModal

  assets/                       Images (hero, about, leadership, logo, team photos, icons) and a
                                 downloadable corporate profile PDF (imported directly as ES modules,
                                 so Vite fingerprints/hashes them at build time)
```

**Role summary**: `pages/` defines _what exists at each URL_; `components/sections/` defines _the reusable visual/content blocks_ pages are assembled from; `components/common/PageHero.tsx` is a deliberately shared header pattern for all inner pages; `data/` is the static content backbone; `services/` + `schemas/` are the (currently thin but real) integration-ready layer for the one dynamic feature — the contact form.

---

# 4. Routes and Pages Breakdown

Routing is defined in `App.tsx` with six routes, all lazily loaded:

### `/` — `pages/Index.tsx` (Homepage)

Composed of, in order: `HeroSection` → `AboutSection` → `WhyPartnerWithRimal` → `Cards5` → `WhatMakesUsDifferent` → `TeamSection` → `QuoteSection` → `FinalCTA`.

- **Purpose**: primary landing page — brand introduction, value proposition, team teaser, and a closing CTA.
- **Interactions**: Hero has two CTA buttons (`Explore Partnership` link, `Download Corporate Profile` PDF download). `TeamSection` opens a `ProfileModal` on click of any team card. `Cards5` currently renders a static "Coming Soon" placeholder for sectors.
- **Content nature**: entirely static/local — no fetched data.

### `/about` — `pages/About.tsx`

Composed of: `AboutHeroSection` → `AboutNameSection` → `AboutCEOSection` → `AboutMissionVisionSection` → `AboutImageSection` → `AboutCultureSection`.

- **Purpose**: company heritage/identity page — explains the meaning of the name "Rimal," a CEO message, mission/vision, and cultural values.
- **Content nature**: 100% static copy, sourced partly from `siteContent.about` and partly from inline literals (e.g., the CEO message paragraph array in `AboutCEOSection.tsx`).
- No forms or dynamic interactions; purely informational/branding-oriented.

### `/businesses` — `pages/Businesses.tsx`

Composed of: `BusinessesHeroSection` → `BusinessesSectorsSection` → `BusinessesMarketsSection` → `BusinessesPositionSection`.

- **Purpose**: intended to showcase Rimal's business sectors/portfolio companies.
- **Current state**: `BusinessesSectorsSection` is an explicit **"Coming Soon"** placeholder — the sector cards/details described in `siteContent.sectors` are not yet rendered anywhere in the UI, even though the data for them already exists in `data/company.ts`. This is the clearest example of frontend content that's been modeled but not yet wired into a page.
- `BusinessesMarketsSection` and `BusinessesPositionSection` are fully static and do render (target markets grid, positioning statement quote).

### `/leadership` — `pages/Leadership.tsx`

Composed of: `LeadershipHeroSection` → `LeadershipPrinciplesSection` → `LeadershipQuoteSection` → `TeamSection` → `LeadershipFuturePlansSection`.

- **Purpose**: leadership philosophy (six core "Values That Drive Us" principles), a founder quote, the same interactive team grid used on the homepage, and forward-looking strategic messaging ending in a CTA to `/contact`.
- **Interactions**: same `TeamSection` → `ProfileModal` pattern as the homepage (component reuse, not duplicated logic).
- **Content nature**: static; `LeadershipPrinciplesSection`'s six principles are a hardcoded local array.

### `/contact` — `pages/Contact.tsx`

Composed of: `ContactHeroSection` → `ContactFormSection` → `ContactMapSection`.

- **Purpose**: the site's conversion page — a real, validated contact form plus company contact details and an embedded Google Map.
- **This is the only page with genuine dynamic/interactive logic** (see §7 for full form breakdown).
- `ContactMapSection` embeds a Google Maps iframe with a custom animated "Locating Office" loading state driven by local `useState` + `onLoad` callback — not a form, but a meaningful piece of local interactive UI.

### `*` — `pages/NotFound.tsx`

- Generic 404 page. Logs the attempted path to the console via `useEffect` and offers a link back to `/`.

**Note on route inconsistency**: `HeroSection.tsx` (homepage) links its primary CTA to `/partners`, and `Footer.tsx` has a commented-out `Partnerships` quick link (`{ label: "Partnerships", path: "/partners" }`), but **no `/partners` route exists in `App.tsx`**. Navigating that CTA would currently fall through to the `NotFound` page. This is documented further in §12.

---

# 5. Components and Sections Inventory

### Layout & chrome

- **`Layout.tsx`** — Wraps every page in `<Header /> <main>{children}</main> <Footer />`, with `min-h-screen flex flex-col` so the footer sticks to the bottom on short pages. Purely structural, no props beyond `children`.
- **`Header.tsx`** — Fixed top nav. Tracks `scrolled` state via a `window.scroll` listener to swap background opacity/height/blur once the user scrolls past 40px. Desktop link list (`navLinks` local array: Home, About RIMAL, Our Businesses, Leadership — note Contact is _not_ in this array, it's a separate always-visible CTA button) highlights the active route via `useLocation().pathname`. Mobile menu is a Framer Motion `AnimatePresence` slide-down panel toggled by a hamburger/X icon button.
- **`Footer.tsx`** — Three-column grid: (1) social links + full address/CR number/phone/email, (2) quick nav links (`quickLinks` local array, with Partnerships commented out), (3) brand tagline + logo. Bottom bar has a static "Terms of Service / Privacy Policy" label pair (**these are plain `<span>` text, not links** — no actual legal pages exist) and a copyright line reading the company name from `siteContent`.
- **`common/PageHero.tsx`** — The shared parallax header used by every inner page (About/Businesses/Leadership/Contact). Encapsulates the scroll-linked `useScroll`/`useTransform` logic once (Y offset 0→100px, opacity 1→0 over the first 60% of scroll), so each page only needs to pass `eyebrow`, `title` (ReactNode, so callers can inject styled spans/`<br/>`), optional `subtitle`, `bgClassName`, `minHeight`, and an optional `aside` slot (used only by `AboutHeroSection` to place the logo image). This is a good example of extracted, reusable animation logic.

### Team / profile system

- **`sections/TeamSection.tsx`** — Renders a responsive grid of team member cards from `leadership` (imported from `data/team.ts`). Each card is a `motion.button` with a staggered `fadeUpVariant` reveal; clicking sets `selectedMember` local state, which is passed to `ProfileModal`. Used identically on both the Homepage and Leadership page — a clean example of a reusable, self-contained section (owns its own modal state, no prop drilling required from the parent page).
- **`ProfileModal.tsx`** — A two-panel modal (dark "identity" panel with avatar/name/role/email on the left, scrollable bio/expertise/actions panel on the right), animated in/out via `AnimatePresence`. Receives `member: ProfileData | null` and `onClose`. Renders initials as a fallback avatar if no photo is set. Action bar offers a `mailto:` link and an optional LinkedIn link, both conditionally rendered based on whether the member data has `email`/`linkedin`.
- **`types/profile.ts`** — Defines the `ProfileData` shape consumed by both `data/team.ts` and `ProfileModal`.

### Hero / page-intro sections

- **`sections/HeroSection.tsx`** (homepage only) — Not built on `PageHero`; it's a bespoke split layout (image right, copy left) with its own Framer Motion entrance choreography (staggered `initial`/`animate` delays on h1/p/CTA group) and its own responsive image scaling logic (`scale-150 lg:scale-90`). CTA buttons: "Explore Partnership" → `/partners` (broken route, see §12) and "Download Corporate Profile" → a directly-imported PDF asset with the `download` attribute.
- **`sections/AboutHeroSection.tsx`, `BusinessesHeroSection.tsx`, `LeadershipHeroSection.tsx`, `ContactHeroSection.tsx`** — Thin wrappers around `PageHero`, each just supplying page-specific copy/background color/eyebrow text. `AboutHeroSection` additionally passes the company logo image into the `aside` slot.

### Content / narrative sections

- **`AboutSection.tsx`** (homepage) — Two-column "who we are" teaser with a decorative rotated-stripe graphic behind the image and a link to `/about`. Contains a large block of **commented-out JSX** (a stats grid reading from `siteContent.stats`) that is dead code currently not rendered anywhere on the site (confirms the audit finding referenced in prior project memory).
- **`AboutNameSection.tsx`** — Explains the meaning of "Rimal" (Arabic for "sands"); copy partly from `siteContent.about.description`, partly inline.
- **`AboutCEOSection.tsx`** — Multi-paragraph CEO message (`ceoMessage` template literal split on double newlines and mapped into staggered `motion.p` elements) plus a closing italicized tagline.
- **`AboutMissionVisionSection.tsx`** — Two-column Mission/Vision cards, mapped from an inline array pulling text out of `siteContent.about.mission`/`.vision`.
- **`AboutImageSection.tsx`** — Single full-width bordered image, no logic.
- **`AboutCultureSection.tsx`** — Four "culture" statements in a hardcoded local array, rendered as a numbered list with staggered reveal.
- **`QuoteSection.tsx`** / **`LeadershipQuoteSection.tsx`** — Nearly identical large pull-quote blocks (burgundy background, oversized decorative quotation marks, "— Message from Founder & CEO" byline) with different quote text; a clear case of duplicated presentational pattern across two files rather than one parameterized component.
- **`WhyPartnerWithRimal.tsx`** — "Building Trust Before Transactions" narrative section with a 3-item hardcoded `culture` array, each rendered with a large decorative background number.
- **`Cards5.tsx`** — Homepage sectors teaser; currently just a static "Coming Soon" card, not sourced from `siteContent.sectors`.
- **`WhatMakesUsDifferent.tsx`** — Three-column "competitive edge" grid from a hardcoded `points` array (title + description), each card has a large faint background numeral and a hover lift effect.
- **`FinalCTA.tsx`** — Homepage closer: single headline + one "Schedule Discussion - Contact Us" button linking to `/contact`.
- **`LeadershipPrinciplesSection.tsx`** — Six-item "Values That Drive Us" list (Passion, Creativity, Persistence, Humility, Transparency, Diversity) from a hardcoded `principles` array, paired with a leadership team image on large screens.
- **`LeadershipFuturePlansSection.tsx`** — "Looking Ahead" strategic statement + CTA button to `/contact`.
- **`BusinessesMarketsSection.tsx`** — Three-column target market cards (Qatar & GCC / MENA / International) sourced from `siteContent.markets`.
- **`BusinessesPositionSection.tsx`** — Single centered positioning-statement quote, hardcoded inline.
- **`BusinessesSectorsSection.tsx`** — "Coming Soon" placeholder (see §4).
- **`StrategicNumbers.tsx`** — A stats band (Established 2025 / 5+ Sectors / 3+ Markets / Regional Strategic Vision) from a hardcoded `stats` array. **Not currently imported/rendered by any page** — appears to be an orphaned/unused section.
- **`WhyRimalSection.tsx`** — "Why RIMAL" value-prop cards fed from `siteContent.values`, each with an `Award` icon. **Also not currently imported by any page** — another orphaned section.

### Contact-specific sections

- **`ContactFormSection.tsx`** — The one fully wired, production-style form on the site (see §7 for details).
- **`ContactMapSection.tsx`** — Google Maps iframe embed with a custom branded loading overlay (pulsing rings + bouncing pin icon, all Framer Motion `animate` loops) that fades out via `AnimatePresence` once the iframe fires `onLoad`.
- **`ContactSection.tsx`** — A **second, separate, unconnected contact form** exists in `components/sections/ContactSection.tsx`. It has its own local `useState` for `{name, email, message}` (no phone field, no Zod validation, no react-hook-form) and its `handleSubmit` only calls `e.preventDefault()` with a `// future: send to backend` comment — it does not call `contactService.submitContact`. **This component is not imported by any page** (the actual `/contact` route uses `ContactFormSection`, not `ContactSection`), so it appears to be legacy/superseded code left in the tree.

### UI primitives (`components/ui/`)

- **`tooltip.tsx`** — shadcn-style wrapper around Radix `Tooltip` primitives (Provider/Root/Trigger/Content), styled via `cn()` and Tailwind's `animate-in`/`animate-out` data-state classes. `TooltipProvider` is mounted globally in `App.tsx` but no page currently renders a `<Tooltip>` — infrastructure is present but unused.
- **`sonner.tsx`** — Wraps the `sonner` `Toaster` with theme/class defaults; this is the toaster actually mounted in `App.tsx` and actually used (via `toast.success`/`toast.error` in the contact form).
- **`use-toast.ts`** — Re-exports a `useToast`/`toast` pair from `@/hooks/use-toast` (the hook file itself isn't in the reviewed file set, but the shadcn `Toaster` component tied to it is not mounted in `App.tsx`) — this is the second, currently-inactive toast system referenced in project memory.

---

# 6. Frontend Content/Data Inventory

| Content type                   | Where defined                                                                 | Fields (as used)                                                                          | How rendered                                                                                                 |
| ------------------------------ | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Company profile**            | `data/company.ts` → `siteContent.company`                                     | name, shortName, tagline, subtitle, founding, ceo, email, phone, address, social.linkedin | Footer, Contact page, meta-ish usage across CTAs                                                             |
| **About copy**                 | `data/company.ts` → `siteContent.about`                                       | description, mission, vision, values (raw multi-line string)                              | `AboutSection`, `AboutMissionVisionSection`, `AboutNameSection`                                              |
| **Stats**                      | `data/company.ts` → `siteContent.stats`                                       | value, label                                                                              | Defined but **not currently rendered anywhere** live (only in the commented-out block in `AboutSection.tsx`) |
| **Values (why-us cards)**      | `data/company.ts` → `siteContent.values`                                      | title, description                                                                        | Consumed only by the orphaned `WhyRimalSection.tsx`                                                          |
| **Sectors**                    | `data/company.ts` → `siteContent.sectors`                                     | name, description                                                                         | Modeled but **not rendered anywhere** — `BusinessesSectorsSection` shows a static "Coming Soon" instead      |
| **Markets**                    | `data/company.ts` → `siteContent.markets`                                     | primary, secondary, global                                                                | `BusinessesMarketsSection`                                                                                   |
| **Quote / footer tagline**     | `data/company.ts`                                                             | quote, footerTagline                                                                      | `Footer` (tagline); `quote` field appears unused in reviewed sections                                        |
| **Team members**               | `data/team.ts` → `leadership[]`                                               | name, role, department, email, photo, description, expertise[], linkedin                  | `TeamSection` (grid) → `ProfileModal` (detail)                                                               |
| **Navigation links**           | Local arrays inside `Header.tsx` (`navLinks`) and `Footer.tsx` (`quickLinks`) | label, path                                                                               | Header desktop/mobile nav, Footer quick links                                                                |
| **Social links**               | Local array inside `Footer.tsx` (`socialLinks`)                               | icon, label, href                                                                         | Footer social icon row                                                                                       |
| **Contact info list**          | Local array inside `ContactFormSection.tsx` (`contactInfo`)                   | icon (lucide component), label, value (from `siteContent.company`)                        | Contact page right-hand info column                                                                          |
| **Leadership principles**      | Local array inside `LeadershipPrinciplesSection.tsx`                          | num, title, description                                                                   | Leadership page values list                                                                                  |
| **Culture statements**         | Local arrays inside `AboutCultureSection.tsx` and `WhyPartnerWithRimal.tsx`   | point (string)                                                                            | Respective sections                                                                                          |
| **Competitive-edge points**    | Local array inside `WhatMakesUsDifferent.tsx`                                 | title, desc                                                                               | Homepage differentiators grid                                                                                |
| **Strategic numbers**          | Local array inside `StrategicNumbers.tsx`                                     | value, label                                                                              | Defined but section is currently unused/orphaned                                                             |
| **Contact form payload shape** | `schemas/contactSchema.ts` (Zod)                                              | name, email, phone, message                                                               | Drives both validation and the TS type used by `ContactFormSection` and `contactService.submitContact`       |

All content above is **hardcoded at build time** — none of it is fetched from a network call or CMS. The `team.ts` file's own header comment is explicit that this is intentional: _"static for now... Future: replace this import with a `useQuery` from `services/teamService.ts`... without touching consuming components as long as their prop contracts stay stable."_ This signals the content model was designed with a services-layer swap in mind, even though only the contact form currently has that layer implemented.

---

# 7. Forms and User Interactions

### 7.1 Contact form (`ContactFormSection.tsx`) — the site's one real interactive feature

- **Location**: `/contact` route, rendered directly (not lazy beyond the page-level split).
- **Fields**: Name (text), Phone (tel), Email (email), Message (textarea, 6 rows).
- **Validation**: Fully wired via React Hook Form's `useForm<ContactFormData>({ resolver: zodResolver(contactSchema) })`, validating against `schemas/contactSchema.ts`:
  - name: required, ≤100 chars
  - email: valid email format, ≤255 chars
  - phone: required, ≤50 chars
  - message: min 10 chars, max 1000 chars
- **Error display**: Per-field inline error `<p role="alert">` tied via `aria-describedby`/`aria-invalid` — this form has real accessibility attributes, unlike the legacy `ContactSection.tsx` duplicate.
- **Submission flow**: Uses TanStack Query's `useMutation({ mutationFn: submitContact })`. On success: `toast.success(...)` (Sonner) + `reset()` clears the form. On error: `toast.error(...)` with the thrown error's message. The submit button shows a `"Sending…"` label and is `disabled` while `isSubmitting || mutation.isPending`.
- **Actual network behavior**: `submitContact` (in `services/contactService.ts`) checks `import.meta.env.VITE_API_URL`. If set, it POSTs to `/contact` via the shared `httpClient` (Axios). If unset (the default local/dev state, per `.env.example`), it **mocks success after a 600ms delay** and just `console.info`s the payload — so as shipped today, no real backend receives this data. This is a deliberate, clean seam for backend integration: swapping in a real API only requires setting `VITE_API_URL`; no component code needs to change.
- **Production-readiness**: This form looks **genuinely close to production-ready** on the frontend side — proper validation, accessible markup, loading/disabled states, success/error feedback. The only gap is the absence of a live backend endpoint.

### 7.2 Legacy/duplicate contact form (`ContactSection.tsx`) — dead code, not routed

- Separate `useState`-based form with only name/email/message (no phone), no validation library, `maxLength` attributes only (no Zod), and a `handleSubmit` that does nothing but `preventDefault()`. **Not imported by any page.** Documented here because it exists in the tree and could confuse a developer who greps for "ContactSection" instead of "ContactFormSection."

### 7.3 Team profile modal (`TeamSection.tsx` + `ProfileModal.tsx`)

- Click interaction: clicking any team member card sets local `selectedMember` state, opening `ProfileModal`. Closing via the X button, or via `AnimatePresence` exit when `member` becomes `null`. No form here, but it's the site's second most complex interactive component (animated open/close, keyboard-passive but has `role="dialog"`/`aria-modal`/`aria-labelledby` for a11y).

### 7.4 Header mobile navigation toggle

- `Header.tsx` maintains `mobileOpen` boolean state; hamburger/X icon swap; `AnimatePresence` slide-down panel; each mobile link closes the menu on click (`onClick={() => setMobileOpen(false)}`).

### 7.5 Header scroll-aware styling

- `scrolled` boolean state driven by a `window.addEventListener("scroll", ...)` threshold check (>40px), toggling background opacity/blur/height. Pure UI-state, no forms involved.

### 7.6 Contact map loading state

- `ContactMapSection.tsx` maintains `isLoading` boolean, defaulting `true`, flipped to `false` by the iframe's native `onLoad` event, gating an animated branded loading overlay via `AnimatePresence`.

### 7.7 Scroll-to-top on route change

- `ScrollToTop.tsx` is a logic-only component (renders `null`) that calls `useLenis().scrollToTop({ duration: 1.2 })` inside a `useEffect` keyed on `location.pathname` — ensures every route transition starts scrolled to top, using the smooth Lenis animation rather than an instant jump.

**No other forms, filters, search boxes, carousels, tabs, or accordions exist in the reviewed codebase.**

---

# 8. Data Flow and State Logic

- **Static content flow**: The large majority of the site is `data/company.ts` / `data/team.ts` / local in-component arrays → imported directly into section components → mapped into JSX. There is no context/global store for this content; it flows via plain ES module imports, which is appropriate for content that doesn't change at runtime.
- **Page composition flow**: `pages/*.tsx` import section components and lay them out in sequence inside `<Layout>`. Pages pass **no props** to sections in almost every case — sections are self-contained and either use their own local arrays or import from `data/`. This means adding/removing/reordering sections on a page is a one-line change in the page file, but it also means sections can't easily be reused with different data without editing the section file itself (see §12 on reusability trade-offs).
- **Global providers / cross-cutting state**:
  - `LenisProvider` creates one `Lenis` instance, registers it via `setGlobalLenis()` (a module-level singleton in `hooks/useLenis.ts`), and drives it with `requestAnimationFrame`. Any component can then call `useLenis()` to get `scrollTo`/`scrollToTop`/etc. without prop drilling.
  - `QueryClientProvider` wraps the app with a single `new QueryClient()` — currently the **only** consumer of TanStack Query is the contact form's `useMutation`; there are no `useQuery` calls anywhere yet (confirming "TanStack Query installed but underused" beyond the mutation use case).
  - `TooltipProvider` (Radix) is mounted globally but has zero active `<Tooltip>` usages found in the reviewed sections.
- **Local component state**: `useState` is used for: mobile nav toggle (`Header`), scroll-based header styling (`Header`), selected team member (`TeamSection`), contact map loading (`ContactMapSection`), and the abandoned duplicate contact form (`ContactSection`). All are simple, component-scoped, and don't leak into global state.
- **Form state**: Owned entirely by React Hook Form inside `ContactFormSection`; validated synchronously against the Zod schema before `onSubmit` fires; submission state (`isSubmitting`, plus the mutation's `isPending`) drives the button's disabled/label state.
- **The one real async/network boundary**: `contactService.submitContact()` → `httpClient.post()` → Axios → `VITE_API_URL + "/contact"`. Everything upstream of this (`ContactFormSection`, the mutation) is backend-agnostic; swapping the mock for a real API is a matter of environment configuration, not component rewrites.
- **Animation "state"**: Framer Motion's `whileInView`/`initial`/`animate` props drive most scroll-reveal effects declaratively (no manual IntersectionObserver code); `useScroll`/`useTransform` in `PageHero` and the homepage `HeroSection`-adjacent parallax logic compute scroll-linked values reactively. This is presentation-layer "state" (motion values), not application state.

---

# 9. UI System and Reusable Patterns

- **Design tokens**: `src/index.css` defines the entire brand palette as HSL CSS custom properties under `:root` (e.g., `--primary: 345 74% 31%` for the "Dark Amaranth" burgundy, `--secondary`/`--gold`, `--sand`, `--navy`, `--beige`, `--charcoal`), consumed by `tailwind.config.ts`'s `theme.extend.colors` via `hsl(var(--token))`. This is the classic shadcn/ui token pattern, extended with Rimal-specific brand aliases (`burgundy`, `gold`, `navy`, `sand`, `beige`, `charcoal`) plus some raw utility classes (`.bg-burgundy`, `.text-gold`, etc.) defined directly in `@layer utilities` for cases where the Tailwind color-object path isn't convenient.
- **Typography**: Two font families loaded via Google Fonts `@import` — "Montserrat" for all headings (`h1`–`h6` forced `uppercase tracking-wider` at the base layer) and "Open Sans" for body text. `tailwind.config.ts` additionally defines `font-serif` (`"Playfair Display"`) and `font-body` (`Inter`) family aliases that are used across many section components (e.g. `font-serif text-3xl` for headings) — meaning there's actually a **mismatch**: the CSS base layer hardcodes Montserrat/Open Sans on raw heading tags, while individual components more often reach for the Tailwind `font-serif`/`font-body` utility classes referencing Playfair Display/Inter. Both font pairs are declared, but only Montserrat/Open Sans are actually `@import`-loaded in `index.css` — Playfair Display and Inter are referenced by class name but never loaded via `@import` or `<link>`, meaning they likely fall back to system/generic serif/sans-serif in the browser.
- **Layout helpers**: Two custom utility classes defined once and reused everywhere — `.section-padding` (responsive horizontal padding scale) and `.section-spacing` (responsive vertical padding scale) — giving every section consistent horizontal/vertical rhythm without repeating the same Tailwind class stack in every file.
- **Motion conventions**: `fadeUpVariant`/`fadeInVariant` from `lib/animations.ts` are the "official" shared variants (module-scope, so Framer Motion doesn't recreate controller objects each render), but many section files still define their **own inline** `initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}}` objects directly on `motion.div` instead of importing the shared variant — meaning the DRY refactor to `lib/animations.ts` is partially, not fully, adopted across the codebase (e.g., `AboutSection.tsx`, `ContactSection.tsx`, `HeroSection.tsx` all hand-roll their own transition objects rather than using `fadeUpVariant`).
- **Card/section repetition patterns**: A recurring visual motif — large, faint, oversized serif numerals (`01`, `02`, `03`…) behind card content — appears independently in `LeadershipPrinciplesSection`, `BusinessesMarketsSection`, `WhatMakesUsDifferent`, and `WhyPartnerWithRimal`, each reimplementing the same "big background numeral" trick with slightly different opacity/size values rather than a shared `NumberedCard` component.
- **Quote block pattern**: `QuoteSection` and `LeadershipQuoteSection` are near-identical (oversized decorative quotation marks, burgundy background, centered italic serif quote, byline) — a strong candidate for a single shared `QuoteBlock` component taking `quote`/`byline` props, but currently implemented as two separate files.
- **Hero pattern**: Successfully unified via `common/PageHero.tsx` for every inner page (About/Businesses/Leadership/Contact) — this is the **one part of the codebase where the "duplicated hero animation" problem has already been solved** by extraction into a shared component; only the homepage's `HeroSection.tsx` remains a one-off bespoke implementation (which makes sense, since its layout — image beside text — genuinely differs from the inner-page hero pattern).
- **Button/CTA styling**: No shared `<Button>` component is used for the site's many CTA links — each is a raw `<Link>`/`<a>`/`<button>` with its own inline Tailwind class string (gold background, burgundy text, tracking-wide, hover opacity/scale). The visual style (gold pill/rect button) is consistent by convention/copy-paste, not by shared component, though a shadcn `Button` primitive is implied to be available via `components.json`'s aliasing (not confirmed present in the reviewed file set).
- **Responsive conventions**: Consistent mobile-first Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`) throughout; grid section layouts typically collapse from 3–4 columns down to 1 column on small screens (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3/4`).

---

# 10. Static vs Dynamic Analysis

| Category                                                       | Examples                                                                                                                                                                                                                                                                                                |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fully hardcoded static content (inline in component)**       | `WhatMakesUsDifferent` points array, `WhyPartnerWithRimal` culture array, `AboutCultureSection` culture array, `LeadershipPrinciplesSection` principles array, `AboutCEOSection` CEO message string, `BusinessesPositionSection` quote text, `StrategicNumbers` stats array (also orphaned — see below) |
| **Mapped from a shared local data module**                     | Company info/mission/vision/markets/values/sectors (`data/company.ts`), team member list (`data/team.ts`) — consumed by Footer, About sections, Businesses markets section, Team section                                                                                                                |
| **Interactive, but entirely local/no persistence**             | Header mobile menu + scroll styling, TeamSection → ProfileModal open/close, ContactMapSection loading overlay, ScrollToTop                                                                                                                                                                              |
| **Explicitly backend-ready / integration-seamed**              | Contact form → `contactService.submitContact()` → `httpClient` → `VITE_API_URL` (real seam, documented via `.env.example`); `data/team.ts`'s own code comment marks it as a future `useQuery`-backed swap-in candidate                                                                                  |
| **Modeled but not yet rendered (data exists, no UI consumer)** | `siteContent.stats`, `siteContent.values` (only consumed by the orphaned `WhyRimalSection`), `siteContent.sectors` (no consumer at all — `BusinessesSectorsSection` shows "Coming Soon" instead), `siteContent.quote`                                                                                   |
| **Mock/demo implementations left in place**                    | `ContactSection.tsx` (legacy duplicate form, unrouted, `preventDefault()`-only submit)                                                                                                                                                                                                                  |
| **Orphaned/unrouted components**                               | `pages/... ` no `Partners.tsx` was present in the reviewed file set for this pass, but the `/partners` route referenced by `HeroSection` and (commented-out) `Footer` quick link does not exist in `App.tsx`; `StrategicNumbers.tsx` and `WhyRimalSection.tsx` are not imported by any page             |
| **Infrastructure present but unused**                          | Radix `Tooltip` primitives (`ui/tooltip.tsx` + global `TooltipProvider`), shadcn `use-toast` hook/Toaster (separate from the actively-used Sonner toaster)                                                                                                                                              |

---

# 11. Business Interpretation of the Website

Reading the frontend as a product brief:

- **What Rimal is selling**: not a specific product, but _itself as a trustworthy partner and investment group_. The repeated phrase pairing "Driven by Ideas, Powered by Trust" (hero tagline) and "Trust Before Transactions" (dedicated section) signals the core brand pitch is **credibility and long-term partnership**, aimed at brands/investors considering Qatar/GCC market entry through Rimal as a local partner, rather than direct consumers.
- **What actions it wants visitors to take**: overwhelmingly, **get in touch**. Nearly every page terminates in a contact CTA (`FinalCTA`, `LeadershipFuturePlansSection`, Header's persistent "Contact Us" button, Footer). The secondary action is **download the corporate profile PDF** from the hero — a classic B2B lead-gen pattern (offer a tangible document in exchange for engagement) even though there's no email-gate on the download; it's a plain static asset link.
- **Trust-building content**: the CEO message, mission/vision statements, leadership principles, and team profile grid (with LinkedIn links and detailed bios) are all classic credibility-signaling content — designed to reassure a prospective partner that real, identifiable, experienced people run this organization.
- **Sales-oriented vs informational vs branding**:
  - **Sales-oriented**: Hero CTAs, `FinalCTA`, `LeadershipFuturePlansSection`, the Contact page itself.
  - **Informational**: Mission/Vision, Target Markets, Leadership Principles, team bios.
  - **Branding/emotional**: The repeated pull-quote sections, the heritage/name-origin narrative ("Rimal" = sands, tying the company name to Arabian heritage), the "heritage + modernity" framing used in `WhatMakesUsDifferent`.
- **A notable gap**: the actual **portfolio of businesses/sectors** — arguably the single most concrete, differentiating piece of information a prospective partner would want ("what does Rimal actually do/own?") — is the one section still showing a **"Coming Soon"** placeholder, despite the underlying sector data already being modeled in `data/company.ts`. This suggests the business content for that page is still pending from the client/stakeholder side, not a frontend limitation.

---

# 12. Engineering Observations

**Strengths / well-structured areas**:

- The `PageHero` extraction is a genuinely good pattern — parallax scroll logic, written once, correctly reused across four pages via a clean prop interface (`eyebrow`, `title`, `subtitle`, `bgClassName`, `minHeight`, `aside`).
- The contact form (`ContactFormSection.tsx`) is the standout piece of engineering in the codebase: proper schema-driven validation (Zod), accessible markup (`aria-*`, `role="alert"`), sensible loading/disabled states, and a genuinely clean services-layer seam (`contactService` → `httpClient`) for backend integration that requires zero component changes when a real API becomes available.
- `lib/animations.ts` and `lib/utils.ts` show intentional effort toward centralizing cross-cutting concerns (shared motion variants, `cn()` classname merging) even if adoption of the shared variants isn't yet universal.
- The `data/team.ts` file's own inline comment demonstrates the team was already thinking ahead about a CMS/API swap without needing to touch consumer components — a good sign for future backend work, provided the prop contract (`ProfileData`) is respected.
- Route-level code splitting (`React.lazy` + `Suspense`) is already implemented in `App.tsx`, keeping the initial bundle lean.

**Risks / structural observations**:

- **Duplicate contact forms**: `ContactSection.tsx` (unrouted, non-functional) sitting alongside `ContactFormSection.tsx` (routed, fully functional) is a maintenance trap — a future developer could easily edit the wrong one.
- **Dead/orphaned sections**: `StrategicNumbers.tsx` and `WhyRimalSection.tsx` are fully built but not imported anywhere, meaning their content (and the `siteContent.values` data feeding one of them) is currently invisible to real users. Worth confirming with stakeholders whether these should be wired into a page or removed.
- **Broken route reference**: `/partners` is linked from the homepage hero CTA (and referenced, commented out, in the footer) but has no matching `<Route>` — this CTA currently 404s.
- **Commented-out dead code**: a ~notable block of commented JSX (a stats grid) remains in `AboutSection.tsx`. This is content debt — it's unclear if it should be restored, replaced, or deleted.
- **Duplicated presentational patterns**: `QuoteSection`/`LeadershipQuoteSection` and the four separate "big background numeral" card implementations are prime candidates for shared components; as written, any visual tweak (e.g., changing the quote-mark size) must be made in multiple files.
- **Partial adoption of shared animation variants**: several sections hand-roll their own Framer Motion `initial`/`animate` objects instead of importing `fadeUpVariant`/`fadeInVariant` from `lib/animations.ts`, meaning a global timing/easing change won't propagate everywhere it should.
- **Two parallel toast systems**: Sonner (active) and shadcn's `use-toast`/`Toaster` (present but not mounted/used) — the unused one is confusing dead weight in the dependency graph and component tree assumptions.
- **Font mismatch**: `tailwind.config.ts` declares `font-serif` → Playfair Display and `font-body` → Inter, and many components use these classes, but `index.css` only `@import`s Montserrat and Open Sans. Playfair Display/Inter are referenced but never actually loaded, so those elements are likely silently falling back to generic serif/sans-serif in the rendered site — worth a visual QA pass.
- **Section reusability trade-off**: because most sections import their own data directly (from `data/company.ts` or local arrays) rather than receiving it via props, sections are easy to drop onto a page but hard to reuse with _different_ data without duplicating the file or refactoring it to accept props — this is a reasonable trade-off for a small brochure site but would need addressing if the business/sector content model grows.
- **Legal footer links**: "Terms of Service" and "Privacy Policy" in the footer are plain, non-interactive `<span>` text, not real links — there are no corresponding legal pages in the route table.

---

# 13. Final Condensed Project Snapshot

**What this project is**: A Vite + React 18 + TypeScript single-page brochure/portfolio website for Rimal Trading Group, a Qatar-based diversified trading and investment group. Five real routes (`/`, `/about`, `/businesses`, `/leadership`, `/contact`) plus a 404 fallback, styled with Tailwind + shadcn/ui tokens, animated with Framer Motion, and smooth-scrolled with Lenis.

**How it's structured**: Pages (`src/pages`) are thin compositions of reusable, mostly self-contained section components (`src/components/sections`). Static company/team content lives in `src/data`. A small but genuinely production-shaped services layer (`src/services` + `src/schemas`) exists solely to power the one real feature on the site — the validated contact form — and is intentionally decoupled from the mock/live distinction via an environment variable.

**Which parts matter most**:

1. **`App.tsx`** — the entire route table and provider stack; the map of what exists.
2. **`ContactFormSection.tsx` + `schemas/contactSchema.ts` + `services/contactService.ts`** — the only genuinely dynamic, validated, network-aware feature in the app, and the clearest template for how future backend-connected features should be structured.
3. **`common/PageHero.tsx`** and **`lib/animations.ts`** — the two places where the team has already succeeded at extracting shared, reusable logic; good reference points for how further deduplication (quote blocks, numbered cards) should be done.
4. **`data/company.ts` and `data/team.ts`** — the static content backbone; understanding these two files explains most of what's rendered across every page.

**What a new developer must understand before touching the codebase**:

- The site is almost entirely static content today — only the contact form talks to (or mock-talks to) a backend.
- Not all built components are actually in use: `ContactSection.tsx`, `StrategicNumbers.tsx`, and `WhyRimalSection.tsx` are present in the tree but not rendered by any page — check `App.tsx` and each `pages/*.tsx` file to see what's _actually_ live before assuming a component is in production.
- The `/partners` link exists in the UI but has no matching route — don't assume every visible link in the Hero/Footer resolves correctly.
- Content that looks "ready to wire to a backend" (team, sectors, stats) has generally already been modeled as clean, typed local data — the shape of that data is a reasonable contract to preserve if/when it's replaced by real API calls.
