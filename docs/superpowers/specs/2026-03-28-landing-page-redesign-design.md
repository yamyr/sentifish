# Landing Page Redesign — Design Spec

**Date:** 2026-03-28
**Status:** Draft
**Goal:** Redesign the Sentifish landing page from a text-heavy card-grid template into a product-forward page that drives both dashboard adoption and GitHub engagement equally.

---

## Context

Sentifish is an open-source web search provider benchmarking platform. The current landing page has 6 sections (Hero, ProviderShowcase, HowItWorks, MetricsExplained, WhySentifish, Footer) that all follow the same card-grid pattern. No product screenshots are shown despite having 4 demo GIFs available. There is no navigation bar, no social proof, no repeated CTAs, and no actual benchmark data displayed — surprising for a benchmarking tool.

**Approach chosen:** "Show, Don't Tell" — lead with the product's visual strengths (dashboard, race GIFs, real benchmark scores) and break the monotonous layout with varied section designs.

**Conversion goals (equal weight):**
- Drive users to `/dashboard` to start evaluating
- Drive GitHub engagement (stars, forks, contributions)

---

## Tech Constraints

- **Framework:** React 18, Vite, TypeScript
- **Styling:** Tailwind CSS 3.4, shadcn/ui (Radix primitives)
- **Animation:** Framer Motion v12
- **Icons:** lucide-react
- **Fonts:** DM Sans (body), JetBrains Mono (code/metrics)
- **Existing assets:** `assets/gifs/02-race.gif`, `03-comparison.gif`, `04-trend.gif`, `05-dashboard.gif`
- **No new dependencies** unless justified

---

## Section-by-Section Design

### 1. Navbar (New Component)

**File:** `ui/src/components/landing/Navbar.tsx`

**Purpose:** Persistent navigation with dual CTAs always visible.

**Layout:**
- Sticky `top-0 z-50`
- Left: Fish icon + "Sentifish" wordmark (links to `/`)
- Center: anchor links — Providers, How It Works, Metrics, Why Sentifish
- Right: "GitHub" button (ghost/outline, opens repo in new tab) + "Start Evaluating" button (solid brand-cyan, links to `/dashboard`)
- On hero (top of page): `bg-transparent`
- After scrolling past hero: `bg-white/80 backdrop-blur-md border-b border-border` transition
- Mobile (< `md`, i.e. below 768px): hamburger icon toggling a slide-down menu with all links + CTAs

**Behavior:**
- Active section highlighted via `IntersectionObserver` on section `id` attributes
- Smooth scroll to section on anchor click (`scroll-behavior: smooth` or `scrollIntoView`)

**Scroll detection:** Use a `useEffect` with `scroll` event listener checking `window.scrollY > heroHeight`. Toggle a `scrolled` state that swaps className.

---

### 2. Hero (Redesigned)

**File:** `ui/src/components/landing/Hero.tsx` (modify existing)

**Purpose:** Immediate product demonstration.

**Layout (top to bottom):**
1. Logo mark (keep existing)
2. Headline: "Know Which Search API Actually Works" (keep)
3. Subheadline (keep)
4. Dual CTAs:
   - "Start Evaluating" (brand-cyan solid, links to `/dashboard`)
   - "View on GitHub" (ghost white border, with inline GitHub star count badge)
5. **New: Dashboard preview** — `05-dashboard.gif` displayed in a browser-chrome mockup frame
   - Rounded `2xl` corners, subtle `border border-white/10`
   - Drop shadow: `shadow-2xl shadow-brand-cyan/10`
   - Slight 3D perspective tilt via CSS `transform: perspective(1200px) rotateX(2deg)`
   - Framer Motion: fade-in + slide-up on load with `delay: 0.5`
   - Max width: `max-w-5xl`, centered

**Removed:** Floating metric badges (NDCG 0.891, MRR 0.92, P@K 0.87). The dashboard GIF showing real metrics is strictly better.

**GitHub stars badge:** Static initial value, optionally fetched from `https://api.github.com/repos/yamyr/sentifish` on mount. Display as a small pill next to the GitHub CTA: star icon + count. Fallback: hide badge if fetch fails.

