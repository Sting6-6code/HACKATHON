import { NextRequest, NextResponse } from 'next/server';
import type { ReasoningTask } from 'subconscious';
import { extractRoomProfile, FALLBACK_ROOM_PROFILE } from '@/lib/baseten';
import { buildLayout } from '@/lib/layout';
import { getSubconscious, AGENT_ENGINE, WAYFAIR_TOOLS } from '@/lib/subconscious';
import { WAYFAIR_AGENT_PROMPT } from '@/lib/prompts';
import { saveRun } from '@/lib/store';
import type {
  AgentAnswer,
  AgentSource,
  AgentSuccessResponse,
  Product,
  ReasoningNode,
  RoomProfile,
} from '@/lib/types';

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

function parseJsonObject(raw: string): unknown | null {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .split('</think>')
    .pop()
    ?.trim() ?? raw.trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    for (const match of cleaned.matchAll(/\{[\s\S]*?\}/g)) {
      try {
        return JSON.parse(match[0]);
      } catch {
      }
    }
  }

  return null;
}

function parseAnswer(raw: string): AgentAnswer | null {
  const parsed = parseJsonObject(raw);
  if (!parsed || typeof parsed !== 'object') return null;
  const answer = parsed as Partial<AgentAnswer>;
  return Array.isArray(answer.products) &&
    typeof answer.summary === 'string' &&
    typeof answer.total_estimated === 'string'
    ? (answer as AgentAnswer)
    : null;
}

function buildSuccessResponse({
  runId,
  userRequest,
  roomProfile,
  products,
  reasoning,
  summary,
  total_estimated,
  source,
}: {
  runId: string;
  userRequest: string;
  roomProfile: RoomProfile;
  products: Product[];
  reasoning: ReasoningNode[];
  summary: string;
  total_estimated: string;
  source: AgentSource;
}): AgentSuccessResponse {
  const layout = buildLayout(products);

  saveRun(runId, {
    userRequest,
    roomProfile,
    products,
    reasoning,
    summary,
    total_estimated,
    layout,
    source,
  });

  return {
    runId,
    roomProfile,
    products,
    summary,
    total_estimated,
    reasoning,
    layout,
    source,
  };
}

