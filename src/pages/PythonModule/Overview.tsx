import React from 'react';
import { knowledgeNodes } from '../../data/knowledgeGraph';
import { 
  Database, 
  Wand2, 
  Cpu, 
  Eye, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Code, 
  Clock, 
  Award,
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
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-brand-950/40 to-slate-900 border border-slate-800 p-6 sm:p-10">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-medium mb-4">
            <Award className="w-3.5 h-3.5" />
            <span>国家职业技能等级认定 · 人工智能训练师（三级/高级工）</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Python 语言与人工智能实战考点精粹
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            深入剖析 <span className="text-brand-300 font-mono font-medium">1.1.1 至 3.2.5</span> 全部 20 套官方考核项目源码。涵盖数据流设计、清洗特征工程、经典机器学习与深度学习 ONNX 端侧推理，打造体系化、无死角备考进阶路线。
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('exams')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-600/30 transition-all cursor-pointer"
            >
              <span>研习 20 套真题项目</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('cheatsheet')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold transition-all cursor-pointer"
            >
              <span>查阅核心 API 手册</span>
            </button>
            <button
              onClick={() => onNavigate('quiz')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 text-sm font-semibold transition-all cursor-pointer"
            >
              <span>考点互动自测</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-8 pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60">
            <span className="text-xs text-slate-400">实操真题收录</span>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono mt-1">20 套</div>
            <span className="text-[11px] text-emerald-400">1.1.1 ~ 3.2.5 全覆盖</span>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60">
            <span className="text-xs text-slate-400">考核能力维度</span>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono mt-1">4 大模块</div>
            <span className="text-[11px] text-brand-400">全流程AI技能树</span>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60">
            <span className="text-xs text-slate-400">主流生态库</span>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono mt-1">8 核心库</div>
            <span className="text-[11px] text-purple-400">Pandas / ONNX / Sklearn</span>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60">
            <span className="text-xs text-slate-400">代码填空命中率</span>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono mt-1">100%</div>
            <span className="text-[11px] text-amber-400">评分点逐空详解</span>
          </div>
        </div>
      </div>

      {/* Exam Environment Notice */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 sm:p-5 flex items-start space-x-3.5">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-slate-300 space-y-1">
          <h4 className="font-semibold text-amber-300">考试系统实操机考规范提醒：</h4>
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
              <span>四维核心能力矩阵与技能树</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">三级训练师考核涵盖从数据治理到生产部署的工业级全生命周期</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {knowledgeNodes.map((node) => (
            <div 
              key={node.id}
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
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
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
          <h4 className="text-sm font-semibold text-white group-hover:text-brand-300 transition-colors">20套真题逐题精讲</h4>
          <p className="text-xs text-slate-400 mt-1">包含1.1.1-3.2.5的业务场景、代码填空答案与各空分值评分剖析</p>
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
