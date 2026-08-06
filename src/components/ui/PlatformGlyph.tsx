import { PLATFORMS } from "@/data/mock";
import type { PlatformKey } from "@/types";
import { cn } from "@/lib/utils";

export function PlatformGlyph({
  platform,
  size = 28,
  className,
}: {
  platform: PlatformKey;
  size?: number;
  className?: string;
}) {
  const meta = PLATFORMS[platform];
  return (
    <span
      className={cn(
        "inline-grid place-items-center rounded-lg font-bold font-mono shrink-0",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        background: `${meta.color}22`,
        color: meta.color,
        border: `1px solid ${meta.color}44`,
      }}
      title={meta.name}
    >
      {meta.short}
    </span>
  );
}
