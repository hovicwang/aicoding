import { motion } from "motion/react";
import { Check, Loader2, Play } from "lucide-react";
import type { AspectRatio, Variant } from "@/types";
import { VideoThumb } from "@/components/ui/VideoThumb";
import { PlatformGlyph } from "@/components/ui/PlatformGlyph";
import { PLATFORMS } from "@/data/mock";
import { cn } from "@/lib/utils";

export default function VariantCard({
  variant,
  index,
  selected,
  onToggle,
}: {
  variant: Variant;
  index: number;
  selected: boolean;
  onToggle: () => void;
}) {
  const platform = PLATFORMS[variant.platform as keyof typeof PLATFORMS];
  const ratioLabel: Record<AspectRatio, string> = {
    "9:16": "竖屏",
    "1:1": "方图",
    "16:9": "横屏",
    "4:5": "竖卡",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "card-surface p-3 cursor-pointer transition-all relative overflow-hidden",
        selected
          ? "border-fission-500/50 ring-1 ring-fission-500/40"
          : "hover:border-white/15",
      )}
      onClick={onToggle}
    >
      <div className="relative">
        <VideoThumb
          gradient={variant.thumbnail}
          ratio={variant.aspectRatio as AspectRatio}
        />
        {variant.status === "generating" && (
          <div className="absolute inset-0 grid place-items-center bg-ink-950/50 backdrop-blur-sm">
            <div className="absolute inset-x-0 top-0 h-full overflow-hidden">
              <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-fission-400/40 to-transparent animate-scansheen" />
            </div>
            <Loader2 className="w-6 h-6 text-fission-400 animate-spin" />
          </div>
        )}
        <div className="absolute top-1.5 left-1.5">
          <PlatformGlyph platform={variant.platform as keyof typeof PLATFORMS} size={22} />
        </div>
        {selected && (
          <div className="absolute top-1.5 right-1.5 grid place-items-center w-5 h-5 rounded-full bg-fission-500">
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
        )}
        <button className="absolute inset-0 grid place-items-center opacity-0 hover:opacity-100 transition-opacity">
          <span className="grid place-items-center w-10 h-10 rounded-full bg-black/50 backdrop-blur border border-white/30">
            <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
          </span>
        </button>
      </div>
      <div className="mt-2.5 px-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-bone-100">
            {variant.style}
          </span>
          <span className="font-mono text-[10px] text-bone-400">
            {variant.aspectRatio} · {variant.duration}s
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[10px] text-bone-500">{platform.name}</span>
          <span className="text-[10px] text-bone-500">{ratioLabel[variant.aspectRatio as AspectRatio]}</span>
        </div>
      </div>
    </motion.div>
  );
}
