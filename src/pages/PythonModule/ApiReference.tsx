import React, { useState, useMemo } from 'react';
import { cheatSheetData } from '../../data/apiCheatSheet';
import { ApiItem } from '../../types';
import { CodeBlock } from '../../components/CodeBlock';
import { Search, Code, CheckCircle, Lightbulb, Bookmark } from 'lucide-react';

export const ApiReference: React.FC = () => {
  const [selectedLib, setSelectedLib] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const libraries = [
    { id: 'all', name: '全部库' },
    { id: 'pandas', name: 'Pandas (数据处理)' },
    { id: 'numpy', name: 'NumPy (矩阵运算)' },
    { id: 'sklearn', name: 'Scikit-Learn (建模)' },
    { id: 'onnxruntime', name: 'ONNX Runtime (推理)' },
    { id: 'cv2', name: 'OpenCV (图像处理)' },
    { id: 'PIL', name: 'PIL (图像I/O)' },
    { id: 'scipy', name: 'Scipy (科学计算)' }
  ];

  const filteredApis = useMemo(() => {
    return cheatSheetData.filter((item) => {
      const matchLib = selectedLib === 'all' || item.library === selectedLib;
      const matchQuery = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.usage.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchLib && matchQuery;
    });
  }, [selectedLib, searchQuery]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
            <span>高频核心 API 备查速查手册</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
              机考金手指
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            收录三级实操考题中 100% 出现的核心函数用法、参数细节与真题典型代码模板
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索函数名 (如 cut, transpose)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      {/* Library Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {libraries.map((lib) => (
          <button
            key={lib.id}
            onClick={() => setSelectedLib(lib.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              selectedLib === lib.id
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {lib.name}
          </button>
        ))}
      </div>

      {/* API Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {filteredApis.map((item, idx) => (
          <div
            key={idx}
            className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold text-brand-400 bg-brand-500/10 px-2.5 py-0.5 rounded border border-brand-500/20">
                  {item.library}
                </span>
                <span className="text-xs text-slate-400">{item.category}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  item.examFrequency === '高频核心' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                  item.examFrequency === '中频常用' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                  'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                }`}>
                  {item.examFrequency}
                </span>
              </div>

              <h3 className="text-base font-bold font-mono text-white mt-2">
                {item.name}
              </h3>

              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                {item.description}
              </p>

              <div className="mt-3">
                <CodeBlock code={item.exampleCode} title="典型真题调用范例" />
              </div>
            </div>

            <div className="mt-3 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs text-amber-300/90 flex items-start space-x-2">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>避坑要诀：</strong>{item.tips}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredApis.length === 0 && (
        <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-sm">未找到匹配的 API 接口</p>
        </div>
      )}
    </div>
  );
};
