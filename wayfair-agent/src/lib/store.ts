import type { RunRecord } from './types';

declare global {
  var __wayfairRunStore: Map<string, RunRecord> | undefined;
}

const store: Map<string, RunRecord> =
  globalThis.__wayfairRunStore ?? new Map<string, RunRecord>();

if (!globalThis.__wayfairRunStore) {
  globalThis.__wayfairRunStore = store;
}

export function saveRun(runId: string, data: Omit<RunRecord, 'runId' | 'createdAt'>): RunRecord {
  const record: RunRecord = {
    runId,
    createdAt: new Date().toISOString(),
    ...data,
  };
  store.set(runId, record);
  return record;
}

export function getRun(runId: string): RunRecord | undefined {
  return store.get(runId);
}
