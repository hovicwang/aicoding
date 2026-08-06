import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { cn, formatCompact } from "@/lib/utils";

export default function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  trend,
  sparkline,
  accent = "gold",
  delay = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  suffix?: string;
  trend?: string;
  sparkline?: number[];
  accent?: "gold" | "fission" | "emerald";
  delay?: number;
}) {
  const display = useCountUp(value, 1400, true);
  const accentText =
    accent === "gold" ? "text-gold-400" : accent === "fission" ? "text-fission-400" : "text-emerald-400";
  const accentBg =
    accent === "gold" ? "bg-gold-500/12" : accent === "fission" ? "bg-fission-500/12" : "bg-emerald-500/12";
  const stroke = accent === "gold" ? "#f5b800" : accent === "fission" ? "#ff2e7e" : "#34d399";

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="card-surface p-5 relative overflow-hidden group"
    >
      <div
        className={cn(
          "absolute -right-8 -top-8 w-28 h-28 rounded-full blur-2xl opacity-50 group-hover:opacity-80 transition-opacity",
          accentBg,
        )}
      />
      <div className="relative flex items-start justify-between">
        <div className={cn("grid place-items-center w-10 h-10 rounded-xl", accentBg)}>
          <Icon className={cn("w-[18px] h-[18px]", accentText)} />
        </div>
        {trend && (
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
            {trend}
          </span>
        )}
      </div>
      <div className="relative mt-4">
        <div className="text-[11px] uppercase tracking-[0.16em] text-bone-400">
          {label}
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="font-display text-3xl font-extrabold tracking-tight">
            {formatCompact(display)}
          </span>
          {suffix && <span className="text-sm text-bone-400">{suffix}</span>}
        </div>
      </div>
      {sparkline && (
        <svg
          viewBox="0 0 100 28"
          className="relative mt-3 w-full h-7"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`fill-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <Sparkline data={sparkline} stroke={stroke} fillId={`fill-${label}`} />
        </svg>
      )}
    </motion.div>
  );
}

function Sparkline({
  data,
  stroke,
  fillId,
}: {
  data: number[];
  stroke: string;
  fillId: string;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 26 - ((d - min) / range) * 22;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `0,26 ${line} 100,26`;
  return (
    <>
      <polygon points={area} fill={`url(#${fillId})`} />
      <polyline
        points={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}
