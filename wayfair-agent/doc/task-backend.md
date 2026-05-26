# Backend Tasks — Move-in Discovery Agent

> Mission: make `/api/agent` return complete, stable demo data. Frontend should never block on real sponsor APIs.

---

## Ownership

You own:

```text
src/app/api/agent/route.ts
src/lib/types.ts
src/lib/baseten.ts
src/lib/layout.ts
src/lib/prompts.ts
src/lib/store.ts
src/lib/subconscious.ts
```

Avoid editing:

```text
src/app/page.tsx
src/components/*
src/app/globals.css
src/app/layout.tsx
```

---

## Phase B1 — 0:00-0:10: Lock Response Contract

- [ ] Extend `src/lib/types.ts` with:
  - `RoomProfile`
  - `LayoutItem`
  - updated `RunRecord`
  - updated `AgentSuccessResponse`
- [ ] Confirm `POST /api/agent` response includes:

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

**Checkpoint:** Frontend can code against this contract.

---

## Phase B2 — 0:10-0:25: Mock-Backed Complete API

- [ ] Update mock data in `src/app/api/agent/route.ts`
- [ ] Add mock `roomProfile`
- [ ] Add mock products for the happy path:
  - platform bed
  - compact desk
  - storage shelf
  - accent chair
  - optional rug or lamp
- [ ] Add mock reasoning trace
- [ ] Ensure `USE_MOCK=true` returns the full response shape
- [ ] Save full run record in `src/lib/store.ts`

**Checkpoint command:**

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{"userRequest":"I just moved into my first studio apartment. It is small, and I need a bed, a place to work, and some storage. I like light wood and cozy neutrals, and I want to stay under $800."}'
```

**Expected:** JSON includes `roomProfile`, `products`, `layout`, and `reasoning`.

---

## Phase B3 — 0:25-0:40: Layout Generation

- [ ] Create `src/lib/layout.ts`
- [ ] Export `buildLayout(products: Product[]): LayoutItem[]`
- [ ] Infer product category from name:
  - bed, mattress, platform -> `bed`
  - desk, writing table -> `desk`
  - chair, armchair -> `chair`
  - shelf, cabinet, storage -> `storage`
  - rug -> `rug`
  - lamp -> `lamp`
  - table, nightstand -> `table`
- [ ] Use deterministic CSS positions from `architecture.md`
- [ ] Include `layout` in both mock and real API responses

**Checkpoint:** API response always includes at least 3 layout blocks.

---

## Phase B4 — 0:40-0:55: Baseten Room Profile

- [ ] Create `src/lib/baseten.ts`
- [ ] Export `extractRoomProfile(userRequest: string): Promise<RoomProfile>`
- [ ] Use `BASETEN_ROOM_PROFILE_PROMPT` from `src/lib/prompts.ts`
- [ ] If `BASETEN_API_KEY` is missing, return fallback profile
- [ ] If Baseten response is invalid JSON, return fallback profile
- [ ] Keep timeout/implementation simple; do not let this block the demo

Fallback profile:

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

**Checkpoint:** `/api/agent` returns `roomProfile` even with no Baseten key.

---

## Phase B5 — 0:55-1:10: Subconscious Integration

- [ ] Call `extractRoomProfile()` before Subconscious
- [ ] Include both `userRequest` and `roomProfile` in Subconscious instructions
- [ ] Keep existing `flattenReasoning()` and `parseAnswer()`
- [ ] If Subconscious succeeds:
  - parse products
  - build layout
  - save run
  - return full response
- [ ] If Subconscious fails:
  - return mock products, fallback reasoning, room profile, and layout

**Important:** Do not return HTTP 500 for sponsor API failure during the demo. Return fallback data.

---

## Phase B6 — 1:10-1:20: Verify + Push

- [ ] Run `npm run lint` if time allows
- [ ] Test mock mode once
- [ ] Test real mode once if keys are ready
- [ ] Push Backend branch/changes first so Frontend can pull API contract

**Done when:** Frontend can submit to `/api/agent` and render full data without local mocks.

---

## Do Not Build

- `GET /api/runs/[id]` unless everything else is finished
- separate reasoning page
- database
- product scraping outside Subconscious
- Cloudflare deployment
