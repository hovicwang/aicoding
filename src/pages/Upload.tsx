import { useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  UploadCloud,
  Film,
  Search,
  LayoutGrid,
  List as ListIcon,
  Sparkles,
  Scissors,
  FileVideo,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import PageHeader from "@/components/ui/PageHeader";
import ProjectCard from "@/components/cards/ProjectCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { VideoThumb } from "@/components/ui/VideoThumb";
import { EmptyView } from "@/components/ui/StateView";
import { ANALYSIS_STAGES } from "@/data/mock";
import { toast } from "@/components/ui/toastStore";
import { cn, formatDuration } from "@/lib/utils";
import type { ProjectStatus } from "@/types";

const FILTERS: { key: ProjectStatus | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "analyzing", label: "分析中" },
  { key: "ready", label: "待剪辑" },
  { key: "fissioned", label: "已裂变" },
  { key: "distributed", label: "已分发" },
];

const MAX_SIZE = 10 * 1024 * 1024 * 1024; // 10GB

interface PendingFile {
  file: File;
  name: string;
  size: number;
  title: string;
  sizeLabel: string;
  duration: number;
  ext: string;
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function extOf(name: string): string {
  const m = name.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toUpperCase() : "MP4";
}

function validateFile(file: File): string | null {
  if (!file.type.startsWith("video/")) {
    return "请选择视频文件（MP4 / MOV / MKV 等）";
  }
  if (file.size === 0) return "文件为空，请重新选择";
  if (file.size > MAX_SIZE) return "文件超过 10GB 上限";
  return null;
}

export default function Upload() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projects = useProjectStore((s) => s.projects);
  const uploadAndAnalyze = useProjectStore((s) => s.uploadAndAnalyze);
  const uploadAsync = useProjectStore((s) => s.async["upload"]);

  const [filter, setFilter] = useState<ProjectStatus | "all">("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const [pending, setPending] = useState<PendingFile | null>(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () =>
      projects.filter(
        (p) =>
          (filter === "all" || p.status === filter) &&
          p.title.toLowerCase().includes(query.toLowerCase()),
      ),
    [projects, filter, query],
  );

