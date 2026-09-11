import { QuizQuestion } from '../types';

export const quizQuestions: QuizQuestion[] = [
  {
    id: 'q-1',
    title: '关于 pd.cut 的区间开闭',
    category: 'Pandas 数据分箱',
    question: '在智能医疗或电商用户统计试题中，要求分箱区间为：“低于18.5”、“18.5～24.9”，要实现左闭右开[18.5, 24.9)的效果，pd.cut 应传入哪个参数？',
    options: ['right=True', 'right=False', 'closed="left"', 'include_lowest=True'],
    correctIndex: 1,
    explanation: 'pd.cut 默认是 right=True（左开右闭 (a, b]）。若要满足“18.5属于第二个区间”的业务要求，必须指定 right=False 设定为左闭右开 [a, b)。',
    relatedExam: '1.1.1 智能医疗'
  },
  {
    id: 'q-2',
    title: '连续型脏数据强制转换与空值清洗',
    category: 'Pandas 特征清洗',
    question: '某数据列 horsepower 混入了字符串 "?"，使用哪个方法可以将其优雅转为 NaN 并配合 dropna() 剔除？',
    codeSnippet: "df['horsepower'] = pd._________(df['horsepower'], errors='_________')",
    options: [
      "astype(float), errors='ignore'",
      "to_numeric, errors='coerce'",
      "to_float, errors='replace'",
      "to_numeric, errors='raise'"
    ],
    correctIndex: 1,
    explanation: 'pd.to_numeric(..., errors="coerce") 在遇到无法解析的非数字字符时，会将其强制置为 np.nan，随后使用 dropna(subset=[...]) 即可干净剔除。',
    relatedExam: '2.1.1 智慧交通'
  },
  {
    id: 'q-3',
    title: '非平衡样本 SMOTE 采样的规范顺序',
    category: '机器学习实战',
    question: '在 2.2.1 智能信用评分试题中，对于严重不平衡的正负样本数据，SMOTE 的正确使用规范是？',
    options: [
      '在读入数据后立即对整个数据集进行 SMOTE 采样，然后再划分训练集与测试集',
      '先划分 train_test_split，仅在训练集 (X_train, y_train) 上执行 fit_resample',
      '仅在测试集 (X_test, y_test) 上执行 fit_resample 以平衡评测结果',
      '训练完逻辑回归模型之后再对模型权重做 SMOTE 矫正'
    ],
    correctIndex: 1,
    explanation: '数据科学铁律：测试集必须严格保持真实业务分布，绝不可参与任何过采样或信息合成。因此必须先划分数据集，仅在训练集上做 SMOTE。',
    relatedExam: '2.2.1 智能信用评分'
  },
  {
    id: 'q-4',
    title: 'ONNX 图像张量维度通道调整',
    category: 'CV 与模型推理',
    question: '使用 OpenCV 或 PIL 读入的图像形状为 (H, W, C)，送入标准 ONNX 计算机视觉模型前，应使用哪个方法将其转置为 (C, H, W)？',
    codeSnippet: 'image = np._________(image, (________))',
    options: [
      'reshape, (0, 1, 2)',
      'transpose, (2, 0, 1)',
      'swapaxes, (1, 2)',
      'expand_dims, 0'
    ],
    correctIndex: 1,
    explanation: 'np.transpose(image, (2, 0, 1)) 将第2轴(通道轴)移至最前，第0轴(高)和第1轴(宽)依次后移，满足深度学习 NCHW 规范。',
    relatedExam: '3.2.1 / 3.2.5 图像识别与目标检测'
  },
  {
    id: 'q-5',
    title: 'OpenCV 颜色通道转换避坑',
    category: '计算机视觉',
    question: '使用 cv2.imread 读取本地图片 orig_image 后，送入深度学习模型前应进行哪种颜色空间转换？',
    options: [
      'cv2.cvtColor(orig_image, cv2.COLOR_RGB2BGR)',
      'cv2.cvtColor(orig_image, cv2.COLOR_BGR2RGB)',
      'cv2.cvtColor(orig_image, cv2.COLOR_BGR2GRAY)',
      '无需转换，默认就是标准 RGB'
    ],
    correctIndex: 1,
    explanation: 'cv2.imread 默认读入的通道顺序是 BGR。如果不通过 cv2.COLOR_BGR2RGB 转为 RGB，会导致送入神经网络的红蓝通道颠倒，造成识别结果严重异常。',
    relatedExam: '3.2.5 目标检测'
  },
  {
    id: 'q-6',
    title: '回归模型 score() 方法返回含义',
    category: '机器学习实战',
    question: '在回归任务（如 2.2.2 或 2.2.3）中，调用 rf_model.score(X_test, y_test) 返回的数值是？',
    options: [
      '准确率 (Accuracy)',
      '均方误差 (MSE)',
      '决定系数 (R² Score)',
      '平均绝对误差 (MAE)'
    ],
    correctIndex: 2,
    explanation: '对于 scikit-learn 中的回归器（Regressor），.score() 默认返回的是决定系数 R²（可解释方差得分），取值范围通常在 0 到 1 之间（极差情况下可为负数）。',
    relatedExam: '2.2.3 运动量预测'
  }
];
