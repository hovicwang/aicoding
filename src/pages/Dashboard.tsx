import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Film,
  Split,
  Eye,
  Heart,
  Upload as UploadIcon,
  Scissors,
  Send,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import { dashboardStats } from "@/data/mock";
import StatCard from "@/components/ui/StatCard";
import ProjectCard from "@/components/cards/ProjectCard";

const workflow = [
  {
    step: "01",
    title: "上传原片",
    desc: "拖入任意时长视频，自动接入 AI 高光分析管线",
    icon: UploadIcon,
    to: "/upload",
    accent: "text-gold-400",
  },
  {
    step: "02",
    title: "高光剪辑",
    desc: "AI 标记高潮 / 金句 / 动作 / 情绪，一键选定片段",
    icon: Scissors,
    to: "/studio/p-004",
    accent: "text-gold-400",
  },
  {
    step: "03",
    title: "多维裂变",
    desc: "按比例 / 时长 / 平台 / 风格批量生成 N 条适配版本",
    icon: Split,
    to: "/fission/p-002",
    accent: "text-fission-400",
  },
  {
    step: "04",
    title: "全渠道分发",
    desc: "一次配置，多渠道并行发布并回收互动数据",
    icon: Send,
    to: "/distribute",
    accent: "text-fission-400",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const projects = useProjectStore((s) => s.projects);
  const tasks = useProjectStore((s) => s.tasks);

  // 基于真实 store 数据计算统计
  const totalVideos = projects.length;
  const fissionOutputs = projects.reduce((s, p) => s + p.variants.length, 0);
  const publishedTasks = tasks.filter((t) => t.status === "published");
  const distributionReach = publishedTasks.reduce(
    (s, t) => s + (t.stats?.views ?? 0),
    0,
  );
  const engagement = publishedTasks.reduce(
    (s, t) =>
      s +
      (t.stats?.likes ?? 0) +
      (t.stats?.comments ?? 0) +
      (t.stats?.shares ?? 0),
    0,
  );

  return (
    <div className="px-4 lg:px-8 py-8 max-w-[1400px] mx-auto">
      {/* Hero */}
      <section className="relative overflow-hidden card-surface noise p-8 lg:p-12 mb-10">
        <div className="absolute inset-0 bg-radial-gold opacity-70" />
        <div className="absolute -right-20 -bottom-32 w-[420px] h-[420px] rounded-full bg-fission-500/10 blur-3xl" />
        <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-8 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 chip bg-gold-500/10 border-gold-500/25 text-gold-300 mb-5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI 高光引擎 v3.2 · 已为你处理 47 条原片
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="font-display text-4xl lg:text-[52px] font-extrabold leading-[1.04] tracking-tight"
            >
              一支原片，
              <br />
              <span className="text-gradient-gold">裂变</span>成
              <span className="text-gradient-fission"> 全渠道 </span>
              高光内容。
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="mt-5 text-bone-300 text-[15px] leading-relaxed max-w-xl"
            >
              上传视频后，AI 自动识别高光片段，按比例、时长、平台多维度裂变生成 N 条版本，最后一键分发至抖音、小红书、视频号、B站、YouTube。
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="mt-7 flex flex-wrap items-center gap-3"
            >
              <button
                onClick={() => navigate("/upload")}
                className="flex items-center gap-2 h-11 px-6 rounded-xl btn-gold text-sm"
              >
                <UploadIcon className="w-4 h-4" strokeWidth={2.5} />
                上传视频开始
              </button>
              <button
                onClick={() => navigate("/studio/p-001")}
                className="flex items-center gap-2 h-11 px-5 rounded-xl btn-ghost text-sm"
              >
                查看演示项目
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>

          {/* Visual: fission diagram */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative hidden lg:block"
          >
            <FissionDiagram />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <StatCard
          icon={Film}
          label="原始视频"
          value={totalVideos}
          trend="+2 本周"
          sparkline={[1, 2, 2, 3, 3, 4, 5]}
          accent="gold"
          delay={0}
        />
        <StatCard
          icon={Split}
          label="裂变产出"
          value={fissionOutputs}
          trend="+8 本周"
          sparkline={dashboardStats.fissionTrend}
          accent="fission"
          delay={0.08}
        />
        <StatCard
          icon={Eye}
          label="分发触达"
          value={distributionReach}
          suffix="次"
          trend="+24%"
          sparkline={dashboardStats.reachTrend}
          accent="gold"
          delay={0.16}
        />
        <StatCard
          icon={Heart}
          label="互动总量"
          value={engagement}
          trend="+18%"
          sparkline={[2, 3, 4, 3, 5, 6, 8]}
          accent="emerald"
          delay={0.24}
        />
      </section>

      {/* Workflow */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-bold">内容生产流水线</h2>
          <span className="text-xs text-bone-400">四步从原片到全渠道</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {workflow.map((w, i) => (
            <motion.button
              key={w.step}
              onClick={() => navigate(w.to)}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="card-surface p-5 text-left relative overflow-hidden group"
            >
              <div className="absolute right-4 top-3 font-mono text-[40px] font-bold text-white/[0.04] group-hover:text-gold-500/10 transition-colors">
                {w.step}
              </div>
              <div className={`grid place-items-center w-10 h-10 rounded-xl bg-white/[0.04] ${w.accent}`}>
                <w.icon className="w-[18px] h-[18px]" />
              </div>
              <h3 className="mt-4 font-display font-bold text-base">{w.title}</h3>
              <p className="mt-1.5 text-[12px] text-bone-400 leading-relaxed">
                {w.desc}
              </p>
              <span className={`mt-3 inline-flex items-center gap-1 text-xs ${w.accent}`}>
                进入 <ArrowRight className="w-3 h-3" />
              </span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Recent projects */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-xl font-bold">最近项目</h2>
            <p className="text-xs text-bone-400 mt-1">
              点击任意项目继续剪辑、裂变或查看分发数据
            </p>
          </div>
          <button
            onClick={() => navigate("/upload")}
            className="flex items-center gap-1.5 text-sm text-gold-400 hover:text-gold-300"
          >
            全部项目 <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.slice(0, 6).map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

function FissionDiagram() {
  const variants = [
    { ratio: "9:16", color: "#ff2e7e", label: "抖音" },
    { ratio: "1:1", color: "#f5b800", label: "小红书" },
    { ratio: "16:9", color: "#00a1d6", label: "B站" },
    { ratio: "4:5", color: "#34d399", label: "视频号" },
  ];
  return (
    <div className="relative">
      <div className="flex justify-center">
        <div className="w-28 h-16 rounded-xl bg-gradient-to-br from-gold-500/30 to-fission-500/30 border border-gold-500/40 grid place-items-center backdrop-blur">
          <Film className="w-7 h-7 text-gold-300" />
        </div>
      </div>
      <div className="relative h-10 mt-2">
        <svg viewBox="0 0 240 40" className="w-full h-full">
          {variants.map((_, i) => {
            const x = 30 + i * 60;
            return (
              <path
                key={i}
                d={`M120 0 Q ${x} 20 ${x} 40`}
                fill="none"
                stroke="url(#linegrad)"
                strokeWidth="1.4"
                strokeDasharray="3 3"
                opacity="0.5"
              />
            );
          })}
          <defs>
            <linearGradient id="linegrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f5b800" />
              <stop offset="100%" stopColor="#ff2e7e" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {variants.map((v, i) => (
          <motion.div
            key={v.ratio}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="rounded-lg border p-2 text-center"
            style={{ borderColor: `${v.color}40`, background: `${v.color}12` }}
          >
            <div
              className="mx-auto mb-1 rounded"
              style={{
                width: v.ratio === "9:16" ? 14 : v.ratio === "16:9" ? 26 : 18,
                height: v.ratio === "9:16" ? 24 : v.ratio === "16:9" ? 14 : 18,
                background: `${v.color}50`,
              }}
            />
            <div className="text-[9px] text-bone-300">{v.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
