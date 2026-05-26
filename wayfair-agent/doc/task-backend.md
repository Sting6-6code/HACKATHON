# Backend Build Plan — Move-in Discovery Agent MVP

> Purpose: this file is written for an engineering LLM that will execute one task at a time. Each task is intentionally small, testable, and ordered by implementation dependency.

---

## Engineering LLM Instructions

You are an engineer building this codebase.

Before writing code:

- Carefully read `doc/architecture.md`.
- Carefully read this backend task file.
- Make sure there is no misunderstanding about what is being built.

Execution rule:

- Follow the tasks below in order.
- Complete only one task at a time.
- Stop after each task is complete.
- The human will test the task, commit it to GitHub if it passes, and then ask you to continue.

### CODING PROTOCOL

Development rules:

- Use the smallest amount of code needed for the current task.
- Do not make large-scale changes.
- Do not make unrelated edits.
- Focus only on the task currently being implemented.
- Code must be precise, modular, and testable.
- Do not break existing functionality.
- If any external configuration is required, such as Supabase, AWS, Baseten, or another service, clearly tell the human exactly what is needed.

---

## Backend Goal

Make `POST /api/agent` return the exact shape the current frontend expects:

```ts
{
  runId?: string;
  roomProfile: RoomProfile;
  products: Product[];
  summary: string;
  total_estimated: string;
  reasoning: ReasoningNode[];
  layout: LayoutItem[];
}
```

The endpoint must support real sponsor APIs, but it must never block the demo. If Baseten or Subconscious fails, return a complete fallback plan with HTTP 200.

---

## Current Frontend Contract

The current frontend in `src/app/page.tsx` expects:

- `roomProfile.room_type`
- `roomProfile.dimensions.label`
- `roomProfile.dimensions.source`
- `roomProfile.style`
- `roomProfile.budget`
- `roomProfile.needs`
- `roomProfile.constraints`
- `products[].name`
- `products[].price`
- `products[].why_it_fits`
- `products[].image_url`
- `products[].product_url`
- `summary`
- `total_estimated`
- `reasoning[]`
- `layout[]`

Do not rename these fields.

---

## File Ownership

Backend may edit only:

```text
src/app/api/agent/route.ts
src/lib/types.ts
src/lib/baseten.ts
src/lib/layout.ts
src/lib/prompts.ts
src/lib/store.ts
src/lib/subconscious.ts
```

Do not edit frontend files during these tasks.

---

## Testing Commands

Use this prompt for all endpoint tests:

```text
I just moved into my first studio apartment. It is small, and I need a bed, a place to work, and some storage. I like light wood and cozy neutrals, and I want to stay under $800.
```

Curl:

```bash
curl -s -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{"userRequest":"I just moved into my first studio apartment. It is small, and I need a bed, a place to work, and some storage. I like light wood and cozy neutrals, and I want to stay under $800."}'
```

Pretty print if `jq` is available:

```bash
curl -s -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{"userRequest":"I just moved into my first studio apartment. It is small, and I need a bed, a place to work, and some storage. I like light wood and cozy neutrals, and I want to stay under $800."}' | jq
```

---

## Task 01 — Extend Shared Types

**Start:** `src/lib/types.ts` only has `Product`, `ReasoningNode`, `AgentAnswer`, `RunRecord`, `AgentSuccessResponse`, and `AgentErrorResponse`.

**Change:** Add these types:

- `RoomProfile`
- `LayoutItem`
- `AgentSource = "mock" | "fallback" | "live"`

Update:

- `RunRecord` to include `userRequest`, `roomProfile`, `layout`, and optional `source`
- `AgentSuccessResponse` to include `roomProfile`, `reasoning`, `layout`, and optional `source`

**End:** TypeScript can represent the final frontend response shape.

**Test:** Run:

```bash
npm run lint
```

If lint fails because later tasks are not implemented yet, verify there are no syntax errors in `src/lib/types.ts`.

---

## Task 02 — Add a Fallback Room Profile Constant

**Start:** Types exist.

**Change:** In `src/app/api/agent/route.ts`, add a `MOCK_ROOM_PROFILE` constant typed as `RoomProfile`.

Use:

```json
{
  "room_type": "studio apartment",
  "dimensions": {
    "label": "assumed 12 ft x 15 ft",
    "width_ft": 12,
    "length_ft": 15,
    "source": "assumed"
  },
  "style": ["light wood", "cozy neutrals", "Scandinavian"],
  "budget": 800,
  "needs": ["bed", "desk", "storage", "chair"],
  "constraints": ["small space", "first apartment", "work from home"]
}
```

**End:** The route has a room profile available before Baseten exists.

**Test:** Run:

```bash
npm run lint
```

---

## Task 03 — Upgrade Mock Products to Match the Frontend Demo

