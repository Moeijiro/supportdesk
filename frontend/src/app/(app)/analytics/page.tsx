"use client";

import { CheckCircle2, Clock, Hourglass, Inbox } from "lucide-react";
import { Bar, Empty, ErrorState, PageLoading, PageTitle, Panel, Stat } from "@/components/kit/ui";
import { useApi } from "@/hooks/use-api";
import { api, DEMO_GUILD_NAME } from "@/lib/api";
import { duration } from "@/lib/format";

export default function AnalyticsPage() {
  const data = useApi(() => Promise.all([api.getOverview(), api.getCategories()]), "analytics");
  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  if (!data.data) return <PageLoading />;
  const [s, categories] = data.data;
  const sorted = [...categories].sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...sorted.map((c) => c.count));

  return (
    <>
      <PageTitle title="SLA analytics" description={`Response and resolution times for ${DEMO_GUILD_NAME}, measured from ticket timestamps — nothing is estimated.`} />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Avg. first response" icon={Clock} value={duration(s.average_first_response_minutes)} hint="Open → first staff reply" />
        <Stat label="Avg. resolution" icon={Hourglass} value={duration(s.average_resolution_hours * 60)} hint="Open → resolved" />
        <Stat label="Resolved today" icon={CheckCircle2} value={s.resolved_today_count} tone={s.resolved_today_count ? "ok" : undefined} />
        <Stat label="Tickets recorded" icon={Inbox} value={s.total_tickets_recorded} hint={`${s.open_tickets_count} still open`} />
      </div>
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <Panel title="Tickets by category" description="Share of all recorded tickets.">
          {sorted.length === 0 ? <Empty title="No tickets yet" description="Load the demo tickets from the queue." /> : (
            <div className="space-y-4 px-5 py-5">
              {sorted.map((c) => <Bar key={c.category} label={c.category} value={c.count} max={max} hint={`${c.count} · ${c.percentage}%`} />)}
            </div>
          )}
        </Panel>
        <Panel title="Queue health" description="Where open tickets are waiting right now.">
          <div className="space-y-4 px-5 py-5">
            <Bar label="Open" value={s.open_tickets_count} max={Math.max(1, s.open_tickets_count)} />
            <Bar label="Waiting on staff" value={s.waiting_for_staff_count} max={Math.max(1, s.open_tickets_count)} tone="fail" />
            <Bar label="Unassigned" value={s.unassigned_count} max={Math.max(1, s.open_tickets_count)} tone="warn" />
          </div>
        </Panel>
      </div>
    </>
  );
}
