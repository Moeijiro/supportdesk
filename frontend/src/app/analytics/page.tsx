"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Clock, ArrowLeft, CheckCircle2, AlertCircle, Headphones } from "lucide-react";
import { api, OverviewStats, CategoryBreakdown } from "@/lib/api";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const [st, cats] = await Promise.all([
        api.getOverview("support-demo-999"),
        api.getCategories("support-demo-999"),
      ]);
      setStats(st);
      setCategories(cats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 py-4">
      <div className="space-y-1 border-b border-zinc-800/80 pb-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition pb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Ticket Queue
        </Link>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          Support SLA & Performance Analytics
        </h1>
        <p className="text-xs text-zinc-400">
          Measured first-response times, resolution durations, and category distribution for <strong className="text-white">Acme Cloud Technologies</strong>.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-zinc-400 font-mono">Aggregating telemetry...</div>
      ) : (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Avg First Response</span>
              <p className="text-2xl font-bold text-blue-400">
                {stats?.average_first_response_minutes || 0} min
              </p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Avg Resolution Time</span>
              <p className="text-2xl font-bold text-emerald-400">
                {stats?.average_resolution_hours || 0} hrs
              </p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Resolved Today</span>
              <p className="text-2xl font-bold text-white">{stats?.resolved_today_count || 0}</p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Lifetime Tickets</span>
              <p className="text-2xl font-bold text-zinc-300">{stats?.total_tickets_recorded || 0}</p>
            </div>
          </div>

          {/* Category Distribution Breakdown */}
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4">
            <h3 className="font-semibold text-sm text-white">Tickets by Category Breakdown</h3>

            <div className="space-y-3">
              {categories.map((c) => (
                <div key={c.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-white">{c.category}</span>
                    <span className="font-mono text-zinc-400">
                      {c.count} tickets ({c.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800/80">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all"
                      style={{ width: `${c.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
