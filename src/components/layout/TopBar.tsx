import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Menu, Plus, Command } from "lucide-react";

export default function TopBar({
  onOpenMobileNav,
}: {
  onOpenMobileNav: () => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(query ? `/upload?q=${encodeURIComponent(query)}` : "/upload");
  };

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 h-[64px] px-4 lg:px-8 border-b border-white/[0.06] bg-ink-950/70 backdrop-blur-xl">
      <button
        onClick={onOpenMobileNav}
        className="lg:hidden p-2 -ml-1 rounded-lg btn-ghost"
        aria-label="打开导航"
      >
        <Menu className="w-5 h-5" />
      </button>

      <form
        onSubmit={onSearch}
        className="flex-1 max-w-md hidden sm:flex items-center gap-2 px-3 h-9 rounded-xl btn-ghost"
      >
        <Search className="w-4 h-4 text-bone-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索项目、片段、渠道…"
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-bone-500"
        />
        <span className="flex items-center gap-0.5 text-[10px] text-bone-500 font-mono">
          <Command className="w-3 h-3" />K
        </span>
      </form>

      <div className="flex-1 sm:hidden" />

      <button
        onClick={() => navigate("/upload")}
        className="hidden sm:flex items-center gap-1.5 h-9 px-4 rounded-xl btn-gold text-sm"
      >
        <Plus className="w-4 h-4" strokeWidth={2.5} />
        上传视频
      </button>
    </header>
  );
}
