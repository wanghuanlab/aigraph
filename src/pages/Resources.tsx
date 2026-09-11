import React, { useMemo, useState } from "react";
import {
  Search,
  ArrowUpRight,
  BookOpen,
  FileCheck,
  Code2,
  Network,
  AlertTriangle,
} from "lucide-react";
import { knowledgeNodes } from "../data/knowledgeGraph";
import { examQuestions } from "../data/examQuestions";
import { cheatSheetData } from "../data/apiCheatSheet";
import { pitfallsData } from "../data/pitfallsData";
import { PythonSubTab } from "../components/Navbar";

type Kind =
  | "全部"
  | "知识点"
  | "实操项目"
  | "API 速查"
  | "避坑指南"
  | "文章"
  | "专题手册";
const icons = {
  知识点: Network,
  实操项目: FileCheck,
  "API 速查": Code2,
  避坑指南: AlertTriangle,
};
const catalog = [
  ...knowledgeNodes.map((n) => ({
    id: n.id,
    title: n.title,
    description: n.description,
    kind: "知识点" as const,
    tab: "overview" as const,
    category: undefined,
    keywords: n.tags.join(" "),
  })),
  ...examQuestions.map((n) => ({
    id: n.id,
    title: n.title,
    description: n.scenario,
    kind: "实操项目" as const,
    tab: "exams" as const,
    category: n.category,
    keywords: n.coreLibraries.join(" "),
  })),
  ...cheatSheetData.map((n, i) => ({
    id: `api-${i}`,
    title: n.name,
    description: n.description,
    kind: "API 速查" as const,
    tab: "cheatsheet" as const,
    category: undefined,
    keywords: `${n.library} ${n.usage}`,
  })),
  ...pitfallsData.map((n) => ({
    id: n.id,
    title: n.title,
    description: n.reason,
    kind: "避坑指南" as const,
    tab: "pitfalls" as const,
    category: undefined,
    keywords: n.category,
  })),
];
export const Resources: React.FC<{
  onStudy: (tab: PythonSubTab, category?: string, query?: string) => void;
  onExam: (id: string) => void;
}> = ({ onStudy, onExam }) => {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<Kind>("全部");
  const results = useMemo(
    () =>
      catalog.filter(
        (item) =>
          (kind === "全部" || item.kind === kind) &&
          `${item.title} ${item.description} ${item.keywords}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [query, kind],
  );
  return (
    <div className="resource-page">
      <div className="page-heading">
        <span className="eyebrow">学习资源库</span>
        <h1>每一次查阅，都是知识的连接。</h1>
        <p>检索当前已收录的知识点、实操项目、API 与避坑指南。</p>
      </div>
      <label className="resource-search">
        <Search size={21} />
        <input
          autoFocus
          aria-label="搜索学习资源"
          placeholder="搜索知识、函数或场景，例如 Pandas、数据清洗…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && <button onClick={() => setQuery("")}>清空</button>}
      </label>
      <div className="resource-filters" aria-label="资源类型">
        {(
          [
            "全部",
            "知识点",
            "实操项目",
            "API 速查",
            "避坑指南",
            "文章",
            "专题手册",
          ] as Kind[]
        ).map((k) => (
          <button
            key={k}
            aria-pressed={kind === k}
            className={kind === k ? "active" : ""}
            onClick={() => setKind(k)}
          >
            {k}
            {(k === "文章" || k === "专题手册") && <small>规划</small>}
          </button>
        ))}
      </div>
      <div className="results-meta">
        <span>当前范围：Python 语言 / 人工智能训练师 / 三级</span>
        <span aria-live="polite">{results.length} 条结果</span>
      </div>
      {results.length ? (
        <div className="resource-results">
          {results.map((item) => {
            const Icon = icons[item.kind];
            return (
              <button
                key={`${item.kind}-${item.id}`}
                className="resource-result"
                onClick={() =>
                  item.kind === "实操项目"
                    ? onExam(item.id)
                    : onStudy(item.tab, item.category, item.title)
                }
              >
                <span className="result-icon">
                  <Icon size={20} />
                </span>
                <span className="result-copy">
                  <small>{item.kind}</small>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </span>
                <ArrowUpRight size={18} />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="empty-resources">
          <BookOpen size={32} />
          <h2>
            {kind === "文章" || kind === "专题手册"
              ? "内容正在规划中"
              : "没有找到匹配内容"}
          </h2>
          <p>
            {kind === "文章" || kind === "专题手册"
              ? "这里将收录 AI 相关文章与系统化专题手册。现在可以先查阅已开放的研习资源。"
              : "试试函数名、技术库名或更简短的关键词。"}
          </p>
          <button
            className="secondary-button"
            onClick={() => {
              setKind("全部");
              setQuery("");
            }}
          >
            浏览已收录资源
          </button>
        </div>
      )}
    </div>
  );
};
