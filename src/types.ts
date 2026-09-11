export type ModuleCategory = '1.1' | '2.1' | '2.2' | '3.2';

export interface ExamQuestion {
  id: string; // e.g. "1.1.1"
  category: ModuleCategory;
  categoryName: string; // e.g. "业务数据采集与处理"
  title: string;
  scenario: string; // 业务背景
  dataset: {
    name: string;
    description: string;
    fields: { name: string; desc: string }[];
  };
  tasks: {
    order: number;
    description: string;
    targetFile: string;
  }[];
  skillRequirements: string[];
  qualityMetrics: string[];
  coreLibraries: string[];
  codeTemplate: string;
  codeSolution: string;
  blanksExplanation: {
    blankIndex: number;
    code: string;
    points: number;
    explanation: string;
    pitfall?: string;
  }[];
  keyTakeaways: string[];
  difficulty: '基础' | '中等' | '进阶';
}

export interface KnowledgeNode {
  id: string;
  title: string;
  category: string;
  level: string;
  description: string;
  iconName: string;
  tags: string[];
  coreAPIs: {
    name: string;
    signature: string;
    description: string;
    example: string;
  }[];
  relatedQuestions: string[]; // e.g. ["1.1.1", "1.1.2"]
}

export interface ApiItem {
  library: 'pandas' | 'numpy' | 'sklearn' | 'xgboost' | 'onnxruntime' | 'cv2' | 'PIL' | 'scipy';
  name: string;
  category: string;
  usage: string;
  description: string;
  examFrequency: '高频核心' | '中频常用' | '特定专项';
  exampleCode: string;
  tips: string;
}

export interface PitfallItem {
  id: string;
  title: string;
  category: string;
  severity: '高危失分' | '易混淆' | '规范细节';
  problemCode: string;
  correctCode: string;
  reason: string;
  applicableQuestions: string[];
}

export interface QuizQuestion {
  id: string;
  title: string;
  category: string;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  relatedExam: string;
}
