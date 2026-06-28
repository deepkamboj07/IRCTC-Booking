const STATS = [
  { value: "62+", label: "Stations Connected" },
  { value: "17",  label: "Active Trains" },
  { value: "14",  label: "Days Advance Booking" },
  { value: "4",   label: "Travel Classes" },
];

export function StatsBar() {
  return (
    <div className="bg-brand-primary text-white py-8">
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-3xl md:text-4xl font-extrabold tabular-nums">{s.value}</p>
            <p className="mt-1 text-sm text-blue-200">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
