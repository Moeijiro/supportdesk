"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { FileDown, FileText, Lock, MessageSquare, Send, Star, UserCheck } from "lucide-react";
import { PriorityPill, StatusPill } from "@/components/desk";
import { SelectField } from "@/components/kit/select-field";
import { Empty, ErrorState, Field, PageLoading, PageTitle, Panel, Tag } from "@/components/kit/ui";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/hooks/use-api";
import { api, type Ticket, type TicketDetail, transcriptUrl } from "@/lib/api";
import { duration, formatDateTime, formatTime, parseUTC, PRIORITIES, relative, STATUSES } from "@/lib/format";
import { cn } from "@/lib/utils";

const AGENT = "Alex Morgan";

function minutesBetween(from: string, to: string | null): number | null {
  return to ? (parseUTC(to).getTime() - parseUTC(from).getTime()) / 60000 : null;
}

export default function TicketPage() {
  const id = Number(useParams<{ id: string }>().id);
  const ticket = useApi(() => api.getTicketDetail(id), String(id));

  if (ticket.error) return <ErrorState message={ticket.error} onRetry={ticket.reload} />;
  if (!ticket.data) return <PageLoading />;
  return <TicketView ticket={ticket.data} reload={ticket.reload} />;
}

function TicketView({ ticket: t, reload }: { ticket: TicketDetail; reload: () => void }) {
  const [busy, setBusy] = useState(false);

  async function act(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const firstResponse = minutesBetween(t.created_at, t.first_response_at);
  const resolution = minutesBetween(t.created_at, t.resolved_at);

  return (
    <>
      <PageTitle
        eyebrow={<><Link href="/dashboard" className="hover:text-foreground">Ticket queue</Link> / <span className="font-mono">#{t.ticket_number}</span></>}
        title={t.subject}
        description={<span className="flex flex-wrap items-center gap-2"><StatusPill status={t.status} /><PriorityPill priority={t.priority} /><Tag>{t.category}</Tag><span>opened {relative(t.created_at)} by {t.customer_name}</span></span>}
        actions={<>
          {!t.assigned_agent_id ? <Button onClick={() => act(() => api.claimTicket(t.id, AGENT), "Ticket claimed")} disabled={busy}><UserCheck />Claim ticket</Button> : null}
          <Button asChild variant="outline"><a href={transcriptUrl(t.id, "html")} target="_blank" rel="noreferrer"><FileText />Transcript</a></Button>
          <Button asChild variant="outline" size="icon" aria-label="Download text transcript"><a href={transcriptUrl(t.id, "text")}><FileDown /></a></Button>
        </>} />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <Panel title="Initial request" description={`${t.customer_name} · ${formatDateTime(t.created_at)}`} bodyClassName="px-5 py-4">
            <p className="text-sm leading-relaxed whitespace-pre-line">{t.description}</p>
          </Panel>

          <Tabs defaultValue="conversation">
            <TabsList>
              <TabsTrigger value="conversation"><MessageSquare />Conversation ({t.messages.length})</TabsTrigger>
              <TabsTrigger value="notes"><Lock />Internal notes ({t.notes.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="conversation" className="mt-3">
              <Conversation ticket={t} onSent={reload} />
            </TabsContent>
            <TabsContent value="notes" className="mt-3">
              <Notes ticket={t} onAdded={reload} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-5">
          <Panel title="Properties" bodyClassName="space-y-4 px-5 py-4">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Status</p>
              <SelectField label="Status" value={t.status} onChange={(v) => act(() => api.updateStatus(t.id, v as Ticket["status"]), `Status set to ${v}`)} options={STATUSES} />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Priority</p>
              <SelectField label="Priority" value={t.priority} onChange={(v) => act(() => api.updatePriority(t.id, v as Ticket["priority"]), `Priority set to ${v}`)} options={PRIORITIES} />
            </div>
            <div>
              <Field label="Customer">{t.customer_name}</Field>
              <Field label="Discord ID"><span className="font-mono text-xs">{t.customer_id}</span></Field>
              <Field label="Assignee">{t.assigned_agent_name ?? <span className="text-muted-foreground">Unassigned</span>}</Field>
              <Field label="Opened">{formatDateTime(t.created_at)}</Field>
            </div>
          </Panel>

          <Panel title="Service levels" description="Measured from the ticket's own timestamps." bodyClassName="px-5 py-2">
            <Field label="First response">{firstResponse === null ? <span className="text-muted-foreground">Waiting</span> : duration(firstResponse)}</Field>
            <Field label="Resolution">{resolution === null ? <span className="text-muted-foreground">Not resolved</span> : duration(resolution)}</Field>
            <Field label="Closed">{t.closed_at ? formatDateTime(t.closed_at) : "—"}</Field>
          </Panel>

          {t.rating ? (
            <Panel title="Customer rating" bodyClassName="px-5 py-4">
              <div className="flex items-center gap-0.5" aria-label={`${t.rating} out of 5`}>
                {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={cn("size-4", n <= t.rating! ? "fill-warn text-warn" : "text-border")} />)}
                <span className="ml-2 text-sm font-medium">{t.rating} / 5</span>
              </div>
              {t.rating_comment ? <p className="mt-2 text-sm text-muted-foreground">“{t.rating_comment}”</p> : null}
            </Panel>
          ) : null}
        </div>
      </div>
    </>
  );
}

function Conversation({ ticket: t, onSent }: { ticket: TicketDetail; onSent: () => void }) {
  const [text, setText] = useState("");
  const [asCustomer, setAsCustomer] = useState(false);
  const [sending, setSending] = useState(false);
  const closed = t.status === "Closed";

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.addMessage(t.id, text.trim(), asCustomer ? { id: t.customer_id, name: t.customer_name, staff: false } : { id: "agent_1", name: AGENT, staff: true });
      setText("");
      onSent();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Panel bodyClassName="p-0">
      <ol className="space-y-3 p-4 sm:p-5">
        {t.messages.map((m) => (
          <li key={m.id} className={cn("flex", m.is_staff ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[85%] rounded-xl border px-3.5 py-2.5", m.is_staff ? "border-primary/20 bg-accent" : "bg-card")}>
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{m.author_name}</span>
                {m.is_staff ? <span className="rounded bg-primary px-1 py-px text-[10px] font-semibold text-primary-foreground">STAFF</span> : null}
                <time dateTime={m.timestamp} title={formatDateTime(m.timestamp)}>{formatTime(m.timestamp)}</time>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line">{m.content}</p>
            </div>
          </li>
        ))}
      </ol>
      {closed ? (
        <p className="border-t px-5 py-3 text-sm text-muted-foreground">This ticket is closed. Reopen it to reply.</p>
      ) : (
        <form onSubmit={send} className="space-y-2 border-t p-4 sm:p-5">
          <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={asCustomer ? `Reply as ${t.customer_name}…` : "Write a reply to the customer…"} aria-label="Reply" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={asCustomer} onChange={(e) => setAsCustomer(e.target.checked)} className="accent-[var(--primary)]" />
              Simulate a customer reply (demo)
            </label>
            <Button type="submit" disabled={sending || !text.trim()}><Send />{sending ? "Sending…" : "Send reply"}</Button>
          </div>
        </form>
      )}
    </Panel>
  );
}

function Notes({ ticket: t, onAdded }: { ticket: TicketDetail; onAdded: () => void }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try {
      await api.addNote(t.id, text.trim());
      setText("");
      onAdded();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel bodyClassName="p-0">
      <p className="flex items-center gap-2 border-b bg-warn/10 px-5 py-2.5 text-xs text-foreground/80"><Lock className="size-3.5 text-warn" />Internal notes are only visible here. They are never posted to the customer&apos;s Discord channel.</p>
      {t.notes.length === 0 ? (
        <Empty title="No internal notes yet" description="Use notes for verification details, escalation context or hand-over." />
      ) : (
        <ol className="divide-y">
          {t.notes.map((n) => (
            <li key={n.id} className="px-5 py-3">
              <div className="flex justify-between text-xs text-muted-foreground"><span className="font-medium text-foreground">{n.staff_name}</span><span>{formatDateTime(n.created_at)}</span></div>
              <p className="mt-1 text-sm">{n.note_text}</p>
            </li>
          ))}
        </ol>
      )}
      <form onSubmit={add} className="space-y-2 border-t p-4 sm:p-5">
        <Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a private note for the team…" aria-label="Internal note" />
        <div className="flex justify-end"><Button type="submit" variant="outline" disabled={saving || !text.trim()}><Lock />Add note</Button></div>
      </form>
    </Panel>
  );
}
