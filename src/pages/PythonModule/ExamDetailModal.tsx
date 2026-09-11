import React, { useState, useEffect, useRef } from "react";
import { ExamQuestion } from "../../types";
import { CodeBlock } from "../../components/CodeBlock";
import {
  X,
  ArrowRight,
  ChevronDown,
  BookOpen,
  Code2,
  ListChecks,
  Lightbulb,
} from "lucide-react";
interface ExamDetailModalProps {
  exam: ExamQuestion;
  onClose: () => void;
}
const sections = [
  { id: "tasks", label: "理解任务", icon: BookOpen },
  { id: "code", label: "动手练习", icon: Code2 },
  { id: "blanks", label: "查看解析", icon: ListChecks },
  { id: "summary", label: "复习要点", icon: Lightbulb },
] as const;
type Section = (typeof sections)[number]["id"];
export const ExamDetailModal: React.FC<ExamDetailModalProps> = ({
  exam,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<Section>("tasks");
  const [codeMode, setCodeMode] = useState<"template" | "solution">("template");
  const bodyRef = useRef<HTMLDivElement>(null);
  const switchSection = (id: Section) => {
    setActiveTab(id);
    bodyRef.current?.scrollTo(0, 0);
  };
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key === "Tab") {
        const focusable = Array.from(
          dialogRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], input, summary, [tabindex="0"]',
          ) || [],
        );
        const visible = focusable.filter(
          (element) => element.getClientRects().length > 0,
        );
        const first = visible[0],
          last = visible[visible.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === dialogRef.current)
        ) {
          event.preventDefault();
          last?.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === dialogRef.current)
        ) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handleKey);
      previous?.focus();
    };
  }, []);

  return (
    <div className="study-modal-backdrop">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exam-dialog-title"
        tabIndex={-1}
        className="study-modal"
      >
        <header className="study-modal-header">
          <div>
            <div className="project-meta">
              <span>实操 {exam.id}</span>
              <span>{exam.difficulty}</span>
              <span>{exam.tasks.length} 项任务</span>
            </div>
            <h2 id="exam-dialog-title">{exam.title}</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="关闭项目详情"
          >
            <X size={21} />
          </button>
        </header>
        <nav className="study-modal-nav" aria-label="项目学习步骤">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              aria-current={activeTab === id ? "step" : undefined}
              onClick={() => switchSection(id)}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
        <div className="study-modal-body" ref={bodyRef}>
          {activeTab === "tasks" && (
            <div className="task-reader">
              <section>
                <h3>项目背景</h3>
                <p>{exam.scenario}</p>
              </section>
              <section>
                <h3>你要完成什么</h3>
                <ol className="learning-task-list">
                  {exam.tasks.map((task) => (
                    <li key={task.order}>
                      <span>{task.order}</span>
                      <p>{task.description}</p>
                    </li>
                  ))}
                </ol>
              </section>
              <details className="learning-disclosure">
                <summary>
                  数据集与字段 <span>{exam.dataset.fields.length} 个字段</span>
                  <ChevronDown size={16} />
                </summary>
                <div>
                  <p className="dataset-name">{exam.dataset.name}</p>
                  <p>{exam.dataset.description}</p>
                  <div className="field-table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>字段</th>
                          <th>说明</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exam.dataset.fields.map((field) => (
                          <tr key={field.name}>
                            <td>
                              <code>{field.name}</code>
                            </td>
                            <td>{field.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </details>
              <details className="learning-disclosure">
                <summary>
                  练习准备与提交要求 <ChevronDown size={16} />
                </summary>
                <div>
                  <h4>依赖库</h4>
                  <p className="dependency-list">
                    {exam.coreLibraries.join(" / ")}
                  </p>
                  <h4>技能要求</h4>
                  <ul>
                    {exam.skillRequirements.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <h4>质量要求</h4>
                  <ul>
                    {exam.qualityMetrics.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <h4>提交文件</h4>
                  {exam.tasks.map((task) => (
                    <p key={task.order}>
                      任务 {task.order}：<code>{task.targetFile}</code>
                    </p>
                  ))}
                </div>
              </details>
            </div>
          )}
          {activeTab === "code" && (
            <div>
              <div className="practice-toolbar">
                <div
                  className="segmented-control"
                  role="group"
                  aria-label="代码视图"
                >
                  <button
                    aria-pressed={codeMode === "template"}
                    onClick={() => setCodeMode("template")}
                  >
                    填空练习
                  </button>
                  <button
                    aria-pressed={codeMode === "solution"}
                    onClick={() => setCodeMode("solution")}
                  >
                    参考答案
                  </button>
                </div>
                <span>复制到本地 Notebook 中运行</span>
              </div>
              <CodeBlock
                code={
                  codeMode === "template"
                    ? exam.codeTemplate
                    : exam.codeSolution
                }
                title={
                  codeMode === "template"
                    ? "补全下划线处的代码"
                    : "完整参考代码"
                }
              />
              <p className="practice-note">
                先独立补全，再对照答案。理解每一步为什么这样写。
              </p>
            </div>
          )}
          {activeTab === "blanks" && (
            <div className="explanation-reader">
              <div className="reader-heading">
                <h3>逐空理解</h3>
                <span>
                  {exam.blanksExplanation.length} 个填空 · 共{" "}
                  {exam.blanksExplanation.reduce(
                    (sum, item) => sum + item.points,
                    0,
                  )}{" "}
                  分
                </span>
              </div>
              {exam.blanksExplanation.map((blank) => (
                <section className="blank-explanation" key={blank.blankIndex}>
                  <div className="blank-heading">
                    <span>填空 {blank.blankIndex}</span>
                    <small>{blank.points} 分</small>
                  </div>
                  <code className="answer-snippet">{blank.code}</code>
                  <p>{blank.explanation}</p>
                  {blank.pitfall && (
                    <details className="blank-pitfall">
                      <summary>易错提醒</summary>
                      <p>{blank.pitfall}</p>
                    </details>
                  )}
                </section>
              ))}
            </div>
          )}
          {activeTab === "summary" && (
            <div className="task-reader">
              <section>
                <h3>带走这些知识点</h3>
                <ul className="takeaway-list">
                  {exam.keyTakeaways.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </section>
              <p className="learning-tip">
                <Lightbulb size={18} />
                <span>合上答案，试着解释核心步骤，再独立完成一次练习。</span>
              </p>
            </div>
          )}
        </div>
        <footer className="study-modal-footer">
          <span>Python / 人工智能训练师 / 三级</span>
          {activeTab === "summary" ? (
            <button
              className="secondary-button"
              onClick={() => {
                setCodeMode("template");
                switchSection("code");
              }}
            >
              再练一次 <ArrowRight size={15} />
            </button>
          ) : (
            <button
              className="primary-button"
              onClick={() =>
                switchSection(
                  sections[sections.findIndex((s) => s.id === activeTab) + 1]
                    .id,
                )
              }
            >
              {activeTab === "tasks"
                ? "开始练习"
                : activeTab === "code"
                  ? "查看解析"
                  : "复习要点"}
              <ArrowRight size={15} />
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};
