import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Split,
  Send,
  CheckSquare,
  Square,
  Sparkles,
  Wand2,
  Layers,
} from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import { StatusBadge } from "@/components/ui/StatusBadge";
import VariantCard from "@/components/fission/VariantCard";
import {
  ASPECT_RATIOS,
  CLIP_DURATIONS,
  PLATFORMS,
  STYLE_PRESETS,
  THUMB_GRADIENTS,
} from "@/data/mock";
import type { AspectRatio, ClipDuration, PlatformKey, Variant } from "@/types";
import { cn } from "@/lib/utils";

export default function Fission() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId),
  );
  const setProjectStatus = useProjectStore((s) => s.setProjectStatus);
  const saveVariants = useProjectStore((s) => s.saveVariants);

  const [ratios, setRatios] = useState<Set<AspectRatio>>(
    new Set(["9:16", "1:1"]),
  );
  const [durations, setDurations] = useState<Set<ClipDuration>>(
    new Set([15, 30]),
  );
  const [platforms, setPlatforms] = useState<Set<PlatformKey>>(
    new Set(["douyin", "xiaohongshu"]),
  );
  const [styles, setStyles] = useState<Set<string>>(new Set(["高燃卡点"]));

  const [variants, setVariants] = useState<Variant[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);

  // seed existing variants from project
  useEffect(() => {
    if (project && project.variants.length > 0 && variants.length === 0) {
      setVariants(project.variants);
      setSelected(new Set(project.variants.map((v) => v.id)));
    }
  }, [project, variants.length]);

  const comboCount =
    ratios.size * durations.size * platforms.size * styles.size;

  const generate = () => {
    if (comboCount === 0) return;
    setGenerating(true);
    const combos: Variant[] = [];
    let idx = 0;
    [...ratios].forEach((ar) =>
      [...durations].forEach((d) =>
        [...platforms].forEach((pf) =>
          [...styles].forEach((st) => {
            combos.push({
              id: `${project?.id}-gen-${idx++}`,
              projectId: project?.id || "",
              aspectRatio: ar,
              duration: d,
              platform: pf,
              style: st,
              thumbnail: THUMB_GRADIENTS[idx % THUMB_GRADIENTS.length],
              status: "generating",
            });
          }),
        ),
      ),
    );
    setVariants(combos);
    setSelected(new Set());

    // progressively mark ready
    combos.forEach((v, i) => {
      setTimeout(() => {
        setVariants((prev) => {
          const next = prev.map((x) =>
            x.id === v.id ? { ...x, status: "ready" as const } : x,
          );
          // 全部就绪后持久化到 store
          if (i === combos.length - 1 && project) {
            saveVariants(project.id, next);
            setProjectStatus(project.id, "fissioned");
          }
          return next;
        });
        setSelected((prev) => new Set([...prev, v.id]));
        if (i === combos.length - 1) {
          setGenerating(false);
        }
      }, 600 + i * 350);
    });
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () => {
    const readyIds = variants.filter((v) => v.status === "ready").map((v) => v.id);
    setSelected(
      selected.size === readyIds.length ? new Set() : new Set(readyIds),
    );
  };

  if (!project) {
    return <div className="p-10 text-center text-bone-400">项目不存在。</div>;
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1500px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(`/studio/${project.id}`)}
            className="grid place-items-center w-9 h-9 rounded-xl btn-ghost shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-extrabold flex items-center gap-2">
                <Split className="w-5 h-5 text-fission-400" />
                裂变中心
              </h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-xs text-bone-400 mt-0.5 truncate">
              {project.title}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/distribute")}
          disabled={selected.size === 0}
          className={cn(
            "flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm",
            selected.size > 0 ? "btn-fission" : "btn-ghost opacity-50 cursor-not-allowed",
          )}
        >
          <Send className="w-4 h-4" />
          分发选中 ({selected.size})
        </button>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-5">
        {/* Config panel */}
        <div className="card-surface p-5 h-fit lg:sticky lg:top-[80px]">
          <div className="flex items-center gap-2 mb-1">
            <Wand2 className="w-4 h-4 text-fission-400" />
            <h2 className="font-display font-bold text-base">裂变维度配置</h2>
          </div>
          <p className="text-[11px] text-bone-400 mb-5">
            勾选维度组合，AI 将批量生成适配版本
          </p>

          <DimGroup
            title="画幅比例"
            options={ASPECT_RATIOS as unknown as string[]}
            selected={ratios}
            onToggle={(v) => toggleSet(ratios, setRatios, v as AspectRatio)}
          />
          <DimGroup
            title="片段时长"
            options={CLIP_DURATIONS.map(String)}
            suffix="s"
            selected={durations as unknown as Set<string>}
            onToggle={(v) =>
              toggleSet(durations, setDurations, Number(v) as ClipDuration)
            }
          />
          <DimGroup
            title="目标平台"
            options={Object.keys(PLATFORMS)}
            labels={Object.fromEntries(
              Object.entries(PLATFORMS).map(([k, v]) => [k, v.name]),
            )}
            selected={platforms}
            onToggle={(v) => toggleSet(platforms, setPlatforms, v as PlatformKey)}
          />
          <DimGroup
            title="风格预设"
            options={STYLE_PRESETS}
            selected={styles}
            onToggle={(v) => toggleSet(styles, setStyles, v)}
          />

          <div className="mt-5 pt-5 border-t border-white/[0.06]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-bone-400">预计生成</span>
              <span className="font-mono text-2xl font-bold text-gradient-fission">
                {comboCount}
              </span>
            </div>
            <button
              onClick={generate}
              disabled={generating || comboCount === 0}
              className={cn(
                "w-full h-10 rounded-xl text-sm flex items-center justify-center gap-2",
                generating || comboCount === 0
                  ? "btn-ghost opacity-60 cursor-not-allowed"
                  : "btn-fission",
              )}
            >
              {generating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  裂变生成中…
                </>
              ) : (
                <>
                  <Split className="w-4 h-4" />
                  生成 {comboCount} 个变体
                </>
              )}
            </button>
            <p className="mt-2 text-[10px] text-bone-500 text-center">
              生成包含自动裁切、字幕重排与卡点对齐
            </p>
          </div>
        </div>

        {/* Matrix */}
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-bone-300" />
              <h2 className="font-display font-bold text-base">变体矩阵</h2>
              <span className="text-[11px] text-bone-400">
                {variants.length} 个变体 · 已选 {selected.size}
              </span>
            </div>
            {variants.length > 0 && (
              <button
                onClick={toggleAll}
                className="flex items-center gap-1.5 text-xs text-bone-300 hover:text-gold-300"
              >
                {selected.size ===
                variants.filter((v) => v.status === "ready").length ? (
                  <CheckSquare className="w-4 h-4 text-fission-400" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                全选
              </button>
            )}
          </div>

          {variants.length === 0 ? (
            <EmptyMatrix comboCount={comboCount} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {variants.map((v, i) => (
                <VariantCard
                  key={v.id}
                  variant={v}
                  index={i}
                  selected={selected.has(v.id)}
                  onToggle={() => toggleSelect(v.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function toggleSet<T>(set: Set<T>, setter: (s: Set<T>) => void, value: T) {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  setter(next);
}

function DimGroup({
  title,
  options,
  selected,
  onToggle,
  suffix,
  labels,
}: {
  title: string;
  options: string[];
  selected: Set<string>;
  onToggle: (v: string) => void;
  suffix?: string;
  labels?: Record<string, string>;
}) {
  return (
    <div className="mb-5">
      <div className="text-[11px] uppercase tracking-[0.14em] text-bone-500 mb-2">
        {title}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = selected.has(opt);
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className={cn(
                "px-2.5 h-7 rounded-lg text-[12px] font-medium transition-all border",
                active
                  ? "bg-fission-500/15 border-fission-500/50 text-fission-300"
                  : "bg-white/[0.03] border-white/[0.07] text-bone-300 hover:border-white/15",
              )}
            >
              {labels?.[opt] ?? opt}
              {suffix}
              {active && <span className="ml-1">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmptyMatrix({ comboCount }: { comboCount: number }) {
  return (
    <div className="card-surface p-12 text-center">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-fission-500/10 grid place-items-center mb-4">
        <Split className="w-7 h-7 text-fission-400" />
      </div>
      <h3 className="font-display font-bold text-lg">尚未生成变体</h3>
      <p className="text-sm text-bone-400 mt-2 max-w-sm mx-auto">
        在左侧配置裂变维度，当前组合可生成
        <span className="text-fission-300 font-semibold"> {comboCount} </span>
        个变体。点击「生成」开始裂变。
      </p>
    </div>
  );
}
