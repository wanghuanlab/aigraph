import React, { useState, useMemo } from 'react';
import { examQuestions } from '../../data/examQuestions';
import { ExamQuestion } from '../../types';
import { ExamDetailModal } from './ExamDetailModal';
import { 
  Search, 
  Filter, 
  ArrowRight, 
  CheckCircle2, 
  Code, 
  Layers, 
  Database,
  ExternalLink
} from 'lucide-react';

interface ExamQuestionsProps {
  initialCategory?: string;
}

export const ExamQuestions: React.FC<ExamQuestionsProps> = ({ initialCategory }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExam, setSelectedExam] = useState<ExamQuestion | null>(null);

  const categories = [
    { id: 'all', name: '全部试题', count: 20 },
    { id: '1.1', name: '1.1 业务数据处理', count: 5 },
    { id: '2.1', name: '2.1 数据清洗标注', count: 5 },
    { id: '2.2', name: '2.2 模型开发测试', count: 5 },
    { id: '3.2', name: '3.2 AI交互与部署', count: 5 }
  ];

  const filteredExams = useMemo(() => {
    return examQuestions.filter((exam) => {
      const matchCategory = selectedCategory === 'all' || exam.category === selectedCategory;
      const matchQuery = 
        exam.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.scenario.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.coreLibraries.some(lib => lib.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
            <span>20 套官方考核试题逐题精析</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
              三级实操 1.1.1 ~ 3.2.5
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            提供官方原版题目要求、数据结构字典、填空代码答案与机考截图规范
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索题号 (如 1.1.1)、关键词或库名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>{cat.name}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              selectedCategory === cat.id ? 'bg-brand-700 text-brand-100' : 'bg-slate-800 text-slate-400'
            }`}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Questions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
        {filteredExams.map((exam) => (
          <div
            key={exam.id}
            onClick={() => setSelectedExam(exam)}
            className="group bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-brand-500/50 hover:bg-slate-850/80 transition-all hover:shadow-xl hover:shadow-brand-900/10 cursor-pointer flex flex-col justify-between"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2.5">
                  <span className="px-2.5 py-0.5 rounded-lg bg-brand-500/20 text-brand-300 font-mono font-bold text-xs border border-brand-500/30">
                    {exam.id}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{exam.categoryName}</span>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  exam.difficulty === '基础' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                  exam.difficulty === '中等' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                  'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                }`}>
                  {exam.difficulty}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                {exam.title}
              </h3>

              {/* Scenario */}
              <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                {exam.scenario}
              </p>

              {/* Dataset & Tasks summary */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                <div className="flex items-center space-x-1 truncate max-w-[200px]">
                  <Database className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{exam.dataset.name}</span>
                </div>
                <span>{exam.tasks.length} 项考核任务</span>
              </div>
            </div>

            {/* Bottom Bar: Libraries & Action */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {exam.coreLibraries.map((lib) => (
                  <span key={lib} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/50">
                    {lib}
                  </span>
                ))}
              </div>

              <div className="flex items-center space-x-1 text-xs text-brand-400 group-hover:translate-x-0.5 transition-transform font-medium">
                <span>详解</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredExams.length === 0 && (
        <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-sm">未找到符合搜索条件的试题</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedExam && (
        <ExamDetailModal 
          exam={selectedExam} 
          onClose={() => setSelectedExam(null)} 
        />
      )}
    </div>
  );
};