---

### 3. Benchmark Results Table (Replaces ProviderShowcase)

**File:** `ui/src/components/landing/BenchmarkTable.tsx` (new, replaces `ProviderShowcase.tsx`)

**Purpose:** Show actual competitive benchmark data. This is the highest-value change on the page.

**Section header:**
- Label: "BENCHMARKS"
- Heading: "Four Providers, One Benchmark"
- Subtext: "Same queries, same dataset, scored with real IR metrics."

**Table layout:**

| Provider | NDCG@10 | MRR | Precision@5 | Avg Latency |
|----------|---------|-----|-------------|-------------|
| Brave    | 0.82    | 0.88| 0.76        | 320ms       |
| Serper   | 0.89    | 0.92| 0.84        | 245ms       |
| Tavily   | 0.85    | 0.87| 0.80        | 410ms       |
| TinyFish | 0.78    | 0.81| 0.72        | 180ms       |

**Visual treatment:**
- Each row has the provider's color accent (left border or icon)
- Score cells include a mini horizontal bar (width proportional to value) for scanability
- Best score per column gets a subtle highlight background + small trophy/crown icon
- Responsive: on mobile, collapse to cards (one card per provider with all metrics listed)

**Data source:** Hardcoded in component as a const array. Values should reflect realistic sample-dataset results. Add a `// TODO: fetch from /api/runs/latest` comment for future dynamic data.

**Below table:**
- Disclaimer: `font-mono-brand text-xs text-muted-foreground` — "Scores from sample dataset. Results vary by query set."
- CTA link: "Run your own benchmark →" as a text link to `/dashboard`

**Animation:** Table rows stagger in with Framer Motion `whileInView`, each row delayed by 0.08s.

---

### 4. How It Works — Tabbed Demo (Redesigned)

**File:** `ui/src/components/landing/HowItWorks.tsx` (modify existing)

**Purpose:** Visual workflow walkthrough using existing GIF assets.

**Section header:**
- Label: "WORKFLOW"
- Heading: "Three Steps to Better Search"
- Subtext: "From dataset to decision in minutes."

**Tab interface:**
- 3 tabs displayed horizontally above the content area:
  - "01 Choose Dataset" / "02 Run Evaluation" / "03 Compare Results"
  - Active tab: `border-b-2 border-brand-cyan text-foreground font-semibold`
  - Inactive tabs: `text-muted-foreground`
- Below tabs: GIF display area
  - Each tab maps to a GIF:
    - Tab 1 → `05-dashboard.gif`
    - Tab 2 → `02-race.gif`
    - Tab 3 → `03-comparison.gif`
  - GIF shown in a browser-chrome mockup frame (same style as hero, but flat — no perspective)
  - Below GIF: 1-2 sentence description (shortened from current text)

**Auto-advance behavior:**
- Tabs auto-cycle every 5 seconds
- A thin progress bar animates across the active tab (brand-cyan, `transition: width 5s linear`)
- Auto-advance pauses on hover over the tab content area
- Clicking a tab resets the timer

**GIF asset handling:**
- GIFs are currently in `assets/gifs/`. They need to be copied to or referenced from `ui/public/gifs/` so Vite serves them as static assets.
- Use standard `<img>` tags with `loading="lazy"` for tabs 2 and 3.

**Animation:** Tab content crossfades using Framer Motion `AnimatePresence` with `mode="wait"`.

---

### 5. Metrics Explained (Streamlined)

**File:** `ui/src/components/landing/MetricsExplained.tsx` (modify existing)

**Purpose:** Educate without another card grid. Break the visual pattern.

**Layout: 2-column**
- Left column (40% width):
  - Label: "METRICS"
  - Heading: "What We Measure"
  - Brief intro: "Standard IR metrics used by researchers and engineers worldwide."
- Right column (60% width):
  - 5 metric rows, each with:
    - Color-coded icon (keep existing icons and colors)
    - Metric name in `font-mono-brand font-semibold`
    - One-line explanation (merge current `question` + `detail` into a single concise sentence)
    - Subtle `border-b border-border` divider between rows (except last)

