import React from 'react';
import { BrainCircuit, BookOpen, Terminal, Sparkles, Award } from 'lucide-react';
import { MainModule } from './Navbar';

interface FooterProps {
  onSelectModule: (module: MainModule) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectModule }) => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            AI
          </div>
          <div>
            <span className="font-bold text-slate-200">AIGraph · AI 知识图谱</span>
            <p className="text-slate-500 text-[11px]">aigraph.wanghuanlab.com · 人工智能全栈知识图谱与研习社</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400">
          <button onClick={() => onSelectModule('python')} className="hover:text-brand-400 transition-colors cursor-pointer">
            Module 1: Python 语言与实战考点
          </button>
          <button onClick={() => onSelectModule('ml')} className="hover:text-brand-400 transition-colors cursor-pointer">
            Module 2: 机器学习算法
          </button>
          <button onClick={() => onSelectModule('dl')} className="hover:text-brand-400 transition-colors cursor-pointer">
            Module 3: 深度学习与大模型
          </button>
          <button onClick={() => onSelectModule('exam')} className="hover:text-brand-400 transition-colors cursor-pointer">
            Module 4: 模拟考场
          </button>
        </div>

        <div className="text-slate-500 text-center md:text-right">
          <p>© 2026 AIGraph (aigraph.wanghuanlab.com). All rights reserved.</p>
          <p className="mt-0.5 text-[10px]">构建体系化人工智能认知与工程实践</p>
        </div>
      </div>
    </footer>
  );
};
