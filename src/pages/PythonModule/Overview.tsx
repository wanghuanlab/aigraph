import React from 'react';
import { knowledgeNodes } from '../../data/knowledgeGraph';
import { 
  Database, 
  Wand2, 
  Cpu, 
  Eye, 
  ArrowRight, 
  Layers, 
  Code, 
  AlertCircle
} from 'lucide-react';
import { PythonSubTab } from '../../components/Navbar';

interface OverviewProps {
  onNavigate: (tab: PythonSubTab, filterCategory?: string) => void;
  onSelectExam: (examId: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({ onNavigate, onSelectExam }) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'Database': return <Database className="w-6 h-6 text-blue-400" />;
      case 'Wand2': return <Wand2 className="w-6 h-6 text-purple-400" />;
      case 'Cpu': return <Cpu className="w-6 h-6 text-emerald-400" />;
      case 'Eye': return <Eye className="w-6 h-6 text-amber-400" />;
      default: return <Code className="w-6 h-6 text-brand-400" />;
    }
  };

  return (
    <div className="space-y-10 pb-16">
      <div className="page-heading">
        <span className="eyebrow">Python 专项研习</span>
        <h1>人工智能训练师 · 三级</h1>
        <p>当前已整理四个能力主题的部分内容。沿着知识点理解原理，再通过实操项目巩固应用。</p>
        <div className="hero-actions"><button className="primary-button" onClick={() => onNavigate('exams')}>进入实操项目 <ArrowRight size={16} /></button><button className="secondary-button" onClick={() => onNavigate('cheatsheet')}>查阅 API 手册</button></div>
      </div>

      {/* Exam Environment Notice */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 sm:p-5 flex items-start space-x-3.5">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-slate-300 space-y-1">
          <h4 className="font-semibold text-amber-300">本支实操规范（人工智能训练师 · 三级）：</h4>
          <p>
            1. 考场环境为基于 <code className="text-amber-200 bg-amber-950/60 px-1 py-0.5 rounded">Jupyter Notebook</code> 的离线虚拟机，要求在下划线 <code className="text-amber-200 bg-amber-950/60 px-1 py-0.5 rounded">_________</code> 处精准填充代码，切勿随意修改源码结构。
          </p>
          <p>
            2. 运行代码产生结果后，需使用系统截图工具截取终端/输出并保存为指定文件名的 <code className="text-amber-200 bg-amber-950/60 px-1 py-0.5 rounded">.jpg</code> 截图，并将 Notebook 导出为 <code className="text-amber-200 bg-amber-950/60 px-1 py-0.5 rounded">.html</code> 上传。
          </p>
        </div>
      </div>

      {/* Four Pillars Knowledge Nodes */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
              <Layers className="w-5 h-5 text-brand-400" />
              <span>已收录的核心能力主题</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">从数据处理到模型应用，点击项目编号查看完整解析。</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {knowledgeNodes.map((node) => (
            <div 
              key={node.id}
              data-resource-title={node.title}
              style={{ scrollMarginTop: 100 }}
              className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 hover:border-slate-700 transition-all hover:shadow-xl hover:shadow-brand-900/10 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                      {getIcon(node.iconName)}
                    </div>
                    <div>
                      <span className="text-[11px] font-mono font-medium text-brand-400 tracking-wide uppercase">{node.category}</span>
                      <h3 className="text-base sm:text-lg font-bold text-white">{node.title}</h3>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[11px] rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {node.level}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                  {node.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {node.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Core APIs Preview */}
                <div className="space-y-2 mb-5">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">高频考查核心接口：</span>
                  <div className="space-y-1.5">
                    {node.coreAPIs.slice(0, 3).map((api) => (
                      <div key={api.name} className="text-xs bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 font-mono text-slate-300 flex items-center justify-between">
                        <span className="text-brand-300 font-semibold">{api.name}</span>
                        <span className="text-slate-500 truncate max-w-[200px]">{api.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action bar */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-3 items-center justify-between">
                <div className="flex flex-wrap gap-1 items-center space-x-1.5 text-xs text-slate-400">
                  <span>对应真题：</span>
                  <div className="flex space-x-1">
                    {node.relatedQuestions.map((qId) => (
                      <button
                        key={qId}
                        onClick={() => onSelectExam(qId)}
                        className="font-mono text-brand-400 hover:text-brand-300 underline font-medium cursor-pointer"
                      >
                        {qId}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('exams', node.category.substring(0, 3))}
                  className="inline-flex items-center space-x-1 text-xs text-brand-400 hover:text-brand-300 font-medium cursor-pointer"
                >
                  <span>查看真题专练</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <div 
          onClick={() => onNavigate('exams')}
          className="group p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-brand-500/50 hover:bg-slate-850 transition-all cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Code className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-white group-hover:text-brand-300 transition-colors">本支实操项目精讲</h4>
          <p className="text-xs text-slate-400 mt-1">1.1.1–3.2.5 业务场景、代码填空与评分要点，属于当前三级支线</p>
        </div>

        <div 
          onClick={() => onNavigate('cheatsheet')}
          className="group p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-brand-500/50 hover:bg-slate-850 transition-all cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Layers className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-white group-hover:text-brand-300 transition-colors">高频 API 备查速查表</h4>
          <p className="text-xs text-slate-400 mt-1">Pandas、Sklearn、ONNX Runtime、OpenCV 核心函数使用与代码模板</p>
        </div>

        <div 
          onClick={() => onNavigate('pitfalls')}
          className="group p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 transition-all cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <AlertCircle className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">易错避坑与失分点</h4>
          <p className="text-xs text-slate-400 mt-1">总结 right=False、维度转置、SMOTE 采样时序等致命失分细节</p>
        </div>
      </div>
    </div>
  );
};
