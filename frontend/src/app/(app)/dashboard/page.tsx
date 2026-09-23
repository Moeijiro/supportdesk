"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Inbox, Search, Filter, Clock, Sparkles, CheckCircle2, 
  AlertCircle, UserCheck, ArrowRight, LifeBuoy 
} from "lucide-react";
import { api, Ticket, OverviewStats } from "@/lib/api";
import TicketStatusBadge from "@/components/TicketStatusBadge";
import PriorityBadge from "@/components/PriorityBadge";

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter, priorityFilter, search]);

  async function loadData() {
    setLoading(true);
    try {
      const [tList, st] = await Promise.all([
        api.getTickets("support-demo-999", {
          status: statusFilter,
          category: categoryFilter,
          priority: priorityFilter,
          search: search.trim() || undefined,
        }),
        api.getOverview("support-demo-999"),
      ]);
      setTickets(tList);
      setStats(st);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSeedDemo() {
    setSeeding(true);
    try {
      await api.seedDemo();
      await loadData();
    } catch (err) {
      alert("Failed to seed demo data.");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="space-y-8 py-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Inbox className="w-6 h-6 text-blue-400" />
            Support Ticket Queue
          </h1>
          <p className="text-xs text-zinc-400">
            Real-time Discord customer support desk for <strong className="text-white">Acme Cloud Technologies</strong>.
          </p>
        </div>

        <button
          onClick={handleSeedDemo}
          disabled={seeding}
          className="px-3.5 py-2 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300 flex items-center gap-1.5 transition disabled:opacity-50 self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          {seeding ? "Seeding..." : "Seed Demo Tickets"}
        </button>
      </div>

      {/* SLA Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 space-y-1">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Open Tickets</span>
          <p className="text-2xl font-bold text-white">{stats?.open_tickets_count || 0}</p>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 space-y-1">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Unassigned</span>
          <p className="text-2xl font-bold text-amber-400">{stats?.unassigned_count || 0}</p>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 space-y-1">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Waiting on Staff</span>
          <p className="text-2xl font-bold text-rose-400">{stats?.waiting_for_staff_count || 0}</p>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 space-y-1">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Avg First Response</span>
          <p className="text-2xl font-bold text-blue-400">
            {stats?.average_first_response_minutes || 0}m
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticket #, customer, subject..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Waiting for Staff">Waiting for Staff</option>
            <option value="Waiting for Customer">Waiting for Customer</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Categories</option>
            <option value="Billing">Billing</option>
            <option value="Technical Issue">Technical Issue</option>
            <option value="Purchase Question">Purchase Question</option>
            <option value="Account Help">Account Help</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Ticket Table */}
      {loading ? (
        <div className="py-24 text-center text-xs text-zinc-500 font-mono">Loading queue records...</div>
      ) : tickets.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-zinc-800 rounded-xl text-xs text-zinc-500 font-mono">
          No support tickets match the current criteria.
        </div>
      ) : (
        <div className="border border-zinc-800 rounded-xl bg-zinc-900/40 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4 w-20">Ticket</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-900/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">
                      #{t.ticket_number}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/tickets/${t.id}`}
                        className="font-semibold text-white hover:text-blue-400 transition"
                      >
                        {t.subject}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-zinc-300 font-medium">
                      {t.customer_name}
                    </td>
                    <td className="py-3 px-4 text-zinc-400">{t.category}</td>
                    <td className="py-3 px-4">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="py-3 px-4">
                      <TicketStatusBadge status={t.status} />
                    </td>
                    <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                      {t.assigned_agent_name || <span className="text-zinc-600">Unassigned</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/tickets/${t.id}`}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium transition inline-flex items-center gap-1"
                      >
                        Inspect <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
