"use client";


import Link from "next/link";
import { ArrowRight, BarChart3, FileText, Hash, Inbox, Lock, MessageSquareText, MousePointerClick, Shield, Tags, UserCheck } from "lucide-react";
import { Logo } from "@/components/brand";
import { CtaBand, FeatureCard, Hero, HeroButton, HeroCard, InfoCard, Section, SiteFooter, SiteNav } from "@/components/kit/site";
import { Pill, Tag } from "@/components/kit/ui";
import { Button } from "@/components/ui/button";

function TicketPreview() {
  return (
    <HeroCard>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted-foreground">#1001 · Sarah_Dev · 2 h ago</p>
          <p className="mt-0.5 font-semibold">API Gateway 502 Bad Gateway</p>
        </div>
        <div className="flex flex-wrap gap-1.5"><Pill tone="run">In Progress</Pill><Pill tone="fail" dot={false}>Urgent</Pill><Tag>Technical Issue</Tag></div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_240px]">
        <ol className="space-y-2.5">
          <li className="max-w-[85%] rounded-xl border bg-card px-3.5 py-2.5 text-sm"><span className="mb-0.5 block text-xs font-medium">Sarah_Dev</span>Staging started returning 502s on /v1/auth this morning.</li>
          <li className="ml-auto max-w-[85%] rounded-xl border border-primary/20 bg-accent px-3.5 py-2.5 text-sm"><span className="mb-0.5 flex items-center gap-1.5 text-xs font-medium">Alex Morgan <span className="rounded bg-primary px-1 text-[10px] text-primary-foreground">STAFF</span></span>I&apos;ve taken the ticket and I&apos;m checking the proxy timeouts now.</li>
          <li className="flex items-center gap-2 rounded-lg border border-dashed bg-warn/5 px-3 py-2 text-xs text-muted-foreground"><Lock className="size-3.5 text-warn" />Internal note: upstream keepalive on cluster B — not visible to the customer.</li>
        </ol>
        <dl className="space-y-2 rounded-xl border bg-muted/30 p-4 text-sm">
          {[["First response", "15 min"], ["Assignee", "Alex Morgan"], ["Channel", "#ticket-1001"], ["Transcript", "on close"]].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
          ))}
        </dl>
      </div>
    </HeroCard>
  );
}

export default function Landing() {
  return (
    <>
      <SiteNav brand={<Logo />} links={[["#how", "How it works"], ["#features", "Features"], ["#use-cases", "Use cases"]]}
        actions={<><Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link href="/analytics">Analytics</Link></Button><Button asChild size="sm"><Link href="/dashboard">Open the demo</Link></Button></>} />
      <main id="main">
        <Hero eyebrow="Discord helpdesk"
          title="Customer support that lives in your Discord server."
          description="SupportDesk turns a support channel into a real ticket queue: private ticket channels, agent assignment, internal notes, transcripts when a ticket closes, and response times measured from real timestamps."
          actions={<><HeroButton href="/dashboard">Open the ticket queue<ArrowRight data-icon="inline-end" /></HeroButton><HeroButton href="#how" variant="outline">How it works</HeroButton></>}
          note="The demo runs on generated tickets — no Discord account needed."
          visual={<TicketPreview />} />

        <Section id="how" eyebrow="How it works" title="From a button in Discord to a closed ticket">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard icon={MousePointerClick} title="Customer opens a ticket" index={1}>A support panel button opens a short form: category, subject and description.</FeatureCard>
            <FeatureCard icon={Hash} title="A private channel appears" index={2} delay={0.05}>Only the customer and the support role can see it. The ticket joins the queue here.</FeatureCard>
            <FeatureCard icon={UserCheck} title="An agent claims it" index={3} delay={0.1}>Claim, reply, change priority and status from Discord or the dashboard.</FeatureCard>
            <FeatureCard icon={FileText} title="Close with a transcript" index={4} delay={0.15}>The conversation is saved as HTML and text, and the customer can rate the help.</FeatureCard>
          </div>
        </Section>

        <Section id="features" eyebrow="For the support team" title="Everything a small support team needs, nothing it doesn't" tinted>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard icon={Inbox} title="One ticket queue">Filter by status, category and priority; search by ticket number, customer or subject.</FeatureCard>
            <FeatureCard icon={Lock} title="Private staff notes" delay={0.05}>Verification details and escalation context stay in the dashboard, never in the customer&apos;s channel.</FeatureCard>
            <FeatureCard icon={BarChart3} title="Measured SLAs" delay={0.1}>First-response and resolution times come from the ticket&apos;s timestamps, not estimates.</FeatureCard>
            <FeatureCard icon={Tags} title="Categories and priorities">Billing, technical, purchase and account questions — each with Low to Urgent priority.</FeatureCard>
            <FeatureCard icon={MessageSquareText} title="Canned responses" delay={0.05}>Saved replies for greetings, order checks and log requests, per server.</FeatureCard>
            <FeatureCard icon={Shield} title="Escaped transcripts" delay={0.1}>Every message is HTML-escaped before it goes into a transcript file.</FeatureCard>
          </div>
        </Section>

        <Section id="use-cases" eyebrow="Use cases" title="Built for communities that sell something" last>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoCard title="SaaS and developer tools">Bug reports and account questions from a Discord community, with a real queue behind them.</InfoCard>
            <InfoCard title="Game studios" delay={0.05}>Purchase and account-recovery tickets kept private instead of in a public help channel.</InfoCard>
            <InfoCard title="Creators and shops">Order and billing questions with a transcript you can attach to the order.</InfoCard>
            <InfoCard title="Agencies" delay={0.05}>One support channel per client server, with response times you can report on.</InfoCard>
          </div>
          <CtaBand title="See the queue with real-looking tickets" description="The demo server has open, waiting and resolved tickets — claim one, reply, add a note, and close it."
            action={<Button asChild size="lg" variant="secondary" className="h-11 px-5"><Link href="/dashboard">Open the demo<ArrowRight data-icon="inline-end" /></Link></Button>} />
        </Section>
      </main>
      <SiteFooter brand={<Logo />} right={<><Lock className="size-3.5" />Staff notes never leave the dashboard</>} />
    </>
  );
}
