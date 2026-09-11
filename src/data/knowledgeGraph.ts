import { KnowledgeNode } from '../types';

export const knowledgeNodes: KnowledgeNode[] = [
  {
    id: 'kn-1',
    title: '数据采集、质量审核与统计分析',
    category: '1.1 业务数据处理',
    level: 'L3 必备核心',
    description: '涵盖结构化数据(CSV/Excel)加载、缺失与重复完整性审查、业务合理性多条件过滤、连续变量离散化分箱(pd.cut)以及多维度透视分组统计。',
    iconName: 'Database',
    tags: ['Pandas', 'NumPy', '数据审核', '离散分箱', '分组聚合'],
    relatedQuestions: ['1.1.1', '1.1.2', '1.1.3', '1.1.4', '1.1.5'],
    coreAPIs: [
      {
        name: 'pd.read_csv / pd.read_excel',
        signature: 'pd.read_csv(filepath_or_buffer, ...)',
        description: '从本地文件系统加载结构化数据，返回DataFrame对象。',
        example: "df = pd.read_csv('patient_data.csv')"
      },
      {
        name: 'Series.between',
        signature: 's.between(left, right, inclusive="both")',
        description: '判断数值是否落在指定的闭区间内，返回布尔序列。在业务合理性审核中极其高频。',
        example: "valid_age = df['Age'].between(18, 70)"
      },
      {
        name: 'pd.cut',
        signature: 'pd.cut(x, bins, labels=None, right=True, ...)',
        description: '连续数值离散化分箱。考试重点：right=False 表示左闭右开区间 [a, b)。',
        example: "df['AgeGroup'] = pd.cut(df['Age'], bins=[0, 18, 65, np.inf], labels=['少年', '成年', '老年'], right=False)"
      },
      {
        name: 'DataFrame.groupby & agg',
        signature: 'df.groupby(by).agg(func)',
        description: '多维度分组聚合计算，常配合 .unstack() 实现透视表重塑。',
        example: "df.groupby('SensorType')['Value'].agg(['count', 'mean'])"
      },
      {
        name: 'np.where',
        signature: 'np.where(condition, [x, y])',
        description: '向量化条件选择，常用于根据单一或复合业务指标快速生成二值分类标签。',
        example: "df['Risk'] = np.where(df['Days'] > 7, '高风险', '低风险')"
      }
    ]
  },
  {
    id: 'kn-2',
    title: '数据清洗、特征工程与规范标注',
    category: '2.1 数据清洗标注',
    level: 'L3 必备核心',
    description: '针对现实脏数据，处理特殊字符转换与强制解析、差异化缺失值填补（众数/中位数/前后向）、IQR四分位距离群值过滤、StandardScaler/MinMaxScaler特征缩放与哑变量编码。',
    iconName: 'Wand2',
    tags: ['StandardScaler', 'MinMaxScaler', 'IQR离群点', '缺失填补', '哑变量'],
    relatedQuestions: ['2.1.1', '2.1.2', '2.1.3', '2.1.4', '2.1.5'],
    coreAPIs: [
      {
        name: 'pd.to_numeric',
        signature: 'pd.to_numeric(arg, errors="raise|coerce|ignore")',
        description: '将列强制解析为浮点或整型。指定 errors="coerce" 可将脏字符串(如"?")安全置为NaN。',
        example: "df['horsepower'] = pd.to_numeric(df['horsepower'], errors='coerce')"
      },
      {
        name: 'Series.quantile & IQR',
        signature: 's.quantile(q=0.5)',
        description: '计算样本分位数。Q1=quantile(0.25), Q3=quantile(0.75), IQR=Q3-Q1。',
        example: "IQR = df['col'].quantile(0.75) - df['col'].quantile(0.25)"
      },
      {
        name: 'StandardScaler',
        signature: 'sklearn.preprocessing.StandardScaler()',
        description: '标准正态化：z = (x - u) / s。常用于多元线性模型和基于梯度的算法。',
        example: "scaler = StandardScaler()\ndf[cols] = scaler.fit_transform(df[cols])"
      },
      {
        name: 'MinMaxScaler',
        signature: 'sklearn.preprocessing.MinMaxScaler(feature_range=(0, 1))',
        description: '离差标准化：将连续数值映射至 [0, 1] 闭区间，消除量纲影响。',
        example: "scaler = MinMaxScaler()\ndf[cols] = scaler.fit_transform(df[cols])"
      },
      {
        name: 'pd.get_dummies',
        signature: 'pd.get_dummies(data, drop_first=False, ...)',
        description: '对分类字符变量进行独热(One-Hot)哑变量编码。考试常指定 drop_first=True 防范多重共线性。',
        example: "df_dummy = pd.get_dummies(df, drop_first=True)"
      }
    ]
  },
  {
    id: 'kn-3',
    title: '机器学习模型开发、评估与调优',
    category: '2.2 模型开发测试',
    level: 'L3 关键实战',
    description: '覆盖分类与回归任务全生命周期。包含SMOTE非平衡样本过采样、Logistic回归分类、Pipeline流水线集成、RandomForest与XGBoost对比实验、模型序列化及评估报告撰写。',
    iconName: 'Cpu',
    tags: ['SMOTE', 'RandomForest', 'XGBoost', 'Pipeline', 'MSE/R2', 'pickle/joblib'],
    relatedQuestions: ['2.2.1', '2.2.2', '2.2.3', '2.2.4', '2.2.5'],
    coreAPIs: [
      {
        name: 'SMOTE.fit_resample',
        signature: 'imblearn.over_sampling.SMOTE().fit_resample(X, y)',
        description: '合成少数类过采样技术，只应在训练集上调用，平衡正负样本比例。',
        example: "X_res, y_res = SMOTE(random_state=42).fit_resample(X_train, y_train)"
      },
      {
        name: 'RandomForestRegressor / Classifier',
        signature: 'sklearn.ensemble.RandomForestRegressor(n_estimators=100, ...)',
        description: '经典Bagging集成树模型，抗过拟合能力强，常用于构建稳健预测基线。',
        example: "model = RandomForestRegressor(n_estimators=100, random_state=42)\nmodel.fit(X_train, y_train)"
      },
      {
        name: 'XGBRegressor',
        signature: 'xgboost.XGBRegressor(n_estimators=100, learning_rate=0.1, ...)',
        description: '极端梯度提升树。三级考纲常作为“模型纠偏与优化升级”的优选方案。',
        example: "xgb_model = XGBRegressor(n_estimators=100, learning_rate=0.05, max_depth=5)"
      },
      {
        name: 'mean_squared_error & r2_score',
        signature: 'sklearn.metrics.mean_squared_error(y_true, y_pred)',
        description: '回归问题最常用的评价指标。MSE衡量绝对误差大小，R2衡量方差解释度。',
        example: "mse = mean_squared_error(y_test, y_pred)\nr2 = r2_score(y_test, y_pred)"
      },
      {
        name: 'pickle.dump / joblib.dump',
        signature: 'pickle.dump(model, open("model.pkl", "wb"))',
        description: '将训练完毕的模型持久化保存至本地磁盘供服务部署调用。',
        example: "with open('model.pkl', 'wb') as f:\n    pickle.dump(model, f)"
      }
    ]
  },
  {
    id: 'kn-4',
    title: '系统交互设计与计算机视觉部署',
    category: '3.2 AI交互系统与部署',
    level: 'L3 高阶工程',
    description: '工业级AI推理落地链路。使用ONNX Runtime加载深度学习模型，使用PIL/OpenCV进行图像多通道预处理(NCHW)、置信度Softmax映射、Top-K与NMS后处理及标注渲染。',
    iconName: 'Eye',
    tags: ['ONNX Runtime', 'OpenCV', 'PIL', 'NMS目标检测', 'Softmax', 'Top-K'],
    relatedQuestions: ['3.2.1', '3.2.2', '3.2.3', '3.2.4', '3.2.5'],
    coreAPIs: [
      {
        name: 'ort.InferenceSession',
        signature: 'onnxruntime.InferenceSession(model_path)',
        description: '创建跨平台高性能深度学习模型推理会话。',
        example: "session = ort.InferenceSession('model.onnx')\noutput = session.run([out_name], {in_name: tensor})"
      },
      {
        name: 'Image.open & convert',
        signature: 'PIL.Image.open(fp).convert(mode)',
        description: '载入图像文件并转换为目标色彩模式。模式 "RGB" 为彩色三通道，模式 "L" 为灰度单通道。',
        example: "img = Image.open('test.jpg').convert('RGB')"
      },
      {
        name: 'np.transpose & expand_dims',
        signature: 'np.transpose(a, axes) / np.expand_dims(a, axis)',
        description: 'CV张量维度变换核心。将图像从 HWC (高宽通道) 转置为 CHW，并扩展为 NCHW (批次高阶)。',
        example: "tensor = np.transpose(img, (2, 0, 1))\ntensor = np.expand_dims(tensor, axis=0)"
      },
      {
        name: 'scipy.special.softmax',
        signature: 'scipy.special.softmax(x, axis=-1)',
        description: '对网络直接输出的无界logits激活为多分类概率分布（各项和为1）。',
        example: "probs = scipy.special.softmax(output, axis=-1)"
      },
      {
        name: 'cv2.imread / cv2.rectangle / cv2.putText',
        signature: 'cv2.imread(filename) / cv2.rectangle(img, pt1, pt2, color, thickness)',
        description: 'OpenCV核心I/O与绘图标注函数。在目标检测框绘制与可视化输出中必考。',
        example: "cv2.rectangle(img, (x1, y1), (x2, y2), (255, 255, 0), 2)"
      }
    ]
  }
];
