import { BASETEN_ROOM_PROFILE_PROMPT } from './prompts';
import type { RoomProfile } from './types';

export const FALLBACK_ROOM_PROFILE: RoomProfile = {
  room_type: 'studio apartment',
  dimensions: {
    label: 'assumed 12 ft x 15 ft',
    width_ft: 12,
    length_ft: 15,
    source: 'assumed',
  },
  style: ['light wood', 'cozy neutrals', 'Scandinavian'],
  budget: 800,
  needs: ['bed', 'desk', 'storage', 'chair'],
  constraints: ['small space', 'first apartment', 'work from home'],
};

function parseJsonObject(raw: string): unknown | null {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  const jsonText = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;

  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

function stringArray(value: unknown, fallback: string[]): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
    ? value
    : fallback;
}

function normalizeRoomProfile(value: unknown): RoomProfile {
  if (!value || typeof value !== 'object') return FALLBACK_ROOM_PROFILE;

  const input = value as Partial<RoomProfile>;
  const dimensions = input.dimensions;
  const source = dimensions?.source === 'user' ? 'user' : 'assumed';
  const budget = typeof input.budget === 'number' ? input.budget : undefined;

  return {
    room_type:
      typeof input.room_type === 'string' && input.room_type.trim()
        ? input.room_type
        : FALLBACK_ROOM_PROFILE.room_type,
    dimensions: {
      label:
        typeof dimensions?.label === 'string' && dimensions.label.trim()
          ? dimensions.label
          : FALLBACK_ROOM_PROFILE.dimensions.label,
      width_ft: typeof dimensions?.width_ft === 'number' ? dimensions.width_ft : FALLBACK_ROOM_PROFILE.dimensions.width_ft,
      length_ft: typeof dimensions?.length_ft === 'number' ? dimensions.length_ft : FALLBACK_ROOM_PROFILE.dimensions.length_ft,
      source,
    },
    style: stringArray(input.style, FALLBACK_ROOM_PROFILE.style),
    ...(budget ? { budget } : { budget: FALLBACK_ROOM_PROFILE.budget }),
    needs: stringArray(input.needs, FALLBACK_ROOM_PROFILE.needs),
    constraints: stringArray(input.constraints, FALLBACK_ROOM_PROFILE.constraints),
  };
}

export async function extractRoomProfile(userRequest: string): Promise<RoomProfile> {
  const apiKey = process.env.BASETEN_API_KEY;
  const model = process.env.BASETEN_MODEL;

  if (!apiKey || !model) return FALLBACK_ROOM_PROFILE;

  try {
    const response = await fetch('https://inference.baseten.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Api-Key ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: BASETEN_ROOM_PROFILE_PROMPT },
          { role: 'user', content: userRequest },
        ],
        max_tokens: 700,
      }),
    });

    if (!response.ok) return FALLBACK_ROOM_PROFILE;

    const data = (await response.json()) as {
      choices?: { message?: { content?: string }; text?: string }[];
    };
    const content = data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text;
    if (!content) return FALLBACK_ROOM_PROFILE;

    return normalizeRoomProfile(parseJsonObject(content));
  } catch {
    return FALLBACK_ROOM_PROFILE;
  }
}
