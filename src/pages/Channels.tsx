import { motion } from "motion/react";
import {
  Users,
  RefreshCw,
  Link2,
  Unlink,
  Plus,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import PageHeader from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PlatformGlyph } from "@/components/ui/PlatformGlyph";
import { PLATFORMS } from "@/data/mock";
import { toast } from "@/components/ui/toastStore";
import type { PlatformKey } from "@/types";
import { cn, formatCompact } from "@/lib/utils";

export default function Channels() {
  const channels = useProjectStore((s) => s.channels);
  const reconnect = useProjectStore((s) => s.reconnectChannel);
  const disconnect = useProjectStore((s) => s.disconnectChannel);
  const asyncMap = useProjectStore((s) => s.async);

  return (
    <div className="px-4 lg:px-8 py-8 max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="Channels"
        title="渠道账号管理"
        description="连接与管理你的多平台账号，授权后方可进行内容分发与数据回收。"
        actions={
          <button
            onClick={() =>
              toast.info("新渠道接入需在开放平台创建应用后配置，演示环境暂未开放")
            }
            className="flex items-center gap-2 h-10 px-5 rounded-xl btn-gold text-sm"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            连接新渠道
          </button>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="已连接" value={channels.filter((c) => c.authStatus === "connected").length} accent="emerald" />
        <SummaryCard label="授权过期" value={channels.filter((c) => c.authStatus === "expired").length} accent="gold" />
        <SummaryCard label="未连接" value={channels.filter((c) => c.authStatus === "disconnected").length} accent="bone" />
        <SummaryCard
          label="总粉丝量"
          value={channels.reduce((s, c) => s + c.followers, 0)}
          accent="fission"
          compact
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {channels.map((c, i) => {
          const meta = PLATFORMS[c.platform];
          const connected = c.authStatus === "connected";
          const busy = asyncMap[`channel-${c.id}`]?.status === "loading";
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.07, 0.35) }}
              whileHover={{ y: -4 }}
              className="card-surface p-5 relative overflow-hidden group"
            >
              <div
                className="absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-25 group-hover:opacity-40 transition-opacity"
                style={{ background: meta.color }}
              />
              <div className="relative flex items-start justify-between">
                <PlatformGlyph platform={c.platform as PlatformKey} size={48} />
                <StatusBadge status={c.authStatus} />
              </div>
              <h3 className="relative mt-4 font-display font-bold text-lg">
                {c.name}
              </h3>
              <div className="relative flex items-center gap-1.5 text-xs text-bone-400 mt-1">
                <span>{meta.name}</span>
                <span className="text-bone-600">·</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {formatCompact(c.followers)}
                </span>
              </div>

              <div className="relative mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                {connected ? (
                  <>
                    <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                      <TrendingUp className="w-3.5 h-3.5" />
                      近 7 日 +{formatCompact(Math.round(c.followers * 0.012))} 粉丝
                    </span>
                    <button
                      onClick={() => disconnect(c.id)}
                      disabled={busy}
                      className="flex items-center gap-1.5 text-xs text-bone-300 hover:text-fission-300 disabled:opacity-50"
                    >
                      {busy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Unlink className="w-3.5 h-3.5" />
                      )}
                      解绑
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => reconnect(c.id)}
                    disabled={busy}
                    className={cn(
                      "ml-auto flex items-center gap-1.5 text-xs px-3 h-8 rounded-lg disabled:opacity-50",
                      c.authStatus === "expired" ? "btn-gold" : "btn-ghost",
                    )}
                  >
                    {busy ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : c.authStatus === "expired" ? (
                      <RefreshCw className="w-3.5 h-3.5" />
                    ) : (
                      <Link2 className="w-3.5 h-3.5" />
                    )}
                    {c.authStatus === "expired" ? "重新授权" : "连接账号"}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
  compact,
}: {
  label: string;
  value: number;
  accent: "gold" | "fission" | "emerald" | "bone";
  compact?: boolean;
}) {
  const color =
    accent === "gold"
      ? "text-gold-400"
      : accent === "fission"
        ? "text-fission-400"
        : accent === "emerald"
          ? "text-emerald-400"
          : "text-bone-200";
  return (
    <div className="card-surface p-4">
      <div className="text-[11px] uppercase tracking-[0.14em] text-bone-400">
        {label}
      </div>
      <div className={cn("mt-1 font-display text-2xl font-extrabold", color)}>
        {compact ? formatCompact(value) : value}
      </div>
    </div>
  );
}
