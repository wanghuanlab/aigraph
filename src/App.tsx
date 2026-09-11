import React, { useEffect, useState } from "react";
import { ChevronRight, Home as HomeIcon } from "lucide-react";
import {
  Navbar,
  MainModule,
  PythonSubTab,
  studyTabs,
} from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { Resources } from "./pages/Resources";
import { Overview } from "./pages/PythonModule/Overview";
import { ExamQuestions } from "./pages/PythonModule/ExamQuestions";
import { ApiReference } from "./pages/PythonModule/ApiReference";
import { ExamPitfalls } from "./pages/PythonModule/ExamPitfalls";
import { InteractiveQuiz } from "./pages/PythonModule/InteractiveQuiz";
import {
  MachineLearningView,
  DeepLearningView,
  MockExamView,
} from "./pages/OtherModules/ModuleViews";
import { examQuestions } from "./data/examQuestions";
import { ExamDetailModal } from "./pages/PythonModule/ExamDetailModal";
import { ExamQuestion } from "./types";

const modules: MainModule[] = [
  "home",
  "graph",
  "resources",
  "python",
  "ml",
  "dl",
  "exam",
];
function readLocation() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const module = params.get("module") as MainModule;
  const tab = params.get("tab") as PythonSubTab;
  return {
    module: modules.includes(module) ? module : ("home" as MainModule),
    tab: studyTabs.some((t) => t.id === tab)
      ? tab
      : ("overview" as PythonSubTab),
    category: params.get("category") || undefined,
    query: params.get("q") || "",
  };
}
export const App: React.FC = () => {
  const [location, setLocation] = useState(readLocation);
  const [selectedExamDirect, setSelectedExamDirect] =
    useState<ExamQuestion | null>(null);
  useEffect(() => {
    if (
      !location.query ||
      location.module !== "python" ||
      location.tab === "cheatsheet"
    )
      return;
    const target = Array.from(
      document.querySelectorAll<HTMLElement>("[data-resource-title]"),
    ).find((element) => element.dataset.resourceTitle === location.query);
    target?.scrollIntoView({ block: "start" });
  }, [location]);
  useEffect(() => {
    const update = () => {
      setLocation(readLocation());
      setSelectedExamDirect(null);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  const navigate = (
    module: MainModule,
    tab: PythonSubTab = "overview",
    category?: string,
    query = "",
  ) => {
    const params = new URLSearchParams({ module });
    if (module === "python") params.set("tab", tab);
    if (category) params.set("category", category);
    if (query) params.set("q", query);
    window.location.hash = params.toString();
  };
  const study = (tab: PythonSubTab, category?: string, query = "") =>
    navigate("python", tab, category, query);
  const selectExam = (id: string) =>
    setSelectedExamDirect(examQuestions.find((e) => e.id === id) || null);
  const { module, tab, category, query } = location;
  const names: Record<MainModule, string> = {
    home: "研习首页",
    graph: "全栈知识图谱",
    resources: "学习资源库",
    python: "Python 语言",
    ml: "机器学习算法",
    dl: "深度学习与大模型",
    exam: "模拟考场",
  };
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        跳转到主要内容
      </a>
      <Navbar
        activeModule={module}
        onSelectModule={(m) => navigate(m)}
        activeSubTab={tab}
        onSelectSubTab={study}
      />
      <div className="site-body">
        <main id="main-content" tabIndex={-1} className="main-content">
          <nav className="breadcrumbs" aria-label="面包屑">
            <button onClick={() => navigate("home")} aria-label="回到首页">
              <HomeIcon size={14} />
            </button>
            <ChevronRight size={12} />
            <span>{names[module]}</span>
            {module === "python" && (
              <>
                <ChevronRight size={12} />
                <span>人工智能训练师</span>
                <ChevronRight size={12} />
                <span>三级</span>
                <ChevronRight size={12} />
                <strong>{studyTabs.find((t) => t.id === tab)?.label}</strong>
              </>
            )}
          </nav>
          {(module === "home" || module === "graph") && (
            <Home
              graphOnly={module === "graph"}
              onModule={(m) => navigate(m)}
              onStudy={study}
            />
          )}
          {module === "resources" && (
            <Resources onStudy={study} onExam={selectExam} />
          )}
          {module === "python" && (
            <div className="lesson-content" key={`${tab}-${category}-${query}`}>
              {tab === "overview" && (
                <div className="scope-notice">
                  <span className="status-dot" />
                  当前研习：Python 语言 → 人工智能训练师 → 三级
                  <span>部分内容已收录</span>
                </div>
              )}
              {tab === "overview" && (
                <Overview onNavigate={study} onSelectExam={selectExam} />
              )}
              {tab === "exams" && <ExamQuestions initialCategory={category} />}
              {tab === "cheatsheet" && <ApiReference initialQuery={query} />}
              {tab === "pitfalls" && <ExamPitfalls />}
              {tab === "quiz" && <InteractiveQuiz />}
            </div>
          )}
          {module === "ml" && (
            <MachineLearningView
              moduleKey="ml"
              onGoToPython={() => study("overview")}
            />
          )}
          {module === "dl" && (
            <DeepLearningView
              moduleKey="dl"
              onGoToPython={() => study("overview")}
            />
          )}
          {module === "exam" && (
            <MockExamView
              moduleKey="exam"
              onGoToPython={() => study("exams")}
            />
          )}
        </main>
        <Footer onSelectModule={(m) => navigate(m)} />
      </div>
      {selectedExamDirect && (
        <ExamDetailModal
          exam={selectedExamDirect}
          onClose={() => setSelectedExamDirect(null)}
        />
      )}
    </div>
  );
};
export default App;
