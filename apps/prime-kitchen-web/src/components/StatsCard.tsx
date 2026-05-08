interface Props {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
  accent?: boolean;
}

export function StatsCard({ label, value, icon, sub, accent }: Props) {
  return (
    <div className={`bg-surface border rounded-2xl p-5 flex items-start gap-4 ${accent ? 'border-accent/30' : 'border-border'}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent ? 'bg-accent/15 text-accent' : 'bg-surface-2 text-text-secondary'}`}>
        {icon}
      </div>
      <div>
        <p className="text-text-secondary text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className={`font-display font-bold text-2xl mt-0.5 ${accent ? 'text-accent' : 'text-text-primary'}`}>
          {value}
        </p>
        {sub && <p className="text-text-secondary text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
