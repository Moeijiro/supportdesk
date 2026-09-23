import { BrandMark } from "@/components/kit/brand";

/** A life ring: support that comes to you. */
export function Logo({ wordmark = true, className }: { wordmark?: boolean; className?: string }) {
  return (
    <BrandMark name="SupportDesk" wordmark={wordmark} className={className}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M6.5 6.5l3.4 3.4M17.5 6.5l-3.4 3.4M6.5 17.5l3.4-3.4M17.5 17.5l-3.4-3.4" />
    </BrandMark>
  );
}
