# Architecture — Move-in Discovery Agent

> Goal: turn a messy move-in request into a coordinated Wayfair shopping plan with room understanding, budget reasoning, a simple 2D layout preview, and visible agent reasoning.

---

## 1. Product Shape

This is a consumer discovery agent for Wayfair shoppers.

The user should not fill out filters. They describe their situation naturally:

```text
I just moved into my first studio apartment. It is small, and I need a bed, a place to work, and some storage. I like light wood and cozy neutrals, and I want to stay under $800.
```

The app returns:

- parsed room profile
- 3-5 Wayfair product recommendations
- total budget summary
- 2D top-down layout preview
- reasoning trace showing how the agent made decisions

---

## 2. High-Level Architecture

```text
User
 |
 | free-form room request
 v
Next.js Homepage
 |
 | POST /api/agent
 v
Next.js Route Handler
 |
 |-------------------------------|
 |                               |
 v                               v
Baseten                      Subconscious
Room profile extraction      Wayfair discovery agent
 |                               |
 |                               v
 |                         fast_search tool
 |                               |
 |                               v
 |                         wayfair.com results
 |                               |
 |-------------------------------|
 v
Combined response
 |
 v
Frontend UI
- Room Profile
- Product Cards
- Budget Bar
- 2D Layout Preview
- Reasoning Panel
```

---

## 3. Current Project Mapping

Current files already present:

```text
src/app/page.tsx                  # currently default Next.js page; replace with MVP UI
src/app/api/agent/route.ts        # already calls Subconscious; extend response shape
src/lib/subconscious.ts           # Subconscious client and fast_search tool config
src/lib/prompts.ts                # agent prompts; update for new MVP
src/lib/store.ts                  # in-memory run store
src/lib/types.ts                  # shared TypeScript types; extend for room/layout
src/components/ui/*               # shadcn/base UI components
```

Recommended new files:

```text
src/lib/baseten.ts                # Baseten room profile extraction with fallback
src/lib/layout.ts                 # deterministic 2D layout generation from products
src/components/RoomProfileCard.tsx
src/components/ProductGrid.tsx
src/components/BudgetBar.tsx
src/components/LayoutPreview.tsx
src/components/ReasoningPanel.tsx
```

Optional, only if time remains:

```text
src/app/api/runs/[id]/route.ts    # GET stored run by id
```

Do not build a separate reasoning page for MVP. Show reasoning on the homepage.

---

## 4. Technology Choices

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js App Router | Existing project, fast full-stack demo |
| UI | Tailwind + existing UI components | Already installed, low setup cost |
| Room understanding | Baseten Model API | Extracts structured room profile from natural language |
| Product discovery | Subconscious | Agent runtime with tool use and reasoning trace |
| Search | Subconscious `fast_search` | Finds Wayfair products without custom browser automation |
| State | In-memory Map | Good enough for a live hackathon demo |
| Layout preview | CSS top-down plan | Reliable and fast; avoids weak photorealistic rendering |

---

## 5. Data Flow

### Step 1 — User Input

The homepage contains one free-form text area and 2-3 example prompts.

No dropdowns. No required filters.

### Step 2 — `POST /api/agent`

Request:

```ts
{
  userRequest: string;
}
```

### Step 3 — Baseten Room Profile

The backend calls Baseten to convert the free-form request into a room profile.

Target output:

```ts
type RoomProfile = {
  room_type: string;
  dimensions: {
    label: string;
    width_ft?: number;
    length_ft?: number;
    source: "user" | "assumed";
  };
  style: string[];
  budget?: number;
  needs: string[];
  constraints: string[];
};
```

Example:

```json
{
  "room_type": "studio apartment",
  "dimensions": {
    "label": "assumed 12 ft x 15 ft",
    "width_ft": 12,
    "length_ft": 15,
    "source": "assumed"
  },
  "style": ["Scandinavian", "light wood", "cozy neutrals"],
  "budget": 800,
  "needs": ["bed", "desk", "storage", "chair"],
  "constraints": ["small space", "work from home"]
}
```

If Baseten fails, use a local fallback profile so the demo never blocks.

