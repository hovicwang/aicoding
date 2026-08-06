import { Loader2, Inbox, AlertTriangle, RotateCw } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/** 统一的加载/空/错误状态视图，保证各页面一致 */

export function LoadingView({
  label = "加载中",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("grid place-items-center py-16 text-center", className)}>
      <Loader2 className="w-6 h-6 text-gold-400 animate-spin" />
      <p className="mt-3 text-sm text-bone-400">{label}…</p>
    </div>
  );
}

export function EmptyView({
  icon: Icon = Inbox,
  title = "暂无数据",
  desc,
  action,
}: {
  icon?: typeof Inbox;
  title?: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid place-items-center py-16 text-center"
    >
      <div className="grid place-items-center w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.07] mb-4">
        <Icon className="w-6 h-6 text-bone-400" />
      </div>
      <h3 className="font-display font-bold">{title}</h3>
      {desc && <p className="text-sm text-bone-400 mt-1.5 max-w-xs">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}

export function ErrorView({
  message = "加载失败",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="grid place-items-center py-16 text-center">
      <div className="grid place-items-center w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/25 mb-4">
        <AlertTriangle className="w-6 h-6 text-red-400" />
      </div>
      <h3 className="font-display font-bold">{message}</h3>
      <p className="text-sm text-bone-400 mt-1.5">请检查网络后重试</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 flex items-center gap-1.5 h-9 px-4 rounded-xl btn-gold text-sm"
        >
          <RotateCw className="w-3.5 h-3.5" />
          重试
        </button>
      )}
    </div>
  );
}
