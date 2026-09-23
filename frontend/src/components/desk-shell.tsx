"use client";

import { BarChart3, Inbox } from "lucide-react";
import { Logo } from "@/components/brand";
import { AppShell, ShellAccount, type NavItem } from "@/components/kit/shell";
import { DEMO_GUILD_NAME } from "@/lib/api";

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Ticket queue", icon: Inbox },
  { href: "/analytics", label: "SLA analytics", icon: BarChart3 },
];

export function DeskShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell brand={<Logo />} items={NAV}
      footer={<ShellAccount name="Alex Morgan" detail={`Support lead · ${DEMO_GUILD_NAME}`} note="Demo server — tickets are generated, no real Discord account is connected." />}>
      {children}
    </AppShell>
  );
}
