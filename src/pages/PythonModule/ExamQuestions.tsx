import React, { useState, useMemo } from "react";
import { examQuestions } from "../../data/examQuestions";
import { ExamQuestion } from "../../types";
import { ExamDetailModal } from "./ExamDetailModal";
import { Search, ArrowUpRight } from "lucide-react";

export const ExamQuestions: React.FC<{ initialCategory?: string }> = ({
  initialCategory,
}) => {
  const [category, setCategory] = useState(initialCategory || "all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ExamQuestion | null>(null);
  const categories = [
    { id: "all", name: "全部" },
    { id: "1.1", name: "数据处理" },
    { id: "2.1", name: "清洗与标注" },
    { id: "2.2", name: "模型开发" },
    { id: "3.2", name: "交互与部署" },
  ];
  const filtered = useMemo(
    () =>
      examQuestions.filter(
        (exam) =>
          (category === "all" || exam.category === category) &&
          `${exam.id} ${exam.title} ${exam.scenario} ${exam.coreLibraries.join(" ")}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [category, query],
  );
  return (
    <section>
      <div className="learning-heading">
        <h1>实操项目</h1>
        <p>选一个场景，理解任务，独立完成，再对照解析。</p>
      </div>
      <div className="api-toolbar">
        <label className="learning-search">
          <Search size={17} />
          <input
            aria-label="搜索实操项目"
            placeholder="搜索题号、场景或技术库"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && <button onClick={() => setQuery("")}>清空</button>}
        </label>
        <span className="result-count" aria-live="polite">
          {filtered.length} 个项目
        </span>
      </div>
      <div className="library-filters" role="group" aria-label="按能力主题筛选">
        {categories.map((item) => (
          <button
            key={item.id}
            aria-pressed={category === item.id}
            onClick={() => setCategory(item.id)}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="project-grid">
        {filtered.map((exam) => (
          <button
            key={exam.id}
            className="project-card"
            aria-label={`查看项目：${exam.title}`}
            onClick={() => setSelected(exam)}
          >
            <div className="project-card-meta">
              <span>{exam.id}</span>
              <span>
                {exam.difficulty} · {exam.tasks.length} 项任务
              </span>
            </div>
            <h2>{exam.title}</h2>
            <p>{exam.scenario}</p>
            <div className="project-card-footer">
              <span>
                {exam.coreLibraries.slice(0, 3).join(" / ")}
                {exam.coreLibraries.length > 3 ? " …" : ""}
              </span>
              <ArrowUpRight size={17} />
            </div>
          </button>
        ))}
      </div>
      {!filtered.length && (
        <div className="empty-resources">
          <Search size={28} />
          <h2>没有找到匹配项目</h2>
          <p>试试题号、场景关键词或技术库名称。</p>
          <button
            className="secondary-button"
            onClick={() => {
              setCategory("all");
              setQuery("");
            }}
          >
            清除筛选
          </button>
        </div>
      )}
      {selected && (
        <ExamDetailModal exam={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
};
