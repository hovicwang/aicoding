import { motion, AnimatePresence } from "motion/react";
import { Scissors, Check, Trash2, Wand2 } from "lucide-react";
import type { Project } from "@/types";
import { cn, formatTimecode, HIGHLIGHT_TYPE_META } from "@/lib/utils";

export default function SegmentPanel({
  project,
  onToggle,
  onSelectAll,
}: {
  project: Project;
  onToggle: (id: string) => void;
  onSelectAll: (v: boolean) => void;
}) {
  const selected = project.highlights.filter((h) => h.selected);
  const totalDur = selected.reduce((s, h) => s + (h.end - h.start), 0);
  const allSelected =
    project.highlights.length > 0 &&
    project.highlights.every((h) => h.selected);

  return (
    <div className="card-surface flex flex-col h-full max-h-[calc(100vh-160px)]">
      <div className="p-5 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-base flex items-center gap-2">
            <Scissors className="w-4 h-4 text-gold-400" />
            已选片段
          </h3>
          <button
            onClick={() => onSelectAll(!allSelected)}
            className="text-[11px] text-gold-400 hover:text-gold-300"
          >
            {allSelected ? "取消全选" : "全选高光"}
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-white/[0.03] p-2.5">
            <div className="text-[10px] text-bone-400">片段数</div>
            <div className="font-mono text-lg font-bold text-gold-300">
              {selected.length}
              <span className="text-xs text-bone-500">
                /{project.highlights.length}
              </span>
            </div>
          </div>
          <div className="rounded-lg bg-white/[0.03] p-2.5">
            <div className="text-[10px] text-bone-400">合计时长</div>
            <div className="font-mono text-lg font-bold text-fission-300">
              {formatTimecode(totalDur).split(".")[0]}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence initial={false}>
          {selected.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-10 px-4"
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-white/[0.04] grid place-items-center mb-3">
                <Scissors className="w-5 h-5 text-bone-500" />
              </div>
              <p className="text-sm text-bone-300">还未选定片段</p>
              <p className="text-xs text-bone-500 mt-1">
                在时间轴上点击高光块即可选定
              </p>
            </motion.div>
          )}
          {selected.map((h, i) => {
            const meta = HIGHLIGHT_TYPE_META[h.type];
            return (
              <motion.div
                key={h.id}
                layout
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 group hover:border-gold-500/30 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <span className="font-mono text-[10px] text-bone-500 mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("chip", meta.bg, meta.color)}>
                        {meta.label}
                      </span>
                      <span className="font-mono text-[10px] text-bone-400">
                        {formatTimecode(h.start).split(".")[0]} →{" "}
                        {formatTimecode(h.end).split(".")[0]}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[12px] text-bone-100 leading-snug line-clamp-2">
                      {h.label}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-gold-500 to-fission-500"
                          style={{ width: `${h.confidence * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-[9px] text-bone-400">
                        {Math.round(h.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onToggle(h.id)}
                    className="p-1 rounded text-bone-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    aria-label="移除片段"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {selected.length > 0 && (
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 mb-3 text-[11px] text-bone-400">
            <Wand2 className="w-3.5 h-3.5 text-fission-400" />
            AI 将自动为片段生成字幕、转场与卡点
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
            <Check className="w-3.5 h-3.5" />
            智能去重 · 已剔除 2 段语义重复
          </div>
        </div>
      )}
    </div>
  );
}
