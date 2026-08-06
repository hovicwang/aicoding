import { NavLink } from "react-router-dom";
import { X, LayoutDashboard, Upload, Send, Share2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "工作台", icon: LayoutDashboard, end: true },
  { to: "/upload", label: "上传项目", icon: Upload, end: false },
  { to: "/distribute", label: "分发中心", icon: Send, end: false },
  { to: "/channels", label: "渠道管理", icon: Share2, end: false },
];

export default function MobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="lg:hidden fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-[260px] h-full bg-ink-900 border-r border-white/10 flex flex-col animate-fade-up">
        <div className="flex items-center justify-between px-5 h-[64px] border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="grid place-items-center w-8 h-8 rounded-lg bg-ink-850 border border-white/10">
              <Zap className="w-4 h-4 text-gold-400" fill="currentColor" />
            </div>
            <span className="font-display font-extrabold">ClipForge</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg btn-ghost">
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm",
                  isActive
                    ? "bg-gold-500/15 text-bone-50 border border-gold-500/25"
                    : "text-bone-300 hover:bg-white/[0.04] border border-transparent",
                )
              }
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
