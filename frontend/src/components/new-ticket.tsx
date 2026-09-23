"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SelectField } from "@/components/kit/select-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, type NewTicket } from "@/lib/api";
import { CATEGORIES, PRIORITIES } from "@/lib/format";

const EMPTY: NewTicket = { customer_id: "", customer_name: "", category: "Technical Issue", subject: "", description: "", priority: "Normal" };

/** What the Discord support panel's modal collects, for trying the flow without a bot. */
export function NewTicketDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; onCreated: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState<NewTicket>(EMPTY);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof NewTicket>(key: K, value: NewTicket[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const ticket = await api.createTicket({ ...form, customer_id: form.customer_id || `user_${form.customer_name.toLowerCase().replace(/\W+/g, "_")}` });
      toast.success(`Ticket #${ticket.ticket_number} opened`);
      onCreated();
      onOpenChange(false);
      setForm(EMPTY);
      router.push(`/tickets/${ticket.id}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Open a ticket</DialogTitle>
          <DialogDescription>The same fields the Discord support panel asks a customer for.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="nt-name">Customer</Label><Input id="nt-name" required minLength={2} value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} placeholder="Discord username" /></div>
            <div className="space-y-1.5"><Label htmlFor="nt-cat">Category</Label><SelectField id="nt-cat" label="Category" value={form.category} onChange={(v) => set("category", v)} options={CATEGORIES} /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="nt-subject">Subject</Label><Input id="nt-subject" required minLength={3} maxLength={255} value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="Short summary" /></div>
          <div className="space-y-1.5"><Label htmlFor="nt-desc">Description</Label><Textarea id="nt-desc" required minLength={5} rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What happened, and what did you expect?" /></div>
          <div className="space-y-1.5 sm:w-1/2"><Label htmlFor="nt-priority">Priority</Label><SelectField id="nt-priority" label="Priority" value={form.priority} onChange={(v) => set("priority", v as NewTicket["priority"])} options={PRIORITIES} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Opening…" : "Open ticket"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
