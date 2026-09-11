import React from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Network,
  Terminal,
  Cpu,
  Sparkles,
  BookOpen,
  Code2,
  FileCheck,
  Route,
  Check,
} from "lucide-react";
import { MainModule, PythonSubTab } from "../components/Navbar";
import { knowledgeNodes } from "../data/knowledgeGraph";
import { examQuestions } from "../data/examQuestions";
import { cheatSheetData } from "../data/apiCheatSheet";

interface Props {
  onModule: (m: MainModule) => void;
  onStudy: (tab: PythonSubTab, category?: string) => void;
  graphOnly?: boolean;
}
export const Home: React.FC<Props> = ({ onModule, onStudy, graphOnly }) => (
  <div className="home-page">
    {!graphOnly && (
      <section className="home-hero">
        <div className="hero-copy">
          <span className="eyebrow">连接知识 · 理解原理 · 动手实践</span>
          <h1>
            构建你的
            <br />
            <span>人工智能知识体系。</span>
          </h1>
          <p>
            人工智能全栈知识图谱与实战研习社。
            <br />
            沿着知识脉络探索，在实践中把理解变成能力。
          </p>
          <div className="hero-actions">
            <button
              className="primary-button"
              onClick={() => onStudy("overview")}
            >
              开始研习 <ArrowRight size={16} />
            </button>
            <button className="text-button" onClick={() => onModule("graph")}>
              探索知识图谱 <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
        <div className="hero-path" aria-label="当前开放的学习路径">
          <div className="path-heading">
            <Route size={16} /> 从这里开始 <span>当前开放支线</span>
          </div>
          <div className="path-step">
            <span className="path-icon">
              <Terminal size={20} />
            </span>
            <div>
              <small>技术基础</small>
              <strong>Python 语言</strong>
            </div>
          </div>
          <div className="path-step">
            <span className="path-icon">
              <BookOpen size={20} />
            </span>
            <div>
              <small>专项研习</small>
              <strong>人工智能训练师</strong>
            </div>
          </div>
          <button
            className="path-step path-current"
            onClick={() => onStudy("overview")}
          >
            <span className="path-icon">
              <Check size={20} />
            </span>
            <div>
              <small>部分内容已收录</small>
              <strong>三级 · 实操与知识梳理</strong>
            </div>
            <ArrowUpRight size={18} />
          </button>
        </div>
      </section>
    )}
    {!graphOnly && (
      <div className="collection-strip">
        <span>
          <span className="status-dot" /> 当前收录 · Python / 人工智能训练师 /
          三级
        </span>
        <div>
          <strong>{knowledgeNodes.length}</strong> 能力主题 <i />
          <strong>{examQuestions.length}</strong> 实操项目 <i />
          <strong>{cheatSheetData.length}</strong> API 条目
        </div>
      </div>
    )}
    <section className="atlas-section">
      <div className="section-heading">
        <div>
          {graphOnly ? <h1 className="text-2xl font-semibold">全栈知识图谱</h1> : <h2>从全景，找到你的学习起点</h2>}
          <p>
            按技术领域组织知识，再连接手册、知识点与实操。图谱将随内容逐步展开。
          </p>
        </div>
        {!graphOnly && (
          <button className="text-button" onClick={() => onModule("graph")}>
            查看全景 <ArrowUpRight size={16} />
          </button>
        )}
      </div>
      <div className="atlas">
        <div className="atlas-root">
          <Network size={20} />
          <strong>人工智能全栈</strong>
          <span>知识与实践</span>
        </div>
        <div className="atlas-branches">
          <div className="atlas-branch available">
            <button
              className="branch-heading"
              onClick={() => onStudy("overview")}
            >
              <Terminal size={20} />
              <strong>Python 语言</strong>
              <span className="status-label">持续更新</span>
              <ArrowUpRight size={17} />
            </button>
            <p>数据处理、模型开发与工程实践的基础</p>
            <div className="branch-child">
              <BookOpen size={15} /> 人工智能训练师 <Chevron />
            </div>
            <button className="branch-leaf" onClick={() => onStudy("overview")}>
              <span>三级</span>
              <small>部分内容已收录</small>
              <ArrowRight size={15} />
            </button>
            <div className="branch-tags">
              Pandas / NumPy / Scikit-learn / ONNX
            </div>
          </div>
          <div className="atlas-branch">
            <button className="branch-heading" onClick={() => onModule("ml")}>
              <Cpu size={20} />
              <strong>机器学习算法</strong>
              <span className="planned-label">规划中</span>
            </button>
            <p>理解模型如何从数据中学习</p>
            <ul>
              <li>监督学习与无监督学习</li>
              <li>特征工程与模型评估</li>
              <li>集成学习与参数调优</li>
            </ul>
            <button className="branch-more" onClick={() => onModule("ml")}>
              了解主题规划 <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="atlas-branch">
            <button className="branch-heading" onClick={() => onModule("dl")}>
              <Sparkles size={20} />
              <strong>深度学习与大模型</strong>
              <span className="planned-label">规划中</span>
            </button>
            <p>从神经网络走向智能应用</p>
            <ul>
              <li>神经网络与计算机视觉</li>
              <li>Transformer 与大模型</li>
              <li>RAG 与智能体应用</li>
            </ul>
            <button className="branch-more" onClick={() => onModule("dl")}>
              了解主题规划 <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
        <div className="atlas-caption">
          <span>
            <span className="status-dot" /> 已开放的学习支线
          </span>
          <span>其他主题为内容规划，尚未开放研习</span>
        </div>
      </div>
    </section>
    <section className="study-section">
      <div className="section-heading">
        <div>
          <h2>正在建设的研习专题</h2>
          <p>Python 语言 / 人工智能训练师 / 三级 · 从知识理解到实操应用</p>
        </div>
      </div>
      <div className="study-feature">
        <div className="study-intro">
          <span className="status-label">部分已收录</span>
          <h3>
            人工智能训练师
            <br />
            三级研习专题
          </h3>
          <p>围绕已整理的四个能力主题，串联核心知识、代码示例与项目练习。</p>
          <button className="text-button" onClick={() => onStudy("overview")}>
            进入专题 <ArrowRight size={16} />
          </button>
        </div>
        <div className="study-topic-list">
          {knowledgeNodes.map((node) => (
            <button
              key={node.id}
              onClick={() => onStudy("exams", node.category.substring(0, 3))}
            >
              <span className="topic-code">
                {node.category.substring(0, 3)}
              </span>
              <span>
                <strong>{node.title}</strong>
                <small>{node.tags.slice(0, 3).join(" · ")}</small>
              </span>
              <span className="topic-count">
                {node.relatedQuestions.length} 个项目
              </span>
              <ArrowUpRight size={17} />
            </button>
          ))}
        </div>
      </div>
    </section>
    <section className="resource-section">
      <div className="section-heading">
        <div>
          <h2>按你需要的方式学习</h2>
          <p>系统学习、随手查阅，或用一道题检验理解。</p>
        </div>
        <button className="text-button" onClick={() => onModule("resources")}>
          全部资源 <ArrowUpRight size={16} />
        </button>
      </div>
      <div className="resource-shortcuts">
        {[
          {
            name: "实操项目精讲",
            desc: "从业务场景到代码实现，拆解关键步骤。",
            icon: FileCheck,
            tab: "exams" as const,
          },
          {
            name: "手册与 API 速查",
            desc: "查函数、看参数，快速找到可用的示例。",
            icon: Code2,
            tab: "cheatsheet" as const,
          },
          {
            name: "知识巩固与自测",
            desc: "辨析易错细节，用交互练习检验掌握程度。",
            icon: BookOpen,
            tab: "quiz" as const,
          },
        ].map((item) => (
          <button key={item.tab} onClick={() => onStudy(item.tab)}>
            <item.icon size={23} />
            <h3>
              {item.name}
              <ArrowUpRight size={16} />
            </h3>
            <p>{item.desc}</p>
          </button>
        ))}
      </div>
      <div className="editorial-note">
        <BookOpen size={17} />
        <span>AI 文章与专题手册正在规划，后续会与相关知识节点关联。</span>
      </div>
    </section>
  </div>
);
const Chevron = () => <ArrowRight size={13} />;
