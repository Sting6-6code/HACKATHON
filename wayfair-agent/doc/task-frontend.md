# Frontend + Demo Tasks — Move-in Discovery Agent

> Mission: build a polished one-page demo that works against the Backend response contract and still looks good in mock mode.

---

## Ownership

You own:

```text
src/app/page.tsx
src/app/layout.tsx
src/app/globals.css
src/components/ProductGrid.tsx
src/components/RoomProfileCard.tsx
src/components/BudgetBar.tsx
src/components/LayoutPreview.tsx
src/components/ReasoningPanel.tsx
src/components/ui/*
README.md
```

Avoid editing:

```text
src/app/api/agent/route.ts
src/lib/baseten.ts
src/lib/layout.ts
src/lib/prompts.ts
src/lib/store.ts
src/lib/subconscious.ts
```

If Backend has not pushed `src/lib/types.ts` yet, define temporary local UI types inside `page.tsx`. Replace them with imports later only if time allows.

---

## Phase F1 — 0:00-0:10: Build Against Contract

- [ ] Read `doc/task.md` API contract
- [ ] Assume `POST /api/agent` returns:
  - `roomProfile`
  - `products`
  - `summary`
  - `total_estimated`
  - `reasoning`
  - `layout`
- [ ] Do not wait for real APIs
- [ ] Start with local fallback sample response in `page.tsx` if `/api/agent` is not ready

**Checkpoint:** you can build UI while Backend is still working.

---

## Phase F2 — 0:10-0:30: Homepage Input + Result Shell

Files:

```text
src/app/page.tsx
```

Tasks:

- [ ] Replace default Next.js starter page
- [ ] Add project title: Move-in Discovery Agent
- [ ] Add concise subtitle:

```text
Describe your move-in situation. The agent turns it into a coordinated Wayfair room plan.
```

- [ ] Add large free-form text area
- [ ] Add example chips:
  - First studio
  - Work-from-home corner
  - Shared living room
- [ ] Add submit button
- [ ] POST to `/api/agent`
- [ ] Add loading state
- [ ] Add error state with fallback-friendly copy

Happy-path prompt:

```text
I just moved into my first studio apartment. It is small, and I need a bed, a place to work, and some storage. I like light wood and cozy neutrals, and I want to stay under $800.
```

**Checkpoint:** submitting text updates the page with any response or local fallback.

---

## Phase F3 — 0:30-0:50: Core Result Components

Create:

```text
src/components/RoomProfileCard.tsx
src/components/BudgetBar.tsx
src/components/ProductGrid.tsx
```

Tasks:

- [ ] `RoomProfileCard`
  - show room type
  - show dimensions label
  - show style chips
  - show needs and constraints

- [ ] `BudgetBar`
  - parse budget from `roomProfile.budget`
  - parse total from `total_estimated`
  - show `$776 / $800`
  - show under/over budget status

- [ ] `ProductGrid`
  - show 3-5 product cards
  - image area with graceful fallback
  - product name
  - price
  - `why_it_fits`
  - Wayfair link if available

**Checkpoint:** the result already looks demo-worthy without the layout preview.

---

## Phase F4 — 0:50-1:05: 2D Layout Preview

Create:

```text
src/components/LayoutPreview.tsx
```

Tasks:

- [ ] Render a top-down room rectangle
- [ ] Show room dimensions label
- [ ] Render each `layout` item as an absolutely positioned block
- [ ] Show item label and price
- [ ] Use simple category styling:
  - bed: largest block
  - desk/table/storage: rectangular blocks
  - chair/lamp: smaller blocks
  - rug: centered soft block
- [ ] Add small caption:

```text
Spatial fit preview, not a photorealistic render.
```

**Checkpoint:** the page clearly communicates "these items fit into the room."

---

## Phase F5 — 1:05-1:15: Reasoning + Polish

Create:

```text
src/components/ReasoningPanel.tsx
```

Tasks:

- [ ] Show first 5-8 reasoning steps
- [ ] Map types:
  - `thought` -> Thought
  - `tool_call` -> Search
  - `observation` -> Observation
- [ ] Keep text clipped or wrapped so the page stays clean
- [ ] Update metadata in `src/app/layout.tsx`:
  - title: Move-in Discovery Agent
  - description: Wayfair shopping agent for new movers
- [ ] Do quick spacing/color polish

**Checkpoint:** full story is visible on one page: prompt -> profile -> products -> budget -> layout -> reasoning.

---

## Phase F6 — 1:15-1:30: Demo Prep

- [ ] Pull Backend changes
- [ ] Test real `/api/agent`
- [ ] Test fallback/mock path
- [ ] Run happy path twice
- [ ] Record 30-60 second backup demo
- [ ] Prepare pitch

Pitch:

> Wayfair has millions of products, but new movers do not want to filter forever. Our agent turns a messy move-in request into a coordinated room plan. Baseten extracts the room profile, Subconscious searches Wayfair and reasons over product choices, and the UI shows products, budget, and a spatial fit preview.

---

## Visual Direction

Keep it simple and buyer-facing:

- clean white or warm neutral background
- no dark dashboard look
- no fake photorealistic render
- product cards should be readable
- layout preview should look like planning, not a low-quality image

Avoid:

- complex animations
- nested cards everywhere
- giant marketing hero that pushes the app below the fold
- dropdown/filter-heavy input

---

## Do Not Build

- separate reasoning route
- room render/image generation
- floor plan editor
- auth
- checkout flow
- deployment work
