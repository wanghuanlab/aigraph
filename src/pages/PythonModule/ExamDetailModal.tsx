import React, { useState } from 'react';
import { ExamQuestion } from '../../types';
import { CodeBlock } from '../../components/CodeBlock';
import { 
  X, 
  Database, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  BookOpen, 
  Code2, 
  Award,
  Layers
} from 'lucide-react';

interface ExamDetailModalProps {
  exam: ExamQuestion;
  onClose: () => void;
}

export const ExamDetailModal: React.FC<ExamDetailModalProps> = ({ exam, onClose }) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'code' | 'blanks' | 'summary'>('code');
  const [codeMode, setCodeMode] = useState<'solution' | 'template'>('solution');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="px-3 py-1 bg-brand-500/20 text-brand-300 font-mono font-bold rounded-lg border border-brand-500/30 text-sm">
              {exam.id}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-slate-400">{exam.categoryName}</span>
                <span className="text-slate-600">·</span>
                <span className={`text-[11px] px-2 py-0.2 rounded-full font-medium ${
                  exam.difficulty === '基础' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                  exam.difficulty === '中等' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                  'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                }`}>
                  {exam.difficulty}
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-bold text-white mt-0.5">{exam.title}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs inside Modal */}
        <div className="flex items-center px-4 sm:px-6 border-b border-slate-800 bg-slate-950/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'code'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>代码实现与填空对比</span>
          </button>

          <button
            onClick={() => setActiveTab('blanks')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'blanks'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>逐空得分点详解 ({exam.blanksExplanation.length}空)</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'tasks'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>业务场景与考核要求</span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'summary'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>核心考点小结</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Tab 1: Code */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400">切换展示视图：</span>
                  <div className="flex p-1 rounded-lg bg-slate-800 border border-slate-700/80 text-xs">
                    <button
                      onClick={() => setCodeMode('solution')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        codeMode === 'solution'
                          ? 'bg-brand-600 text-white font-medium shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      标准满分解答源码
                    </button>
                    <button
                      onClick={() => setCodeMode('template')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        codeMode === 'template'
                          ? 'bg-brand-600 text-white font-medium shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      官方考卷填空模板 (ipynb)
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
                  <span>依赖库：</span>
                  {exam.coreLibraries.map((lib) => (
                    <span key={lib} className="px-2 py-0.5 rounded bg-slate-800 text-brand-300">
                      {lib}
                    </span>
                  ))}
                </div>
              </div>

              <CodeBlock
                code={codeMode === 'solution' ? exam.codeSolution : exam.codeTemplate}
                title={codeMode === 'solution' ? `${exam.id}.ipynb - 官方标准解答完整代码` : `${exam.id}.ipynb - 官方填空下划线模板`}
              />

              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60 text-xs text-slate-300">
                <span className="font-semibold text-brand-300">机考提示：</span>
                在官方考试界面中，代码均预先写好了骨架，考生需在下划线 <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">_____________</code> 处补充核心函数或逻辑调用，保存运行后截图结果。
              </div>
            </div>
          )}

          {/* Tab 2: Blanks Explanation */}
          {activeTab === 'blanks' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>本题考核的填空位置、标准语法及各空得分权重：</span>
                <span className="text-brand-300 font-medium">总分分值：约 15 ~ 25 分 / 题</span>
              </div>

              <div className="space-y-3">
                {exam.blanksExplanation.map((blank, index) => (
                  <div 
                    key={index}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-300 font-mono font-bold text-xs flex items-center justify-center">
                          {blank.blankIndex}
                        </span>
                        <span className="text-xs font-semibold text-white">填空序号 #{blank.blankIndex}</span>
                      </div>
                      <span className="px-2 py-0.5 text-xs font-mono font-bold text-amber-400 bg-amber-500/10 rounded border border-amber-500/20">
                        {blank.points} 分
                      </span>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
                      <code>{blank.code}</code>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      <span className="text-slate-500 font-medium">考查点解析：</span>
                      {blank.explanation}
                    </p>

                    {blank.pitfall && (
                      <div className="mt-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start space-x-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span><strong>易错避坑：</strong>{blank.pitfall}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Tasks & Scenario */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              {/* Scenario */}
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2 mb-2">
                  <Database className="w-4 h-4 text-brand-400" />
                  <span>工作任务背景与数据源</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  {exam.scenario}
                </p>
              </div>

              {/* Dataset Fields */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  数据集字段字典 ({exam.dataset.name})：
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-slate-300 font-mono">
                      <tr>
                        <th className="px-4 py-2.5 font-semibold">字段名称 (Column)</th>
                        <th className="px-4 py-2.5 font-semibold">业务含义与规范说明</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/60 font-sans">
                      {exam.dataset.fields.map((field) => (
                        <tr key={field.name} className="hover:bg-slate-800/40">
                          <td className="px-4 py-2 font-mono text-brand-300 font-medium">{field.name}</td>
                          <td className="px-4 py-2 text-slate-300">{field.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Specific Tasks */}
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>考核实操任务清单及成果物提交要求</span>
                </h3>
                <div className="space-y-2.5">
                  {exam.tasks.map((task) => (
                    <div key={task.order} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-brand-400">任务 ({task.order})</span>
                        <p className="text-xs text-slate-300">{task.description}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-slate-800 text-amber-300 font-mono text-xs border border-slate-700 whitespace-nowrap ml-4">
                        {task.targetFile}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Summary */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-brand-400" />
                <span>知识点沉淀与考点解构</span>
              </h3>
              <div className="space-y-2.5">
                {exam.keyTakeaways.map((point, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span>官方考核时间：<strong>30 分钟</strong></span>
            <span>·</span>
            <span>试题编号：<strong className="font-mono text-slate-300">{exam.id}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors cursor-pointer"
          >
            关闭窗口
          </button>
        </div>
      </div>
    </div>
  );
};