**Start:** `MOCK_PRODUCTS` has only three old products.

**Change:** Replace `MOCK_PRODUCTS` with 5 products matching the current frontend sample:

- `Hagen Solid Wood Platform Bed`, `$329`
- `Alden Compact Writing Desk`, `$158`
- `Briar Two-Door Storage Cabinet`, `$139`
- `Nora Upholstered Desk Chair`, `$92`
- `Mila Washable Area Rug`, `$58`

Use stable image URLs. Wayfair product URLs may be `https://www.wayfair.com/` for now because the frontend converts generic Wayfair URLs into search links.

**End:** Mock products produce a complete room plan and total `$776`.

**Test:** No endpoint test yet. Run lint or inspect the file.

---

## Task 04 — Upgrade Mock Reasoning

**Start:** `MOCK_REASONING` describes the old 3-item plan.

**Change:** Replace `MOCK_REASONING` with 5-7 steps that mention:

- identifying the studio move-in need
- searching for a light wood platform bed
- searching for compact desk/storage
- checking total cost against `$800`
- finalizing a 5-item plan at `$776`

**End:** Reasoning panel has useful demo content even in mock mode.

**Test:** No endpoint test yet. Run lint or inspect the file.

---

## Task 05 — Add Layout Types Import

**Start:** `route.ts` imports only `AgentAnswer`, `Product`, and `ReasoningNode`.

**Change:** Update imports from `src/lib/types.ts` to include:

- `RoomProfile`
- `LayoutItem`
- `AgentSuccessResponse`

**End:** `route.ts` can type the full response shape.

**Test:** Run:

```bash
npm run lint
```

---

## Task 06 — Create Layout Builder File

**Start:** `src/lib/layout.ts` does not exist.

**Change:** Create `src/lib/layout.ts`.

Export:

```ts
export function buildLayout(products: Product[]): LayoutItem[]
```

Use deterministic category positions compatible with the frontend:

```ts
bed:     left "7%",  top "9%",  width "40%", height "27%"
desk:    left "8%",  top "70%", width "30%", height "14%"
chair:   left "43%", top "68%", width "17%", height "18%"
storage: left "73%", top "13%", width "17%", height "31%"
rug:     left "31%", top "43%", width "38%", height "21%"
lamp:    left "65%", top "70%", width "10%", height "13%"
table:   left "52%", top "15%", width "18%", height "13%"
```

Infer category from product name:

- bed, mattress, platform -> `bed`
- desk, writing -> `desk`
- chair, armchair, seat, stool -> `chair`
- shelf, cabinet, storage, dresser, bookcase -> `storage`
- rug, mat -> `rug`
- lamp, light -> `lamp`
- table, nightstand, stand -> `table`
- default -> `table`

For duplicate categories, offset `left` and `top` using `calc(... + 4%)`.

**End:** `buildLayout(MOCK_PRODUCTS)` returns layout items that the frontend can render.

**Test:** Run:

```bash
npm run lint
```

---

## Task 07 — Use Layout Builder in Mock Response

**Start:** Mock mode returns no `layout`.

**Change:** Import `buildLayout` in `src/app/api/agent/route.ts`.

In the `USE_MOCK=true` branch:

- build `layout` from `MOCK_PRODUCTS`
- save `roomProfile`, `products`, `reasoning`, `summary`, `total_estimated`, and `layout`
- return full `AgentSuccessResponse`
- include `source: "mock"`

**End:** Mock mode returns the final frontend response shape.

**Test:** Start dev server and run curl with `USE_MOCK=true`.

Expected response keys:

```text
runId
roomProfile
products
summary
total_estimated
reasoning
layout
source
```

---

## Task 08 — Update Store Record Shape

**Start:** `saveRun()` accepts old run data without `roomProfile`, `layout`, or `userRequest`.

**Change:** Update `src/lib/store.ts` usage and `RunRecord` type so `saveRun()` stores:

- `userRequest`
- `roomProfile`
- `products`
- `reasoning`
- `summary`
- `total_estimated`
- `layout`
- optional `source`

Do not create `/api/runs/[id]` in this task.

**End:** `saveRun()` accepts the full record used by mock mode.

**Test:** Run curl with `USE_MOCK=true`. The endpoint should still return 200.

---

## Task 09 — Add Helper to Build Success Response

**Start:** `route.ts` constructs response objects inline.

**Change:** Add a small local helper in `route.ts`:

```ts
function buildSuccessResponse(args: {
  runId: string;
  userRequest: string;
  roomProfile: RoomProfile;
  products: Product[];
  reasoning: ReasoningNode[];
  summary: string;
  total_estimated: string;
  source: AgentSource;
}): AgentSuccessResponse
```

The helper should:

- call `buildLayout(products)`
- call `saveRun(...)`
- return the full frontend response shape

**End:** Mock and live paths can share one response builder.

