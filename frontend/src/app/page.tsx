import Link from "next/link";
import { Headphones, Shield, Clock, FileText, ArrowRight, CheckCircle2, MessageSquare, Lock, Sparkles, Inbox } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="space-y-24 py-6">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-3xl mx-auto pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/40 bg-blue-500/10 text-blue-400 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Professional Discord Helpdesk • Linear/Zendesk Grade Workflow</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Enterprise customer support, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">
            native to Discord.
          </span>
        </h1>

        <p className="text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Elevate your Discord server into a structured CRM environment with categorized ticket routing, agent assignment, private internal staff notes, automated HTML transcripts, and SLA response tracking.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2 transition glow-blue"
          >
            Open Staff Ticket Queue
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/analytics"
            className="w-full sm:w-auto px-6 py-3 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-200 font-medium transition"
          >
            Explore SLA Analytics
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-white">Private Channel Gating</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Auto-provisions isolated Discord threads/channels accessible strictly to the customer, assigned support staff, and verified supervisor roles.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-white">Private Staff Notes</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Staff can record internal diagnostics, customer verification details, and escalation notes visible strictly in the web dashboard.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-white">Archival HTML Transcripts</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Automatically compiles clean, downloadable HTML and plain text transcripts with timestamps, author badges, and resolution metadata upon ticket close.
          </p>
        </div>
      </section>

      {/* SLA Policy Banner */}
      <section className="p-8 rounded-2xl border border-zinc-800 bg-zinc-900/20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 text-xs text-blue-400 font-mono">
            <Clock className="w-4 h-4" />
            <span>Measured SLA Engine</span>
          </div>
          <h2 className="text-xl font-bold text-white">Actual Timed Telemetry</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            SupportDesk calculates precise first-response times and resolution durations directly from database timestamps. No fake or fabricated averages.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shrink-0 glow-blue"
        >
          View Ticket Dashboard
        </Link>
      </section>
    </div>
  );
}
