type BudgetBarProps = {
  budget?: number;
  total: string;
};

function parseCurrency(value: string | number | undefined) {
  if (typeof value === "number") return value;
  if (!value) return 0;
  return Number(value.replace(/[^0-9.]/g, "")) || 0;
}

export function BudgetBar({ budget, total }: BudgetBarProps) {
  const totalValue = parseCurrency(total);
  const budgetValue = budget ?? 0;
  const hasBudget = budgetValue > 0;
  const percent = hasBudget
    ? Math.min(Math.round((totalValue / budgetValue) * 100), 130)
    : 0;
  const isOver = hasBudget && totalValue > budgetValue;
  const remaining = Math.abs(budgetValue - totalValue);

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Budget
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">
            {total} {hasBudget ? `/ $${budgetValue.toLocaleString()}` : ""}
          </h2>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isOver
              ? "bg-rose-50 text-rose-700 ring-1 ring-rose-100"
              : "bg-[#7F187F]/10 text-[#7F187F] ring-1 ring-[#7F187F]/20"
          }`}
        >
          {isOver ? "Over budget" : "Under budget"}
        </span>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-stone-100">
        <div
          className={`h-full rounded-full transition-all ${
            isOver ? "bg-rose-500" : "bg-[#7F187F]"
          }`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <p className="mt-3 text-sm text-slate-600">
        {hasBudget
          ? isOver
            ? `$${remaining.toLocaleString()} above target.`
            : `$${remaining.toLocaleString()} left for delivery, decor, or swaps.`
          : "No budget detected, so the plan focuses on fit and style."}
      </p>
    </section>
  );
}
