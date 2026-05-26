type ReasoningNode = {
  step: number;
  type: "thought" | "tool_call" | "observation";
  content: string;
  tool?: string;
  duration_ms?: number;
};

type ReasoningPanelProps = {
  reasoning: ReasoningNode[];
};

const labels: Record<ReasoningNode["type"], string> = {
  thought: "Thought",
  tool_call: "Search",
  observation: "Observation",
};

export function ReasoningPanel({ reasoning }: ReasoningPanelProps) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Reasoning
        </p>
        <h2 className="mt-1 text-xl font-semibold text-slate-950">
          Agent trace
        </h2>
      </div>

      <ol className="space-y-3">
        {reasoning.slice(0, 8).map((node) => (
          <li
            className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3"
            key={`${node.step}-${node.type}-${node.content}`}
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-slate-600">
              {node.step}
            </div>
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#7F187F]">
                  {labels[node.type]}
                </span>
                {node.tool ? (
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-stone-200">
                    {node.tool}
                  </span>
                ) : null}
                {node.duration_ms ? (
                  <span className="text-[11px] text-slate-500">
                    {node.duration_ms}ms
                  </span>
                ) : null}
              </div>
              <p className="mt-2 line-clamp-3 break-words text-sm leading-6 text-slate-700">
                {node.content}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
