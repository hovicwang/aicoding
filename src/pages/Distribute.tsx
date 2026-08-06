import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Send,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  Loader2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import PageHeader from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PlatformGlyph } from "@/components/ui/PlatformGlyph";
import { PLATFORMS } from "@/data/mock";
import type { PlatformKey } from "@/types";
import { cn, formatCompact, formatFull } from "@/lib/utils";

export default function Distribute() {
  const tasks = useProjectStore((s) => s.tasks);
  const channels = useProjectStore((s) => s.channels);
  const projects = useProjectStore((s) => s.projects);
  const distribute = useProjectStore((s) => s.distribute);
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(
    new Set(channels.filter((c) => c.authStatus === "connected").map((c) => c.id)),
  );
  const [caption, setCaption] = useState("这一刻，全场沸腾 #高光时刻");
  const [publishing, setPublishing] = useState(false);
  const pendingDistribution = useProjectStore((s) => s.pendingDistribution);

  const published = tasks.filter((t) => t.status === "published");
  const totals = useMemo(
    () =>
      published.reduce(
        (acc, t) => {
          if (t.stats) {
            acc.views += t.stats.views;
            acc.likes += t.stats.likes;
            acc.comments += t.stats.comments;
            acc.shares += t.stats.shares;
          }
          return acc;
        },
        { views: 0, likes: 0, comments: 0, shares: 0 },
      ),
    [published],
  );

  // 来源项目：优先用裂变页传递的 pendingDistribution，否则回退到最近有变体的项目
  const sourceProject =
    (pendingDistribution
      ? projects.find((p) => p.id === pendingDistribution.projectId)
      : null) ?? projects.find((p) => p.variants.length > 0) ?? projects[0];

  const sourceVariantIds =
    pendingDistribution?.variantIds ??
    sourceProject?.variants.slice(0, 2).map((v) => v.id) ??
    [];

  const sourceVariants = sourceProject
    ? sourceProject.variants.filter((v) => sourceVariantIds.includes(v.id))
    : [];

  const handlePublish = () => {
    if (!sourceProject || sourceVariantIds.length === 0 || selectedChannels.size === 0)
      return;
    setPublishing(true);
    setTimeout(() => {
      distribute(
        sourceProject.id,
        sourceVariantIds,
        [...selectedChannels],
        caption,
      );
      setPublishing(false);
    }, 1800);
  };

  const toggleChannel = (id: string) =>
    setSelectedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="px-4 lg:px-8 py-8 max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="Distribution"
        title="多渠道分发与数据回收"
        description="勾选已连接渠道，一键将裂变版本并行发布，实时回收播放与互动数据。"
        actions={
          <button
            onClick={handlePublish}
            disabled={publishing || selectedChannels.size === 0}
            className={cn(
              "flex items-center gap-2 h-10 px-5 rounded-xl text-sm",
              publishing || selectedChannels.size === 0
                ? "btn-ghost opacity-60 cursor-not-allowed"
                : "btn-fission",
            )}
          >
            {publishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {publishing ? "发布中…" : `分发到 ${selectedChannels.size} 渠道`}
          </button>
        }
      />

      {/* Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard icon={Eye} label="累计播放" value={totals.views} accent="gold" />
        <MetricCard icon={Heart} label="累计点赞" value={totals.likes} accent="fission" />
        <MetricCard icon={MessageCircle} label="累计评论" value={totals.comments} accent="emerald" />
        <MetricCard icon={Share2} label="累计转发" value={totals.shares} accent="gold" />
      </div>

      {/* 待分发变体清单 */}
      {sourceVariants.length > 0 && (
        <div className="card-surface p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-base flex items-center gap-2">
              <Send className="w-4 h-4 text-fission-400" />
              待分发变体
            </h2>
            <span className="text-[11px] text-bone-400">
              来源：{sourceProject?.title.slice(0, 16)}… · {sourceVariants.length} 个
            </span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {sourceVariants.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.07]"
              >
                <PlatformGlyph
                  platform={v.platform as PlatformKey}
                  size={24}
                />
                <div className="text-[11px]">
                  <div className="text-bone-100 font-medium">{v.style}</div>
                  <div className="font-mono text-bone-400">
                    {v.aspectRatio} · {v.duration}s
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_1.3fr] gap-5">
        {/* Channel selection */}
        <div className="card-surface p-5 h-fit">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-base">选择分发渠道</h2>
            <span className="text-[11px] text-bone-400">
              {selectedChannels.size} 已选
            </span>
          </div>
          <div className="space-y-2">
            {channels.map((c) => {
              const disabled = c.authStatus !== "connected";
              const checked = selectedChannels.has(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => !disabled && toggleChannel(c.id)}
                  disabled={disabled}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                    disabled
                      ? "border-white/[0.04] opacity-40 cursor-not-allowed"
                      : checked
                        ? "border-fission-500/50 bg-fission-500/[0.06]"
                        : "border-white/[0.07] hover:border-white/15",
                  )}
                >
                  <PlatformGlyph platform={c.platform as PlatformKey} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {c.name}
                      </span>
                      <StatusBadge status={c.authStatus} />
                    </div>
                    <div className="text-[11px] text-bone-400 mt-0.5">
                      {PLATFORMS[c.platform].name} · {formatCompact(c.followers)} 粉丝
                    </div>
                  </div>
                  <div
                    className={cn(
                      "grid place-items-center w-5 h-5 rounded-md border",
                      checked
                        ? "bg-fission-500 border-fission-500"
                        : "border-white/20",
                      disabled && "opacity-30",
                    )}
                  >
                    {checked && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 pt-5 border-t border-white/[0.06]">
            <label className="text-[11px] uppercase tracking-[0.14em] text-bone-500">
              发布文案
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl bg-white/[0.03] border border-white/[0.07] px-3 py-2 text-sm outline-none focus:border-gold-500/40 resize-none"
            />
            <p className="mt-2 text-[10px] text-bone-500">
              AI 将根据各渠道风格自动改写文案与话题标签
            </p>
          </div>
        </div>

        {/* Task queue */}
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gold-400" />
              分发任务队列
            </h2>
            <span className="text-[11px] text-bone-400">{tasks.length} 条任务</span>
          </div>
          <div className="space-y-2.5">
            {tasks.map((t, i) => {
              const channel = channels.find((c) => c.id === t.channelId);
              const project = projects.find((p) => p.id === t.projectId);
              const variant = project?.variants.find((v) => v.id === t.variantId);
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="card-surface p-4 flex items-center gap-4"
                >
                  <PlatformGlyph
                    platform={channel?.platform as PlatformKey}
                    size={36}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">
                        {channel?.name}
                      </span>
                      <StatusBadge status={t.status} />
                      {variant && (
                        <span className="chip bg-white/[0.04] text-bone-300">
                          {variant.aspectRatio} · {variant.duration}s · {variant.style}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-bone-400 mt-1 line-clamp-1">
                      {t.caption}
                    </p>
                    {t.publishedAt && (
                      <p className="text-[10px] text-bone-500 mt-0.5 font-mono">
                        {t.publishedAt}
                      </p>
                    )}
                  </div>
                  {t.stats ? (
                    <div className="hidden sm:grid grid-cols-4 gap-3 text-center shrink-0">
                      <Stat icon={Eye} v={t.stats.views} />
                      <Stat icon={Heart} v={t.stats.likes} />
                      <Stat icon={MessageCircle} v={t.stats.comments} />
                      <Stat icon={Share2} v={t.stats.shares} />
                    </div>
                  ) : (
                    <div className="shrink-0">
                      {t.status === "publishing" && (
                        <Loader2 className="w-4 h-4 text-gold-400 animate-spin" />
                      )}
                      {t.status === "queued" && (
                        <Clock className="w-4 h-4 text-bone-400" />
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Eye;
  label: string;
  value: number;
  accent: "gold" | "fission" | "emerald";
}) {
  const color =
    accent === "gold" ? "text-gold-400" : accent === "fission" ? "text-fission-400" : "text-emerald-400";
  const bg =
    accent === "gold" ? "bg-gold-500/12" : accent === "fission" ? "bg-fission-500/12" : "bg-emerald-500/12";
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-surface p-5"
    >
      <div className={cn("grid place-items-center w-9 h-9 rounded-xl", bg)}>
        <Icon className={cn("w-[17px] h-[17px]", color)} />
      </div>
      <div className="mt-3 font-display text-2xl font-extrabold">
        {formatCompact(value)}
      </div>
      <div className="text-[11px] text-bone-400 mt-0.5">{label}</div>
    </motion.div>
  );
}

function Stat({ icon: Icon, v }: { icon: typeof Eye; v: number }) {
  return (
    <div className="flex flex-col items-center">
      <Icon className="w-3 h-3 text-bone-500" />
      <span className="font-mono text-[11px] text-bone-200 mt-0.5">
        {formatFull(v)}
      </span>
    </div>
  );
}
