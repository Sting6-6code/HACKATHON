type RoomProfile = {
  room_type: string;
  dimensions: {
    label: string;
    width_ft?: number;
    length_ft?: number;
    source: "user" | "assumed";
  };
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

type LayoutPreviewProps = {
  items: LayoutItem[];
  profile: RoomProfile;
};

const categoryClasses: Record<string, string> = {
  bed: "bg-[#7F187F]/15 text-[#4f0f4f] ring-[#7F187F]/30",
  desk: "bg-sky-100 text-sky-950 ring-sky-300",
  chair: "bg-violet-100 text-violet-950 ring-violet-300",
  storage: "bg-amber-100 text-amber-950 ring-amber-300",
  rug: "bg-rose-100/80 text-rose-950 ring-rose-200",
  lamp: "bg-yellow-100 text-yellow-950 ring-yellow-300",
  table: "bg-stone-200 text-stone-950 ring-stone-300",
};

export function LayoutPreview({ items, profile }: LayoutPreviewProps) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Spatial fit
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            2D layout preview
          </h2>
        </div>
        <span className="rounded-full bg-stone-50 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-stone-200">
          {profile.dimensions.label}
        </span>
      </div>

      <div className="relative aspect-[16/10] min-h-[300px] overflow-hidden rounded-lg border-2 border-stone-300 bg-[#fbfaf7]">
        <div className="absolute inset-4 rounded-md border border-dashed border-stone-300" />
        <div className="absolute left-4 top-4 rounded-br-md bg-white/85 px-2 py-1 text-xs font-medium text-slate-500">
          {profile.room_type}
        </div>

        {items.map((item) => (
          <div
            className={`absolute flex min-h-10 min-w-14 flex-col justify-center rounded-md p-2 text-xs font-semibold leading-tight ring-1 ${
              categoryClasses[item.category] ?? categoryClasses.table
            }`}
            key={item.id}
            style={{
              left: item.left,
              top: item.top,
              width: item.width,
              height: item.height,
              zIndex: item.category === "rug" ? 1 : 2,
            }}
          >
            <span className="truncate">{item.label}</span>
            {item.price ? (
              <span className="mt-0.5 text-[11px] font-medium opacity-75">
                {item.price}
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <p className="mt-3 text-sm text-slate-500">
        Spatial fit preview, not a photorealistic render.
      </p>
    </section>
  );
}
