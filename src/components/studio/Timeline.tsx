import { motion } from "motion/react";
import { Check } from "lucide-react";
import type { Highlight, Project } from "@/types";
import { cn, formatTimecode, HIGHLIGHT_TYPE_META } from "@/lib/utils";

export default function Timeline({
  project,
  playhead,
  onSelectHighlight,
  onSeek,
}: {
  project: Project;
  playhead: number;
  onSelectHighlight: (id: string) => void;
  onSeek: (t: number) => void;
}) {
  const duration = project.duration || 1;

  const pct = (t: number) => `${(t / duration) * 100}%`;

  // Build a coarse confidence heatmap across the timeline
  const heat = Array.from({ length: 60 }, (_, i) => {
    const center = (i / 60) * duration;
    let v = 0.04;
    project.highlights.forEach((h) => {
      if (center >= h.start && center <= h.end) {
        v = Math.max(v, h.confidence);
      }
    });
    return v;
  });

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-base flex items-center gap-2">
            AI 高光时间轴
            <span className="text-[11px] font-sans font-normal text-bone-400">
              共 {project.highlights.length} 段 · 点击块切换选定
            </span>
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          {Object.entries(HIGHLIGHT_TYPE_META).map(([k, m]) => (
            <span key={k} className="flex items-center gap-1.5 text-bone-400">
              <span className={cn("w-2 h-2 rounded-sm", m.bg)} /> {m.label}
            </span>
          ))}
        </div>
      </div>

      {/* Heatmap strip */}
      <div className="flex items-end gap-[2px] h-8 mb-2 px-1">
        {heat.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: `${20 + v * 80}%`,
              background:
                v > 0.5
                  ? `linear-gradient(180deg, rgba(245,184,0,${0.3 + v * 0.5}), rgba(255,46,126,${v * 0.4}))`
                  : "rgba(255,255,255,0.06)",
            }}
          />
        ))}
      </div>

      {/* Track */}
      <div
        className="relative h-20 rounded-xl bg-ink-900/80 border border-white/[0.06] overflow-hidden cursor-pointer select-none"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const t = ((e.clientX - rect.left) / rect.width) * duration;
          onSeek(t);
        }}
      >
        {/* grid ticks */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex-1 border-r border-white/[0.04]" />
          ))}
        </div>

        {/* highlight blocks */}
        {project.highlights.map((h) => (
          <HighlightBlock
            key={h.id}
            h={h}
            pct={pct}
            onClick={(e) => {
              e.stopPropagation();
              onSelectHighlight(h.id);
            }}
          />
        ))}

        {/* playhead */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-gold-400 z-20 pointer-events-none"
          style={{ left: pct(playhead) }}
        >
          <div className="absolute -top-1 -left-[5px] w-3 h-3 rotate-45 bg-gold-400 shadow-glow" />
        </div>
      </div>

      {/* time axis */}
      <div className="flex justify-between mt-2 px-1 font-mono text-[10px] text-bone-500">
        <span>00:00</span>
        <span>{formatTimecode(duration * 0.25).split(".")[0]}</span>
        <span>{formatTimecode(duration * 0.5).split(".")[0]}</span>
        <span>{formatTimecode(duration * 0.75).split(".")[0]}</span>
        <span>{formatTimecode(duration).split(".")[0]}</span>
      </div>
    </div>
  );
}

function HighlightBlock({
  h,
  pct,
  onClick,
}: {
  h: Highlight;
  pct: (t: number) => string;
  onClick: (e: React.MouseEvent) => void;
}) {
  const meta = HIGHLIGHT_TYPE_META[h.type];
  return (
    <motion.button
      layout
      onClick={onClick}
      whileHover={{ y: -2 }}
      className={cn(
        "absolute top-2 bottom-2 rounded-lg border text-left px-2 py-1 overflow-hidden transition-all",
        h.selected
          ? "border-gold-400/60 ring-1 ring-gold-400/40"
          : "border-white/10 opacity-70 hover:opacity-100",
      )}
      style={{
        left: pct(h.start),
        width: `calc(${pct(h.end)} - ${pct(h.start)})`,
        background: h.selected
          ? `linear-gradient(180deg, ${meta.bg}, transparent)`
          : "rgba(255,255,255,0.04)",
      }}
    >
      <div className="flex items-center gap-1">
        <span className={cn("w-1.5 h-1.5 rounded-full", meta.bg)} />
        <span className="text-[9px] text-bone-200 font-medium truncate">
          {h.label}
        </span>
        {h.selected && (
          <Check className="w-2.5 h-2.5 text-gold-400 ml-auto shrink-0" />
        )}
      </div>
      <div className="mt-0.5 font-mono text-[8px] text-bone-400">
        {Math.round(h.confidence * 100)}%
      </div>
    </motion.button>
  );
}
