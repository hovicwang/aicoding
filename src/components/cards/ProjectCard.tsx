import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Scissors, Split, ArrowRight, Clock, Trash2 } from "lucide-react";
import type { Project } from "@/types";
import { useProjectStore } from "@/store/useProjectStore";
import { VideoThumb } from "@/components/ui/VideoThumb";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn, formatDuration } from "@/lib/utils";

export default function ProjectCard({
  project,
  index = 0,
}: {
  project: Project;
  index?: number;
}) {
  const navigate = useNavigate();
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const selected = project.highlights.filter((h) => h.selected).length;

  const nextAction = () => {
    if (project.status === "analyzing") return;
    if (project.status === "ready" || project.status === "clipped") {
      navigate(`/studio/${project.id}`);
    } else if (project.status === "fissioned" || project.status === "distributed") {
      navigate(`/fission/${project.id}`);
    } else {
      navigate(`/studio/${project.id}`);
    }
  };

  const cta =
    project.status === "analyzing"
      ? "分析中"
      : project.status === "fissioned" || project.status === "distributed"
        ? "再次裂变"
        : "进入剪辑";

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`确认删除项目「${project.title}」？相关分发任务也会一并清除。`)) {
      deleteProject(project.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="card-surface group relative overflow-hidden hover:border-gold-500/30 transition-colors"
    >
      <div
        onClick={() => {
          if (project.status !== "analyzing") nextAction();
        }}
        className={cn(
          "block w-full text-left",
          project.status === "analyzing" ? "cursor-default" : "cursor-pointer",
        )}
      >
        <div className="p-3">
          <div className="relative">
            <VideoThumb
              gradient={project.thumbnail}
              duration={formatDuration(project.duration)}
              playing
            />
            <div className="absolute top-2 left-2">
              <StatusBadge status={project.status} className="bg-ink-950/70" />
            </div>
            {project.variants.length > 0 && (
              <div className="absolute top-2 right-2 chip bg-ink-950/70 border-fission-500/30">
                <Split className="w-3 h-3 text-fission-400" />
                <span className="text-fission-300">
                  {project.variants.length} 变体
                </span>
              </div>
            )}
            <button
              onClick={handleDelete}
              className="absolute bottom-2 right-2 grid place-items-center w-7 h-7 rounded-lg bg-ink-950/70 border border-white/10 text-bone-400 hover:text-red-400 hover:border-red-500/40 opacity-0 group-hover:opacity-100 transition-all"
              title="删除项目"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="px-4 pb-4">
          <h3 className="font-display font-bold text-[15px] leading-snug line-clamp-2 group-hover:text-gold-300 transition-colors">
            {project.title}
          </h3>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-bone-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {project.uploadedAt}
            </span>
            <span className="text-bone-600">·</span>
            <span>{project.source}</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px]">
              {selected > 0 ? (
                <span className="flex items-center gap-1 text-gold-300">
                  <Scissors className="w-3 h-3" />
                  已选 {selected} 段
                </span>
              ) : project.highlights.length > 0 ? (
                <span className="text-bone-300">
                  识别 {project.highlights.length} 段高光
                </span>
              ) : (
                <span className="text-bone-500">等待 AI 分析</span>
              )}
            </div>
            <span
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                project.status === "analyzing"
                  ? "text-bone-500"
                  : "text-gold-400 group-hover:translate-x-0.5 transition-transform",
              )}
            >
              {cta}
              {project.status !== "analyzing" && (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
            </span>
          </div>
        </div>
      </div>
      {project.status === "analyzing" && (
        <div className="px-4 pb-4 -mt-1">
          <div className="h-1 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-gold-500 to-fission-500 animate-shimmer bg-[length:200%_100%]" />
          </div>
        </div>
      )}
    </motion.div>
  );
}
