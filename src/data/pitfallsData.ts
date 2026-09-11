import { PitfallItem } from '../types';

export const pitfallsData: PitfallItem[] = [
  {
    id: 'pitfall-1',
    title: 'pd.cut 漏写 right=False 导致边界归属错误',
    category: 'Pandas 数据分箱',
    severity: '高危失分',
    problemCode: "data['BMIRange'] = pd.cut(data['BMI'], bmi_bins, labels=bmi_labels)",
    correctCode: "data['BMIRange'] = pd.cut(data['BMI'], bmi_bins, labels=bmi_labels, right=False)",
    reason: 'pd.cut 默认是 right=True（左开右闭 (a, b]）。而考卷题目要求“低于18.5、18.5~24.9”，即 18.5 属于第二区间，是典型的左闭右开 [a, b)。如果不加 right=False，边界点统计计数全错，该题4分全扣。',
    applicableQuestions: ['1.1.1', '1.1.4', '1.1.5']
  },
  {
    id: 'pitfall-2',
    title: 'ONNX 图像输入张量维度未转置（缺少 HWC 到 CHW）',
    category: 'CV 与 ONNX 推理',
    severity: '高危失分',
    problemCode: `# 错误：直接将 PIL 或 OpenCV 数组扩展 Batch 送入模型
image = np.array(image)
image = np.expand_dims(image, axis=0)
session.run(None, {input_name: image})`,
    correctCode: `# 正确：必须先做通道转置 (2, 0, 1)
image = np.transpose(image, (2, 0, 1))
image = np.expand_dims(image, axis=0).astype(np.float32)
session.run(None, {input_name: image})`,
    reason: 'PyTorch / ONNX 图像模型绝大多数期望输入格式为 (N, C, H, W)，而 PIL / OpenCV 读入的是 (H, W, C)。若不转置维度，ONNX Runtime 会直接抛出张量形状不匹配异常 (Shape mismatch error)。',
    applicableQuestions: ['3.2.1', '3.2.4', '3.2.5']
  },
  {
    id: 'pitfall-3',
    title: 'SMOTE 过采样用在整个数据集导致严重数据泄露',
    category: '机器学习建模',
    severity: '高危失分',
    problemCode: `# 错误：切分前对整体 X, y 做 SMOTE
X_res, y_res = smote.fit_resample(X, y)
X_train, X_test, y_train, y_test = train_test_split(X_res, y_res)`,
    correctCode: `# 正确：先切分出纯净的测试集，仅在训练集上采样
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
X_train_res, y_train_res = smote.fit_resample(X_train, y_train)`,
    reason: '如果在划分训练测试集前就合成样本，测试集就会包含训练集特征生成的合成点，引发严重的数据泄露(Data Leakage)，模型在测试集上虚高但在真实业务中失效。',
    applicableQuestions: ['2.2.1']
  },
  {
    id: 'pitfall-4',
    title: 'OpenCV 读取图像通道默认为 BGR 直接送入网络',
    category: '计算机视觉',
    severity: '易混淆',
    problemCode: `# 错误：直接送入模型
orig = cv2.imread(path)
resized = cv2.resize(orig, (320, 240))`,
    correctCode: `# 正确：必须转换色彩空间
orig = cv2.imread(path)
rgb_img = cv2.cvtColor(orig, cv2.COLOR_BGR2RGB)
resized = cv2.resize(rgb_img, (320, 240))`,
    reason: 'cv2.imread 历史原因为BGR，而几乎所有预训练模型(ResNet, MobileNet, RFB-320)都是基于RGB训练的。若不转色彩通道，红蓝色颠倒，特征提取彻底失效，推理准确率剧降。',
    applicableQuestions: ['3.2.5']
  },
  {
    id: 'pitfall-5',
    title: '缺失值众数填补漏写 [0] 导致无法填充',
    category: 'Pandas 数据清洗',
    severity: '易混淆',
    problemCode: "df['col'].fillna(df['col'].mode(), inplace=True)",
    correctCode: "df['col'].fillna(df['col'].mode()[0], inplace=True)",
    reason: 'Series.mode() 返回的是一个 Series（因为可能存在多众数），而不是标量。直接传入 fillna 会导致索引对齐失败，空值依旧是 NaN。必须写 .mode()[0] 取出第一个众数标量。',
    applicableQuestions: ['2.1.2', '2.1.4']
  },
  {
    id: 'pitfall-6',
    title: '文件导出漏写 index=False 导致评分系统解析失败',
    category: '工程规范',
    severity: '规范细节',
    problemCode: "cleaned_df.to_csv('cleaned_data.csv')",
    correctCode: "cleaned_df.to_csv('cleaned_data.csv', index=False)",
    reason: '三级机考评分系统通常使用脚本自动校验 CSV 的第一行 header 与列数量。如果漏了 index=False，会自动写入从0递增的索引序号列，导致列数增加1，被自动批改脚本判定为不合格。',
    applicableQuestions: ['1.1.2', '1.1.3', '1.1.4', '1.1.5', '2.1.1', '2.1.3']
  }
];
