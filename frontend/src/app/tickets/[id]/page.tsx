"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Lock, MessageSquare, Send, Shield, User, Clock, 
  FileText, CheckCircle2, AlertTriangle, UserCheck, Star 
} from "lucide-react";
import { api, TicketDetail } from "@/lib/api";
import TicketStatusBadge from "@/components/TicketStatusBadge";
import PriorityBadge from "@/components/PriorityBadge";

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = Number(params?.id);

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"chat" | "notes">("chat");

  const [replyText, setReplyText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!ticketId) return;
    loadTicket();
  }, [ticketId]);

  async function loadTicket() {
    setLoading(true);
    try {
      const data = await api.getTicketDetail("support-demo-999", ticketId);
      setTicket(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await api.addMessage("support-demo-999", ticketId, replyText.trim(), true);
      setReplyText("");
      await loadTicket();
    } catch (err) {
      alert("Failed to send reply.");
    } finally {
      setSending(false);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSending(true);
    try {
      await api.addNote("support-demo-999", ticketId, noteText.trim());
      setNoteText("");
      await loadTicket();
    } catch (err) {
      alert("Failed to add private note.");
    } finally {
      setSending(false);
    }
  }

  async function handleClaim() {
    try {
      await api.claimTicket("support-demo-999", ticketId, "Alex (Lead Engineer)");
      await loadTicket();
    } catch (err) {
      alert("Failed to claim ticket.");
    }
  }

  async function handleStatusChange(newStatus: string) {
    try {
      await api.updateStatus("support-demo-999", ticketId, newStatus);
      await loadTicket();
    } catch (err) {
      alert("Failed to update status.");
    }
  }

  async function handlePriorityChange(newPriority: string) {
    try {
      await api.updatePriority("support-demo-999", ticketId, newPriority);
      await loadTicket();
    } catch (err) {
      alert("Failed to update priority.");
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-zinc-400 font-mono">Loading ticket workspace...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Ticket not found</h2>
        <Link href="/dashboard" className="text-xs text-blue-400 hover:underline">
          Return to Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Back button & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition pb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Queue
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xl font-mono font-bold text-blue-400">#{ticket.ticket_number}</span>
            <h1 className="text-xl font-bold text-white">{ticket.subject}</h1>
            <TicketStatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!ticket.assigned_agent_id && (
            <button
              onClick={handleClaim}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Claim Ticket
            </button>
          )}

          <a
            href={`http://localhost:8000/api/v1/tickets/support-demo-999/${ticket.id}/transcript?format=html`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-xs text-zinc-300 flex items-center gap-1.5 transition"
          >
            <FileText className="w-3.5 h-3.5" />
            HTML Transcript
          </a>
        </div>
      </div>

      {/* Main Grid: Conversation + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Timeline, Messages & Notes */}
        <div className="lg:col-span-8 space-y-4">
          {/* Initial Customer Request Card */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-semibold text-white">Initial Request</span>
              <span className="font-mono text-[11px]">{ticket.created_at.substring(0, 16).replace("T", " ")} UTC</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">{ticket.description}</p>
          </div>

          {/* Tab Selector: Conversation vs Staff Notes */}
          <div className="flex border-b border-zinc-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab("chat")}
              className={`py-2 px-4 border-b-2 flex items-center gap-1.5 transition ${
                activeTab === "chat"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Conversation ({ticket.messages.length})
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`py-2 px-4 border-b-2 flex items-center gap-1.5 transition ${
                activeTab === "notes"
                  ? "border-amber-500 text-amber-400"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Internal Notes ({ticket.notes.length})
            </button>
          </div>

          {activeTab === "chat" ? (
            <div className="space-y-4">
              <div className="space-y-3 min-h-[220px]">
                {ticket.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                      m.is_staff
                        ? "bg-blue-950/20 border-blue-900/50 ml-6"
                        : "bg-zinc-900/60 border-zinc-800/80 mr-6"
                    }`}
                  >
                    <div className="flex items-center justify-between text-zinc-400 font-mono text-[11px]">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        {m.author_name}
                        {m.is_staff && (
                          <span className="px-1.5 py-0.2 rounded bg-blue-600 text-[10px] text-white font-sans">
                            STAFF
                          </span>
                        )}
                      </span>
                      <span>{m.timestamp.substring(11, 16)}</span>
                    </div>
                    <p className="text-zinc-200 leading-relaxed whitespace-pre-line">{m.content}</p>
                  </div>
                ))}
              </div>

              {/* Staff Reply Form */}
              <form onSubmit={handleSendReply} className="space-y-2 pt-2">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type official support reply to customer..."
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition ml-auto"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sending ? "Sending..." : "Send Response"}
                </button>
              </form>
            </div>
          ) : (
            /* Internal Notes Tab */
            <div className="space-y-4">
              <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Internal staff notes are never displayed to the customer or posted in Discord channels.</span>
              </div>

              <div className="space-y-3 min-h-[160px]">
                {ticket.notes.length === 0 ? (
                  <p className="text-xs text-zinc-500 font-mono italic py-4">No internal notes recorded yet.</p>
                ) : (
                  ticket.notes.map((n) => (
                    <div key={n.id} className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 text-xs space-y-1">
                      <div className="flex justify-between text-zinc-400 font-mono text-[11px]">
                        <span className="font-semibold text-amber-400">{n.staff_name}</span>
                        <span>{n.created_at.substring(0, 16).replace("T", " ")}</span>
                      </div>
                      <p className="text-zinc-300">{n.note_text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-2 pt-2">
                <textarea
                  rows={2}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Record confidential troubleshooting notes, user verification details..."
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition ml-auto"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Add Internal Note
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Ticket Metadata, SLA & Actions */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4">
            <h3 className="font-semibold text-sm text-white border-b border-zinc-800/80 pb-2">Ticket Properties</h3>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-zinc-400 uppercase">Status Transition</label>
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Open">Open</option>
                  <option value="Waiting for Staff">Waiting for Staff</option>
                  <option value="Waiting for Customer">Waiting for Customer</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-zinc-400 uppercase">Priority Rating</label>
                <select
                  value={ticket.priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="pt-2 border-t border-zinc-800/60 space-y-2 text-zinc-400">
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <strong className="text-white">{ticket.customer_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Discord ID:</span>
                  <span className="font-mono text-zinc-400">{ticket.customer_id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Category:</span>
                  <span className="text-white">{ticket.category}</span>
                </div>
                <div className="flex justify-between">
                  <span>Assigned Agent:</span>
                  <span className="text-blue-400 font-medium">
                    {ticket.assigned_agent_name || "Unassigned"}
                  </span>
                </div>
              </div>

              {ticket.rating && (
                <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/10 space-y-1">
                  <div className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>Customer Rating: {ticket.rating} / 5</span>
                  </div>
                  {ticket.rating_comment && (
                    <p className="text-[11px] text-zinc-300 italic">&ldquo;{ticket.rating_comment}&rdquo;</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
