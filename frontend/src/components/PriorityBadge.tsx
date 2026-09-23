interface PriorityBadgeProps {
  priority: string;
}

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  Low: { label: "Low", className: "bg-zinc-800 text-zinc-400 border-zinc-700" },
  Normal: { label: "Normal", className: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  High: { label: "High", className: "bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold" },
  Urgent: { label: "Urgent", className: "bg-rose-500/10 text-rose-400 border-rose-500/30 font-bold" },
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const conf = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.Normal;
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border uppercase tracking-wider ${conf.className}`}>
      {conf.label}
    </span>
  );
}
