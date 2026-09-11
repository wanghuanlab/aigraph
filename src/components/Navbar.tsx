import React, { useState } from "react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import {
  BrainCircuit,
  Network,
  Library,
  Home,
  Terminal,
  Cpu,
  Sparkles,
  Award,
  BookOpen,
  Code2,
  FileCheck,
  AlertTriangle,
  HelpCircle,
  Search,
  Menu,
  X,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";

export type MainModule =
  "home" | "graph" | "resources" | "python" | "ml" | "dl" | "exam";
export type PythonSubTab =
  "overview" | "exams" | "cheatsheet" | "pitfalls" | "quiz";
export const studyTabs = [
  { id: "overview" as const, label: "知识全景图谱", icon: BookOpen },
  { id: "exams" as const, label: "实操项目精讲", icon: FileCheck },
  { id: "cheatsheet" as const, label: "高频 API 速查", icon: Code2 },
  { id: "pitfalls" as const, label: "易错避坑指南", icon: AlertTriangle },
  { id: "quiz" as const, label: "交互自测", icon: HelpCircle },
];
interface NavbarProps {
  activeModule: MainModule;
  onSelectModule: (module: MainModule) => void;
  activeSubTab: PythonSubTab;
  onSelectSubTab: (subTab: PythonSubTab) => void;
}
export const Navbar: React.FC<NavbarProps> = ({
  activeModule,
  onSelectModule,
  activeSubTab,
  onSelectSubTab,
}) => {
  const [open, setOpen] = useState(false);
  const select = (module: MainModule) => {
    onSelectModule(module);
    setOpen(false);
  };
  return (
    <>
      <header className="site-header">
        <button
          className="brand"
          onClick={() => select("home")}
          aria-label="AIGraph 首页"
        >
          <span className="brand-mark">
            <BrainCircuit size={23} />
          </span>
          <span>
            AIGraph<span className="brand-caption">知识图谱 · 实战研习社</span>
          </span>
        </button>
        <nav className="top-nav" aria-label="全站导航">
          {(
            [
              { id: "home", label: "首页" },
              { id: "graph", label: "知识图谱" },
              { id: "resources", label: "学习资源" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              className={activeModule === item.id ? "active" : ""}
              aria-current={activeModule === item.id ? "page" : undefined}
              onClick={() => select(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button
          className="header-search"
          aria-label="搜索知识、API、实操项目"
          onClick={() => select("resources")}
        >
          <Search size={16} />
          <span>搜索知识、API、实操项目</span>
          <ArrowUpRight size={14} />
        </button>
        <ThemeSwitcher />
        <button
          className="menu-toggle"
          aria-label={open ? "关闭目录" : "打开目录"}
          aria-expanded={open}
          aria-controls="site-sidebar"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </header>
      {open && (
        <button
          className="sidebar-overlay"
          aria-label="关闭目录遮罩"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        id="site-sidebar"
        className={`site-sidebar ${open ? "is-open" : ""}`}
        aria-label="学习目录"
      >
        <div className="sidebar-section-label">探索 AIGraph</div>
        {(
          [
            { id: "home", label: "研习首页", icon: Home },
            { id: "graph", label: "全栈知识图谱", icon: Network },
            { id: "resources", label: "学习资源库", icon: Library },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            className={`side-link ${activeModule === item.id ? "active" : ""}`}
            onClick={() => select(item.id)}
            aria-current={activeModule === item.id ? "page" : undefined}
          >
            <item.icon size={17} />
            {item.label}
          </button>
        ))}
        <div className="sidebar-section-label section-gap">技术领域</div>
        <button
          className={`side-link ${activeModule === "python" ? "parent-active" : ""}`}
          onClick={() => select("python")}
        >
          <Terminal size={17} />
          Python 语言
          <ChevronRight size={14} className="ml-auto" />
        </button>
        <div className="study-tree">
          <span>人工智能训练师</span>
          <button
            className="level-link"
            onClick={() => {
              select("python");
              onSelectSubTab("overview");
            }}
          >
            三级 <span className="status-dot" /> <small>部分已收录</small>
          </button>
          {activeModule === "python" && (
            <nav aria-label="三级研习目录" className="study-tabs">
              {studyTabs.map((item) => (
                <button
                  key={item.id}
                  className={activeSubTab === item.id ? "active" : ""}
                  aria-current={activeSubTab === item.id ? "page" : undefined}
                  onClick={() => {
                    onSelectSubTab(item.id);
                    setOpen(false);
                  }}
                >
                  <item.icon size={14} />
                  {item.label}
                </button>
              ))}
            </nav>
          )}
        </div>
        {(
          [
            { id: "ml", label: "机器学习算法", icon: Cpu },
            { id: "dl", label: "深度学习与大模型", icon: Sparkles },
            { id: "exam", label: "模拟考场", icon: Award },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            className={`side-link planned ${activeModule === item.id ? "active" : ""}`}
            onClick={() => select(item.id)}
          >
            <item.icon size={17} />
            <span>{item.label}</span>
            <small>规划</small>
          </button>
        ))}
        <div className="sidebar-note">
          <Network size={20} />
          <strong>让知识连接，让学习发生。</strong>
          <p>
            从一个知识点出发，
            <br />
            逐步构建你的 AI 技术体系。
          </p>
        </div>
        <div className="sidebar-bottom">
          持续生长的 AI 知识库 <span className="status-dot" />
        </div>
      </aside>
    </>
  );
};
