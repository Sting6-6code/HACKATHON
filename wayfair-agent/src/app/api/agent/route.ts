import { NextRequest, NextResponse } from 'next/server';
import type { ReasoningTask } from 'subconscious';
import { getSubconscious, AGENT_ENGINE, WAYFAIR_TOOLS } from '@/lib/subconscious';
import { WAYFAIR_AGENT_PROMPT } from '@/lib/prompts';
import { saveRun } from '@/lib/store';
import type { AgentAnswer, Product, ReasoningNode } from '@/lib/types';

function flattenReasoning(tasks: ReasoningTask[] | undefined): ReasoningNode[] {
  if (!tasks) return [];
  const out: ReasoningNode[] = [];
  let step = 1;
  const walk = (t: ReasoningTask) => {
    if (t.title || t.thought) {
      out.push({ step: step++, type: 'thought', content: t.thought || t.title || '' });
    }
    if (t.tooluse) {
      out.push({ step: step++, type: 'tool_call', tool: t.tooluse.tool_name, content: JSON.stringify(t.tooluse.parameters ?? {}) });
      if (t.tooluse.tool_result !== undefined) {
        const r = t.tooluse.tool_result;
        const text = typeof r === 'string' ? r : JSON.stringify(r);
        out.push({ step: step++, type: 'observation', content: text.slice(0, 800) });
      }
    }
    t.subtasks?.forEach(walk);
    if (t.conclusion) out.push({ step: step++, type: 'observation', content: t.conclusion });
  };
  tasks.forEach(walk);
  return out;
}

function parseAnswer(raw: string): AgentAnswer | null {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try {
    const p = JSON.parse(cleaned);
    return Array.isArray(p?.products) ? (p as AgentAnswer) : null;
  } catch {
    return null;
  }
}

const PLACEHOLDER = (label: string) => `https://via.placeholder.com/400x300?text=${encodeURIComponent(label)}`;
const MOCK_PRODUCTS: Product[] = [
  { name: 'Hagen Solid Wood Platform Bed', price: '$329', why_it_fits: 'Light oak finish and clean lines anchor the Scandinavian palette without crowding a studio.', image_url: PLACEHOLDER('Platform Bed'), product_url: 'https://www.wayfair.com/furniture/pdp/example-bed.html' },
  { name: 'Mercer Round Side Table', price: '$89', why_it_fits: 'Compact 18" footprint slots next to the bed and echoes the warm wood tones.', image_url: PLACEHOLDER('Side Table'), product_url: 'https://www.wayfair.com/furniture/pdp/example-table.html' },
  { name: 'Ellis Linen Accent Chair', price: '$249', why_it_fits: 'Cream upholstery and tapered legs keep the room feeling airy and under budget.', image_url: PLACEHOLDER('Accent Chair'), product_url: 'https://www.wayfair.com/furniture/pdp/example-chair.html' },
];
const MOCK_REASONING: ReasoningNode[] = [
  { step: 1, type: 'thought', content: 'Scandinavian studio, $800 budget. Need bed, side table, accent seating.' },
  { step: 2, type: 'tool_call', tool: 'fast_search', content: '{"query":"scandinavian platform bed wayfair"}', duration_ms: 1240 },
  { step: 3, type: 'observation', content: 'Top hit: Hagen platform bed, light oak, $329 — fits the brief.' },
  { step: 4, type: 'tool_call', tool: 'fast_search', content: '{"query":"round wood side table site:wayfair.com"}', duration_ms: 980 },
  { step: 5, type: 'thought', content: 'Subtotal $667. Within budget. Finalizing the set.' },
];
const MOCK_SUMMARY = 'A warm, light-wood Scandinavian studio: oak platform bed, a compact round side table, and a cream linen chair tie the palette together.';

export async function POST(req: NextRequest) {
  try {
    const { userRequest } = (await req.json()) as { userRequest?: string };
    if (!userRequest?.trim()) return NextResponse.json({ error: 'userRequest is required' }, { status: 400 });
    const runId = crypto.randomUUID();

    if (process.env.USE_MOCK === 'true') {
      saveRun(runId, { products: MOCK_PRODUCTS, reasoning: MOCK_REASONING, summary: MOCK_SUMMARY, total_estimated: '$667' });
      return NextResponse.json({ runId, products: MOCK_PRODUCTS, summary: MOCK_SUMMARY, total_estimated: '$667' });
    }

    const run = await getSubconscious().run({
      engine: AGENT_ENGINE,
      input: { instructions: `${WAYFAIR_AGENT_PROMPT}\n\n# User request\n\n${userRequest}`, tools: WAYFAIR_TOOLS },
      options: { awaitCompletion: true },
    });

    const raw = run.result?.answer ?? '';
    const reasoning = flattenReasoning(run.result?.reasoning);
    const parsed = parseAnswer(raw);

    if (parsed) {
      saveRun(runId, { products: parsed.products, reasoning, summary: parsed.summary, total_estimated: parsed.total_estimated });
      return NextResponse.json({ runId, products: parsed.products, summary: parsed.summary, total_estimated: parsed.total_estimated });
    }
    saveRun(runId, { products: [], reasoning, summary: raw, total_estimated: 'N/A' });
    return NextResponse.json({ runId, products: [], summary: raw, total_estimated: 'N/A', _raw: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
