"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Clock, Inbox, Plus, Search, Sparkles, UserX, Users } from "lucide-react";
import { NewTicketDialog } from "@/components/new-ticket";
import { PriorityPill, StatusPill } from "@/components/desk";
import { SelectField } from "@/components/kit/select-field";
import { Empty, ErrorState, PageTitle, Panel, RowsLoading, Stat, Table, Tag, Td, Th } from "@/components/kit/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApi } from "@/hooks/use-api";
import { useDebounced } from "@/hooks/use-debounced";
import { api, DEMO_GUILD_NAME } from "@/lib/api";
import { CATEGORIES, duration, PRIORITIES, relative, STATUSES } from "@/lib/format";

const ALL = "All";

export default function QueuePage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [priority, setPriority] = useState(ALL);
  const [seeding, setSeeding] = useState(false);
  const [creating, setCreating] = useState(false);
  const query = useDebounced(search.trim(), 250);

  const filters = { status, category, priority, search: query || undefined };
  const tickets = useApi(() => api.getTickets(filters), JSON.stringify(filters));
  const stats = useApi(() => api.getOverview(), "overview");
  const filtered = status !== ALL || category !== ALL || priority !== ALL || query !== "";

  async function seed() {
    setSeeding(true);
    try {
      const result = await api.seedDemo();
      toast.success(result.created ? "Demo tickets loaded" : "Demo tickets are already loaded");
      tickets.reload();
      stats.reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSeeding(false);
    }
  }

  const s = stats.data;
  return (
    <>
      <PageTitle title="Ticket queue" description={<>Every support request from the <strong className="font-medium text-foreground">{DEMO_GUILD_NAME}</strong> Discord server.</>}
        actions={<>
          <Button variant="outline" onClick={seed} disabled={seeding}><Sparkles />{seeding ? "Loading…" : "Load demo tickets"}</Button>
          <Button onClick={() => setCreating(true)}><Plus />New ticket</Button>
        </>} />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Open tickets" icon={Inbox} value={s?.open_tickets_count ?? "—"} hint={s ? `${s.total_tickets_recorded} recorded in total` : undefined} />
        <Stat label="Unassigned" icon={UserX} value={s?.unassigned_count ?? "—"} tone={s && s.unassigned_count > 0 ? "warn" : undefined} hint="Waiting for an agent to claim" />
        <Stat label="Waiting on staff" icon={Users} value={s?.waiting_for_staff_count ?? "—"} tone={s && s.waiting_for_staff_count > 0 ? "fail" : undefined} hint="Customer spoke last" />
        <Stat label="Avg. first response" icon={Clock} value={s ? duration(s.average_first_response_minutes) : "—"} hint="From open to first staff reply" />
      </div>

      <Panel bodyClassName="p-0">
        <div className="grid grid-cols-1 gap-2 border-b p-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_170px_170px_140px]">
          <label className="relative sm:col-span-2 lg:col-span-1">
            <span className="sr-only">Search tickets</span>
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by ticket #, customer or subject" className="bg-card pl-8" />
          </label>
          <SelectField label="Status" value={status} onChange={setStatus} options={[{ value: ALL, label: "All statuses" }, ...STATUSES]} />
          <SelectField label="Category" value={category} onChange={setCategory} options={[{ value: ALL, label: "All categories" }, ...CATEGORIES]} />
          <SelectField label="Priority" value={priority} onChange={setPriority} options={[{ value: ALL, label: "All priorities" }, ...PRIORITIES]} />
        </div>

        {tickets.error ? (
          <div className="p-4"><ErrorState message={tickets.error} onRetry={tickets.reload} /></div>
        ) : tickets.loading && !tickets.data ? (
          <RowsLoading rows={5} />
        ) : !tickets.data?.length ? (
          filtered ? (
            <Empty icon={Search} title="No tickets match these filters" description="Try another status or clear the search." />
          ) : (
            <Empty icon={Inbox} title="The queue is empty" description="Load the demo tickets, or open one as a customer would from the Discord support panel."
              action={<Button onClick={seed} disabled={seeding}><Sparkles />Load demo tickets</Button>} />
          )
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <thead><tr><Th>Ticket</Th><Th>Subject</Th><Th>Category</Th><Th>Priority</Th><Th>Status</Th><Th>Assignee</Th><Th className="text-right">Opened</Th></tr></thead>
                <tbody>
                  {tickets.data.map((t) => (
                    <tr key={t.id} className="group hover:bg-muted/40">
                      <Td className="font-mono text-xs text-muted-foreground">#{t.ticket_number}</Td>
                      <Td className="max-w-[340px]">
                        <Link href={`/tickets/${t.id}`} className="block truncate font-medium group-hover:text-primary">{t.subject}</Link>
                        <span className="text-xs text-muted-foreground">{t.customer_name}</span>
                      </Td>
                      <Td><Tag>{t.category}</Tag></Td>
                      <Td><PriorityPill priority={t.priority} /></Td>
                      <Td><StatusPill status={t.status} /></Td>
                      <Td className="text-sm">{t.assigned_agent_name ?? <span className="text-muted-foreground">Unassigned</span>}</Td>
                      <Td className="text-right text-xs whitespace-nowrap text-muted-foreground">{relative(t.created_at)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <ul className="divide-y md:hidden">
              {tickets.data.map((t) => (
                <li key={t.id}>
                  <Link href={`/tickets/${t.id}`} className="block space-y-2 px-4 py-3.5 hover:bg-muted/40">
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">#{t.ticket_number} · {t.customer_name}</span>
                      <span>{relative(t.created_at)}</span>
                    </div>
                    <p className="font-medium">{t.subject}</p>
                    <div className="flex flex-wrap gap-1.5"><StatusPill status={t.status} /><PriorityPill priority={t.priority} /><Tag>{t.category}</Tag></div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>

      <NewTicketDialog open={creating} onOpenChange={setCreating} onCreated={() => { tickets.reload(); stats.reload(); }} />
    </>
  );
}
