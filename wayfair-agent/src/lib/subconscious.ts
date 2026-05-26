import { Subconscious } from 'subconscious';

let cached: Subconscious | undefined;

export function getSubconscious(): Subconscious {
  if (cached) return cached;
  const apiKey = process.env.SUBCONSCIOUS_API_KEY;
  if (!apiKey) {
    throw new Error(
      'SUBCONSCIOUS_API_KEY is not set. Add it to .env.local before starting the server.',
    );
  }
  cached = new Subconscious({ apiKey });
  return cached;
}

export const AGENT_ENGINE = 'tim';

export const WAYFAIR_TOOLS = [
  { type: 'platform' as const, id: 'fast_search' },
];
