import React, { useState, useMemo } from "react";
import { cheatSheetData } from "../../data/apiCheatSheet";
import { CodeBlock } from "../../components/CodeBlock";
import { Search, ChevronDown } from "lucide-react";

export const ApiReference: React.FC<{ initialQuery?: string }> = ({
  initialQuery = "",
}) => {
  const [selectedLib, setSelectedLib] = useState("all");
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [expanded, setExpanded] = useState<string | null>(initialQuery || null);
  const libraries = [...new Set(cheatSheetData.map((item) => item.library))];
  const filtered = useMemo(
    () =>
      cheatSheetData.filter(
        (item) =>
          (selectedLib === "all" || item.library === selectedLib) &&
          `${item.name} ${item.library} ${item.description} ${item.usage} ${item.category}`
            .toLowerCase()
            .includes(searchQuery.trim().toLowerCase()),
      ),
    [selectedLib, searchQuery],
  );
  return (
    <section className="api-reference">
      <div className="learning-heading">
        <h1>API 速查</h1>
        <p>查常用写法，点击函数展开示例。</p>
      </div>
      <div className="api-toolbar">
        <label className="learning-search">
          <Search size={17} />
          <input
            aria-label="搜索 API"
            placeholder="搜索函数或用途，如 cut、分箱"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}>清空</button>
          )}
        </label>
        <span className="result-count" aria-live="polite">
          {filtered.length} 个函数
        </span>
      </div>
      <div className="library-filters" role="group" aria-label="按技术库筛选">
        {["all", ...libraries].map((lib) => (
          <button
            key={lib}
            aria-pressed={selectedLib === lib}
            onClick={() => setSelectedLib(lib)}
          >
            {lib === "all" ? "全部" : lib}
          </button>
        ))}
      </div>
      <div className="api-list">
        {filtered.map((item) => {
          const open = expanded === item.name;
          const id = `api-${cheatSheetData.indexOf(item)}`;
          return (
            <article
              className={`api-entry ${open ? "expanded" : ""}`}
              key={item.name}
            >
              <button
                className="api-entry-heading"
                aria-expanded={open}
                aria-controls={id}
                onClick={() => setExpanded(open ? null : item.name)}
              >
                <span className="api-entry-name">
                  <code>{item.name}</code>
                  <small>
                    {item.library} · {item.category}
                  </small>
                </span>
                <span className="api-description">{item.description}</span>
                <ChevronDown size={17} />
              </button>
              <div className="api-usage">
                <code>{item.usage}</code>
              </div>
              {open && (
                <div id={id} className="api-details">
                  <CodeBlock code={item.exampleCode} title="使用示例" />
                  <p className="learning-tip">
                    <strong>注意</strong>
                    <span>{item.tips}</span>
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>
      {!filtered.length && (
        <div className="empty-resources">
          <Search size={28} />
          <h2>没有找到对应函数</h2>
          <p>试试更短的关键词，或切换到全部技术库。</p>
          <button
            className="secondary-button"
            onClick={() => {
              setSearchQuery("");
              setSelectedLib("all");
            }}
          >
            清除筛选
          </button>
        </div>
      )}
    </section>
  );
};