**Responsive:** On mobile (`< md`), stack to single column — header on top, metrics below.

**Removed:** Individual card wrappers, the separate "question" field.

**Animation:** Each metric row slides in from right with stagger, using `whileInView`.

---

### 6. Why Sentifish (Minor Tweaks)

**File:** `ui/src/components/landing/WhySentifish.tsx` (minor modify)

**Changes:**
- Keep the 2x2 card grid layout — it's correct for value propositions
- Add `id="why"` for navbar anchor linking
- Add subtle diagonal gradient pattern in the section background to distinguish from metrics above:
  `bg-secondary/50` → `bg-gradient-to-br from-secondary/50 to-secondary/30`
- No structural changes

---

### 7. Final CTA Banner (New Component)

**File:** `ui/src/components/landing/CtaBanner.tsx`

**Purpose:** Strong closing conversion moment.

**Layout:**
- Full-width section with the same dark gradient as the hero (navy → indigo), creating a visual bookend
- Reuse the subtle grid overlay from hero
- Center-aligned content:
  - Heading: "Ready to Find Your Best Search API?"
  - Subtext: "Run your first benchmark in under a minute. Free, open source, no account required."
  - Dual CTAs (same style as hero): "Start Evaluating" + "View on GitHub"
- Vertical padding: `py-20`

**Animation:** Content fades in on scroll with Framer Motion `whileInView`.

---

### 8. Footer (Enhanced)

**File:** `ui/src/components/landing/Footer.tsx` (modify existing)

**Layout: 3-column on desktop, stacked on mobile**

- **Left column:** Logo + tagline
  - Fish icon + "Sentifish"
  - Below: "Open-source search provider benchmarking"

- **Center column:** Two link groups side by side
  - "Product": Dashboard, API Docs (link to README#api-documentation)
  - "Community": GitHub, Issues, Discussions

- **Right column:** Tech credibility
  - "Built with" line + small text badges: "FastAPI", "React", "TypeScript"
  - GitHub stars badge (reuse from hero, or a simple "Star us on GitHub" link)

- **Bottom row:** Full-width, `border-t border-border`, copyright text centered

---

## Landing.tsx Composition

```tsx
const Landing = () => (
  <div className="min-h-screen">
    <Navbar />
    <Hero />            {/* id="hero" */}
    <BenchmarkTable />  {/* id="providers" */}
    <HowItWorks />      {/* id="how-it-works" */}
    <MetricsExplained />{/* id="metrics" */}
    <WhySentifish />    {/* id="why" */}
    <CtaBanner />
    <Footer />
  </div>
);
```

---

## Section ID Anchors

Each section gets an `id` attribute for navbar smooth-scroll linking:
- `#hero` (scroll to top)
- `#providers` (BenchmarkTable)
- `#how-it-works` (HowItWorks)
- `#metrics` (MetricsExplained)
- `#why` (WhySentifish)

---

## Asset Changes

- Copy GIF files from `assets/gifs/` to `ui/public/gifs/` for Vite static serving
- Reference as `/gifs/02-race.gif` etc. in `<img>` tags

---

## Accessibility

- Navbar: `<nav>` element with `aria-label="Main navigation"`
- Anchor links: smooth scroll with `prefers-reduced-motion` respect
- GIF frames: `alt` text describing what's shown (e.g., "Dashboard showing provider comparison metrics")
- Table: semantic `<table>` with `<thead>`, `<th scope="col">`, `<th scope="row">` for screen readers
- CTA buttons: sufficient color contrast (brand-cyan on navy passes WCAG AA for large text)
- Mobile hamburger: `aria-expanded`, `aria-controls`

---

## Unused Asset

- `04-trend.gif` (NDCG trend over time) is not assigned to any section in this redesign. It could be added as a 4th tab in How It Works ("04 Track Trends") in a follow-up iteration, but the current 3-step model is cleaner. Keep the asset available.

---

## Out of Scope

- Dark mode toggle (not currently supported, keep light-only)
- Live data fetching for benchmark table (hardcode for now, mark TODO)
- i18n / multi-language
- Analytics / tracking integration
- SEO meta tags (separate task)
- Blog or changelog section
