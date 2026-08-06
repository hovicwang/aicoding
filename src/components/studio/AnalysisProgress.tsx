import { motion } from "motion/react";
import {
  Loader2,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  RotateCw,
  X,
} from "lucide-react";
import { ANALYSIS_STAGES } from "@/data/mock";
import { cn } from "@/lib/utils";

interface Props {
  stage: number;
  percent: number;
  title: string;
  error?: string;
  onRetry?: () => void;
  onCancel?: () => void;
}

export default function AnalysisProgress({
  stage,
  percent,
  title,
  error,
  onRetry,
  onCancel,
}: Props) {
  const failed = Boolean(error);

  return (
    <div className="card-surface p-8 lg:p-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-gold opacity-40" />
      {!failed && (
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-fission-500/10 blur-3xl" />
      )}
      <div className="relative max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            "mx-auto w-16 h-16 rounded-2xl grid place-items-center mb-5 border",
            failed
              ? "bg-red-500/10 border-red-500/25"
              : "bg-gold-500/15 border-gold-500/30",
          )}
        >
          {failed ? (
            <AlertTriangle className="w-7 h-7 text-red-400" />
          ) : (
            <Sparkles className="w-7 h-7 text-gold-400 animate-pulse" />
          )}
        </motion.div>
        <h2 className="font-display text-2xl font-extrabold">
          {failed ? "分析失败" : `AI 正在分析「${title}」`}
        </h2>
        <p className="text-sm text-bone-400 mt-2">
          {failed
            ? error
            : "自动识别高潮、金句、动作与情绪片段，生成时间轴字幕"}
        </p>

        {failed ? (
          <button
            onClick={onRetry}
            className="mt-6 inline-flex items-center gap-1.5 h-10 px-5 rounded-xl btn-gold text-sm"
          >
            <RotateCw className="w-4 h-4" />
            重新分析
          </button>
        ) : (
          <>
            {/* 总进度 */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-gold-500 via-fission-500 to-gold-500 bg-[length:200%_100%] animate-shimmer"
                  animate={{ width: `${percent}%` }}
                  transition={{ ease: "linear", duration: 0.2 }}
                />
              </div>
              <span className="font-mono text-sm text-gold-300 tabular-nums w-12 text-right">
                {Math.round(percent)}%
              </span>
            </div>

            {/* 阶段列表 */}
            <div className="mt-8 grid sm:grid-cols-5 gap-2.5 text-left">
              {ANALYSIS_STAGES.map((s, i) => {
                const done = i < stage;
                const active = i === stage;
                return (
                  <div
                    key={s.key}
                    className={cn(
                      "rounded-xl border p-3 transition-all",
                      done
                        ? "border-emerald-500/30 bg-emerald-500/[0.06]"
                        : active
                          ? "border-gold-500/40 bg-gold-500/[0.08]"
                          : "border-white/[0.06] bg-white/[0.02] opacity-50",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      {done ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : active ? (
                        <Loader2 className="w-3.5 h-3.5 text-gold-400 animate-spin" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-bone-500" />
                      )}
                      <span
                        className={cn(
                          "text-[11px] font-medium",
                          done
                            ? "text-emerald-300"
                            : active
                              ? "text-gold-300"
                              : "text-bone-400",
                        )}
                      >
                        {s.label}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-bone-500 leading-tight">
                      {s.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            <p className="mt-6 text-[11px] text-bone-500">
              分析完成后将自动进入剪辑工作台，无需手动刷新
            </p>

            {onCancel && (
              <button
                onClick={onCancel}
                className="mt-3 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl btn-ghost text-xs text-bone-400"
              >
                <X className="w-3.5 h-3.5" />
                取消分析
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
