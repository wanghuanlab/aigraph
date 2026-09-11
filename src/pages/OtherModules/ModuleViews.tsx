import React from 'react';
import { Cpu, Sparkles, Award, ArrowRight, Layers, CheckCircle2 } from 'lucide-react';
import { MainModule } from '../../components/Navbar';

interface UpcomingModuleProps {
  moduleKey: MainModule;
  onGoToPython: () => void;
}

export const MachineLearningView: React.FC<UpcomingModuleProps> = ({ onGoToPython }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shadow-xl shadow-brand-500/10">
        <Cpu className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800 text-brand-300 text-xs font-medium border border-slate-700">
          <span>模块二 · 规划中</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">机器学习算法原理与实战进阶</h2>
        <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
          深入决策树、SVM支持向量机、聚类算法与集成学习(XGBoost / LightGBM / CatBoost)从数学推导到Scikit-learn工程调优实战。
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-left max-w-2xl mx-auto space-y-3 text-xs sm:text-sm text-slate-300">
        <h4 className="font-semibold text-white flex items-center space-x-2">
          <Layers className="w-4 h-4 text-brand-400" />
          <span>本模块规划核心主题：</span>
        </h4>
        <ul className="space-y-2">
          <li className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>分类与回归决策边界可视化</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>超参数调优网格搜索与贝叶斯优化(Optuna)</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>特征工程深度衍生与SHAP特征可解释性分析</span>
          </li>
        </ul>
      </div>

      <div className="pt-4">
        <button
          onClick={onGoToPython}
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-brand-600/30"
        >
          <span>先去研习 Module 1: Python 语言核心</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const DeepLearningView: React.FC<UpcomingModuleProps> = ({ onGoToPython }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-xl shadow-purple-500/10">
        <Sparkles className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800 text-purple-300 text-xs font-medium border border-slate-700">
          <span>模块三 · 规划中</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">深度学习与大模型前沿 (LLM)</h2>
        <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
          涵盖PyTorch网络构建、CNN/ResNet计算机视觉、Transformer架构原理、大模型微调(LoRA/Q-LoRA)及RAG智能体知识库搭建。
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-left max-w-2xl mx-auto space-y-3 text-xs sm:text-sm text-slate-300">
        <h4 className="font-semibold text-white flex items-center space-x-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <span>本模块规划核心主题：</span>
        </h4>
        <ul className="space-y-2">
          <li className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>PyTorch 神经网络张量计算与自动微分机制</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>ONNX / TensorRT 高性能推理引擎跨端部署</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>开源大模型本地部署与应用开发(LangChain/LlamaIndex)</span>
          </li>
        </ul>
      </div>

      <div className="pt-4">
        <button
          onClick={onGoToPython}
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-brand-600/30"
        >
          <span>返回研习 Module 1: Python 语言核心</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const MockExamView: React.FC<UpcomingModuleProps> = ({ onGoToPython }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
        <Award className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800 text-amber-300 text-xs font-medium border border-slate-700">
          <span>模块四 · 规划中</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">人工智能训练师全真机考模拟中心</h2>
        <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
          提供与官方考场 1:1 还原的倒计时机考界面、Jupyter Notebook 运行检测、结果截图上传模拟与自动评分系统。
        </p>
      </div>

      <div className="pt-4">
        <button
          onClick={onGoToPython}
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-brand-600/30"
        >
          <span>立即练习 Python 实操真题 (1.1.1~3.2.5)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
