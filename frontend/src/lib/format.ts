import type { Tone } from "@/components/kit/ui";
import type { Ticket } from "@/lib/api";

/** The API stores UTC without an offset; read it as UTC, not local time. */
export function parseUTC(value: string): Date {
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return parseUTC(value).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function formatTime(value: string): string {
  return parseUTC(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function relative(value: string | null | undefined): string {
  if (!value) return "—";
  const seconds = Math.round((Date.now() - parseUTC(value).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function duration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  return hours < 48 ? `${hours.toFixed(1)} h` : `${(hours / 24).toFixed(1)} days`;
}

export const STATUSES: Ticket["status"][] = ["Open", "Waiting for Staff", "In Progress", "Waiting for Customer", "Resolved", "Closed"];
export const PRIORITIES: Ticket["priority"][] = ["Low", "Normal", "High", "Urgent"];
export const CATEGORIES = ["Billing", "Technical Issue", "Purchase Question", "Account Help", "Other"];

export const STATUS_TONE: Record<Ticket["status"], Tone> = {
  Open: "primary",
  "Waiting for Staff": "warn",
  "In Progress": "run",
  "Waiting for Customer": "muted",
  Resolved: "ok",
  Closed: "muted",
};

export const PRIORITY_TONE: Record<Ticket["priority"], Tone> = {
  Low: "muted",
  Normal: "run",
  High: "warn",
  Urgent: "fail",
};
