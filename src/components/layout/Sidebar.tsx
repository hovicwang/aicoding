import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  Send,
  Share2,
  Zap,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "工作台", icon: LayoutDashboard, end: true },
  { to: "/upload", label: "上传项目", icon: Upload, end: false },
  { to: "/distribute", label: "分发中心", icon: Send, end: false },
  { to: "/channels", label: "渠道管理", icon: Share2, end: false },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex w-[248px] shrink-0 flex-col border-r border-white/[0.06] bg-ink-950/60 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-6 h-[72px] border-b border-white/[0.06]">
        <div className="relative grid place-items-center w-9 h-9 rounded-xl bg-ink-850 border border-white/10">
          <Zap className="w-4 h-4 text-gold-400" fill="currentColor" />
          <span className="absolute -right-1 -top-1 w-2.5 h-2.5 rounded-full bg-fission-400 shadow-fissionglow" />
        </div>
        <div className="leading-tight">
          <div className="font-display font-extrabold text-[15px] tracking-tight">
            ClipForge
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-bone-400">
            AI Studio
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        <div className="px-3 pb-2 text-[10px] uppercase tracking-[0.18em] text-bone-500">
          主导航
        </div>
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                isActive
                  ? "bg-gradient-to-r from-gold-500/15 to-transparent text-bone-50 border border-gold-500/25"
                  : "text-bone-300 hover:bg-white/[0.04] hover:text-bone-50 border border-transparent",
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    "w-[18px] h-[18px] transition-colors",
                    isActive ? "text-gold-400" : "text-bone-400 group-hover:text-bone-200",
                  )}
                />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulseglow" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="m-3 p-4 rounded-2xl glass relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-fission-500/20 blur-2xl" />
        <div className="flex items-center gap-2 text-gold-400">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-semibold">产能提示</span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-bone-300">
          一支 47 分钟原片平均可裂变出
          <span className="text-gradient-gold font-semibold"> 14 条 </span>
          适配多平台的高光内容。
        </p>
      </div>

      <div className="px-6 py-4 border-t border-white/[0.06] flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-fission-500 grid place-items-center text-[12px] font-bold text-ink-950">
          L
        </div>
        <div className="leading-tight min-w-0">
          <div className="text-xs font-medium truncate">林川 Creator</div>
          <div className="text-[10px] text-bone-500">Pro · 14 / 30 席位</div>
        </div>
      </div>
    </aside>
  );
}
