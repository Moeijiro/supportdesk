import { Pill } from "@/components/kit/ui";
import type { Ticket } from "@/lib/api";
import { PRIORITY_TONE, STATUS_TONE } from "@/lib/format";

export function StatusPill({ status }: { status: Ticket["status"] }) {
  return <Pill tone={STATUS_TONE[status] ?? "muted"}>{status}</Pill>;
}

export function PriorityPill({ priority }: { priority: Ticket["priority"] }) {
  return <Pill tone={PRIORITY_TONE[priority] ?? "muted"} dot={false}>{priority}</Pill>;
}
