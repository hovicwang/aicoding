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
  VolumeX,
  Maximize2,
  Minimize2,
  Subtitles,
  Split,
  Scissors,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Timeline from "@/components/studio/Timeline";
import SegmentPanel from "@/components/studio/SegmentPanel";
import AnalysisProgress from "@/components/studio/AnalysisProgress";
import { useSourceVideoUrl } from "@/hooks/useVideoUrl";
import { toast } from "@/components/ui/toastStore";
import { cn, formatTimecode } from "@/lib/utils";

export default function Studio() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId),
  );
  const toggleHighlight = useProjectStore((s) => s.toggleHighlight);
  const selectAll = useProjectStore((s) => s.selectAllHighlights);
  const analysisProgress = useProjectStore((s) =>
    projectId ? s.analysisProgress[projectId] : undefined,
  );
  const setProjectStatus = useProjectStore((s) => s.setProjectStatus);
  const retryAnalysis = useProjectStore((s) => s.retryAnalysis);
  const cancelAnalysis = useProjectStore((s) => s.cancelAnalysis);
  const analysisAsync = useProjectStore((s) =>
    projectId ? s.async[`analysis-${projectId}`] : undefined,
  );

  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const [duration, setDuration] = useState(project?.duration ?? 0);
  const [waiting, setWaiting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerWrapRef = useRef<HTMLDivElement>(null);

  const { url: videoUrl, loading: videoLoading, error: videoError } =
    useSourceVideoUrl(project?.videoUrl);

  const toggleFullscreen = () => {
    const el = playerWrapRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const onFsChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // 播放/暂停同步到 <video>
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) v.play().catch(() => setPlaying(false));
    else v.pause();
  }, [playing, videoUrl]);

  // timeupdate 同步 playhead
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setPlayhead(v.currentTime);
    const onDur = () => setDuration(v.duration || project?.duration || 0);
    const onWait = () => setWaiting(true);
    const onPlay = () => {
      setWaiting(false);
      setPlaying(true);
    };
    const onPause = () => setPlaying(false);
    const onErr = () =>
      setLoadError("视频加载失败，文件可能已损坏或不被浏览器支持");
    const onEnded = () => setPlaying(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onDur);
    v.addEventListener("durationchange", onDur);
    v.addEventListener("waiting", onWait);
    v.addEventListener("playing", onPlay);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("error", onErr);
    v.addEventListener("ended", onEnded);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onDur);
      v.removeEventListener("durationchange", onDur);
      v.removeEventListener("waiting", onWait);
      v.removeEventListener("playing", onPlay);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("error", onErr);
      v.removeEventListener("ended", onEnded);
    };
  }, [videoUrl, project?.duration]);

  // 若项目处于分析中且尚未启动/未失败，自动启动分析流程
  useEffect(() => {
    if (
      project &&
      project.status === "analyzing" &&
      project.highlights.length === 0 &&
      analysisAsync?.status !== "loading" &&
      analysisAsync?.status !== "error"
    ) {
      retryAnalysis(project.id);
    }
  }, [project, analysisAsync?.status, retryAnalysis]);

  if (!project) {
    return (
      <div className="p-10 text-center text-bone-400">
        项目不存在或已被删除。
      </div>
    );
  }

  const selectedCount = project.highlights.filter((h) => h.selected).length;

  // 分析中或分析失败：展示分析进度视图
  if (project.status === "analyzing" && project.highlights.length === 0) {
    const failed = analysisAsync?.status === "error";
    return (
      <div className="px-4 lg:px-8 py-8 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/upload")}
            className="grid place-items-center w-9 h-9 rounded-xl btn-ghost shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-display text-xl font-extrabold truncate">
            {project.title}
          </h1>
          <StatusBadge status={project.status} />
        </div>
        <AnalysisProgress
          stage={analysisProgress?.stage ?? 0}
          percent={analysisProgress?.percent ?? 0}
          title={project.title}
          error={failed ? analysisAsync?.error : undefined}
          onRetry={() => retryAnalysis(project.id)}
          onCancel={() => {
            cancelAnalysis(project.id);
            navigate("/upload");
          }}
        />
      </div>
    );
  }

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
          {project.status === "ready" && selectedCount > 0 && (
            <button
              onClick={() => {
                setProjectStatus(project.id, "clipped");
                toast.success("剪辑已保存，可进入裂变");
              }}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl btn-ghost text-sm"
            >
              <Scissors className="w-4 h-4 text-gold-400" />
              保存剪辑
            </button>
          )}
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
            <div className="relative group bg-black rounded-xl overflow-hidden" ref={playerWrapRef}>
              {videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full aspect-video object-contain bg-black"
                  playsInline
                  muted={muted}
                  onClick={() => setPlaying((p) => !p)}
                />
              ) : (
                <div className="w-full aspect-video grid place-items-center bg-gradient-to-br from-ink-900 to-ink-950">
                  {videoError ? (
                    <div className="text-center px-6">
                      <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                      <p className="text-sm text-red-300">{videoError}</p>
                      <button
                        onClick={() => navigate("/upload")}
                        className="mt-3 text-xs text-gold-300 hover:text-gold-200"
                      >
                        返回上传
                      </button>
                    </div>
                  ) : videoLoading ? (
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-gold-400 animate-spin mx-auto mb-2" />
                      <p className="text-xs text-bone-400">正在加载视频…</p>
                    </div>
                  ) : null}
                </div>
              )}

              {/* 加载中指示 */}
              {waiting && videoUrl && !loadError && !videoError && (
                <div className="absolute inset-0 grid place-items-center bg-black/30 pointer-events-none">
                  <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
                </div>
              )}

              {/* 字幕（基于高光片段标签） */}
              {showSubtitle && playing && videoUrl && !loadError && !videoError && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-12 px-3 py-1 rounded bg-black/60 backdrop-blur text-[12px] text-white/90 max-w-[80%]">
                  {currentCaption(project.highlights, playhead)}
                </div>
              )}

              {/* 大播放按钮 */}
              {videoUrl && !loadError && !videoError && (
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
              )}
            </div>

            {/* 进度条（可拖拽 seek） */}
            <div className="mt-3 flex items-center gap-3">
              <div
                className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden cursor-pointer"
                onClick={(e) => {
                  const v = videoRef.current;
                  if (!v || !duration) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = (e.clientX - rect.left) / rect.width;
                  v.currentTime = Math.max(0, Math.min(duration, ratio * duration));
                }}
              >
                <div
                  className="h-full bg-gradient-to-r from-gold-500 to-fission-500"
                  style={{ width: `${duration ? (playhead / duration) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* controls */}
            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={() => {
                  const v = videoRef.current;
                  if (v) v.currentTime = Math.max(0, v.currentTime - 10);
                }}
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
                onClick={() => {
                  const v = videoRef.current;
                  if (v) v.currentTime = Math.min(duration, v.currentTime + 10);
                }}
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
                  / {formatTimecode(duration || project.duration).split(".")[0]}
                </span>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => setShowSubtitle((v) => !v)}
                  className={cn(
                    "p-1.5 rounded-lg hover:bg-white/5",
                    showSubtitle ? "text-gold-400" : "text-bone-400",
                  )}
                  title="字幕开关"
                >
                  <Subtitles className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setMuted((m) => {
                      const next = !m;
                      if (videoRef.current) videoRef.current.muted = next;
                      return next;
                    });
                  }}
                  className={cn(
                    "p-1.5 rounded-lg hover:bg-white/5",
                    !muted ? "text-bone-200" : "text-bone-400",
                  )}
                  title="静音切换"
                >
                  {muted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => toggleFullscreen()}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-bone-400"
                  title="全屏"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
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
