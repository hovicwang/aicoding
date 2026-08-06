import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Maximize2,
  Subtitles,
  Split,
  Settings2,
} from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import { VideoThumb } from "@/components/ui/VideoThumb";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Timeline from "@/components/studio/Timeline";
import SegmentPanel from "@/components/studio/SegmentPanel";
import { cn, formatTimecode } from "@/lib/utils";

export default function Studio() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId),
  );
  const toggleHighlight = useProjectStore((s) => s.toggleHighlight);
  const selectAll = useProjectStore((s) => s.selectAllHighlights);

  const [playing, setPlaying] = useState(true);
  const [playhead, setPlayhead] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!project) return;
    if (playhead >= project.duration) setPlayhead(0);
  }, [playhead, project]);

  useEffect(() => {
    if (!playing || !project) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setPlayhead((p) => (p + dt * 24) % (project.duration || 1));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, project]);

  if (!project) {
    return (
      <div className="p-10 text-center text-bone-400">
        项目不存在或已被删除。
      </div>
    );
  }

  const selectedCount = project.highlights.filter((h) => h.selected).length;

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1500px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/upload")}
            className="grid place-items-center w-9 h-9 rounded-xl btn-ghost shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-extrabold truncate">
                {project.title}
              </h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-xs text-bone-400 mt-0.5">
              {project.source} · 上传于 {project.uploadedAt}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 h-9 px-3 rounded-xl btn-ghost text-sm">
            <Settings2 className="w-4 h-4" />
            分析设置
          </button>
          <button
            onClick={() => navigate(`/fission/${project.id}`)}
            disabled={selectedCount === 0}
            className={cn(
              "flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm",
              selectedCount > 0 ? "btn-fission" : "btn-ghost opacity-50 cursor-not-allowed",
            )}
          >
            <Split className="w-4 h-4" />
            进入裂变 ({selectedCount})
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-5">
        <div className="space-y-5 min-w-0">
          {/* Video previewer */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-surface p-4"
          >
            <div className="relative group">
              <VideoThumb
                gradient={project.thumbnail}
                ratio="16:9"
                playing={playing}
              />
              {/* simulated caption */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-12 px-3 py-1 rounded bg-black/60 backdrop-blur text-[12px] text-white/90 max-w-[80%]">
                {currentCaption(project.highlights, playhead)}
              </div>
              {/* big play overlay */}
              <button
                onClick={() => setPlaying((p) => !p)}
                className="absolute inset-0 grid place-items-center"
              >
                <span
                  className={cn(
                    "grid place-items-center rounded-full backdrop-blur-md border border-white/30 transition-opacity",
                    playing
                      ? "w-14 h-14 bg-gold-500/90 opacity-0 group-hover:opacity-100"
                      : "w-16 h-16 bg-gold-500/90 opacity-100",
                  )}
                >
                  {playing ? (
                    <Pause className="w-6 h-6 text-ink-950" fill="currentColor" />
                  ) : (
                    <Play className="w-6 h-6 ml-0.5 text-ink-950" fill="currentColor" />
                  )}
                </span>
              </button>
            </div>

            {/* controls */}
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => setPlayhead((p) => Math.max(0, p - 10))}
                className="p-1.5 rounded-lg hover:bg-white/5 text-bone-300"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPlaying((p) => !p)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-bone-50"
              >
                {playing ? (
                  <Pause className="w-4 h-4" fill="currentColor" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                )}
              </button>
              <button
                onClick={() =>
                  setPlayhead((p) => Math.min(project.duration, p + 10))
                }
                className="p-1.5 rounded-lg hover:bg-white/5 text-bone-300"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              <div className="font-mono text-xs text-bone-300 tabular-nums">
                {formatTimecode(playhead).split(".")[0]}
                <span className="text-bone-500">
                  .{formatTimecode(playhead).split(".")[1]}
                </span>
                <span className="text-bone-600">
                  {" "}
                  / {formatTimecode(project.duration).split(".")[0]}
                </span>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <button className="p-1.5 rounded-lg hover:bg-white/5 text-bone-400">
                  <Subtitles className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-white/5 text-bone-400">
                  <Volume2 className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-white/5 text-bone-400">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>

          <Timeline
            project={project}
            playhead={playhead}
            onSelectHighlight={(id) => toggleHighlight(project.id, id)}
            onSeek={setPlayhead}
          />
        </div>

        <SegmentPanel
          project={project}
          onToggle={(id) => toggleHighlight(project.id, id)}
          onSelectAll={(v) => selectAll(project.id, v)}
        />
      </div>
    </div>
  );
}

function currentCaption(
  highlights: { start: number; end: number; label: string }[],
  t: number,
) {
  const cur = highlights.find((h) => t >= h.start && t <= h.end);
  return cur ? cur.label : "…";
}
