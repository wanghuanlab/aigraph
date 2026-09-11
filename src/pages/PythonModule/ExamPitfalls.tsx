import React from 'react';
import { pitfallsData } from '../../data/pitfallsData';
import { AlertTriangle, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { CodeBlock } from '../../components/CodeBlock';

export const ExamPitfalls: React.FC = () => {
  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
          <span>本支易错避坑</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          人工智能训练师 · 三级实操中的高频陷阱与失分细节，属于当前 Python 支线的配套材料。
        </p>
      </div>

      {/* Pitfall Cards */}
      <div className="space-y-6">
        {pitfallsData.map((item) => (
          <div
            key={item.id}
            data-resource-title={item.title}
            style={{ scrollMarginTop: 100 }}
            className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 hover:border-slate-700 transition-all shadow-lg"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center space-x-3">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                  item.severity === '高危失分' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                  item.severity === '易混淆' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                  'bg-blue-500/10 text-blue-400 border-blue-500/30'
                }`}>
                  {item.severity}
                </span>
                <span className="text-xs text-slate-400 font-mono">{item.category}</span>
              </div>

              <div className="flex items-center space-x-1 text-xs text-slate-400">
                <span>涉及考题：</span>
                {item.applicableQuestions.map((q) => (
                  <span key={q} className="font-mono text-brand-300 font-semibold bg-slate-800 px-1.5 py-0.5 rounded">
                    {q}
                  </span>
                ))}
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white">
              {item.title}
            </h3>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Problem Code */}
              <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-4">
                <div className="flex items-center space-x-2 text-xs font-semibold text-red-400 mb-2">
                  <XCircle className="w-4 h-4" />
                  <span>典型失分错误写法 (Wrong)</span>
                </div>
                <div className="font-mono text-xs text-red-200 bg-slate-950/80 p-3 rounded-lg overflow-x-auto">
                  <pre>{item.problemCode}</pre>
                </div>
              </div>

              {/* Correct Code */}
              <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-4">
                <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>满分规范标准写法 (Correct)</span>
                </div>
                <div className="font-mono text-xs text-emerald-200 bg-slate-950/80 p-3 rounded-lg overflow-x-auto">
                  <pre>{item.correctCode}</pre>
                </div>
              </div>
            </div>

            {/* Explanation Reason */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <span className="font-semibold text-brand-300">为什么会失分 / 原理解读：</span>
              {item.reason}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
