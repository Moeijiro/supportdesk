import { DeskShell } from "@/components/desk-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <DeskShell>{children}</DeskShell>;
}
