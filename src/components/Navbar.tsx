import React from 'react';
import { 
  Sparkles, 
  Terminal, 
  Cpu, 
  BrainCircuit, 
  Award,
  BookOpen,
  Code2,
  FileCheck,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';

export type MainModule = 'python' | 'ml' | 'dl' | 'exam';
export type PythonSubTab = 'overview' | 'exams' | 'cheatsheet' | 'pitfalls' | 'quiz';

interface NavbarProps {
  activeModule: MainModule;
  onSelectModule: (module: MainModule) => void;
  activeSubTab: PythonSubTab;
  onSelectSubTab: (subTab: PythonSubTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeModule,
  onSelectModule,
  activeSubTab,
  onSelectSubTab
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      {/* Top Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectModule('python')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-500/20 ring-1 ring-white/20">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  AIGraph
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-brand-500/20 text-brand-300 rounded-full border border-brand-500/30">
                  知识体系
                </span>
              </div>
              <p className="text-xs text-slate-400">人工智能全栈知识图谱与实战研习社</p>
            </div>
          </div>

          {/* Module Switcher Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-800/60 p-1.5 rounded-xl border border-slate-700/60">
            <button
              onClick={() => onSelectModule('python')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeModule === 'python'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Python 语言 & 三级考点</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>

            <button
              onClick={() => onSelectModule('ml')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeModule === 'ml'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>机器学习算法</span>
              <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 rounded">规划中</span>
            </button>

            <button
              onClick={() => onSelectModule('dl')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeModule === 'dl'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>深度学习与大模型</span>
              <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 rounded">规划中</span>
            </button>

            <button
              onClick={() => onSelectModule('exam')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeModule === 'exam'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>模拟考场</span>
              <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 rounded">规划中</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Secondary Sub-nav for Python Module */}
      {activeModule === 'python' && (
        <div className="bg-slate-950/80 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto py-2.5">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => onSelectSubTab('overview')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  activeSubTab === 'overview'
                    ? 'bg-slate-800 text-brand-400 border border-brand-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>知识全景图谱</span>
              </button>

              <button
                onClick={() => onSelectSubTab('exams')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  activeSubTab === 'exams'
                    ? 'bg-slate-800 text-brand-400 border border-brand-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                <span>20套真题精讲 (1.1.1~3.2.5)</span>
                <span className="bg-brand-500/20 text-brand-300 text-[10px] px-1.5 py-0.2 rounded-full">20</span>
              </button>

              <button
                onClick={() => onSelectSubTab('cheatsheet')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  activeSubTab === 'cheatsheet'
                    ? 'bg-slate-800 text-brand-400 border border-brand-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Code2 className="w-4 h-4" />
                <span>高频 API 速查</span>
              </button>

              <button
                onClick={() => onSelectSubTab('pitfalls')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  activeSubTab === 'pitfalls'
                    ? 'bg-slate-800 text-amber-400 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>易错避坑指南</span>
              </button>

              <button
                onClick={() => onSelectSubTab('quiz')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  activeSubTab === 'quiz'
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                <span>考点交互自测</span>
              </button>
            </div>

            <div className="hidden lg:flex items-center text-xs text-slate-500 space-x-1">
              <span>考纲版本：</span>
              <span className="text-slate-300 font-mono font-medium">人社部人工智能训练师（三级/高级工）</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
