interface TicketStatusBadgeProps {
  status: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  Open: { label: "Open", className: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  "Waiting for Staff": { label: "Waiting on Staff", className: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  "Waiting for Customer": { label: "Waiting on Customer", className: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
  "In Progress": { label: "In Progress", className: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" },
  Resolved: { label: "Resolved", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  Closed: { label: "Closed", className: "bg-zinc-800 text-zinc-400 border-zinc-700" },
};

export default function TicketStatusBadge({ status }: TicketStatusBadgeProps) {
  const conf = STATUS_CONFIG[status] || STATUS_CONFIG.Open;
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border ${conf.className}`}>
      {conf.label}
    </span>
  );
}