**Test:** Mock curl still returns the same keys.

---

## Task 10 — Preserve Empty Input Validation

**Start:** `POST` currently returns 400 when `userRequest` is empty.

**Change:** Keep this behavior unchanged.

Do not fallback for empty input. Empty input is a real user error.

**End:** Empty input returns:

```json
{ "error": "userRequest is required" }
```

with HTTP 400.

**Test:**

```bash
curl -i -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{"userRequest":""}'
```

---

## Task 11 — Add Safe JSON Extraction Utility

**Start:** `parseAnswer()` only strips simple markdown fences.

**Change:** Improve or add a local helper in `route.ts`:

```ts
function parseJsonObject(raw: string): unknown | null
```

It should handle:

- plain JSON object
- fenced JSON block
- extra prose before/after JSON by extracting from first `{` to last `}`

Keep it small. Do not add a dependency.

**End:** Both Baseten and Subconscious parsing can reuse it.

**Test:** Add temporary mental/manual test only, or run lint.

---

## Task 12 — Update `parseAnswer()` to Use Safe JSON Extraction

**Start:** `parseAnswer()` uses `JSON.parse(cleaned)` directly.

**Change:** Make `parseAnswer(raw)` call `parseJsonObject(raw)`.

Return `AgentAnswer | null` only when:

- parsed object has `products` as an array
- `summary` is a string
- `total_estimated` is a string

**End:** Subconscious final answer parsing is more robust.

**Test:** Run lint.

---

## Task 13 — Create Baseten Helper File With Fallback Only

**Start:** `src/lib/baseten.ts` does not exist.

**Change:** Create `src/lib/baseten.ts`.

Export:

```ts
export const FALLBACK_ROOM_PROFILE: RoomProfile
export async function extractRoomProfile(userRequest: string): Promise<RoomProfile>
```

For this task only, `extractRoomProfile()` should always return `FALLBACK_ROOM_PROFILE`.

Do not call the network yet.

**End:** Backend can import a stable room profile helper before real Baseten integration.

**Test:** Run lint.

---

## Task 14 — Use `extractRoomProfile()` in `/api/agent`

**Start:** `route.ts` uses local `MOCK_ROOM_PROFILE`.

**Change:** Import `extractRoomProfile` from `src/lib/baseten.ts`.

In `POST`:

- call `const roomProfile = await extractRoomProfile(userRequest)`
- use `roomProfile` in mock response
- remove or stop using local `MOCK_ROOM_PROFILE` if duplicated

**End:** `/api/agent` has the final Baseten integration seam, even though it still returns fallback.

**Test:** Curl with `USE_MOCK=true`; verify `roomProfile` exists.

---

## Task 15 — Add Baseten Environment Guard

**Start:** `extractRoomProfile()` always returns fallback.

**Change:** In `src/lib/baseten.ts`, add an environment guard:

- if `BASETEN_API_KEY` is missing, return fallback
- if `BASETEN_MODEL` is missing, return fallback

Do not call the network yet.

Use `BASETEN_MODEL` as the model slug env var.

**End:** Missing Baseten config never breaks the endpoint.

**Test:** With no Baseten env vars, curl still returns HTTP 200 and fallback `roomProfile`.

---

## Task 16 — Add Baseten Chat Completion Call

**Start:** `extractRoomProfile()` has env guards.

**Change:** Implement the real Baseten call in `src/lib/baseten.ts`.

Use Baseten Model APIs chat completions:

- URL: `https://inference.baseten.co/v1/chat/completions`
- method: `POST`
- headers:
  - `Content-Type: application/json`
  - `Authorization: Api-Key ${BASETEN_API_KEY}`
- body:

```ts
{
  model: process.env.BASETEN_MODEL,
  messages: [
    { role: "system", content: BASETEN_ROOM_PROFILE_PROMPT },
    { role: "user", content: userRequest }
  ],
  max_tokens: 700
}
```

Parse response from:

```ts
data.choices?.[0]?.message?.content
```

If fetch, response parsing, or JSON validation fails, return fallback.

**End:** Baseten can extract room profile when env vars are present.

**Test without keys:** Endpoint still returns fallback profile.

**Test with keys:** Endpoint returns a profile influenced by the prompt.

---

## Task 17 — Validate Baseten Room Profile Shape

**Start:** Baseten JSON may be malformed or missing fields.

**Change:** Add a local validator in `src/lib/baseten.ts`:

```ts
function normalizeRoomProfile(value: unknown): RoomProfile
```

It should:

- require `room_type` string, else fallback room type
- require `dimensions.label` string, else fallback dimensions
- allow `dimensions.source` only `"user"` or `"assumed"`
- keep `budget` only if number
- keep `style`, `needs`, `constraints` only if string arrays
- use fallback values for missing arrays

