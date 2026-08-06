import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  if (!seconds) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatTimecode(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(
      s,
    ).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(
    ms,
  ).padStart(2, "0")}`;
}

export function formatCompact(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}亿`;
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function formatFull(n: number): string {
  return n.toLocaleString("en-US");
}

export const STATUS_META: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  analyzing: { label: "AI 分析中", color: "text-gold-400", dot: "bg-gold-400" },
  ready: { label: "高光已识别", color: "text-bone-200", dot: "bg-bone-300" },
  clipped: { label: "片段已选定", color: "text-gold-400", dot: "bg-gold-400" },
  fissioned: { label: "已裂变", color: "text-fission-400", dot: "bg-fission-400" },
  distributed: { label: "已分发", color: "text-emerald-400", dot: "bg-emerald-400" },
  generating: { label: "生成中", color: "text-gold-400", dot: "bg-gold-400" },
  publishing: { label: "分发中", color: "text-gold-400", dot: "bg-gold-400" },
  published: { label: "已发布", color: "text-emerald-400", dot: "bg-emerald-400" },
  queued: { label: "排队中", color: "text-bone-300", dot: "bg-bone-300" },
  failed: { label: "失败", color: "text-red-400", dot: "bg-red-400" },
  connected: { label: "已连接", color: "text-emerald-400", dot: "bg-emerald-400" },
  expired: { label: "授权过期", color: "text-gold-400", dot: "bg-gold-400" },
  disconnected: { label: "未连接", color: "text-bone-400", dot: "bg-bone-400" },
};

export const HIGHLIGHT_TYPE_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  peak: { label: "高潮", color: "text-gold-400", bg: "bg-gold-500/15" },
  quote: { label: "金句", color: "text-fission-300", bg: "bg-fission-500/15" },
  action: { label: "动作", color: "text-sky-300", bg: "bg-sky-500/15" },
  emotion: { label: "情绪", color: "text-emerald-300", bg: "bg-emerald-500/15" },
};
