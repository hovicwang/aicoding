import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Upload from "@/pages/Upload";
import Studio from "@/pages/Studio";
import Fission from "@/pages/Fission";
import Distribute from "@/pages/Distribute";
import Channels from "@/pages/Channels";

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
        </Route>
      </Routes>
    </Router>
  );
}
