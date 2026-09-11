import React, { useState } from 'react';
import { Navbar, MainModule, PythonSubTab } from './components/Navbar';
import { Footer } from './components/Footer';
import { Overview } from './pages/PythonModule/Overview';
import { ExamQuestions } from './pages/PythonModule/ExamQuestions';
import { ApiReference } from './pages/PythonModule/ApiReference';
import { ExamPitfalls } from './pages/PythonModule/ExamPitfalls';
import { InteractiveQuiz } from './pages/PythonModule/InteractiveQuiz';
import { MachineLearningView, DeepLearningView, MockExamView } from './pages/OtherModules/ModuleViews';
import { examQuestions } from './data/examQuestions';
import { ExamDetailModal } from './pages/PythonModule/ExamDetailModal';
import { ExamQuestion } from './types';

export const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<MainModule>('python');
  const [activeSubTab, setActiveSubTab] = useState<PythonSubTab>('overview');
  const [examCategoryFilter, setExamCategoryFilter] = useState<string | undefined>(undefined);
  const [selectedExamDirect, setSelectedExamDirect] = useState<ExamQuestion | null>(null);

  const handleNavigate = (tab: PythonSubTab, filterCategory?: string) => {
    setActiveSubTab(tab);
    if (filterCategory) {
      setExamCategoryFilter(filterCategory);
    } else {
      setExamCategoryFilter(undefined);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectExamById = (examId: string) => {
    const found = examQuestions.find(e => e.id === examId);
    if (found) {
      setSelectedExamDirect(found);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Header */}
      <Navbar
        activeModule={activeModule}
        onSelectModule={(m) => {
          setActiveModule(m);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        activeSubTab={activeSubTab}
        onSelectSubTab={(tab) => {
          setActiveSubTab(tab);
          setExamCategoryFilter(undefined);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Module 1: Python */}
        {activeModule === 'python' && (
          <>
            {activeSubTab === 'overview' && (
              <Overview 
                onNavigate={handleNavigate}
                onSelectExam={handleSelectExamById}
              />
            )}
            {activeSubTab === 'exams' && (
              <ExamQuestions initialCategory={examCategoryFilter} />
            )}
            {activeSubTab === 'cheatsheet' && (
              <ApiReference />
            )}
            {activeSubTab === 'pitfalls' && (
              <ExamPitfalls />
            )}
            {activeSubTab === 'quiz' && (
              <InteractiveQuiz />
            )}
          </>
        )}

        {/* Upcoming Module 2: Machine Learning */}
        {activeModule === 'ml' && (
          <MachineLearningView 
            moduleKey="ml" 
            onGoToPython={() => {
              setActiveModule('python');
              setActiveSubTab('overview');
            }} 
          />
        )}

        {/* Upcoming Module 3: Deep Learning */}
        {activeModule === 'dl' && (
          <DeepLearningView 
            moduleKey="dl" 
            onGoToPython={() => {
              setActiveModule('python');
              setActiveSubTab('overview');
            }} 
          />
        )}

        {/* Upcoming Module 4: Mock Exam */}
        {activeModule === 'exam' && (
          <MockExamView 
            moduleKey="exam" 
            onGoToPython={() => {
              setActiveModule('python');
              setActiveSubTab('exams');
            }} 
          />
        )}
      </main>

      {/* Direct Exam Modal from overview clicks */}
      {selectedExamDirect && (
        <ExamDetailModal 
          exam={selectedExamDirect} 
          onClose={() => setSelectedExamDirect(null)} 
        />
      )}

      {/* Footer */}
      <Footer onSelectModule={setActiveModule} />
    </div>
  );
};

export default App;
