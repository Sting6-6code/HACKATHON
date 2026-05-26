# Move-in Discovery Agent

A one-page Wayfair demo that turns a natural-language move-in request into a coordinated room plan with products, budget tracking, spatial fit, and visible agent reasoning.

## Demo Prompt

```text
I just moved into my first studio apartment. It is small, and I need a bed, a place to work, and some storage. I like light wood and cozy neutrals, and I want to stay under $800.
```

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For emergency demo mode, set `USE_MOCK=true` before starting the app. The frontend also keeps a local fallback response so the page remains presentable if `/api/agent` is unavailable or returns a partial response.

## Frontend Contract

The homepage posts:

```ts
{ userRequest: string }
```

It renders this response shape:

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

## Pitch

Wayfair has millions of products, but new movers do not want to filter forever. Our agent turns a messy move-in request into a coordinated room plan. Baseten extracts the room profile, Subconscious searches Wayfair and reasons over product choices, and the UI shows products, budget, and a spatial fit preview.
