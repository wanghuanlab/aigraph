import React, { useState } from 'react';
import { quizQuestions } from '../../data/quizData';
import { CheckCircle2, XCircle, HelpCircle, RotateCcw, Award, ArrowRight } from 'lucide-react';
import { CodeBlock } from '../../components/CodeBlock';

export const InteractiveQuiz: React.FC = () => {
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (showResults[questionId]) return; // already answered
    setUserAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    setShowResults(prev => ({ ...prev, [questionId]: true }));
  };

  const handleReset = () => {
    setUserAnswers({});
    setShowResults({});
  };

  const answeredCount = Object.keys(userAnswers).length;
  const correctCount = Object.entries(userAnswers).filter(
    ([qId, ansIdx]) => {
      const q = quizQuestions.find(item => item.id === qId);
      return q && q.correctIndex === ansIdx;
    }
  ).length;

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Score Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
            <Award className="w-6 h-6 text-emerald-400" />
            <span>三级考点代码填空自测演练</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            涵盖高频分箱参数、类型转换、SMOTE采样、维度转置与OpenCV通道转换等关键考点
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <span className="text-xs text-slate-400">已作答 / 正确率</span>
            <div className="text-lg font-bold text-white font-mono">
              <span className="text-emerald-400">{correctCount}</span> / {answeredCount}
              <span className="text-xs text-slate-400 font-sans ml-1">
                ({answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0}%)
              </span>
            </div>
          </div>
          {answeredCount > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors border border-slate-700 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重练</span>
            </button>
          )}
        </div>
      </div>

      {/* Quiz List */}
      <div className="space-y-6">
        {quizQuestions.map((q, idx) => {
          const isAnswered = showResults[q.id];
          const selectedOption = userAnswers[q.id];
          const isCorrect = selectedOption === q.correctIndex;

          return (
            <div
              key={q.id}
              className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-300 font-mono font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{q.category}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs font-semibold text-white">{q.title}</span>
                </div>
                <span className="text-xs text-brand-400 font-mono">对应：{q.relatedExam}</span>
              </div>

              {/* Question Description */}
              <p className="text-sm text-slate-200 leading-relaxed font-medium">
                {q.question}
              </p>

              {/* Optional Code Snippet */}
              {q.codeSnippet && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-brand-200">
                  <pre>{q.codeSnippet}</pre>
                </div>
              )}

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {q.options.map((opt, oIdx) => {
                  let btnStyle = 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-750 hover:text-white';
                  if (isAnswered) {
                    if (oIdx === q.correctIndex) {
                      btnStyle = 'bg-emerald-950/40 border-emerald-500/80 text-emerald-300 font-medium ring-1 ring-emerald-500/50';
                    } else if (oIdx === selectedOption) {
                      btnStyle = 'bg-red-950/40 border-red-500/80 text-red-300 line-through';
                    } else {
                      btnStyle = 'bg-slate-900/40 border-slate-800/60 text-slate-500 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(q.id, oIdx)}
                      className={`text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-start space-x-3 cursor-pointer ${btnStyle}`}
                    >
                      <span className="font-mono font-bold text-xs opacity-70 mt-0.5">
                        {String.fromCharCode(65 + oIdx)}.
                      </span>
                      <span className="flex-1 leading-snug">{opt}</span>
                      {isAnswered && oIdx === q.correctIndex && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      {isAnswered && oIdx === selectedOption && oIdx !== q.correctIndex && (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Reveal */}
              {isAnswered && (
                <div className={`mt-3 p-4 rounded-xl border text-xs sm:text-sm leading-relaxed animate-fadeIn ${
                  isCorrect 
                    ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-200' 
                    : 'bg-red-950/20 border-red-900/40 text-red-200'
                }`}>
                  <div className="flex items-center space-x-1.5 font-bold mb-1">
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300">回答正确！</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-400" />
                        <span className="text-red-300">回答有误</span>
                      </>
                    )}
                  </div>
                  <p className="text-slate-300 mt-1">
                    <strong>考点深度剖析：</strong>{q.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
