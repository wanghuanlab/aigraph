import { ApiItem } from '../types';

export const cheatSheetData: ApiItem[] = [
  // Pandas
  {
    library: 'pandas',
    name: 'pd.read_csv',
    category: '数据IO',
    usage: "pd.read_csv('filename.csv')",
    description: '读取CSV格式文件到DataFrame',
    examFrequency: '高频核心',
    exampleCode: "df = pd.read_csv('patient_data.csv')",
    tips: '若存在中文路径或GBK编码报错，可指定 encoding="utf-8" 或 "gbk"'
  },
  {
    library: 'pandas',
    name: 'pd.read_excel',
    category: '数据IO',
    usage: "pd.read_excel('filename.xlsx')",
    description: '读取Excel表格文件',
    examFrequency: '中频常用',
    exampleCode: "df = pd.read_excel('./大学生低碳生活行为的影响因素数据集.xlsx')",
    tips: '对应试题 2.1.2 和 2.2.4，注意后缀名是.xlsx'
  },
  {
    library: 'pandas',
    name: 'df.to_csv',
    category: '数据IO',
    usage: "df.to_csv('filename.csv', index=False)",
    description: '导出DataFrame至CSV文件',
    examFrequency: '高频核心',
    exampleCode: "cleaned_df.to_csv('cleaned_data.csv', index=False)",
    tips: '考试评分常检查是否包含 index=False，若漏写会导致多出一列未命名索引'
  },
  {
    library: 'pandas',
    name: 'pd.cut',
    category: '数据分箱',
    usage: 'pd.cut(x, bins, labels=None, right=True)',
    description: '将连续变量离散化分箱为类别变量',
    examFrequency: '高频核心',
    exampleCode: "df['BMIRange'] = pd.cut(df['BMI'], bins=[0, 18.5, 24, 28, np.inf], labels=['瘦', '正常', '超重', '肥胖'], right=False)",
    tips: '三级考题几乎100%指定 right=False（左闭右开区间 [a, b)），千万不能漏写！'
  },
  {
    library: 'pandas',
    name: 'Series.between',
    category: '条件过滤',
    usage: 's.between(left, right)',
    description: '筛选落在区间[left, right]内的元素',
    examFrequency: '高频核心',
    exampleCode: "mask = df['Age'].between(18, 70)",
    tips: '两端皆包含。等价于 (df["Age"] >= 18) & (df["Age"] <= 70)'
  },
  {
    library: 'pandas',
    name: 'pd.to_numeric',
    category: '类型转换',
    usage: "pd.to_numeric(arg, errors='coerce')",
    description: '强转为数值类型，非数字文本安全转NaN',
    examFrequency: '高频核心',
    exampleCode: "df['horsepower'] = pd.to_numeric(df['horsepower'], errors='coerce')",
    tips: "遇到数据集中带有'?'或特殊符号无法转float时，必须用 errors='coerce'"
  },
  {
    library: 'pandas',
    name: 'df.dropna',
    category: '缺失清洗',
    usage: 'df.dropna(subset=None, inplace=False)',
    description: '丢弃含有缺失值NaN的行',
    examFrequency: '高频核心',
    exampleCode: "df = df.dropna(subset=['horsepower'])",
    tips: '配合 pd.to_numeric 过滤脏数据'
  },
  {
    library: 'pandas',
    name: 'Series.fillna',
    category: '缺失填充',
    usage: 's.fillna(value, method=None, inplace=False)',
    description: '填补缺失值',
    examFrequency: '高频核心',
    exampleCode: "df['Value'].fillna(method='ffill', inplace=True)\ndf['Cat'].fillna(df['Cat'].mode()[0], inplace=True)",
    tips: 'mode() 返回序列，填补必须加 [0]；连续时间序列常用 method="ffill" 与 "bfill"'
  },
  {
    library: 'pandas',
    name: 'pd.get_dummies',
    category: '特征编码',
    usage: 'pd.get_dummies(data, drop_first=False)',
    description: '独热哑变量转换',
    examFrequency: '高频核心',
    exampleCode: 'df_encoded = pd.get_dummies(df, drop_first=True)',
    tips: '线性模型建模前通常加 drop_first=True 避免虚拟变量陷阱'
  },
  {
    library: 'pandas',
    name: 'df.groupby',
    category: '分组聚合',
    usage: "df.groupby('col')['metric'].agg(['count', 'mean'])",
    description: '分组计算样本数与均值',
    examFrequency: '高频核心',
    exampleCode: "df.groupby('SensorType')['Value'].agg(['count', 'mean'])",
    tips: '结合 .unstack() 可以迅速完成行列二维交叉透视表重塑'
  },

  // NumPy
  {
    library: 'numpy',
    name: 'np.where',
    category: '条件判断',
    usage: 'np.where(condition, x, y)',
    description: '满足条件赋值x，不满足赋值y',
    examFrequency: '高频核心',
    exampleCode: "df['Risk'] = np.where(df['DaysInHospital'] > 7, '高风险患者', '低风险患者')",
    tips: '比循环或apply快数十倍的向量化三元运算'
  },
  {
    library: 'numpy',
    name: 'np.expand_dims',
    category: '张量操作',
    usage: 'np.expand_dims(a, axis)',
    description: '在指定axis增加一个轴维度',
    examFrequency: '高频核心',
    exampleCode: "tensor = np.expand_dims(image_array, axis=0)",
    tips: 'CV推理时常用于将 (C, H, W) 扩展为 (1, C, H, W) 的 Batch 维度'
  },
  {
    library: 'numpy',
    name: 'np.transpose',
    category: '张量操作',
    usage: 'np.transpose(a, axes)',
    description: '重排多维数组的维度轴顺序',
    examFrequency: '高频核心',
    exampleCode: "img_chw = np.transpose(img_hwc, (2, 0, 1))",
    tips: '将原始图像 HWC (高宽通道) 转为 PyTorch/ONNX 常用的 CHW (通道宽高)'
  },
  {
    library: 'numpy',
    name: 'np.argmax',
    category: '数学运算',
    usage: 'np.argmax(a, axis=None)',
    description: '返回数组中最大值的索引下标',
    examFrequency: '高频核心',
    exampleCode: "pred_class = np.argmax(probabilities)",
    tips: '图像多分类解析直接得到预测的类别ID'
  },
  {
    library: 'numpy',
    name: 'np.argsort',
    category: '数学运算',
    usage: 'np.argsort(a, axis=-1)',
    description: '返回数组元素升序排序的索引',
    examFrequency: '高频核心',
    exampleCode: "top5_idx = np.argsort(probs)[-5:][::-1]",
    tips: '提取Top 5最大概率：先切片后5位[-5:]，再逆序[::-1]'
  },

  // Scikit-Learn
  {
    library: 'sklearn',
    name: 'train_test_split',
    category: '数据集切分',
    usage: 'train_test_split(*arrays, test_size=0.2, random_state=42)',
    description: '拆分特征矩阵与目标标签',
    examFrequency: '高频核心',
    exampleCode: 'X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)',
    tips: '务必指定 random_state=42 保证结果可复现'
  },
  {
    library: 'sklearn',
    name: 'StandardScaler',
    category: '特征工程',
    usage: 'StandardScaler().fit_transform(X)',
    description: 'Z-score 零均值单位方差标准化',
    examFrequency: '高频核心',
    exampleCode: "scaler = StandardScaler()\ndata[cols] = scaler.fit_transform(data[cols])",
    tips: '返回 ndarray，赋值回 DataFrame 时需要列名切片一一对应'
  },
  {
    library: 'sklearn',
    name: 'MinMaxScaler',
    category: '特征工程',
    usage: 'MinMaxScaler().fit_transform(X)',
    description: '最小最大值归一化至[0, 1]',
    examFrequency: '高频核心',
    exampleCode: 'scaler = MinMaxScaler()\nX_scaled = scaler.fit_transform(X)',
    tips: '用于金融评分卡(2.1.3)，对有固定边界的指标适用'
  },
  {
    library: 'sklearn',
    name: 'LogisticRegression',
    category: '分类模型',
    usage: 'LogisticRegression(max_iter=1000)',
    description: '逻辑回归二分类算法',
    examFrequency: '高频核心',
    exampleCode: "clf = LogisticRegression(max_iter=1000)\nclf.fit(X_train, y_train)",
    tips: '默认 max_iter=100 可能报未收敛警告，考纲中固定填 max_iter=1000'
  },
  {
    library: 'sklearn',
    name: 'RandomForestRegressor',
    category: '回归模型',
    usage: 'RandomForestRegressor(n_estimators=100, random_state=42)',
    description: '随机森林集成回归模型',
    examFrequency: '高频核心',
    exampleCode: "rf = RandomForestRegressor(n_estimators=100, random_state=42)\nrf.fit(X_train, y_train)",
    tips: '三级考题中树的数量常设为 100'
  },
  {
    library: 'sklearn',
    name: 'Pipeline',
    category: '模型管线',
    usage: 'Pipeline([("step1", transformer), ("step2", estimator)])',
    description: '将预处理与估计器封装为单一对象',
    examFrequency: '中频常用',
    exampleCode: "pipe = Pipeline([('scaler', StandardScaler()), ('linreg', LinearRegression())])",
    tips: '见试题 2.2.2，注意入参是包含(名称, 实例)元组的列表'
  },
  {
    library: 'sklearn',
    name: 'classification_report',
    category: '模型评估',
    usage: 'classification_report(y_true, y_pred)',
    description: '打印精准率、召回率、F1与支持度综合报表',
    examFrequency: '高频核心',
    exampleCode: 'print(classification_report(y_test, y_pred))',
    tips: '分类任务中最详尽的评估函数'
  },
  {
    library: 'sklearn',
    name: 'mean_squared_error & r2_score',
    category: '模型评估',
    usage: 'mean_squared_error(y_true, y_pred)',
    description: '回归均方误差与决定系数',
    examFrequency: '高频核心',
    exampleCode: "mse = mean_squared_error(y_test, y_pred)\nr2 = r2_score(y_test, y_pred)",
    tips: 'MSE 越小越好；R2 在 0~1 之间，越靠近 1 越好'
  },

  // ONNX Runtime & CV
  {
    library: 'onnxruntime',
    name: 'ort.InferenceSession',
    category: '模型部署',
    usage: "ort.InferenceSession('model.onnx')",
    description: '创建 ONNX 跨平台推理会话',
    examFrequency: '高频核心',
    exampleCode: "session = ort.InferenceSession('model.onnx')\nouts = session.run([out_name], {in_name: tensor})",
    tips: '获取输入输出名：session.get_inputs()[0].name 与 session.get_outputs()[0].name'
  },
  {
    library: 'PIL',
    name: 'Image.open & convert',
    category: '图像预处理',
    usage: "Image.open(path).convert('RGB')",
    description: '载入图像并转换为RGB或灰度L',
    examFrequency: '高频核心',
    exampleCode: "img_rgb = Image.open('test.jpg').convert('RGB')\nimg_gray = Image.open('mnist.png').convert('L')",
    tips: '彩色模型转 "RGB"，手写数字与情绪单通道转 "L"'
  },
  {
    library: 'cv2',
    name: 'cv2.imread & cv2.cvtColor',
    category: '图像预处理',
    usage: 'cv2.cvtColor(img, cv2.COLOR_BGR2RGB)',
    description: 'OpenCV读入与色彩空间转换',
    examFrequency: '高频核心',
    exampleCode: "orig_img = cv2.imread('test.jpg')\nrgb_img = cv2.cvtColor(orig_img, cv2.COLOR_BGR2RGB)",
    tips: 'cv2.imread 默认为 BGR，送入常规深度学习模型前务必转为 RGB'
  },
  {
    library: 'cv2',
    name: 'cv2.rectangle & cv2.putText',
    category: '图像标注',
    usage: 'cv2.rectangle(img, pt1, pt2, color, thickness)',
    description: '在图像上画检测矩形框与文本',
    examFrequency: '高频核心',
    exampleCode: "cv2.rectangle(img, (x1, y1), (x2, y2), (255, 255, 0), 2)\ncv2.putText(img, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)",
    tips: '颜色参数为 BGR 顺序：(255, 255, 0) 代表青色；左上角与右下角坐标需为整数元组'
  },
  {
    library: 'scipy',
    name: 'scipy.special.softmax',
    category: '数学运算',
    usage: 'scipy.special.softmax(x, axis=-1)',
    description: '对网络logits应用Softmax激活转换为概率',
    examFrequency: '高频核心',
    exampleCode: "probs = scipy.special.softmax(output, axis=-1)",
    tips: '输出各项和为 1，数值范围 (0, 1)'
  }
];
