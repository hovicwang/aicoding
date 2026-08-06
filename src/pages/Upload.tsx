import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  UploadCloud,
  Film,
  Loader2,
  Search,
  LayoutGrid,
  List as ListIcon,
  Sparkles,
  Scissors,
} from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import PageHeader from "@/components/ui/PageHeader";
import ProjectCard from "@/components/cards/ProjectCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { VideoThumb } from "@/components/ui/VideoThumb";
import { cn, formatDuration } from "@/lib/utils";
import type { ProjectStatus } from "@/types";

const FILTERS: { key: ProjectStatus | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "analyzing", label: "分析中" },
  { key: "ready", label: "待剪辑" },
  { key: "fissioned", label: "已裂变" },
  { key: "distributed", label: "已分发" },
];

export default function Upload() {
  const navigate = useNavigate();
  const projects = useProjectStore((s) => s.projects);
  const addProject = useProjectStore((s) => s.addProject);
  const [filter, setFilter] = useState<ProjectStatus | "all">("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);

  const filtered = useMemo(
    () =>
      projects.filter(
        (p) =>
          (filter === "all" || p.status === filter) &&
          p.title.toLowerCase().includes(query.toLowerCase()),
      ),
    [projects, filter, query],
  );

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      const id = addProject("新上传项目 · 待命名");
      setUploading(false);
      navigate(`/studio/${id}`);
    }, 1600);
  };

  return (
    <div className="px-4 lg:px-8 py-8 max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="Upload & Library"
        title="上传视频，管理项目库"
        description="拖拽上传任意时长视频，AI 将自动启动高光分析。下方为你的全部项目。"
        actions={
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center gap-2 h-10 px-5 rounded-xl btn-gold text-sm"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4" strokeWidth={2.5} />
            )}
            {uploading ? "上传中…" : "上传视频"}
          </button>
        }
      />

      {/* Upload dropzone */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative card-surface noise overflow-hidden mb-10"
      >
        <div className="absolute inset-0 bg-radial-gold opacity-50" />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="relative w-full p-10 lg:p-14 text-left"
        >
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div
              className={cn(
                "grid place-items-center w-24 h-24 rounded-3xl border-2 border-dashed transition-all",
                uploading
                  ? "border-gold-500/60 bg-gold-500/10"
                  : "border-white/15 bg-white/[0.03] group-hover:border-gold-500/50",
              )}
            >
              {uploading ? (
                <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
              ) : (
                <UploadCloud className="w-8 h-8 text-gold-400" />
              )}
            </div>
            <div className="flex-1 text-center lg:text-left">
              <h3 className="font-display text-xl font-bold">
                {uploading ? "正在上传并启动 AI 分析…" : "拖拽视频到此处，或点击上传"}
              </h3>
              <p className="text-sm text-bone-400 mt-1.5">
                支持 MP4 / MOV / MKV，单文件最大 10GB · 4K 原片自动转码
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <span className="chip bg-gold-500/10 border-gold-500/25 text-gold-300">
                  <Sparkles className="w-3 h-3" /> 自动识别高光
                </span>
                <span className="chip bg-fission-500/10 border-fission-500/25 text-fission-300">
                  智能字幕生成
                </span>
                <span className="chip bg-white/[0.04] text-bone-300">
                  多机位对齐
                </span>
              </div>
            </div>
          </div>
        </button>
      </motion.div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "shrink-0 px-3 h-8 rounded-lg text-xs font-medium transition-all border",
                filter === f.key
                  ? "bg-gold-500/15 border-gold-500/40 text-gold-300"
                  : "bg-white/[0.03] border-white/[0.07] text-bone-300 hover:border-white/15",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 h-8 rounded-lg btn-ghost">
            <Search className="w-3.5 h-3.5 text-bone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索项目"
              className="bg-transparent outline-none text-xs w-32 placeholder:text-bone-500"
            />
          </div>
          <div className="flex items-center rounded-lg btn-ghost p-0.5">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "p-1.5 rounded-md",
                view === "grid" ? "bg-white/10 text-gold-300" : "text-bone-400",
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "p-1.5 rounded-md",
                view === "list" ? "bg-white/10 text-gold-300" : "text-bone-400",
              )}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Project list */}
      <AnimatePresence mode="wait">
        {view === "grid" ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filtered.map((p, i) => (
              <ProjectCard key={p.id} project={p} index={i} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="card-surface overflow-hidden"
          >
            {filtered.map((p, i) => (
              <button
                key={p.id}
                onClick={() => navigate(`/studio/${p.id}`)}
                className={cn(
                  "w-full flex items-center gap-4 p-3 text-left hover:bg-white/[0.03] transition-colors",
                  i !== filtered.length - 1 && "border-b border-white/[0.05]",
                )}
              >
                <div className="w-24 shrink-0">
                  <VideoThumb
                    gradient={p.thumbnail}
                    ratio="16:9"
                    duration={formatDuration(p.duration)}
                    playing
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-sm truncate">
                      {p.title}
                    </h3>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-[11px] text-bone-400 mt-1">
                    {p.source} · {p.uploadedAt}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-[11px] text-gold-300">
                  <Scissors className="w-3 h-3" />
                  {p.highlights.filter((h) => h.selected).length} 段
                </div>
                <Film className="w-4 h-4 text-bone-500" />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
