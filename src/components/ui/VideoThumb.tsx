import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

export function VideoThumb({
  gradient,
  label,
  ratio = "video",
  duration,
  className,
  playing,
}: {
  gradient?: string;
  label?: string;
  ratio?: "video" | "9:16" | "1:1" | "16:9" | "4:5";
  duration?: string;
  className?: string;
  playing?: boolean;
}) {
  const ratioClass =
    ratio === "9:16"
      ? "aspect-[9/16]"
      : ratio === "1:1"
        ? "aspect-square"
        : ratio === "4:5"
          ? "aspect-[4/5]"
          : "aspect-video";

  // 真实缩略图（data URL 或 http URL）优先用 <img>，否则回退到渐变色块
  const isRealImage =
    gradient?.startsWith("data:") || gradient?.startsWith("http");

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl",
        ratioClass,
        className,
      )}
      style={
        isRealImage
          ? undefined
          : {
              backgroundImage: gradient || "linear-gradient(135deg,#262220,#161412)",
            }
      }
    >
      {isRealImage && (
        <img
          src={gradient}
          alt={label ?? "视频缩略图"}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
      {!isRealImage && (
        <div
          className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg,#fff 0 1px,transparent 1px 28px)",
          }}
        />
      )}
      <div
        className={cn(
          "absolute inset-0 grid place-items-center transition-transform group-hover:scale-110",
          playing && "scale-110",
        )}
      >
        <span
          className={cn(
            "grid place-items-center rounded-full backdrop-blur-md border border-white/30",
            playing ? "w-12 h-12 bg-gold-500/90" : "w-11 h-11 bg-black/30",
          )}
        >
          <Play
            className={cn(
              "w-4 h-4 ml-0.5",
              playing ? "text-ink-950" : "text-white",
            )}
            fill="currentColor"
          />
        </span>
      </div>
      {label && (
        <div className="absolute left-3 bottom-3 right-3">
          <p className="text-[11px] text-white/90 font-medium line-clamp-2 drop-shadow">
            {label}
          </p>
        </div>
      )}
      {duration && (
        <div className="absolute right-2 bottom-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur text-[10px] font-mono text-white/90">
          {duration}
        </div>
      )}
    </div>
  );
}
