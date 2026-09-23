"use client";

import Link from "next/link";
import { Headphones, LifeBuoy, BarChart3, Inbox } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center group-hover:border-blue-400 transition">
            <Headphones className="w-4 h-4 text-blue-400" />
          </div>
          <span className="font-bold tracking-tight text-white flex items-center gap-1.5">
            SupportDesk
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 border border-blue-800/60 text-blue-400 font-mono">
              Helpdesk CRM
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-4 text-xs font-medium">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold transition glow-blue"
          >
            <Inbox className="w-3.5 h-3.5" />
            Ticket Queue
          </Link>
          <Link
            href="/analytics"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-zinc-300 hover:text-white transition"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            SLA Reports
          </Link>
        </div>
      </div>
    </nav>
  );
}