### Step 4 — Subconscious Product Discovery

The backend sends both the original user request and the room profile to Subconscious.

Subconscious should:

- identify the best shopping categories
- search Wayfair through `fast_search`
- select a coherent product set
- keep the total near or under budget
- return strict JSON
- provide reasoning through `run.result.reasoning`

Target product answer:

```ts
type AgentAnswer = {
  products: Product[];
  summary: string;
  total_estimated: string;
};
```

### Step 5 — Layout Generation

The app generates a deterministic 2D layout from product categories.

This is intentionally not a render. It is a planning preview.

Example category positions:

```ts
const layoutMap = {
  bed: { left: "8%", top: "10%", width: "38%", height: "24%" },
  desk: { left: "10%", top: "68%", width: "28%", height: "14%" },
  chair: { left: "68%", top: "64%", width: "18%", height: "18%" },
  storage: { left: "72%", top: "14%", width: "16%", height: "32%" },
  rug: { left: "30%", top: "42%", width: "40%", height: "22%" },
  table: { left: "44%", top: "68%", width: "20%", height: "14%" }
};
```

Product category can be inferred from product name and need:

```text
bed, mattress, platform -> bed
desk, writing table -> desk
chair, armchair -> chair
shelf, cabinet, storage -> storage
rug -> rug
lamp -> lamp
table, nightstand -> table
```

### Step 6 — Combined Response

`POST /api/agent` should return:

```ts
{
  runId: string;
  roomProfile: RoomProfile;
  products: Product[];
  summary: string;
  total_estimated: string;
  reasoning: ReasoningNode[];
  layout: LayoutItem[];
}
```

---

## 6. Core Types

```ts
type Product = {
  name: string;
  price: string;
  why_it_fits: string;
  image_url?: string;
  product_url?: string;
};

type LayoutItem = {
  id: string;
  label: string;
  category: string;
  price?: string;
  left: string;
  top: string;
  width: string;
  height: string;
};

type ReasoningNode = {
  step: number;
  type: "thought" | "tool_call" | "observation";
  content: string;
  tool?: string;
  duration_ms?: number;
};
```

---

## 7. Frontend MVP

Homepage sections, in order:

1. Hero/input area
   - project name: Move-in Discovery Agent
   - one text area
   - example prompt chips
   - submit button

2. Result summary
   - room profile card
   - budget bar

3. Product plan
   - product cards with image, name, price, reason, Wayfair link

4. Spatial fit preview
   - 2D room rectangle
   - positioned furniture blocks
   - room dimension label

5. Reasoning panel
   - show flattened Subconscious reasoning steps
   - use short labels: Thought, Search, Observation

---

## 8. Fallback Strategy

The demo must work even if sponsor APIs fail.

Fallback order:

1. If Baseten fails:
   - use default room profile based on the happy-path prompt.

2. If Subconscious fails:
   - use mock products and mock reasoning.

3. If Subconscious returns non-JSON:
   - show raw summary and no products, but do not crash.

4. If product images fail:
   - show a neutral placeholder.

Set `USE_MOCK=true` for emergency demo mode.

---

## 9. MVP Cut Points

Must-have:

- free-form input
- mock-backed product cards
- room profile card
- budget bar
- 2D layout preview
- reasoning panel on homepage

Nice-to-have:

- real Baseten room profile extraction
- real Wayfair product links/images
- `GET /api/runs/[id]`
- polished loading skeletons

Cut if time runs out:

- photorealistic rendering
- floor plan editor
- separate reasoning page
- Cloudflare deployment
- checkout recovery

---

## 10. Demo Happy Path

Use this exact prompt for the live demo:

```text
I just moved into my first studio apartment. It is small, and I need a bed, a place to work, and some storage. I like light wood and cozy neutrals, and I want to stay under $800.
```

Demo narrative:

> Wayfair has millions of products, but new movers do not want to filter forever. Our agent turns a messy move-in request into a coordinated room plan. Baseten extracts the room profile, Subconscious searches Wayfair and reasons over product choices, and the UI shows products, budget, and a spatial fit preview.
