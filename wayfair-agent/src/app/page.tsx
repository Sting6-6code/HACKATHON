"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";

import { BudgetBar } from "@/components/BudgetBar";
import { LayoutPreview } from "@/components/LayoutPreview";
import { ProductGrid } from "@/components/ProductGrid";
import { ReasoningPanel } from "@/components/ReasoningPanel";
import { RoomProfileCard } from "@/components/RoomProfileCard";
import { Button } from "@/components/ui/button";

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

type Product = {
  name: string;
  price: string;
  why_it_fits: string;
  image_url?: string;
  product_url?: string;
};

type ReasoningNode = {
  step: number;
  type: "thought" | "tool_call" | "observation";
  content: string;
  tool?: string;
  duration_ms?: number;
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

type AgentResponse = {
  runId?: string;
  roomProfile: RoomProfile;
  products: Product[];
  summary: string;
  total_estimated: string;
  reasoning: ReasoningNode[];
  layout: LayoutItem[];
};

const HAPPY_PATH_PROMPT =
  "I just moved into my first studio apartment. It is small, and I need a bed, a place to work, and some storage. I like light wood and cozy neutrals, and I want to stay under $800.";

const examples = [
  {
    label: "First studio",
    prompt: HAPPY_PATH_PROMPT,
  },
  {
    label: "Work-from-home corner",
    prompt:
      "I need to carve out a work-from-home corner in my living room with a compact desk, comfortable chair, storage, and warm modern style under $650.",
  },
  {
    label: "Shared living room",
    prompt:
      "My roommate and I need a shared living room setup with seating for friends, a coffee table, soft lighting, and durable neutral pieces under $900.",
  },
];

const sampleResponse: AgentResponse = {
  runId: "mock-demo",
  roomProfile: {
    room_type: "studio apartment",
    dimensions: {
      label: "assumed 12 ft x 15 ft",
      width_ft: 12,
      length_ft: 15,
      source: "assumed",
    },
    style: ["light wood", "cozy neutrals", "Scandinavian"],
    budget: 800,
    needs: ["bed", "desk", "storage", "chair"],
    constraints: ["small space", "first apartment", "work from home"],
  },
  products: [
    {
      name: "Hagen Solid Wood Platform Bed",
      price: "$329",
      why_it_fits:
        "A low-profile light wood frame anchors the sleeping area without making the studio feel crowded.",
      image_url:
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
      product_url: "https://www.wayfair.com/",
    },
    {
      name: "Alden Compact Writing Desk",
      price: "$158",
      why_it_fits:
        "The slim desktop creates a real work zone while leaving walkway space open near the foot of the bed.",
      image_url:
        "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=900&q=80",
      product_url: "https://www.wayfair.com/",
    },
    {
      name: "Briar Two-Door Storage Cabinet",
      price: "$139",
      why_it_fits:
        "Closed storage hides everyday clutter and doubles as a landing surface in a small apartment.",
      image_url:
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80",
      product_url: "https://www.wayfair.com/",
    },
    {
      name: "Nora Upholstered Desk Chair",
      price: "$92",
      why_it_fits:
        "A soft neutral seat keeps the work corner comfortable and visually connected to the cozy palette.",
      image_url:
        "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=900&q=80",
      product_url: "https://www.wayfair.com/",
    },
    {
      name: "Mila Washable Area Rug",
      price: "$58",
      why_it_fits:
        "The rug visually separates the bed and work zones while adding warmth without blowing the budget.",
      image_url:
        "https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?auto=format&fit=crop&w=900&q=80",
      product_url: "https://www.wayfair.com/",
    },
  ],
  summary:
    "A compact studio plan with light wood anchor pieces, closed storage, a dedicated work corner, and soft neutral texture while staying under budget.",
  total_estimated: "$776",
  reasoning: [
    {
      step: 1,
      type: "thought",
      content:
        "The user needs a first-apartment studio plan, so prioritize multi-zone function over decorative extras.",
    },
    {
      step: 2,
      type: "tool_call",
      tool: "fast_search",
      content: '{"query":"Wayfair light wood platform bed small studio"}',
      duration_ms: 940,
    },
    {
      step: 3,
      type: "observation",
      content:
        "A low platform bed gives the room a visual anchor and keeps sight lines open.",
    },
    {
      step: 4,
      type: "tool_call",
      tool: "fast_search",
      content: '{"query":"compact writing desk storage cabinet Wayfair"}',
      duration_ms: 1120,
    },
    {
      step: 5,
      type: "thought",
      content:
        "The bed, desk, storage, chair, and rug total $776, leaving a small buffer under the $800 target.",
    },
  ],
  layout: [
    {
      id: "bed",
      label: "Platform bed",
      category: "bed",
      price: "$329",
      left: "7%",
      top: "9%",
      width: "40%",
      height: "27%",
    },
    {
      id: "desk",
      label: "Writing desk",
      category: "desk",
      price: "$158",
      left: "8%",
      top: "70%",
      width: "30%",
      height: "14%",
    },
    {
      id: "storage",
      label: "Storage",
      category: "storage",
      price: "$139",
      left: "73%",
      top: "13%",
      width: "17%",
      height: "31%",
    },
    {
      id: "chair",
      label: "Chair",
      category: "chair",
      price: "$92",
      left: "43%",
      top: "68%",
      width: "17%",
      height: "18%",
    },
    {
      id: "rug",
      label: "Area rug",
      category: "rug",
      price: "$58",
      left: "31%",
      top: "43%",
      width: "38%",
      height: "21%",
    },
  ],
};

const layoutMap: Record<string, Omit<LayoutItem, "id" | "label" | "category" | "price">> = {
  bed: { left: "7%", top: "9%", width: "40%", height: "27%" },
  desk: { left: "8%", top: "70%", width: "30%", height: "14%" },
  chair: { left: "43%", top: "68%", width: "17%", height: "18%" },
  storage: { left: "73%", top: "13%", width: "17%", height: "31%" },
  rug: { left: "31%", top: "43%", width: "38%", height: "21%" },
  lamp: { left: "65%", top: "70%", width: "10%", height: "13%" },
  table: { left: "52%", top: "15%", width: "18%", height: "13%" },
};

function inferCategory(product: Product) {
  const text = product.name.toLowerCase();
  if (/bed|mattress|platform/.test(text)) return "bed";
  if (/desk|writing/.test(text)) return "desk";
  if (/chair|seat|stool/.test(text)) return "chair";
  if (/shelf|cabinet|storage|dresser|bookcase/.test(text)) return "storage";
  if (/rug|mat/.test(text)) return "rug";
  if (/lamp|light/.test(text)) return "lamp";
  if (/table|nightstand|stand/.test(text)) return "table";
  return "table";
}

function createLayout(products: Product[]): LayoutItem[] {
  const used = new Map<string, number>();

  return products.slice(0, 6).map((product, index) => {
    const category = inferCategory(product);
    const count = used.get(category) ?? 0;
    used.set(category, count + 1);
    const base = layoutMap[category] ?? layoutMap.table;
    const offset = count * 4;

    return {
      id: `${category}-${index}`,
      label: product.name.split(" ").slice(0, 2).join(" "),
      category,
      price: product.price,
      ...base,
      left: `calc(${base.left} + ${offset}%)`,
      top: `calc(${base.top} + ${offset}%)`,
    };
  });
}

function extractBudget(userRequest: string) {
  const patterns = [
    /\$\s*([0-9][0-9,]*(?:\.\d{1,2})?)/,
    /(?:under|below|budget|stay under|less than|within)\s*\$?\s*([0-9][0-9,]*(?:\.\d{1,2})?)/i,
  ];

  for (const pattern of patterns) {
    const match = userRequest.match(pattern);
    if (match?.[1]) {
      return Number(match[1].replace(/,/g, ""));
    }
  }

  return undefined;
}

function roomProfileFromPrompt(userRequest: string, base: RoomProfile) {
  const budget = extractBudget(userRequest);

  if (!budget) {
    return base;
  }

  return {
    ...base,
    budget,
  };
}

function completeResponse(
  partial: Partial<AgentResponse>,
  userRequest: string,
): AgentResponse {
  const products = partial.products?.length ? partial.products : sampleResponse.products;
  const total = partial.total_estimated ?? sampleResponse.total_estimated;
  const roomProfile = roomProfileFromPrompt(
    userRequest,
    partial.roomProfile ?? sampleResponse.roomProfile,
  );

  return {
    runId: partial.runId ?? sampleResponse.runId,
    roomProfile,
    products,
    summary: partial.summary || sampleResponse.summary,
    total_estimated: total,
    reasoning: partial.reasoning?.length ? partial.reasoning : sampleResponse.reasoning,
    layout: partial.layout?.length ? partial.layout : createLayout(products),
  };
}

export default function Home() {
  const [prompt, setPrompt] = useState(HAPPY_PATH_PROMPT);
  const [result, setResult] = useState<AgentResponse>(sampleResponse);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const budget = useMemo(
    () => result.roomProfile.budget ?? sampleResponse.roomProfile.budget,
    [result.roomProfile.budget],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prompt.trim()) {
      setError("Describe the room you are planning first.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userRequest: prompt }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "The agent could not complete the plan.");
      }

      setResult(completeResponse(payload, prompt));
    } catch (err) {
      setResult(completeResponse(sampleResponse, prompt));
      setError(
        err instanceof Error
          ? `${err.message} Showing a polished fallback plan for the demo.`
          : "Showing a polished fallback plan for the demo.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f5ef] text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-5 sm:px-6 lg:px-8">
        <section className="grid gap-5 rounded-lg border border-stone-200 bg-white p-5 shadow-sm lg:grid-cols-[minmax(0,1fr)_360px] lg:p-6">
          <div className="flex flex-col gap-5">
            <div className="space-y-3">
              <div className="flex w-fit items-center gap-2 rounded-full bg-[#7F187F]/10 px-3 py-1 text-xs font-medium text-[#7F187F] ring-1 ring-[#7F187F]/20">
                <Sparkles className="size-3.5" />
                Wayfair planning agent
              </div>
              <div className="max-w-3xl space-y-2">
                <h1 className="text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
                  Move-in Discovery Agent
                </h1>
                <p className="text-base leading-7 text-slate-600 sm:text-lg">
                  Describe your move-in situation. The agent turns it into a
                  coordinated Wayfair room plan.
                </p>
              </div>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <textarea
                className="min-h-36 w-full resize-y rounded-lg border border-stone-300 bg-stone-50 px-4 py-3 text-base leading-7 text-slate-900 outline-none transition focus:border-[#7F187F] focus:bg-white focus:ring-4 focus:ring-[#7F187F]/15"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Tell the agent about your room, style, budget, and what you need..."
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {examples.map((example) => (
                    <button
                      className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-[#7F187F] hover:text-[#7F187F]"
                      key={example.label}
                      type="button"
                      onClick={() => setPrompt(example.prompt)}
                    >
                      {example.label}
                    </button>
                  ))}
                </div>
                <Button
                  className="h-11 bg-[#7F187F] px-4 text-white hover:bg-[#681268]"
                  disabled={isLoading}
                  size="lg"
                  type="submit"
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowRight className="size-4" />
                  )}
                  {isLoading ? "Planning" : "Build room plan"}
                </Button>
              </div>
            </form>
          </div>

          <aside className="flex flex-col justify-between gap-4 rounded-lg bg-[#f0e9dd] p-4 ring-1 ring-stone-200">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Demo prompt
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {HAPPY_PATH_PROMPT}
              </p>
            </div>
            <div className="rounded-md bg-white/70 p-3 text-sm leading-6 text-slate-700 ring-1 ring-white/80">
              Full story on one page: profile, products, budget, spatial fit,
              and reasoning.
            </div>
          </aside>
        </section>

        {error ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error}
          </div>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="grid gap-5">
            <RoomProfileCard profile={result.roomProfile} />
            <BudgetBar budget={budget} total={result.total_estimated} />
          </div>
          <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Agent summary
            </p>
            <p className="mt-2 text-lg leading-8 text-slate-800">
              {result.summary}
            </p>
          </div>
        </section>

        <ProductGrid products={result.products} />

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
          <LayoutPreview items={result.layout} profile={result.roomProfile} />
          <ReasoningPanel reasoning={result.reasoning} />
        </section>
      </div>
    </main>
  );
}
