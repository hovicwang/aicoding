import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { useToastStore, type Toast, type ToastKind } from "./toastStore";

const META: Record<ToastKind, { icon: typeof CheckCircle2; cls: string }> = {
  success: { icon: CheckCircle2, cls: "text-emerald-400 border-emerald-500/30" },
  error: { icon: AlertTriangle, cls: "text-red-400 border-red-500/30" },
  info: { icon: Info, cls: "text-gold-400 border-gold-500/30" },
};

function ToastItem({ toast: t }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const { icon: Icon, cls } = META[t.kind];
  useEffect(() => {
    const timer = setTimeout(() => dismiss(t.id), t.duration);
    return () => clearTimeout(timer);
  }, [t.id, t.duration, dismiss]);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className={`pointer-events-auto flex items-center gap-2.5 pl-3.5 pr-3 py-2.5 rounded-xl bg-ink-900/95 backdrop-blur border ${cls} shadow-2xl min-w-[260px] max-w-[400px]`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="text-sm text-bone-100 flex-1">{t.message}</span>
      <button
        onClick={() => dismiss(t.id)}
        className="p-1 rounded text-bone-500 hover:text-bone-200"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
