import React from "react";
import { MainModule } from "./Navbar";
export const Footer: React.FC<{ onSelectModule: (m: MainModule) => void }> = ({
  onSelectModule,
}) => (
  <footer className="site-footer">
    <div>
      <strong>AIGraph</strong>
      <span>人工智能全栈知识图谱与实战研习社</span>
    </div>
    <nav aria-label="页脚导航">
      <button onClick={() => onSelectModule("graph")}>知识图谱</button>
      <button onClick={() => onSelectModule("resources")}>学习资源</button>
      <span>© 2026 AIGraph. All rights reserved.</span>
    </nav>
  </footer>
);