**End:** `extractRoomProfile()` always returns a valid `RoomProfile`.

**Test:** Temporarily inspect with missing env vars; endpoint still returns complete arrays.

---

## Task 18 — Include Room Profile in Subconscious Instructions

**Start:** Subconscious prompt only includes `WAYFAIR_AGENT_PROMPT` and user request.

**Change:** In `route.ts`, update instructions to include:

```text
# Room profile
{JSON.stringify(roomProfile, null, 2)}

# User request
...
```

Do this before calling `getSubconscious().run(...)`.

**End:** Subconscious receives structured room context from Baseten/fallback.

**Test:** Run lint.

---

## Task 19 — Return Full Shape on Parsed Subconscious Success

**Start:** Parsed Subconscious success returns only old fields.

**Change:** When `parsed` exists:

- call `buildSuccessResponse`
- include `roomProfile`
- include `parsed.products`
- include flattened `reasoning`
- include `parsed.summary`
- include `parsed.total_estimated`
- set `source: "live"`

**End:** Live Subconscious success matches frontend contract.

**Test:** With Subconscious key available, curl returns `layout` and `roomProfile`.

---

## Task 20 — Return Fallback Shape on Subconscious Parse Failure

**Start:** Non-JSON Subconscious answer returns products `[]`, raw summary, and old shape.

**Change:** If Subconscious returns non-JSON:

- do not return empty products for demo
- return mock products
- set summary to raw answer if non-empty, else mock summary
- use real flattened reasoning if available, else mock reasoning
- build layout from mock products
- set `source: "fallback"`

**End:** Bad model formatting does not break the UI.

**Test:** Hard to force naturally; verify code path exists and lint passes.

---

## Task 21 — Return Fallback Shape on Subconscious Exception

**Start:** Catch block returns HTTP 500.

**Change:** In `catch`, return HTTP 200 with full fallback response unless the error is from empty input validation.

Fallback response should include:

- `roomProfile`: fallback profile if extraction failed
- `products`: mock products
- `summary`: mock summary plus a short note if useful
- `total_estimated`: `$776`
- `reasoning`: mock reasoning
- `layout`: built from mock products
- `source: "fallback"`

**End:** Sponsor API failure never crashes the demo.

**Test:** Remove or omit `SUBCONSCIOUS_API_KEY`, keep `USE_MOCK` unset, then curl. Expected HTTP 200 with full response.

---

## Task 22 — Avoid Calling Subconscious in Mock Mode

**Start:** Mock mode should already short-circuit.

**Change:** Confirm `process.env.USE_MOCK === "true"` returns before any Subconscious call.

If necessary, move the mock branch immediately after `extractRoomProfile(userRequest)`.

**End:** Demo can run with only `USE_MOCK=true` and no sponsor keys.

**Test:** Set `USE_MOCK=true` and remove sponsor keys. Curl returns HTTP 200.

---

## Task 23 — Add Optional Source Field Without Breaking Frontend

**Start:** Frontend ignores unknown fields.

**Change:** Ensure every success response includes:

```ts
source: "mock" | "fallback" | "live"
```

Do not require frontend changes.

**End:** Debugging is easier during live demo.

**Test:** Curl response includes `source`.

---

## Task 24 — Keep Product URLs Safe

**Start:** Live products may omit `product_url` or return non-Wayfair URLs.

**Change:** Do not reject products for missing URLs.

If mock products use placeholder/example URLs, prefer `https://www.wayfair.com/` because frontend turns it into a Wayfair search URL.

Do not fabricate specific Wayfair PDP URLs.

**End:** Product cards always have reasonable behavior.

**Test:** Product cards in frontend show either `View on Wayfair` or `Search on Wayfair`.

---

## Task 25 — Final Endpoint Contract Test

**Start:** All route changes are complete.

**Change:** No code change unless this test fails.

**Test:** Run dev server and curl.

Verify response:

- HTTP status is 200 for valid input
- `roomProfile.room_type` exists
- `roomProfile.dimensions.label` exists
- `roomProfile.dimensions.source` is `"user"` or `"assumed"`
- `products.length` is between 3 and 5
- every product has `name`, `price`, `why_it_fits`
- `summary` is non-empty
- `total_estimated` is non-empty
- `reasoning.length` is at least 3
- `layout.length` is at least 3
- every layout item has `left`, `top`, `width`, `height`

**End:** Frontend can render without using its local fallback completion.

---

## Task 26 — Final Lint

**Start:** Endpoint contract test passes.

**Change:** No intended code change.

**Test:**

```bash
npm run lint
```

**End:** Backend work is ready for frontend integration.

---

## Do Not Build

- Do not build `/api/runs/[id]`
- Do not create a database
- Do not scrape Wayfair outside Subconscious
- Do not edit frontend components
- Do not add Cloudflare deployment
- Do not add image generation