  const acceptFile = (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }
    const estDuration = Math.max(
      120,
      Math.round(file.size / (50 * 1024 * 1024)) * 60,
    );
    setPending({
      file,
      name: file.name,
      title: file.name.replace(/\.[^.]+$/, ""),
      size: file.size,
      sizeLabel: formatSize(file.size),
      duration: estDuration,
      ext: extOf(file.name),
    });
    setUploadPct(0);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) acceptFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) acceptFile(file);
  };

  const startUpload = async () => {
    if (!pending) return;
    const res = await uploadAndAnalyze(pending.file, setUploadPct);
    if (res.ok && res.projectId) {
      setPending(null);
      setUploadPct(0);
      navigate(`/studio/${res.projectId}`);
    } else {
      // 失败：保留 pending，允许重试
      toast.error(res.error ?? "上传失败");
    }
  };

  const cancelUpload = () => {
    uploadAsync?.abort?.();
    setPending(null);
    setUploadPct(0);
  };

  const uploading = uploadAsync?.status === "loading";

  return (
    <div className="px-4 lg:px-8 py-8 max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="Upload & Library"
        title="上传视频，管理项目库"
        description="拖拽或选择视频文件，上传完成后 AI 将自动启动高光分析。下方为你的全部项目。"
        actions={
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "flex items-center gap-2 h-10 px-5 rounded-xl text-sm",
              uploading ? "btn-ghost opacity-60 cursor-not-allowed" : "btn-gold",
            )}
          >
            <UploadCloud className="w-4 h-4" strokeWidth={2.5} />
            选择视频上传
          </button>
        }
      />

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={onInputChange}
      />

      {/* Upload dropzone */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative card-surface noise overflow-hidden mb-10"
      >
        <div className="absolute inset-0 bg-radial-gold opacity-50" />
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !pending && !uploading && inputRef.current?.click()}
          className={cn(
            "relative p-10 lg:p-14 transition-all",
            (!pending || uploading) && "cursor-pointer",
            dragging && "bg-gold-500/[0.06]",
          )}
        >
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div
              className={cn(
                "grid place-items-center w-24 h-24 rounded-3xl border-2 border-dashed transition-all",
                dragging
                  ? "border-gold-500/80 bg-gold-500/15 scale-105"
                  : "border-white/15 bg-white/[0.03]",
              )}
            >
              <UploadCloud
                className={cn(
                  "w-8 h-8 transition-colors",
                  dragging ? "text-gold-300" : "text-gold-400",
                )}
              />
            </div>
            <div className="flex-1 text-center lg:text-left">
              <h3 className="font-display text-xl font-bold">
                {dragging ? "松开即可上传" : "拖拽视频到此处，或点击选择"}
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
        </div>

        {/* Pending file / upload progress */}
        <AnimatePresence>
          {pending && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="relative border-t border-white/[0.06] bg-ink-900/60"
            >
              <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="grid place-items-center w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/25 shrink-0">
                  <FileVideo className="w-5 h-5 text-gold-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {pending.name}
                      </div>
                      <div className="text-[11px] text-bone-400 mt-0.5 font-mono">
                        {pending.sizeLabel} · 预估 {formatDuration(pending.duration)} · {pending.ext}
                      </div>
                    </div>
                    {!uploading && (
                      <button
                        onClick={cancelUpload}
                        className="p-1.5 rounded-lg text-bone-400 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {uploading && (
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between text-[11px] text-bone-400 mb-1">
                        <span>
                          {uploadPct < 100 ? "上传中…" : "上传完成，启动分析…"}
                        </span>
                        <span className="font-mono">{Math.round(uploadPct)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-gold-500 to-fission-500 transition-all duration-200"
                          style={{ width: `${uploadPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {uploadAsync?.status === "error" && (
                    <div className="mt-2 flex items-center gap-1.5 text-[12px] text-red-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {uploadAsync.error}
                    </div>
                  )}
                </div>
                {!uploading && (
                  <button
                    onClick={startUpload}
                    className="h-10 px-5 rounded-xl text-sm shrink-0 flex items-center gap-2 btn-gold"
                  >
                    <UploadCloud className="w-4 h-4" />
                    {uploadAsync?.status === "error" ? "重新上传" : "开始上传"}
                  </button>
                )}
                {uploading && (
                  <button
                    onClick={cancelUpload}
                    className="h-10 px-5 rounded-xl text-sm shrink-0 flex items-center gap-2 btn-ghost"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    取消
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
      {filtered.length === 0 ? (
        <EmptyView
          icon={Film}
          title={query ? "未找到匹配项目" : "还没有项目"}
          desc={
            query
              ? "试试调整搜索关键词或筛选条件"
              : "上传你的第一个视频，开始 AI 高光剪辑"
          }
        />
      ) : (
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
                <div
                  key={p.id}
                  onClick={() => {
                    if (p.status !== "analyzing")
                      navigate(`/studio/${p.id}`);
                  }}
                  className={cn(
                    "w-full flex items-center gap-4 p-3 transition-colors",
                    p.status !== "analyzing" && "cursor-pointer hover:bg-white/[0.03]",
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
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* 分析阶段说明 */}
      <div className="mt-10 grid sm:grid-cols-5 gap-3">
        {ANALYSIS_STAGES.map((s, i) => (
          <div
            key={s.key}
            className="card-surface p-3 flex items-center gap-2.5"
          >
            <div className="grid place-items-center w-7 h-7 rounded-lg bg-white/[0.04] font-mono text-[11px] text-bone-300 shrink-0">
              {i + 1}
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-medium truncate">{s.label}</div>
              <div className="text-[10px] text-bone-500 truncate">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
