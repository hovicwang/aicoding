import { cn, STATUS_META } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const meta = STATUS_META[status] ?? STATUS_META.ready;
  return (
    <span
      className={cn(
        "chip",
        (status === "analyzing" ||
          status === "generating" ||
          status === "publishing") &&
          "animate-pulseglow",
        className,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", meta.dot)} />
      <span className={meta.color}>{meta.label}</span>
    </span>
  );
}
