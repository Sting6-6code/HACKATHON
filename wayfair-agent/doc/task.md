# Tasks — 90 Minute Parallel Plan

> Goal: two people finish the Move-in Discovery Agent demo with minimal file conflicts.

---

## Roles

| Member | Owns | Main output |
|---|---|---|
| Backend | API, Baseten, Subconscious, shared response contract | `/api/agent` returns complete demo data |
| Frontend + Demo | Homepage UI, components, layout preview rendering, pitch | polished one-page demo |

Detailed task files:

- Backend: `doc/task-backend.md`
- Frontend + Demo: `doc/task-frontend.md`

---

## File Ownership

### Backend owns

Backend may edit:

```text
src/app/api/agent/route.ts
src/lib/types.ts
src/lib/baseten.ts
src/lib/layout.ts
src/lib/prompts.ts
src/lib/store.ts
src/lib/subconscious.ts
```

Backend should avoid editing:

```text
src/app/page.tsx
src/components/*
src/app/globals.css
src/app/layout.tsx
```

### Frontend + Demo owns

Frontend may edit:

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

Frontend should avoid editing:

```text
src/app/api/agent/route.ts
src/lib/baseten.ts
src/lib/layout.ts
src/lib/prompts.ts
src/lib/store.ts
src/lib/subconscious.ts
```

Shared file:

```text
src/lib/types.ts
```

Backend edits `types.ts` first. Frontend imports types after Backend pushes. If time is tight, Frontend can temporarily define local loose types in `page.tsx` and replace them later.

---

## API Contract

Frontend should code against this response shape:

```ts
type AgentResponse = {
  runId: string;
  roomProfile: {
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
  products: {
    name: string;
    price: string;
    why_it_fits: string;
    image_url?: string;
    product_url?: string;
  }[];
  summary: string;
  total_estimated: string;
  reasoning: {
    step: number;
    type: "thought" | "tool_call" | "observation";
    content: string;
    tool?: string;
    duration_ms?: number;
  }[];
  layout: {
    id: string;
    label: string;
    category: string;
    price?: string;
    left: string;
    top: string;
    width: string;
    height: string;
  }[];
};
```

Even when sponsor APIs fail, Backend must return this shape using fallback data.

---

## Timeline

```text
0:00-0:05   Sync: confirm prompt, API contract, file ownership
0:05-0:30   Backend builds complete mock-backed API
0:05-0:35   Frontend builds UI from expected response shape
0:35-0:50   Integrate: point UI at real /api/agent
0:50-1:05   Add Baseten real call if key is ready
1:05-1:15   Polish UI + reasoning + copy
1:15-1:25   Test happy path twice
1:25-1:30   Freeze and record backup demo
```

---

## Merge Strategy

1. Backend pushes first once `/api/agent` returns the final response shape.
2. Frontend pulls Backend before final integration.
3. Frontend pushes UI after confirming it renders the Backend response.
4. No one edits ownership-crossing files after the 1:15 freeze unless the demo is broken.

---

## Demo Happy Path

Use exactly this input:

```text
I just moved into my first studio apartment. It is small, and I need a bed, a place to work, and some storage. I like light wood and cozy neutrals, and I want to stay under $800.
```

Pitch:

> Wayfair has millions of products, but new movers do not want to filter forever. Our agent turns a messy move-in request into a coordinated room plan. Baseten extracts the room profile, Subconscious searches Wayfair and reasons over product choices, and the UI shows products, budget, and a spatial fit preview.

---

## Cut Rules

Keep:

- one-page demo
- mock fallback
- room profile
- product cards
- budget bar
- 2D layout preview
- reasoning panel

Cut:

- separate reasoning route
- Cloudflare deployment
- photorealistic render
- floor plan editor
- checkout flow
