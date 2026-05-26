import { Badge } from "@/components/ui/badge";

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

type RoomProfileCardProps = {
  profile: RoomProfile;
};

export function RoomProfileCard({ profile }: RoomProfileCardProps) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Room profile
          </p>
          <h2 className="mt-1 text-xl font-semibold capitalize text-slate-950">
            {profile.room_type}
          </h2>
        </div>
        <Badge className="bg-[#7F187F]/10 text-[#7F187F] ring-1 ring-[#7F187F]/20">
          {profile.dimensions.source}
        </Badge>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-md bg-stone-50 p-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Dimensions
          </dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">
            {profile.dimensions.label}
          </dd>
        </div>
        <div className="rounded-md bg-stone-50 p-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Budget
          </dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">
            {profile.budget ? `$${profile.budget.toLocaleString()}` : "Flexible"}
          </dd>
        </div>
      </dl>

      <div className="mt-5 space-y-4">
        <ChipGroup label="Style" values={profile.style} />
        <ChipGroup label="Needs" values={profile.needs} />
        <ChipGroup label="Constraints" values={profile.constraints} />
      </div>
    </section>
  );
}

function ChipGroup({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <Badge
            className="border-stone-200 bg-stone-50 text-slate-700"
            key={`${label}-${value}`}
            variant="outline"
          >
            {value}
          </Badge>
        ))}
      </div>
    </div>
  );
}