async function runSubconsciousChat(instructions: string): Promise<AgentAnswer | null> {
  const apiKey = process.env.SUBCONSCIOUS_API_KEY;
  if (!apiKey) throw new Error('SUBCONSCIOUS_API_KEY is not set.');

  const response = await fetch('https://api.subconscious.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'subconscious/tim-qwen3.6-27b',
      messages: [{ role: 'user', content: instructions }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Subconscious chat failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  return content ? parseAnswer(content) : null;
}

const MOCK_PRODUCTS: Product[] = [
  {
    name: 'Hagen Solid Wood Platform Bed',
    price: '$329',
    why_it_fits: 'A low-profile light wood frame anchors the sleeping area without making the studio feel crowded.',
    image_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    product_url: 'https://www.wayfair.com/',
  },
  {
    name: 'Alden Compact Writing Desk',
    price: '$158',
    why_it_fits: 'The slim desktop creates a real work zone while leaving walkway space open near the foot of the bed.',
    image_url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=900&q=80',
    product_url: 'https://www.wayfair.com/',
  },
  {
    name: 'Briar Two-Door Storage Cabinet',
    price: '$139',
    why_it_fits: 'Closed storage hides everyday clutter and doubles as a landing surface in a small apartment.',
    image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80',
    product_url: 'https://www.wayfair.com/',
  },
  {
    name: 'Nora Upholstered Desk Chair',
    price: '$92',
    why_it_fits: 'A soft neutral seat keeps the work corner comfortable and visually connected to the cozy palette.',
    image_url: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=900&q=80',
    product_url: 'https://www.wayfair.com/',
  },
  {
    name: 'Mila Washable Area Rug',
    price: '$58',
    why_it_fits: 'The rug visually separates the bed and work zones while adding warmth without blowing the budget.',
    image_url: 'https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?auto=format&fit=crop&w=900&q=80',
    product_url: 'https://www.wayfair.com/',
  },
];
const MOCK_REASONING: ReasoningNode[] = [
  { step: 1, type: 'thought', content: 'The user needs a first-apartment studio plan, so prioritize multi-zone function over decorative extras.' },
  { step: 2, type: 'tool_call', tool: 'fast_search', content: '{"query":"Wayfair light wood platform bed small studio"}', duration_ms: 940 },
  { step: 3, type: 'observation', content: 'A low platform bed gives the room a visual anchor and keeps sight lines open.' },
  { step: 4, type: 'tool_call', tool: 'fast_search', content: '{"query":"compact writing desk storage cabinet Wayfair"}', duration_ms: 1120 },
  { step: 5, type: 'thought', content: 'The bed, desk, storage, chair, and rug total $776, leaving a small buffer under the $800 target.' },
  { step: 6, type: 'observation', content: 'The layout keeps the bed, work surface, and storage in separate zones so the studio feels usable.' },
];
const MOCK_SUMMARY = 'A compact studio plan with light wood anchor pieces, closed storage, a dedicated work corner, and soft neutral texture while staying under budget.';
const MOCK_TOTAL = '$776';

export async function POST(req: NextRequest) {
  const runId = crypto.randomUUID();
  let userRequest = '';
  let roomProfile = FALLBACK_ROOM_PROFILE;

  try {
    const body = (await req.json()) as { userRequest?: string };
    userRequest = body.userRequest?.trim() ?? '';
    if (!userRequest) return NextResponse.json({ error: 'userRequest is required' }, { status: 400 });

    try {
      roomProfile = await extractRoomProfile(userRequest);
    } catch {
      roomProfile = FALLBACK_ROOM_PROFILE;
    }

    if (process.env.USE_MOCK === 'true') {
      return NextResponse.json(
        buildSuccessResponse({
          runId,
          userRequest,
          roomProfile,
          products: MOCK_PRODUCTS,
          reasoning: MOCK_REASONING,
          summary: MOCK_SUMMARY,
          total_estimated: MOCK_TOTAL,
          source: 'mock',
        }),
      );
    }

    const instructions = `${WAYFAIR_AGENT_PROMPT}\n\n# Room profile\n\n${JSON.stringify(roomProfile, null, 2)}\n\n# User request\n\n${userRequest}`;

    let run: Awaited<ReturnType<ReturnType<typeof getSubconscious>['run']>> | null = null;
    let parsed: AgentAnswer | null = null;
    let raw = '';
    let reasoning: ReasoningNode[] = [];

    try {
      run = await getSubconscious().run({
        engine: AGENT_ENGINE,
        input: {
          instructions,
          tools: WAYFAIR_TOOLS,
        },
        options: { awaitCompletion: true },
      });

      raw = run.result?.answer ?? '';
      reasoning = flattenReasoning(run.result?.reasoning);
      parsed = parseAnswer(raw);
    } catch {
      parsed = await runSubconsciousChat(instructions);
      reasoning = [
        { step: 1, type: 'thought', content: 'Parsed the room profile and budget constraints.' },
        { step: 2, type: 'thought', content: 'Used Subconscious OpenAI-compatible inference to generate a structured Wayfair shopping plan.' },
        { step: 3, type: 'observation', content: 'Returned products, total estimate, and design rationale for the frontend layout.' },
      ];
    }


    if (parsed) {
      return NextResponse.json(
        buildSuccessResponse({
          runId,
          userRequest,
          roomProfile,
          products: parsed.products,
          reasoning,
          summary: parsed.summary,
          total_estimated: parsed.total_estimated,
          source: 'live',
        }),
      );
    }

    return NextResponse.json(
      buildSuccessResponse({
        runId,
        userRequest,
        roomProfile,
        products: MOCK_PRODUCTS,
        reasoning: reasoning.length ? reasoning : MOCK_REASONING,
        summary: raw || MOCK_SUMMARY,
        total_estimated: MOCK_TOTAL,
        source: 'fallback',
      }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown sponsor API error';

    return NextResponse.json(
      buildSuccessResponse({
        runId,
        userRequest: userRequest || 'fallback request',
        roomProfile,
        products: MOCK_PRODUCTS,
        reasoning: MOCK_REASONING,
        summary: `${MOCK_SUMMARY} Live API fallback: ${message}`,
        total_estimated: MOCK_TOTAL,
        source: 'fallback',
      }),
    );
  }
}
