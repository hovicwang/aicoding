import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Upload from "@/pages/Upload";
import Studio from "@/pages/Studio";
import Fission from "@/pages/Fission";
import Distribute from "@/pages/Distribute";
import Channels from "@/pages/Channels";

function NotFound() {
  return (
    <div className="min-h-[60vh] grid place-items-center px-6 text-center">
      <div>
        <div className="font-display text-7xl font-extrabold text-gradient-gold">
          404
        </div>
        <p className="mt-3 text-bone-400">页面不存在或已被移除</p>
        <Link
          to="/"
          className="inline-flex items-center mt-6 h-10 px-5 rounded-xl btn-gold text-sm"
        >
          返回工作台
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/studio/:projectId" element={<Studio />} />
          <Route path="/fission/:projectId" element={<Fission />} />
          <Route path="/distribute" element={<Distribute />} />
          <Route path="/channels" element={<Channels />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}
