import { ExamQuestion } from '../types';

export const examQuestions: ExamQuestion[] = [
  // ==================== 1.1.1 ~ 1.1.5 业务数据处理与审核 ====================
  {
    id: '1.1.1',
    category: '1.1',
    categoryName: '业务数据采集与处理',
    title: '智能医疗系统中的业务数据处理流程设计',
    scenario: '某医疗机构计划引入智能医疗系统，以提升诊断效率和准确性。通过分析患者历史数据，使用机器学习预测健康风险，从而辅助医生诊断。需要设计一套全面的业务数据处理流程。',
    dataset: {
      name: 'patient_data.csv',
      description: '患者临床与健康指标数据集',
      fields: [
        { name: 'PatientID', desc: '患者唯一识别码' },
        { name: 'Age', desc: '年龄' },
        { name: 'BMI', desc: '身体质量指数(kg/m²)' },
        { name: 'BloodPressure', desc: '血压指标' },
        { name: 'Cholesterol', desc: '胆固醇水平' },
        { name: 'DaysInHospital', desc: '实际住院天数' }
      ]
    },
    tasks: [
      { order: 1, description: '统计住院天数超过7天的患者数量及占比（定义为高风险患者，反之为低风险患者）', targetFile: '1.1.1-1.jpg' },
      { order: 2, description: '统计不同BMI区间（<18.5, 18.5~24.9, 25.0~29.9, >=30.0）中高风险患者比例与患者数', targetFile: '1.1.1-2.jpg' },
      { order: 3, description: '统计不同年龄区间（<=25, 26-35, 36-45, 46-55, 56-65, >65）中高风险患者比例与患者数', targetFile: '1.1.1-3.jpg' }
    ],
    skillRequirements: ['结合人工智能技术要求和业务特征，设计整套业务数据处理流程'],
    qualityMetrics: ['设计出的业务数据底层逻辑清晰，有效合理'],
    coreLibraries: ['pandas', 'numpy'],
    difficulty: '基础',
    codeTemplate: `import pandas as pd
import numpy as np

# 1. 读取数据集 1分
data = _____________

# 2. 统计住院天数超过7天的患者数量及其占比
# 创建新列'RiskLevel'，根据住院天数判断风险等级 3分
_____________ = _____________(_____________, '高风险患者', '低风险患者')
# 统计不同风险等级的患者数量 2分
risk_counts = data_____________._____________
# 计算高风险患者占比 1分
high_risk_ratio = risk_counts['高风险患者'] / _____________
# 计算低风险患者占比 1分
low_risk_ratio = risk_counts['低风险患者'] / _____________

# 3. 统计不同BMI区间中高风险患者比例与数量
bmi_bins = [0, 18.5, 24, 28, np.inf]
bmi_labels = ['偏瘦', '正常', '超重', '肥胖']
# 根据BMI值划分指定区间 4分
data['BMIRange'] = _____________(_____________, _____________, _____________, right=False)
# 计算每个BMI区间中高风险患者的比例 2分
bmi_risk_rate = _____________(_____________)['RiskLevel'].apply(lambda x: (x == '高风险患者').mean())
# 统计每个BMI区间的患者数量 1分
bmi_patient_count = data_____________`,
    codeSolution: `import pandas as pd
import numpy as np

# 1. 读取数据集
data = pd.read_csv('patient_data.csv')

# 2. 统计住院天数超过7天的患者数量及其占比
data['RiskLevel'] = np.where(data['DaysInHospital'] > 7, '高风险患者', '低风险患者')
risk_counts = data['RiskLevel'].value_counts()
high_risk_ratio = risk_counts['高风险患者'] / len(data)
low_risk_ratio = risk_counts['低风险患者'] / len(data)

# 3. 统计不同BMI区间中高风险患者比例与数量
bmi_bins = [0, 18.5, 24, 28, np.inf]
bmi_labels = ['偏瘦', '正常', '超重', '肥胖']
data['BMIRange'] = pd.cut(data['BMI'], bins=bmi_bins, labels=bmi_labels, right=False)
bmi_risk_rate = data.groupby('BMIRange')['RiskLevel'].apply(lambda x: (x == '高风险患者').mean())
bmi_patient_count = data['BMIRange'].value_counts()

# 4. 年龄分段统计
age_bins = [0, 26, 36, 46, 56, 66, np.inf]
age_labels = ['≤25岁', '26-35岁', '36-45岁', '46-55岁', '56-65岁', '＞65岁']
data['AgeRange'] = pd.cut(data['Age'], bins=age_bins, labels=age_labels, right=False)
age_risk_rate = data.groupby('AgeRange')['RiskLevel'].apply(lambda x: (x == '高风险患者').mean())
age_patient_count = data['AgeRange'].value_counts()`,
    blanksExplanation: [
      { blankIndex: 1, code: "pd.read_csv('patient_data.csv')", points: 1, explanation: '读取本地CSV文件到DataFrame' },
      { blankIndex: 2, code: "data['RiskLevel'] = np.where(data['DaysInHospital'] > 7, '高风险患者', '低风险患者')", points: 3, explanation: '利用np.where实现二值向量化条件衍生列', pitfall: '注意语法为 np.where(condition, x, y)，不要漏掉中括号中的列名' },
      { blankIndex: 3, code: "['RiskLevel'].value_counts()", points: 2, explanation: 'value_counts()统计离散类别的出现频次' },
      { blankIndex: 4, code: 'len(data)', points: 2, explanation: '样本总行数，用于计算高低风险比例' },
      { blankIndex: 5, code: "pd.cut(data['BMI'], bins=bmi_bins, labels=bmi_labels, right=False)", points: 4, explanation: '利用pd.cut进行连续变量分箱离散化，right=False表示左闭右开[a, b)' },
      { blankIndex: 6, code: "data.groupby('BMIRange')", points: 2, explanation: '按照分箱列进行分组' }
    ],
    keyTakeaways: [
      '熟练运用 np.where 快速生成二分类业务标签',
      '掌握 pd.cut 的四个核心参数：待切分Series、bins区间列表、labels标签名称、right=False开闭状态',
      '运用 groupby().apply(lambda x: (x == target).mean()) 快速计算组内目标正例发生率'
    ]
  },
  {
    id: '1.1.2',
    category: '1.1',
    categoryName: '业务数据采集与处理',
    title: '智能农业系统中的业务数据采集和处理流程设计',
    scenario: '构建智慧农场物联网数据流，监控土壤温湿度、光照、氮磷钾传感器指标。需进行传感器类别聚合、多位置对比、业务异常值识别清洗及缺失值填补。',
    dataset: {
      name: 'sensor_data.csv',
      description: '农场物联网传感器上报流数据',
      fields: [
        { name: 'Timestamp', desc: '采样上报时间' },
        { name: 'Location', desc: '农田监测地块' },
        { name: 'SensorType', desc: '传感器类型(Temperature/Humidity等)' },
        { name: 'Value', desc: '采样数值' }
      ]
    },
    tasks: [
      { order: 1, description: '对传感器类型分组，计算每组采样总数与均值', targetFile: '1.1.2-1.jpg' },
      { order: 2, description: '筛选温度和湿度数据，按位置和传感器类型分组并做透视转换展示', targetFile: '1.1.2-2.jpg' },
      { order: 3, description: '标记业务异常值（温度<-10或>50，湿度<0或>100），用ffill和bfill填补缺失并导出清洗数据集', targetFile: '1.1.2-3.jpg' }
    ],
    skillRequirements: ['能针对物联网多维流数据完成清洗预处理与透视重构'],
    qualityMetrics: ['分组汇总指标准确，异常边界判定精准，前后向填补合理'],
    coreLibraries: ['pandas', 'numpy', 'matplotlib'],
    difficulty: '中等',
    codeTemplate: `import pandas as pd
import numpy as np

# 1. 读取数据集 2分
data = _____________

# 2. 传感器数据统计
# 对传感器类型分组，计算数据量和均值 3分
sensor_stats = _____________(_____________)['Value']._____________

# 3. 按位置统计温度和湿度数据
# 筛选出温度和湿度数据，按位置和传感器类型分组计算平均值 2分
location_stats = data[data['SensorType']._____________._____________['Value'].mean().unstack()

# 4. 数据清洗和异常值处理
data['is_abnormal'] = _____________(
    ((_____________) & ((data['Value'] < -10) | (data['Value'] > 50))) |
    ((_____________) & ((data['Value'] < 0) | (data['Value'] > 100))),
    True, False
)
# 缺失值填补与清洗保存 4分
data['Value']._____________(_____________, inplace=True)
data['Value']._____________(_____________, inplace=True)
cleaned_data = _____________(_____________=['is_abnormal'])
_____________('cleaned_sensor_data.csv', _____________)`,
    codeSolution: `import pandas as pd
import numpy as np

data = pd.read_csv('sensor_data.csv')

# 传感器统计
sensor_stats = data.groupby('SensorType')['Value'].agg(['count', 'mean'])

# 位置与传感器透视统计
location_stats = data[data['SensorType'].isin(['Temperature', 'Humidity'])].groupby(['Location', 'SensorType'])['Value'].mean().unstack()

# 标记异常值
data['is_abnormal'] = np.where(
    ((data['SensorType'] == 'Temperature') & ((data['Value'] < -10) | (data['Value'] > 50))) |
    ((data['SensorType'] == 'Humidity') & ((data['Value'] < 0) | (data['Value'] > 100))),
    True, False
)

# 填补缺失值（将异常值设为空后用前向/后向填补）
data.loc[data['is_abnormal'], 'Value'] = np.nan
data['Value'].fillna(method='ffill', inplace=True)
data['Value'].fillna(method='bfill', inplace=True)

cleaned_data = data.drop(columns=['is_abnormal'])
cleaned_data.to_csv('cleaned_sensor_data.csv', index=False)`,
    blanksExplanation: [
      { blankIndex: 1, code: "pd.read_csv('sensor_data.csv')", points: 2, explanation: '基础数据读取' },
      { blankIndex: 2, code: "data.groupby('SensorType')['Value'].agg(['count', 'mean'])", points: 3, explanation: '使用agg聚合函数同时求解样本数与均值' },
      { blankIndex: 3, code: ".isin(['Temperature', 'Humidity'])].groupby(['Location', 'SensorType'])", points: 2, explanation: 'isin过滤目标子集并进行多重索引分组' },
      { blankIndex: 4, code: "data['SensorType'] == 'Temperature'", points: 3, explanation: '针对温度传感器的类型匹配逻辑' },
      { blankIndex: 5, code: "fillna(method='ffill') / fillna(method='bfill')", points: 4, explanation: '前向(ffill)和后向(bfill)缺失值填充算法' },
      { blankIndex: 6, code: "drop(columns=['is_abnormal']) & to_csv(..., index=False)", points: 4, explanation: '剔除辅助列并导出为无索引CSV' }
    ],
    keyTakeaways: [
      '透视聚合：.groupby([A, B]).mean().unstack() 可将层级索引展开为宽表透视格式',
      '异常值复合规则编写：使用 & 和 | 运算符时各条件必须用括号 () 明确优先级',
      '时序或连续传感器数据使用 ffill 与 bfill 结合是工业界常见兜底策略'
    ]
  },
  {
    id: '1.1.3',
    category: '1.1',
    categoryName: '业务数据采集与处理',
    title: '金融机构信用评估系统中的业务数据审核流程设计',
    scenario: '某商业银行对贷款申请人信用数据进行入库审核。数据质量直接关系到风控违约率预测。需对缺失、重复以及不符合业务常识（如年龄、收入、贷款倍数等）的数据进行全面稽核。',
    dataset: {
      name: 'credit_data.csv',
      description: '个人信贷评估与申请档案数据集',
      fields: [
        { name: 'CustomerID', desc: '客户唯一编号' },
        { name: 'Age', desc: '申请人年龄(合规范围18-70)' },
        { name: 'Income', desc: '年收入(必须>0)' },
        { name: 'LoanAmount', desc: '申请贷款额度(不超收入5倍)' },
        { name: 'CreditScore', desc: '征信评分(合规范围300-850)' }
      ]
    },
    tasks: [
      { order: 1, description: '完成数据完整性审核（缺失值统计与重复值统计）', targetFile: '1.1.3-1.jpg' },
      { order: 2, description: '编写数据合理性审核规则（年龄、收入、额度倍数、信用分），生成综合审核列', targetFile: '1.1.3-2.jpg' },
      { order: 3, description: '剔除不合规记录与辅助校验列，保存清洗后的合规信用数据集', targetFile: '1.1.3-3.jpg' }
    ],
    skillRequirements: ['能根据金融风控业务指标规则建立完整的数据稽核体系'],
    qualityMetrics: ['缺失与重复统计无误，多维度逻辑校验完备，清洗过滤无遗漏'],
    coreLibraries: ['pandas', 'numpy', 'matplotlib'],
    difficulty: '基础',
    codeTemplate: `import pandas as pd
import numpy as np

data = pd.read_csv('credit_data.csv')

# 1. 数据完整性审核 4分
missing_values = data._________       # 缺失值统计
duplicate_values = data._________     # 重复值统计

# 2. 数据合理性审核 8分
data['is_age_valid'] = _________._________(18, 70)              # Age合理性
data['is_income_valid'] = _________ > _________                 # Income合理性
data['is_loan_amount_valid'] = _________ < (_________ * 5)      # LoanAmount合理性
data['is_credit_score_valid'] = _________._________(300, 850)   # CreditScore合理性

# 综合合理性检查
data['is_valid'] = data[['is_age_valid', 'is_income_valid', 'is_loan_amount_valid', 'is_credit_score_valid']].all(axis=1)

# 3. 数据清洗与保存 2分
cleaned_data = data[data['is_valid']].drop(columns=['is_age_valid', 'is_income_valid', 'is_loan_amount_valid', 'is_credit_score_valid', 'is_valid'])
_________._________(_________, index=False)`,
    codeSolution: `import pandas as pd
import numpy as np

data = pd.read_csv('credit_data.csv')

# 完整性审核
missing_values = data.isnull().sum()
duplicate_values = data.duplicated().sum()

# 合理性审核
data['is_age_valid'] = data['Age'].between(18, 70)
data['is_income_valid'] = data['Income'] > 0
data['is_loan_amount_valid'] = data['LoanAmount'] < (data['Income'] * 5)
data['is_credit_score_valid'] = data['CreditScore'].between(300, 850)

validity_checks = data[['is_age_valid', 'is_income_valid', 'is_loan_amount_valid', 'is_credit_score_valid']].all(axis=1)
data['is_valid'] = validity_checks

# 清洗与导出
invalid_rows = data[~data['is_valid']]
cleaned_data = data[data['is_valid']].drop(columns=['is_age_valid', 'is_income_valid', 'is_loan_amount_valid', 'is_credit_score_valid', 'is_valid'])
cleaned_data.to_csv('cleaned_credit_data.csv', index=False)`,
    blanksExplanation: [
      { blankIndex: 1, code: 'isnull().sum() / duplicated().sum()', points: 4, explanation: 'isnull().sum()统计各列缺失，duplicated().sum()统计全行重复' },
      { blankIndex: 2, code: "data['Age'].between(18, 70)", points: 2, explanation: 'Series.between(a, b)默认两端闭区间包含' },
      { blankIndex: 3, code: "data['Income'] > 0", points: 2, explanation: '常规数值正数性校验' },
      { blankIndex: 4, code: "data['LoanAmount'] < (data['Income'] * 5)", points: 2, explanation: '行级别交叉特征业务规则约束' },
      { blankIndex: 5, code: "data['CreditScore'].between(300, 850)", points: 2, explanation: '征信标准积分范围校验' },
      { blankIndex: 6, code: "cleaned_data.to_csv('cleaned_credit_data.csv')", points: 2, explanation: '导出清洗好的有效样本' }
    ],
    keyTakeaways: [
      'Series.between(left, right) 替代 (df >= left) & (df <= right)，语义更简洁',
      'DataFrame.all(axis=1) 快速对多列布尔值做按行与运算（全部满足为True）',
      '取反运算符 ~ 在布尔索引中的灵活使用（筛选异常记录：~df["is_valid"]）'
    ]
  },
  {
    id: '1.1.4',
    category: '1.1',
    categoryName: '业务数据采集与处理',
    title: '电商平台用户行为分析系统的数据采集与处理流程设计',
    scenario: '电商平台推荐算法需对用户历史消费与评价记录做前置特征归一化处理。涵盖空值处理、严格数据类型转换、Z-score标准化处理与受众年龄段消费频次统计。',
    dataset: {
      name: 'user_behavior_data.csv',
      description: '电商用户画像与交易行为记录',
      fields: [
        { name: 'UserID', desc: '用户账号ID' },
        { name: 'Age', desc: '年龄(需转整型并过滤18-70)' },
        { name: 'Gender', desc: '性别分类' },
        { name: 'PurchaseAmount', desc: '单笔购买金额(必须>0并做Z-score标定)' },
        { name: 'ReviewScore', desc: '评分星级(1-5整数)' },
        { name: 'PurchaseCategory', desc: '购买品类类别' }
      ]
    },
    tasks: [
      { order: 1, description: '读取并打印前5行数据集（检查字段与格式）', targetFile: '1.1.4-1.jpg' },
      { order: 2, description: '删除缺失值，转换数据类型，异常值过滤，对数值特征进行Z-score标准化并导出', targetFile: '1.1.4-2.jpg' },
      { order: 3, description: '统计每个购买类别的用户数、不同性别的平均购买金额及不同年龄段的用户数', targetFile: '1.1.4-3.jpg' }
    ],
    skillRequirements: ['能熟练完成电商用户行为特征工程清洗与Z-score数据标准化'],
    qualityMetrics: ['特征转换与过滤严格，数学标准化公式应用无误，分组聚合精准'],
    coreLibraries: ['pandas', 'numpy', 'matplotlib'],
    difficulty: '基础',
    codeTemplate: `import pandas
import numpy as np

# 1. 数据采集 4分
data = _______________________________
print(________________________________)

# 2. 数据清洗与预处理
# 处理缺失值（删除） 2分
data = ________________________________
# 数据类型转换 6分
data['Age'] = ________________(int)
data['PurchaseAmount'] = ________________(float)
data['ReviewScore'] = ________________(int)
# 过滤异常值 2分
data = data[(________________.between(18, 70)) & (data['PurchaseAmount'] > 0) & (________________.between(1, 5))]
# 数据标准化（Z-Score） 4分
data['PurchaseAmount'] = (data['PurchaseAmount'] - ________________) / ________________
data['ReviewScore'] = (data['ReviewScore'] - ________________) / ________________
________________('cleaned_user_behavior_data.csv', index=False)

# 3. 数据统计 6分
purchase_category_counts = ________________.________________
gender_purchase_amount_mean = ________________(________________)['PurchaseAmount'].mean()
data['AgeGroup'] = pandas.________________(________________, right=False)`,
    codeSolution: `import pandas as pd
import numpy as np

# 1. 数据采集
data = pd.read_csv('user_behavior_data.csv')
print(data.head())

# 2. 数据清洗与预处理
data = data.dropna()
data['Age'] = data['Age'].astype(int)
data['PurchaseAmount'] = data['PurchaseAmount'].astype(float)
data['ReviewScore'] = data['ReviewScore'].astype(int)

data = data[(data['Age'].between(18, 70)) & 
            (data['PurchaseAmount'] > 0) & 
            (data['ReviewScore'].between(1, 5))]

# Z-score 标准化: (x - μ) / σ
data['PurchaseAmount'] = (data['PurchaseAmount'] - data['PurchaseAmount'].mean()) / data['PurchaseAmount'].std()
data['ReviewScore'] = (data['ReviewScore'] - data['ReviewScore'].mean()) / data['ReviewScore'].std()

data.to_csv('cleaned_user_behavior_data.csv', index=False)

# 3. 数据统计
purchase_category_counts = data['PurchaseCategory'].value_counts()
gender_purchase_amount_mean = data.groupby('Gender')['PurchaseAmount'].mean()

bins = [18, 26, 36, 46, 56, 66, np.inf]
labels = ['18-25', '26-35', '36-45', '46-55', '56-65', '65+']
data['AgeGroup'] = pd.cut(data['Age'], bins=bins, labels=labels, right=False)
age_group_counts = data['AgeGroup'].value_counts().sort_index()`,
    blanksExplanation: [
      { blankIndex: 1, code: 'data.dropna()', points: 2, explanation: '一键剔除含有NaN缺失值的样本行' },
      { blankIndex: 2, code: "data['Col'].astype(dtype)", points: 6, explanation: '使用astype转换Series的数据类型为int或float' },
      { blankIndex: 3, code: "(data['Col'] - data['Col'].mean()) / data['Col'].std()", points: 4, explanation: '手动实现标准正态化(Z-Score)公式' },
      { blankIndex: 4, code: "data['PurchaseCategory'].value_counts()", points: 2, explanation: '类别频数统计' },
      { blankIndex: 5, code: "pd.cut(data['Age'], bins=bins, labels=labels, right=False)", points: 2, explanation: '左闭右开分箱操作' }
    ],
    keyTakeaways: [
      'astype转换前需确保无无法解析的字符串或空值，因此通常先进行 dropna()',
      'Z-score 标准化公式：z = (x - mean) / std，使特征满足均值为0、方差为1',
      'value_counts().sort_index() 能够按分箱区间顺序排列统计结果'
    ]
  },
  {
    id: '1.1.5',
    category: '1.1',
    categoryName: '业务数据采集与处理',
    title: '智能交通系统的数据采集、处理和审核流程设计',
    scenario: '智慧城市车联网监控系统实时采集车辆速度、行驶距离与行程时长。由于传感器信号飘移存在不合理极端值，需实施系统性的数据清洗、业务合理性审核与跨维度多指标统计。',
    dataset: {
      name: 'vehicle_traffic_data.csv',
      description: '智能网联车辆轨迹与事件流水数据',
      fields: [
        { name: 'VehicleID', desc: '车辆标识编码' },
        { name: 'DriverAge', desc: '驾驶员年龄(18-70)' },
        { name: 'DriverGender', desc: '驾驶员性别' },
        { name: 'Speed', desc: '车速km/h(合理范围0-200)' },
        { name: 'TravelDistance', desc: '行程里程km(合理范围1-1000)' },
        { name: 'TravelTime', desc: '行程分钟min(合理范围1-1440)' },
        { name: 'TrafficEvent', desc: '交通事件类型(Congestion/Accident等)' }
      ]
    },
    tasks: [
      { order: 1, description: '加载并校验数据集前5行记录', targetFile: '1.1.5-1.jpg' },
      { order: 2, description: '缺失值删除、字段类型转置、边界过滤并将清洗数据存储', targetFile: '1.1.5-2.jpg' },
      { order: 3, description: '输出不符合业务逻辑的不合理数据子集', targetFile: '1.1.5-3.jpg' },
      { order: 4, description: '统计各类交通事件发生次数、不同性别车速时长均值及年龄段分布', targetFile: '1.1.5-4.jpg' }
    ],
    skillRequirements: ['能熟练设计高并发车联网轨迹数据的流式过滤与审核处理'],
    qualityMetrics: ['四重业务边界约束严谨无差错，多指标分组汇总计算无误'],
    coreLibraries: ['pandas', 'numpy', 'matplotlib'],
    difficulty: '中等',
    codeTemplate: `import pandas as pd
import numpy as np

# 1. 采集读取与展示 4分
data = _____________
print(_____________)

# 2. 数据清洗与多字段类型转换 6分
data = _____________
data['DriverAge'] = data['DriverAge']._____________(int)
data['Speed'] = data['Speed']._____________(float)
data['TravelDistance'] = data['TravelDistance']._____________(float)
data['TravelTime'] = data['TravelTime']._____________(float)

# 边界过滤 3分
data = data[(data['DriverAge']._____________(18, 70)) & 
            (data['Speed']._____________(0, 200)) & 
            (data['TravelDistance']._____________(1, 1000)) & 
            (data['TravelTime']._____________(1, 1440))]
_____________('cleaned_vehicle_traffic_data.csv', index=False)

# 3. 统计交通事件与多维度特征 9分
traffic_event_counts = _____________
gender_stats = data._____________._____________
data['AgeGroup'] = _____________(data['DriverAge'], age_bins, labels=age_labels, right=False)`,
    codeSolution: `import pandas as pd
import numpy as np

# 1. 数据采集
data = pd.read_csv('vehicle_traffic_data.csv')
print(data.head())

# 2. 数据清洗与预处理
data = data.dropna()
data['DriverAge'] = data['DriverAge'].astype(int)
data['Speed'] = data['Speed'].astype(float)
data['TravelDistance'] = data['TravelDistance'].astype(float)
data['TravelTime'] = data['TravelTime'].astype(float)

# 异常值过滤
data = data[(data['DriverAge'].between(18, 70)) & 
            (data['Speed'].between(0, 200)) & 
            (data['TravelDistance'].between(1, 1000)) & 
            (data['TravelTime'].between(1, 1440))]

data.to_csv('cleaned_vehicle_traffic_data.csv', index=False)

# 3. 审核不合理数据
# 统计每种交通事件的发生次数
traffic_event_counts = data['TrafficEvent'].value_counts()

# 统计不同性别的平均车速、行驶距离和行驶时间
gender_stats = data.groupby('DriverGender')[['Speed', 'TravelDistance', 'TravelTime']].mean()

# 统计不同年龄段驾驶员数
age_bins = [18, 26, 36, 46, 56, 66, np.inf]
age_labels = ['18-25', '26-35', '36-45', '46-55', '56-65', '65+']
data['AgeGroup'] = pd.cut(data['DriverAge'], bins=age_bins, labels=age_labels, right=False)
age_group_counts = data['AgeGroup'].value_counts().sort_index()`,
    blanksExplanation: [
      { blankIndex: 1, code: "data['Col'].astype(float)", points: 4, explanation: '连续型指标转为浮点型' },
      { blankIndex: 2, code: "Series.between(min, max)", points: 4, explanation: '利用between实现多维度联合区间截断' },
      { blankIndex: 3, code: "data.groupby('DriverGender')[['Speed', 'TravelDistance', 'TravelTime']].mean()", points: 2, explanation: '多列双中括号切片后进行均值聚合' },
      { blankIndex: 4, code: 'pd.cut(..., right=False)', points: 5, explanation: '考纲固定区间分箱规范' }
    ],
    keyTakeaways: [
      '对多列同时求均值时，groupby之后需使用双重方括号 [["col1", "col2"]]',
      '对于交通等高安全等级业务，审核剔除的脏数据需单独留存审计分析'
    ]
  },

  // ==================== 2.1.1 ~ 2.1.5 数据清洗与特征工程 ====================
  {
    id: '2.1.1',
    category: '2.1',
    categoryName: '数据清洗与标注流程设计',
    title: '智慧交通中燃油效率模型的数据清洗和标注流程设计',
    scenario: '构建汽车燃油消耗预测模型(Auto-MPG)。数据集中horsepower存在问号等非数值脏字符，需进行强制转换并剔除，随后对多个数值特征进行StandardScaler标准化处理，并拆分特征矩阵X与目标变量y。',
    dataset: {
      name: 'auto-mpg.csv',
      description: '经典车辆燃油消耗与动力学参数数据集',
      fields: [
        { name: 'mpg', desc: '每加仑英里数(目标变量y)' },
        { name: 'cylinders', desc: '气缸数量' },
        { name: 'displacement', desc: '排量' },
        { name: 'horsepower', desc: '马力(含有"?"等异常文本字符)' },
        { name: 'weight', desc: '整备质量' },
        { name: 'acceleration', desc: '加速度' },
        { name: 'model year', desc: '出厂年份' },
        { name: 'origin', desc: '产地分类' }
      ]
    },
    tasks: [
      { order: 1, description: '读取数据并检查缺失值，使用to_numeric(..., errors="coerce")处理马力异常值', targetFile: '2.1.1-1.jpg' },
      { order: 2, description: '使用sklearn的StandardScaler对排量、马力、重量、加速度进行Z-Score标准化', targetFile: '2.1.1-2.jpg' },
      { order: 3, description: '定义特征X与标签y，按8:2比例拆分训练集与测试集，保存清洗后数据集', targetFile: '2.1.1-3.jpg' }
    ],
    skillRequirements: ['掌握数值型脏数据强转、缺失值过滤、特征缩放与特征/标签分离规范'],
    qualityMetrics: ['非数值字符清洗彻底，StandardScaler变换正确，数据集切分无数据泄露'],
    coreLibraries: ['pandas', 'sklearn.preprocessing', 'sklearn.model_selection'],
    difficulty: '中等',
    codeTemplate: `import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

data = pd.read_csv('./auto-mpg.csv')

# 1. 检查缺失值并删除缺失值所在行 2分
print(data.isnull().sum())
data = _____________

# 2. 将 'horsepower' 转换为数值类型，并处理异常值 1分
data['horsepower'] = pd._____________(data['horsepower'], errors='_____________')
data = data.dropna(subset=['horsepower'])

# 3. 对数值型数据进行标准化处理 1分
numerical_features = ['displacement', 'horsepower', 'weight', 'acceleration']
scaler = _____________()
data[numerical_features] = scaler._____________(data[numerical_features])

# 4. 选择特征、自变量和目标变量 2分
selected_features = ['cylinders', 'displacement', 'horsepower', 'weight', 'acceleration', 'model year', 'origin']
X = data[_____________]
y = data['_____________']

# 划分训练集和测试集 2分
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
data.to_csv('2.1.1_cleaned_data.csv', index=False)`,
    codeSolution: `import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

data = pd.read_csv('./auto-mpg.csv')

# 检查缺失值并删除
data = data.dropna()

# 转换马力为数值类型（异常值置为NaN并dropna）
data['horsepower'] = pd.to_numeric(data['horsepower'], errors='coerce')
data = data.dropna(subset=['horsepower'])

# 标准化处理
numerical_features = ['displacement', 'horsepower', 'weight', 'acceleration']
scaler = StandardScaler()
data[numerical_features] = scaler.fit_transform(data[numerical_features])

# 特征与标签划分
selected_features = ['cylinders', 'displacement', 'horsepower', 'weight', 'acceleration', 'model year', 'origin']
X = data[selected_features]
y = data['mpg']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
data.to_csv('2.1.1_cleaned_data.csv', index=False)`,
    blanksExplanation: [
      { blankIndex: 1, code: "pd.to_numeric(data['horsepower'], errors='coerce')", points: 1, explanation: "errors='coerce'将无法解析的字符强制转换为NaN，配合dropna优雅剔除" },
      { blankIndex: 2, code: 'scaler = StandardScaler(); scaler.fit_transform(...)', points: 1, explanation: 'StandardScaler拟合并转换连续型特征列' },
      { blankIndex: 3, code: "X = data[selected_features]; y = data['mpg']", points: 2, explanation: '自变量与因变量切分' },
      { blankIndex: 4, code: 'train_test_split(X, y, test_size=0.2, random_state=42)', points: 2, explanation: '80%训练集与20%测试集切分' }
    ],
    keyTakeaways: [
      '处理混有特殊字符(如?, NA, -)的数值列，pd.to_numeric(errors="coerce") 是必考核心API',
      'StandardScaler 返回的是 ndarray，赋值回 DataFrame 时必须列数对齐：data[cols] = scaler.fit_transform(data[cols])'
    ]
  },
  {
    id: '2.1.2',
    category: '2.1',
    categoryName: '数据清洗与标注流程设计',
    title: '低碳生活行为影响因素数据清洗和标注流程设计',
    scenario: '大学生绿色生活方式调研数据为Excel格式，包含问卷答卷耗时、年级生源地及多项5分制态度打分题。需进行Excel导入、重复项去重、缺失项众数填补、基于多维综合打分规则构造分类业务标签。',
    dataset: {
      name: '大学生低碳生活行为的影响因素数据集.xlsx',
      description: '多维度大学生问卷调研Excel数据集',
      fields: [
        { name: '序号', desc: '问卷编号' },
        { name: '所用时间', desc: '答题时长' },
        { name: '性别/年级/生源地', desc: '人口统计学信息' },
        { name: '态度/认知量表题', desc: '1-5分李克特量表' },
        { name: '低碳行为积极性', desc: '待衍生构造的目标业务标签' }
      ]
    },
    tasks: [
      { order: 1, description: '使用read_excel加载数据，识别并删除全行重复记录', targetFile: '2.1.2-1.jpg' },
      { order: 2, description: '对分类变量和打分变量中的缺失值使用众数(mode)进行填补', targetFile: '2.1.2-2.jpg' },
      { order: 3, description: '基于多项行为准则得分总和划分积极与消极样本，完成数据标注并保存', targetFile: '2.1.2-3.jpg' }
    ],
    skillRequirements: ['能熟练处理Excel复杂问卷数据、众数填补及复合规则标注构建'],
    qualityMetrics: ['Excel加载正确，众数提取[0]索引明确，打分求和阈值判断严密'],
    coreLibraries: ['pandas', 'numpy', 'openpyxl'],
    difficulty: '中等',
    codeTemplate: `import pandas as pd

# 1. 读取Excel文件 2分
data = pd.____________('./大学生低碳生活行为的影响因素数据集.xlsx')

# 2. 检查并删除重复行 2分
data = data._____________()

# 3. 众数填补缺失值 4分
for column in data.columns:
    if data[column].isnull().sum() > 0:
        mode_val = data[column]._____________()[0]
        data[column]._____________(mode_val, inplace=True)

# 4. 根据行为题得分总和进行业务标注 4分
score_cols = ['14.我打算以后…—减少使用一次性产品', '合理处理生活中的废弃物', '在日常生活中会进行垃圾分类']
data['total_score'] = data[score_cols].sum(axis=1)
data['低碳行为积极性'] = (data['total_score'] >= 12).astype(int)
data.to_csv('2.1.2_cleaned_data.csv', index=False)`,
    codeSolution: `import pandas as pd

# 读取Excel
data = pd.read_excel('./大学生低碳生活行为的影响因素数据集.xlsx')

# 删除重复行
data = data.drop_duplicates()

# 使用各列众数填补缺失值
for column in data.columns:
    if data[column].isnull().sum() > 0:
        mode_val = data[column].mode()[0]
        data[column].fillna(mode_val, inplace=True)

# 业务标注
score_cols = ['14.我打算以后…—减少使用一次性产品', '合理处理生活中的废弃物', '在日常生活中会进行垃圾分类']
data['total_score'] = data[score_cols].sum(axis=1)
data['低碳行为积极性'] = (data['total_score'] >= 12).astype(int)
data.to_csv('2.1.2_cleaned_data.csv', index=False)`,
    blanksExplanation: [
      { blankIndex: 1, code: "pd.read_excel('...')", points: 2, explanation: '读取Excel工作簿文件' },
      { blankIndex: 2, code: 'data.drop_duplicates()', points: 2, explanation: '剔除样本完全一致的重复行' },
      { blankIndex: 3, code: 'data[col].mode()[0]', points: 2, explanation: 'Series.mode()返回Series，必须取[0]号元素作为标量填充值' },
      { blankIndex: 4, code: 'fillna(mode_val, inplace=True)', points: 2, explanation: '就地填充缺失值' }
    ],
    keyTakeaways: [
      '对于离散问卷评分数据，众数(mode)是比均值更符合业务语义的填补统计量',
      '注意 mode() 函数的返回值是序列，取第一个众数需写 mode()[0]'
    ]
  },
  {
    id: '2.1.3',
    category: '2.1',
    categoryName: '数据清洗与标注流程设计',
    title: '信用评分模型数据清洗和标注流程设计',
    scenario: '金融信贷场景(Give Me Some Credit数据集)，特征维度包含逾期次数、负债率、月收入等。存在极端离群值，需使用IQR四分位距法剔除异常值，并通过MinMaxScaler进行离散归一化，切分训练测试集。',
    dataset: {
      name: 'finance数据集.csv',
      description: '商业信贷客户违约风控数据集',
      fields: [
        { name: 'SeriousDlqin2yrs', desc: '未来两年是否严重逾期(目标标签y)' },
        { name: 'RevolvingUtilizationOfUnsecuredLines', desc: '信用卡透支额度利用率' },
        { name: 'age', desc: '年龄' },
        { name: 'DebtRatio', desc: '负债比率' },
        { name: 'MonthlyIncome', desc: '月收入' },
        { name: 'NumberOfOpenCreditLinesAndLoans', desc: '信贷借款笔数' }
      ]
    },
    tasks: [
      { order: 1, description: '使用箱线图分析识别数值特征列，计算Q1、Q3与IQR四分位距', targetFile: '2.1.3-1.jpg' },
      { order: 2, description: '根据IQR规则过滤异常离群样本，并处理重复记录', targetFile: '2.1.3-2.jpg' },
      { order: 3, description: '使用MinMaxScaler对特征做[0, 1]归一化，按8:2拆分数据集并持久化保存', targetFile: '2.1.3-3.jpg' }
    ],
    skillRequirements: ['熟练掌握IQR统计学离群点识别算法与MinMaxScaler归一化技术'],
    qualityMetrics: ['IQR计算无误，布尔掩码与取反~逻辑清晰，归一化映射[0,1]区间精确'],
    coreLibraries: ['pandas', 'numpy', 'sklearn.preprocessing', 'sklearn.model_selection'],
    difficulty: '进阶',
    codeTemplate: `import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split

data = pd.read_csv('./finance数据集.csv')
numeric_cols = data.select_dtypes(include=['float64', 'int64']).columns

# 1. 计算四分位距 IQR 3分
Q1 = data[numeric_cols]._____________(0.25)
Q3 = data[numeric_cols]._____________(0.75)
IQR = Q3 - Q1

# 2. 过滤掉异常离群值 3分
data_cleaned = data[~((data[numeric_cols] < (Q1 - 1.5 * IQR)) | (data[numeric_cols] > (Q3 + 1.5 * IQR))).any(axis=1)]

# 3. 去重 1分
data_cleaned = data_cleaned._____________()

# 4. MinMaxScaler 归一化 2分
scaler = _____________()
data_cleaned[numeric_cols] = scaler._____________(data_cleaned[numeric_cols])

# 5. 划分特征与目标 2分
X = data_cleaned.drop(columns=['SeriousDlqin2yrs'])
y = data_cleaned['SeriousDlqin2yrs']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
data_cleaned.to_csv('2.1.3_cleaned_data.csv', index=False)`,
    codeSolution: `import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split

data = pd.read_csv('./finance数据集.csv')
numeric_cols = ['RevolvingUtilizationOfUnsecuredLines', 'age', 'DebtRatio', 'MonthlyIncome', 'NumberOfOpenCreditLinesAndLoans']

# 计算IQR
Q1 = data[numeric_cols].quantile(0.25)
Q3 = data[numeric_cols].quantile(0.75)
IQR = Q3 - Q1

# 剔除离群样本
data_cleaned = data[~((data[numeric_cols] < (Q1 - 1.5 * IQR)) | (data[numeric_cols] > (Q3 + 1.5 * IQR))).any(axis=1)]
data_cleaned = data_cleaned.drop_duplicates()

# 归一化处理
scaler = MinMaxScaler()
data_cleaned[numeric_cols] = scaler.fit_transform(data_cleaned[numeric_cols])

# 特征分离
X = data_cleaned.drop(columns=['SeriousDlqin2yrs'])
y = data_cleaned['SeriousDlqin2yrs']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
data_cleaned.to_csv('2.1.3_cleaned_data.csv', index=False)`,
    blanksExplanation: [
      { blankIndex: 1, code: 'quantile(0.25) / quantile(0.75)', points: 3, explanation: 'quantile分位数计算25%下四分位与75%上四分位' },
      { blankIndex: 2, code: '~((...) | (...)).any(axis=1)', points: 3, explanation: '任意一列越过内外边界即判定为异常样本并剔除' },
      { blankIndex: 3, code: 'scaler = MinMaxScaler()', points: 2, explanation: 'MinMaxScaler归一化将特征压缩至[0,1]' }
    ],
    keyTakeaways: [
      'IQR 异常值检测标准：低于 Q1 - 1.5 * IQR 或 高于 Q3 + 1.5 * IQR',
      'MinMaxScaler 与 StandardScaler 的差异：前者有界[0,1]对稀疏分布保留较好，后者基于高斯分布无硬边界'
    ]
  },
  {
    id: '2.1.4',
    category: '2.1',
    categoryName: '数据清洗与标注流程设计',
    title: '医疗研究数据清洗和标注设计',
    scenario: '5440例临床综合随访病历，包含文本病历、用药剂量、就诊与确诊日期、体检数值等22个高维字段。需应对日期类型序列化、混合缺失分类填补、非数值测量字段规整及多类严重程度标签重映射。',
    dataset: {
      name: '医疗研究数据集.csv',
      description: '高维临床随访与诊疗综合病案数据',
      fields: [
        { name: '病人ID/年龄/性别', desc: '基础人口信息' },
        { name: '就诊日期/诊断日期', desc: '时间戳字段(需转datetime并计算潜伏间隔)' },
        { name: '疾病严重程度', desc: '文本分级(轻度/中度/重度等需数值标注)' },
        { name: '检查结果/身高/体重', desc: '连续生理指标' }
      ]
    },
    tasks: [
      { order: 1, description: '检查各列缺失情况，对连续指标使用中位数填补，对分类型字段用众数填补', targetFile: '2.1.4-1.jpg' },
      { order: 2, description: '转换就诊与诊断日期为标准日期时间格式，并做格式合法性校验', targetFile: '2.1.4-2.jpg' },
      { order: 3, description: '将疾病严重程度文本建立字典映射进行数值编码标注，输出清洗数据集', targetFile: '2.1.4-3.jpg' }
    ],
    skillRequirements: ['掌握多类型混合字段清洗规范、日期工程转换与有序分类变量数值映射'],
    qualityMetrics: ['缺失值差异化填充合理，日期格式化稳健，严重程度等级编码单调有序'],
    coreLibraries: ['pandas', 'numpy'],
    difficulty: '中等',
    codeTemplate: `import pandas as pd

data = pd.read_csv('./医疗研究数据.csv')

# 1. 差异化缺失值填补 3分
num_cols = ['检查结果', '体重', '身高']
cat_cols = ['疾病类型', '治疗方案', '药物分类']
for c in num_cols:
    data[c].fillna(data[c]._____________(), inplace=True)
for c in cat_cols:
    data[c].fillna(data[c]._____________()[0], inplace=True)

# 2. 日期转换 2分
data['就诊日期'] = pd._____________(data['就诊日期'], errors='coerce')
data['诊断日期'] = pd._____________(data['诊断日期'], errors='coerce')

# 3. 标签字典映射 3分
severity_map = {'轻度': 0, '中度': 1, '重度': 2, '危重': 3}
data['疾病严重程度_编码'] = data['疾病严重程度']._____________(severity_map)
data.to_csv('2.1.4_cleaned_data.csv', index=False)`,
    codeSolution: `import pandas as pd

data = pd.read_csv('./医疗研究数据.csv')

num_cols = ['检查结果', '体重', '身高']
cat_cols = ['疾病类型', '治疗方案', '药物分类']
for c in num_cols:
    data[c].fillna(data[c].median(), inplace=True)
for c in cat_cols:
    data[c].fillna(data[c].mode()[0], inplace=True)

data['就诊日期'] = pd.to_datetime(data['就诊日期'], errors='coerce')
data['诊断日期'] = pd.to_datetime(data['诊断日期'], errors='coerce')

severity_map = {'轻度': 0, '中度': 1, '重度': 2, '危重': 3}
data['疾病严重程度_编码'] = data['疾病严重程度'].map(severity_map)
data.to_csv('2.1.4_cleaned_data.csv', index=False)`,
    blanksExplanation: [
      { blankIndex: 1, code: 'median() / mode()[0]', points: 3, explanation: '连续变量用中位数(抗离群)，分类型变量用众数' },
      { blankIndex: 2, code: 'pd.to_datetime(...)', points: 2, explanation: '将字符串转化为标准pandas Timestamp' },
      { blankIndex: 3, code: 'Series.map(severity_map)', points: 3, explanation: '使用dict字典对Series做精确一对一键值映射' }
    ],
    keyTakeaways: [
      '数值列有明显偏态时，中位数(median)比均值(mean)更具鲁棒性',
      '有序分类变量（如轻/中/重）使用 map(dict) 映射为有序数字（0,1,2），能保留单调趋势信息'
    ]
  },
  {
    id: '2.1.5',
    category: '2.1',
    categoryName: '数据清洗与标注流程设计',
    title: '健康与营养咨询数据预处理与数据规范设计',
    scenario: '健康管理系统采集用户的运动习惯、饮食偏好、障碍阻力等问卷数据。问卷中存在多选题（分号隔开的文本）、缺失值及分类文本标签，需进行多选向量化计数、文本编码与数据规范化。',
    dataset: {
      name: '健身习惯数据集.csv',
      description: '个人生活运动与饮食多选项调研数据',
      fields: [
        { name: 'Your age', desc: '年龄段(如"19 to 25")' },
        { name: 'How often do you exercise?', desc: '运动频率' },
        { name: 'What barriers prevent you?', desc: '多选文本(以分号分割)' },
        { name: 'How healthy do you consider yourself?', desc: '主观自评等级' }
      ]
    },
    tasks: [
      { order: 1, description: '统计并清除缺失行，处理年龄文本解析提取下限整数值', targetFile: '2.1.5-1.jpg' },
      { order: 2, description: '对多选文本字段进行分割统计，构建二值指示特征', targetFile: '2.1.5-2.jpg' },
      { order: 3, description: '对核心分类列应用LabelEncoder或pd.get_dummies完成数值化并保存', targetFile: '2.1.5-3.jpg' }
    ],
    skillRequirements: ['掌握调研文本特征拆解、分号多选解析与虚拟变量指示编码'],
    qualityMetrics: ['字符串split提取逻辑严谨，多选特征展开正确，编码输出规范'],
    coreLibraries: ['pandas', 'numpy', 'sklearn.preprocessing'],
    difficulty: '中等',
    codeTemplate: `import pandas as pd

df = pd.read_csv('./fitness_data.csv')

# 1. 年龄文本拆分与提取 2分
df['Age_Min'] = df['Your age'].apply(lambda x: int(x.____________(' ')[0]))

# 2. 多选特征拆解 3分
barrier_dummies = df['What barriers prevent you?'].str.____________(';', expand=True)

# 3. 独热哑变量处理 3分
df_encoded = pd.____________(df, drop_first=True)
df_encoded.to_csv('2.1.5_cleaned_data.csv', index=False)`,
    codeSolution: `import pandas as pd

df = pd.read_csv('./fitness_data.csv').dropna()

df['Age_Min'] = df['Your age'].apply(lambda x: int(x.split(' ')[0]))
df_encoded = pd.get_dummies(df, drop_first=True)
df_encoded.to_csv('2.1.5_cleaned_data.csv', index=False)`,
    blanksExplanation: [
      { blankIndex: 1, code: "x.split(' ')[0]", points: 2, explanation: '空格切分取首个字符串并转为int' },
      { blankIndex: 2, code: "pd.get_dummies(df, drop_first=True)", points: 3, explanation: '一键对object列生成哑变量并drop_first剔除多重共线性' }
    ],
    keyTakeaways: [
      'Lambda表达式在Series文本特征清洗中极其高频灵活',
      'pd.get_dummies(drop_first=True) 是统计回归前预防哑变量陷阱(Dummy Variable Trap)的标准做法'
    ]
  },

  // ==================== 2.2.1 ~ 2.2.5 机器学习模型开发与测试 ====================
  {
    id: '2.2.1',
    category: '2.2',
    categoryName: '机器学习模型开发与测试',
    title: '智能信用评分Logistic回归模型开发与测试',
    scenario: '金融违约样本通常严重不平衡（违约率极低），导致常规模型偏向多数类。需使用imblearn的SMOTE算法进行过采样平衡，训练LogisticRegression分类模型，持久化模型文件并输出测试集精确率/召回率评估报告。',
    dataset: {
      name: 'finance数据集.csv',
      description: '信贷用户两年期违约标签数据集',
      fields: [
        { name: 'SeriousDlqin2yrs', desc: '二分类目标变量(0正常，1违约)' },
        { name: 'RevolvingUtilization...', desc: '信用额度利用率' },
        { name: 'DebtRatio / MonthlyIncome', desc: '收支负债指标' }
      ]
    },
    tasks: [
      { order: 1, description: '划分训练集与测试集（8:2），使用SMOTE对训练集进行过采样平衡', targetFile: '2.2.1-1.jpg' },
      { order: 2, description: '训练LogisticRegression二分类模型（max_iter=1000），pickle序列化保存模型', targetFile: '2.2.1-2.jpg' },
      { order: 3, description: '在测试集进行预测，保存预测结果txt，并输出classification_report分类报告', targetFile: '2.2.1-3.jpg' }
    ],
    skillRequirements: ['掌握非均衡样本SMOTE处理、逻辑回归分类训练、模型序列化与分类评估'],
    qualityMetrics: ['只对训练集做SMOTE（防止数据泄露），模型收敛，pickle持久化正确'],
    coreLibraries: ['pandas', 'sklearn.linear_model', 'imblearn.over_sampling', 'pickle', 'sklearn.metrics'],
    difficulty: '进阶',
    codeTemplate: `import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
import pickle
from sklearn.metrics import classification_report
from imblearn.over_sampling import SMOTE

data = pd.read_csv('./finance数据集.csv')
X = data.drop(['SeriousDlqin2yrs', 'Unnamed: 0'], axis=1)
y = data['SeriousDlqin2yrs']

# 1. 拆分数据集 2分
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 2. SMOTE 过采样 3分
smote = _____________()
X_train_res, y_train_res = smote._____________(X_train, y_train)

# 3. 训练逻辑回归 3分
model = _____________(max_iter=1000)
model._____________(X_train_res, y_train_res)

# 4. 保存模型 2分
with open('2.2.1_model.pkl', 'wb') as file:
    pickle._____________(model, file)

# 5. 预测与评估 2分
y_pred = model.predict(X_test)
print(_____________(y_test, y_pred))`,
    codeSolution: `import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
import pickle
from sklearn.metrics import classification_report
from imblearn.over_sampling import SMOTE

data = pd.read_csv('./finance数据集.csv')
X = data.drop(['SeriousDlqin2yrs', 'Unnamed: 0'], axis=1, errors='ignore')
y = data['SeriousDlqin2yrs']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

smote = SMOTE(random_state=42)
X_train_res, y_train_res = smote.fit_resample(X_train, y_train)

model = LogisticRegression(max_iter=1000)
model.fit(X_train_res, y_train_res)

with open('2.2.1_model.pkl', 'wb') as file:
    pickle.dump(model, file)

y_pred = model.predict(X_test)
pd.DataFrame(y_pred, columns=['预测结果']).to_csv('2.2.1_results.txt', index=False)
print(classification_report(y_test, y_pred))`,
    blanksExplanation: [
      { blankIndex: 1, code: 'smote.fit_resample(X_train, y_train)', points: 3, explanation: 'SMOTE拟合并重采样，使正负类样本量对齐' },
      { blankIndex: 2, code: 'LogisticRegression(max_iter=1000); model.fit(...)', points: 3, explanation: '设置足够迭代步数保证L-BFGS优化器收敛' },
      { blankIndex: 3, code: 'pickle.dump(model, file)', points: 2, explanation: '以二进制只写模式(wb)将模型对象序列化到磁盘' },
      { blankIndex: 4, code: 'classification_report(y_test, y_pred)', points: 2, explanation: '输出包含Precision、Recall、F1-Score和Support的完整报表' }
    ],
    keyTakeaways: [
      '严格原则：过采样SMOTE只能作用于训练集(fit_resample)，绝不可在切分前对整体数据做，否则导致严重数据穿越',
      'pickle.dump(obj, f) 保存模型，pickle.load(f) 加载模型'
    ]
  },
  {
    id: '2.2.2',
    category: '2.2',
    categoryName: '机器学习模型开发与测试',
    title: '智慧交通中燃油效率随机森林模型开发与测试',
    scenario: '构建车辆燃油经济性回归预测系统。先用Pipeline流水线封装StandardScaler和LinearRegression基线模型，再建立RandomForestRegressor集成回归树模型，比较两种模型在测试集的均方误差(MSE)和R²得分。',
    dataset: {
      name: 'auto-mpg.csv',
      description: '车辆燃油动力学特征与实测油耗',
      fields: [
        { name: 'mpg', desc: '目标连续型数值(加仑英里数)' },
        { name: 'cylinders / displacement / horsepower / weight', desc: '发动机与车身动力学自变量' }
      ]
    },
    tasks: [
      { order: 1, description: '使用Pipeline封装标准化与线性回归，完成基线训练与持久化', targetFile: '2.2.2-1.jpg' },
      { order: 2, description: '构建RandomForestRegressor(n_estimators=100)，训练集成模型', targetFile: '2.2.2-2.jpg' },
      { order: 3, description: '计算模型在测试集的均方误差(MSE)与决定系数(R²)，生成评估对比报告', targetFile: '2.2.2-3.jpg' }
    ],
    skillRequirements: ['掌握机器学习Pipeline流水线封装、随机森林回归与MSE/R²评价指标计算'],
    qualityMetrics: ['Pipeline构造正确，随机森林超参数设定无误，MSE与R²计算精准'],
    coreLibraries: ['pandas', 'sklearn.pipeline', 'sklearn.ensemble', 'sklearn.metrics', 'pickle'],
    difficulty: '中等',
    codeTemplate: `import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import pickle

df = pd.read_csv('./auto-mpg.csv').dropna()
X = df[['cylinders', 'displacement', 'horsepower', 'weight', 'acceleration', 'model year', 'origin']]
y = df['mpg']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 1. 创建 Pipeline 流水线 3分
pipeline = _____________([('scaler', _____________()), ('linreg', _____________())])
pipeline.fit(X_train, y_train)

# 2. 训练随机森林回归模型 3分
rf_model = _____________(n_estimators=100, random_state=42)
rf_model._____________(X_train, y_train)

# 3. 评估指标计算 4分
y_pred = rf_model.predict(X_test)
mse = _____________(y_test, y_pred)
r2 = _____________(y_test, y_pred)`,
    codeSolution: `import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import pickle

df = pd.read_csv('./auto-mpg.csv')
df['horsepower'] = pd.to_numeric(df['horsepower'], errors='coerce')
df = df.dropna()

X = df[['cylinders', 'displacement', 'horsepower', 'weight', 'acceleration', 'model year', 'origin']]
y = df['mpg']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Pipeline
pipeline = Pipeline([('scaler', StandardScaler()), ('linreg', LinearRegression())])
pipeline.fit(X_train, y_train)
with open('2.2.2_model.pkl', 'wb') as model_file:
    pickle.dump(pipeline, model_file)

# 随机森林
rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
rf_model.fit(X_train, y_train)

y_pred = rf_model.predict(X_test)
mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)`,
    blanksExplanation: [
      { blankIndex: 1, code: "Pipeline([('scaler', StandardScaler()), ('linreg', LinearRegression())])", points: 3, explanation: '将数据标准化与估计器链式组合成Pipeline对象' },
      { blankIndex: 2, code: 'RandomForestRegressor(n_estimators=100, random_state=42)', points: 3, explanation: '初始化100棵决策树的随机森林回归器' },
      { blankIndex: 3, code: 'mean_squared_error(y_test, y_pred) / r2_score(y_test, y_pred)', points: 4, explanation: '回归问题两大核心评估指标' }
    ],
    keyTakeaways: [
      'Pipeline 封装能保证测试集变换时直接复用训练集的均值与方差，杜绝测试泄露',
      'R² 越接近 1 说明模型对数据方差的解释能力越强；MSE 越小说明误差越小'
    ]
  },
  {
    id: '2.2.3',
    category: '2.2',
    categoryName: '机器学习模型开发与测试',
    title: '日常运动量随机森林预测模型开发与测试',
    scenario: '利用生活方式特征预测用户的运动健康指标。先训练随机森林基准模型，分析残差并诊断误差来源，引入先进的梯度提升树算法 XGBoost (XGBRegressor) 进行纠偏对比实验，输出完整双模型性能报表。',
    dataset: {
      name: 'fitness_survey.csv',
      description: '生活规律、饮食偏好与运动活跃度调研集',
      fields: [
        { name: 'Your age', desc: '自变量年龄提取' },
        { name: 'How often do you exercise?', desc: '运动频率分类' },
        { name: 'TargetScore', desc: '连续型运动指数目标y' }
      ]
    },
    tasks: [
      { order: 1, description: '训练RandomForestRegressor(100棵树)并持久化pkl模型文件', targetFile: '2.2.3-1.jpg' },
      { order: 2, description: '测试模型并输出训练集得分、测试集得分、MSE与R²到report.txt', targetFile: '2.2.3-2.jpg' },
      { order: 3, description: '初始化XGBRegressor(100棵树)进行纠错训练与测试，输出对比报告', targetFile: '2.2.3-3.jpg' }
    ],
    skillRequirements: ['掌握回归算法诊断纠偏思路，熟练使用XGBoost进行模型迭代调优'],
    qualityMetrics: ['模型训练与评估完整，XGBoost超参数设置恰当，文件写入规范'],
    coreLibraries: ['pandas', 'sklearn.ensemble', 'xgboost', 'sklearn.metrics', 'pickle'],
    difficulty: '进阶',
    codeTemplate: `import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import xgboost as xgb
import pickle

# 1. 训练随机森林回归模型 3分
rf_model = _____________(n_estimators=100, random_state=42)
rf_model._____________(X_train, y_train)

# 2. 记录测试集与训练集得分 4分
train_score = rf_model._____________(X_train, y_train)
test_score = rf_model._____________(X_test, y_test)
mse = _____________(y_test, y_pred)
r2 = _____________(y_test, y_pred)

# 3. 纠正与进阶：XGBoost回归模型 3分
xgb_model = xgb._____________(n_estimators=100, random_state=42)
xgb_model._____________(X_train, y_train)
y_pred_xgb = xgb_model.predict(X_test)`,
    codeSolution: `import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import xgboost as xgb
import pickle

# 训练随机森林
rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
rf_model.fit(X_train, y_train)

with open('2.2.3_model.pkl', 'wb') as model_file:
    pickle.dump(rf_model, model_file)

y_pred = rf_model.predict(X_test)
train_score = rf_model.score(X_train, y_train)
test_score = rf_model.score(X_test, y_test)
mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

with open('2.2.3_report.txt', 'w') as f:
    f.write(f'训练集得分: {train_score}\\n测试集得分: {test_score}\\n均方误差(MSE): {mse}\\n决定系数(R^2): {r2}\\n')

# XGBoost纠正
xgb_model = xgb.XGBRegressor(n_estimators=100, random_state=42)
xgb_model.fit(X_train, y_train)
y_pred_xgb = xgb_model.predict(X_test)

with open('2.2.3_report_xgb.txt', 'w') as f:
    f.write(f'XGBoost测试集得分: {xgb_model.score(X_test, y_test)}\\n')`,
    blanksExplanation: [
      { blankIndex: 1, code: 'RandomForestRegressor(n_estimators=100, random_state=42)', points: 3, explanation: '随机森林回归模型' },
      { blankIndex: 2, code: 'model.score(X, y)', points: 2, explanation: '对于回归模型，.score() 直接返回 R² 判定系数' },
      { blankIndex: 3, code: 'xgb.XGBRegressor(n_estimators=100, random_state=42)', points: 3, explanation: '使用XGBoost库的回归估计器' }
    ],
    keyTakeaways: [
      '三级考纲中「纠偏与优化」通常使用 XGBoost 对比 Random Forest',
      '回归模型调用 model.score(X, y) 返回的不是准确率，而是 R² 决定系数'
    ]
  },
  {
    id: '2.2.4',
    category: '2.2',
    categoryName: '机器学习模型开发与测试',
    title: '低碳生活行为影响因素预测线性回归模型开发与测试',
    scenario: '分析高校学生低碳环保得分的关联影响因素。删除无用流水字段，对分类文本进行哑变量化(pd.get_dummies)，建立LinearRegression线性回归模型并用joblib保存，随后配置更细致超参数的XGBRegressor(subsample, colsample)进行迭代。',
    dataset: {
      name: '大学生低碳生活行为数据集.xlsx',
      description: '调研答题记录与环保行为影响因素表',
      fields: [
        { name: '序号/所用时间', desc: '问卷采集辅助字段(需作为无用列删除)' },
        { name: '5.您进行过绿色低碳的相关生活方式吗?', desc: '目标预测因变量y' },
        { name: '多项态度题', desc: '自变量特征' }
      ]
    },
    tasks: [
      { order: 1, description: '删除无效列并进行哑变量转换(drop_first=True)，定义自变量X和因变量y', targetFile: '2.2.4-1.jpg' },
      { order: 2, description: '训练LinearRegression模型并用joblib.dump持久化保存为pkl', targetFile: '2.2.4-2.jpg' },
      { order: 3, description: '建立含正则与采样的XGBRegressor(n_estimators=1000, lr=0.05, max_depth=5)评估输出', targetFile: '2.2.4-3.jpg' }
    ],
    skillRequirements: ['掌握高维分类特征虚拟变量编码、joblib序列化及XGBoost进阶调参'],
    qualityMetrics: ['drop_first杜绝共线性，joblib保存无误，XGBoost超参数配置精确'],
    coreLibraries: ['pandas', 'sklearn.linear_model', 'joblib', 'xgboost', 'sklearn.metrics'],
    difficulty: '中等',
    codeTemplate: `import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
import joblib
from xgboost import XGBRegressor

data = pd.read_excel('./大学生低碳生活行为的影响因素数据集.xlsx')

# 1. 删除不必要的列并哑变量编码 2分
data_cleaned = data._____________(columns=['序号', '所用时间'])
data_cleaned = pd._____________(data_cleaned, drop_first=True)

# 2. 特征与目标定义 2分
target = '5.您进行过绿色低碳的相关生活方式吗?'
X = data_cleaned._____________(columns=[target])
y = data_cleaned[target]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 3. 线性回归与 joblib 保存 3分
model = _____________()
model.fit(X_train, y_train)
joblib._____________(model, '2.2.4_model.pkl')

# 4. XGBoost 调优模型 3分
xgb_model = _____________(n_estimators=1000, learning_rate=0.05, max_depth=5, subsample=0.8, colsample_bytree=0.8)
xgb_model.fit(X_train, y_train)`,
    codeSolution: `import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
import joblib
from xgboost import XGBRegressor

data = pd.read_excel('./大学生低碳生活行为的影响因素数据集.xlsx')
data_cleaned = data.drop(columns=['序号', '所用时间'])
data_cleaned = pd.get_dummies(data_cleaned, drop_first=True)

target = '5.您进行过绿色低碳的相关生活方式吗?'
X = data_cleaned.drop(columns=[target])
y = data_cleaned[target]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = LinearRegression()
model.fit(X_train, y_train)
joblib.dump(model, '2.2.4_model.pkl')

y_pred = model.predict(X_test)

xgb_model = XGBRegressor(n_estimators=1000, learning_rate=0.05, max_depth=5, subsample=0.8, colsample_bytree=0.8)
xgb_model.fit(X_train, y_train)
y_pred_xg = xgb_model.predict(X_test)`,
    blanksExplanation: [
      { blankIndex: 1, code: 'drop(columns=[...]) / pd.get_dummies(..., drop_first=True)', points: 2, explanation: '剔除无效列与独热哑变量转换' },
      { blankIndex: 2, code: 'LinearRegression(); joblib.dump(model, ...)', points: 3, explanation: '线性回归及joblib高效模型序列化' },
      { blankIndex: 3, code: 'XGBRegressor(n_estimators=1000, learning_rate=0.05, ...)', points: 3, explanation: 'XGBoost高阶超参数配置' }
    ],
    keyTakeaways: [
      'joblib.dump 比 pickle 对包含大量大型 numpy 数组的模型具有更优的压缩和I/O性能',
      'XGBoost重要超参：subsample (样本随机抽样比例), colsample_bytree (特征子采样比例)'
    ]
  },
  {
    id: '2.2.5',
    category: '2.2',
    categoryName: '机器学习模型开发与测试',
    title: '智能步数预测模型开发与测试',
    scenario: '穿戴健康设备步数预测应用。综合饮食偏好、身体质量自评与运动意愿，构建步数预测回归模型。涵盖缺失处理、特征矩阵构建、随机森林回归训练与预测结果制表输出。',
    dataset: {
      name: 'fitness_steps.csv',
      description: '运动健康手环日常监测统计数据',
      fields: [
        { name: 'Steps', desc: '全天总步数(连续型目标因变量)' },
        { name: 'FitnessLevel / Diet / ExerciseTime', desc: '健康自变量' }
      ]
    },
    tasks: [
      { order: 1, description: '数据清洗剔除空值，提取自变量矩阵与目标向量', targetFile: '2.2.5-1.jpg' },
      { order: 2, description: '构建RandomForestRegressor模型训练拟合，保存为pkl文件', targetFile: '2.2.5-2.jpg' },
      { order: 3, description: '预测测试集步数并以制表符分隔格式写入results.txt，评估R²与MSE', targetFile: '2.2.5-3.jpg' }
    ],
    skillRequirements: ['掌握端到端回归模型工程落地全流程与文本制表输出'],
    qualityMetrics: ['模型训练规范，预测结果格式符合\t制表符规范，评估指标齐全'],
    coreLibraries: ['pandas', 'sklearn.ensemble', 'sklearn.metrics', 'pickle'],
    difficulty: '基础',
    codeTemplate: `import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import pickle

df = pd.read_csv('./fitness_steps.csv').dropna()
X = df.drop(columns=['Steps'])
y = df['Steps']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 1. 训练随机森林回归模型 4分
model = _____________(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 2. 保存模型 2分
with open('2.2.5_model.pkl', 'wb') as f:
    pickle._____________(model, f)

# 3. 结果保存为制表符分隔 4分
y_pred = model.predict(X_test)
results = pd.DataFrame({'实际值': y_test, '预测值': y_pred})
results.to_csv('2.2.5_results.txt', index=False, sep='_____________')`,
    codeSolution: `import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import pickle

df = pd.read_csv('./fitness_steps.csv').dropna()
X = df.drop(columns=['Steps'])
y = df['Steps']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

with open('2.2.5_model.pkl', 'wb') as f:
    pickle.dump(model, f)

y_pred = model.predict(X_test)
results = pd.DataFrame({'实际值': y_test, '预测值': y_pred})
results.to_csv('2.2.5_results.txt', index=False, sep='\\t')`,
    blanksExplanation: [
      { blankIndex: 1, code: 'RandomForestRegressor(n_estimators=100, random_state=42)', points: 4, explanation: '标准随机森林回归器' },
      { blankIndex: 2, code: 'pickle.dump(model, f)', points: 2, explanation: '二进制模型持久化' },
      { blankIndex: 3, code: "sep='\\t'", points: 4, explanation: 'to_csv导出时通过指定sep=\\t实现制表符Tab分隔' }
    ],
    keyTakeaways: [
      '文本格式存储结构化数据时，sep="\\t" 是最标准的制表符格式要求',
      '随机森林自带抗过拟合与对特征单调变换不敏感的优异特性'
    ]
  },

  // ==================== 3.2.1 ~ 3.2.5 交互系统设计与CV推理部署 ====================
  {
    id: '3.2.1',
    category: '3.2',
    categoryName: 'AI系统交互与CV部署',
    title: '图像识别评估系统交互流程设计',
    scenario: '构建通用的ImageNet百类图像识别推理评估流水线。使用ONNX Runtime加载已导出的ResNet神经网络模型，使用PIL对输入图片进行双线性插值缩放、中心裁剪、ImageNet均值方差标准化，转置为NCHW维度后送入InferenceSession执行推理，并通过Softmax解析Top-5概率与类别。',
    dataset: {
      name: 'labels.txt & test.jpg',
      description: 'ImageNet分类标签清单与待评测RGB图像',
      fields: [
        { name: 'labels.txt', desc: '1000类英文/中文标签名列表' },
        { name: 'model.onnx', desc: '预训练好的ONNX格式深度学习网络' }
      ]
    },
    tasks: [
      { order: 1, description: '使用ort.InferenceSession加载ONNX模型并读取labels.txt类别列表', targetFile: '3.2.1-1.jpg' },
      { order: 2, description: '使用PIL加载并预处理图片（resize, crop, 归一化除以255, 减均值除方差, 维度转置）', targetFile: '3.2.1-2.jpg' },
      { order: 3, description: '执行推理计算logits，利用scipy.special.softmax转换为概率并输出Top-5结果', targetFile: '3.2.1-3.jpg' }
    ],
    skillRequirements: ['掌握ONNX Runtime推理链路、计算机视觉图像预处理及Top-K后处理概率解析'],
    qualityMetrics: ['NCHW通道转换无误，ONNX会话输入字典匹配，Softmax与Top5排序准确'],
    coreLibraries: ['onnxruntime', 'numpy', 'PIL', 'scipy.special'],
    difficulty: '进阶',
    codeTemplate: `import onnxruntime as ort
import numpy as np
import scipy.special
from PIL import Image

def preprocess_image(image, resize_size=256, crop_size=224, mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]):
    image = image.resize((resize_size, resize_size), Image.BILINEAR)
    w, h = image.size
    left = (w - crop_size) / 2
    top = (h - crop_size) / 2
    image = image.crop((left, top, left + crop_size, top + crop_size))
    image = np.array(image).astype(np.float32) / 255.0
    image = (image - mean) / std
    image = np.transpose(image, (2, 0, 1))
    image = image.reshape((1,) + image.shape)
    return image

# 1. 模型加载 2分
session = _____________('model.onnx')

# 加载类别标签
with open('labels.txt') as f:
    labels = [line.strip() for line in f.readlines()]

input_name = session.get_inputs()[0].name
output_name = session.get_outputs()[0].name

# 2. 加载与预处理图片 4分
image = Image.open('test.jpg')._____________('RGB')
processed_image = _____________(image)

# 3. 进行推理 2分
output = session._____________([output_name], {input_name: processed_image})[0]

# 4. 应用 softmax 获取概率 2分
probabilities = scipy.special._____________(output, axis=-1)

# 5. 获取最高的5个概率和类别索引 3分
top5_idx = np._____________(probabilities)[-5:][::-1]
top5_prob = probabilities[top5_idx]`,
    codeSolution: `import onnxruntime as ort
import numpy as np
import scipy.special
from PIL import Image

def preprocess_image(image, resize_size=256, crop_size=224, mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]):
    image = image.resize((resize_size, resize_size), Image.BILINEAR)
    w, h = image.size
    left = (w - crop_size) / 2
    top = (h - crop_size) / 2
    image = image.crop((left, top, left + crop_size, top + crop_size))
    image = np.array(image).astype(np.float32) / 255.0
    image = (image - mean) / std
    image = np.transpose(image, (2, 0, 1))
    image = image.reshape((1,) + image.shape)
    return image

# 加载模型
session = ort.InferenceSession('model.onnx')

with open('labels.txt') as f:
    labels = [line.strip() for line in f.readlines()]

input_name = session.get_inputs()[0].name
output_name = session.get_outputs()[0].name

image = Image.open('test.jpg').convert('RGB')
processed_image = preprocess_image(image)

output = session.run([output_name], {input_name: processed_image})[0]
probabilities = scipy.special.softmax(output, axis=-1)

top5_idx = np.argsort(probabilities)[-5:][::-1]
top5_prob = probabilities[top5_idx]`,
    blanksExplanation: [
      { blankIndex: 1, code: "ort.InferenceSession('model.onnx')", points: 2, explanation: '创建ONNX Runtime推理会话实例' },
      { blankIndex: 2, code: "convert('RGB') / preprocess_image(image)", points: 4, explanation: '强制RGB三通道模式并执行缩放裁剪标准化' },
      { blankIndex: 3, code: 'session.run([output_name], {input_name: processed_image})', points: 2, explanation: '执行模型推理，传入输入张量字典' },
      { blankIndex: 4, code: 'scipy.special.softmax(output, axis=-1)', points: 2, explanation: '对网络原始logits施加归一化指数函数Softmax输出概率' },
      { blankIndex: 5, code: 'np.argsort(probabilities)[-5:][::-1]', points: 3, explanation: 'argsort升序索引切片[-5:]后逆序[::-1]得到Top5降序索引' }
    ],
    keyTakeaways: [
      'CV深度学习网络输入通道顺序：PyTorch导出ONNX通常为 NCHW (Batch, Channel, Height, Width)',
      '图像预处理通道转置：np.transpose(image, (2, 0, 1)) 将 HWC 转换为 CHW',
      'np.argsort(x)[-k:][::-1] 是提取Top-K最大值索引的标准NumPy语法'
    ]
  },
  {
    id: '3.2.2',
    category: '3.2',
    categoryName: 'AI系统交互与CV部署',
    title: '手写数字识别系统交互流程设计',
    scenario: '经典MNIST手写数字(0~9)交互推理应用。模型输入为单通道灰度图(1, 1, 28, 28)。需使用PIL将手写图片转为灰度图L，resize为28x28像素，使用np.expand_dims增加Batch与Channel维度，送入ONNX模型并通过np.argmax取得最高置信度预测数字。',
    dataset: {
      name: 'mnist_model.onnx & test_image.png',
      description: 'MNIST手写数字模型与白底黑字测试手写图',
      fields: [
        { name: 'mnist_model.onnx', desc: '卷积手写数字识别ONNX模型' },
        { name: 'test_image.png', desc: '手写数字测试样本' }
      ]
    },
    tasks: [
      { order: 1, description: '使用ort.InferenceSession加载mnist_model.onnx模型', targetFile: '3.2.2-1.jpg' },
      { order: 2, description: '图像灰度化(convert("L"))、调整为28x28，扩展Batch和Channel维度', targetFile: '3.2.2-2.jpg' },
      { order: 3, description: '运行会话执行预测，使用np.argmax解析出预测数字并在控制台打印', targetFile: '3.2.2-3.jpg' }
    ],
    skillRequirements: ['掌握单通道灰度图预处理、维度拓展与Argmax多分类输出解析'],
    qualityMetrics: ['灰度模式转换无误，双重expand_dims维度对齐(1,1,28,28)，argmax正确'],
    coreLibraries: ['onnxruntime', 'numpy', 'PIL'],
    difficulty: '基础',
    codeTemplate: `import onnxruntime
import numpy as np
from PIL import Image

# 1. 加载ONNX模型 2分
ort_session = __________________('mnist_model.onnx')

# 2. 加载图像并转为灰度图 2分
image = Image.open('test_image.png').__________________('L')

# 3. 图像预处理 8分
image = image.__________________((28, 28))
image_array = np.__________________(image, dtype=np.float32)
image_array = np.__________________(image_array, axis=0)  # 添加batch维度
image_array = np.__________________(image_array, axis=0)  # 添加通道维度

# 4. 执行预测 4分
ort_inputs = {ort_session.get_inputs()[0].name: image_array}
ort_outs = ort_session.__________________(None, ort_inputs)

# 5. 获取预测数字 2分
predicted_class = np.__________________(ort_outs[0])
print(f"Predicted class: {predicted_class}")`,
    codeSolution: `import onnxruntime as ort
import numpy as np
from PIL import Image

ort_session = ort.InferenceSession('mnist_model.onnx')
image = Image.open('test_image.png').convert('L')

image = image.resize((28, 28))
image_array = np.array(image, dtype=np.float32)
image_array = np.expand_dims(image_array, axis=0)
image_array = np.expand_dims(image_array, axis=0)

ort_inputs = {ort_session.get_inputs()[0].name: image_array}
ort_outs = ort_session.run(None, ort_inputs)

predicted_class = np.argmax(ort_outs[0])
print(f"Predicted class: {predicted_class}")`,
    blanksExplanation: [
      { blankIndex: 1, code: "ort.InferenceSession('mnist_model.onnx')", points: 2, explanation: '加载ONNX模型' },
      { blankIndex: 2, code: "convert('L')", points: 2, explanation: "'L'表示8位像素灰度图模式(Luminance)" },
      { blankIndex: 3, code: 'resize((28, 28)) / np.array(...) / np.expand_dims(..., axis=0)', points: 8, explanation: '将(28,28)阵列扩展为(1, 1, 28, 28)的四维张量' },
      { blankIndex: 4, code: 'ort_session.run(None, ort_inputs)', points: 2, explanation: '传递输入张量字典进行前向推理' },
      { blankIndex: 5, code: 'np.argmax(ort_outs[0])', points: 2, explanation: '取最大概率所在的类别下标索引作为预测类别' }
    ],
    keyTakeaways: [
      '灰度图使用 convert("L")，RGB彩色图使用 convert("RGB")',
      'np.expand_dims(arr, axis=0) 可在指定位置添加一个长度为1的轴维度'
    ]
  },
  {
    id: '3.2.3',
    category: '3.2',
    categoryName: 'AI系统交互与CV部署',
    title: '面部表情识别系统交互流程设计',
    scenario: '构建人机交互界面中的面部情绪识别服务。读取64x64单通道表情模型，定义7种基础情绪类别映射字典（愤怒、厌恶、恐惧、开心、中性、伤心、惊讶），前处理断言输入形状，推理并输出情绪中文文本与置信度。',
    dataset: {
      name: 'emotion_model.onnx & face.jpg',
      description: '人脸表情分类网络与测试抓拍人脸',
      fields: [
        { name: 'emotion_table', desc: '0~6数字标签与情绪名称的字典映射表' },
        { name: 'input_shape', desc: '固定期望张量维度(1, 1, 64, 64)' }
      ]
    },
    tasks: [
      { order: 1, description: '定义7类表情字典映射表，使用ort.InferenceSession加载模型', targetFile: '3.2.3-1.jpg' },
      { order: 2, description: '灰度转换、双三次抗锯齿resize(64,64)，构建输入张量字典', targetFile: '3.2.3-2.jpg' },
      { order: 3, description: '模型前向运算，np.argmax索引解码，查字典打印预测情绪文本', targetFile: '3.2.3-3.jpg' }
    ],
    skillRequirements: ['掌握计算机视觉图像分类模型部署及自定义标签映射字典解析'],
    qualityMetrics: ['情绪字典定义完备无误，张量形状断言通过，情绪解码输出正确'],
    coreLibraries: ['onnxruntime', 'numpy', 'PIL'],
    difficulty: '中等',
    codeTemplate: `import numpy as np
from PIL import Image
import onnxruntime as ort

def preprocess(image_path):
    input_shape = (1, 1, 64, 64)
    img = Image.open(image_path).____________('L')
    img = img.resize((64, 64), Image.ANTIALIAS)
    img_data = np.array(img, dtype=np.float32)
    img_data = np.expand_dims(img_data, axis=0)
    img_data = np.expand_dims(img_data, axis=1)
    assert img_data.shape == input_shape
    return img_data

# 1. 表情字典映射 3分
emotion_table = {____________}

# 2. 加载模型 3分
ort_session = ____________('emotion_model.onnx')
input_data = preprocess('face.jpg')

# 3. 运行模型预测 3分
ort_inputs = {ort_session.get_inputs()[0].name: input_data}
ort_outs = ort_session.____________(None, ort_inputs)

# 4. 解码最高概率类别并输出情绪名称 6分
predicted_label = np.____________(ort_outs[0])
predicted_emotion = ____________[predicted_label]
print(f"Predicted emotion: {predicted_emotion}")`,
    codeSolution: `import numpy as np
from PIL import Image
import onnxruntime as ort

def preprocess(image_path):
    input_shape = (1, 1, 64, 64)
    img = Image.open(image_path).convert('L')
    img = img.resize((64, 64), Image.ANTIALIAS)
    img_data = np.array(img, dtype=np.float32)
    img_data = np.expand_dims(img_data, axis=0)
    img_data = np.expand_dims(img_data, axis=1)
    assert img_data.shape == input_shape
    return img_data

emotion_table = {0: 'Angry', 1: 'Disgust', 2: 'Fear', 3: 'Happy', 4: 'Neutral', 5: 'Sad', 6: 'Surprise'}
ort_session = ort.InferenceSession('emotion_model.onnx')
input_data = preprocess('face.jpg')

ort_inputs = {ort_session.get_inputs()[0].name: input_data}
ort_outs = ort_session.run(None, ort_inputs)

predicted_label = np.argmax(ort_outs[0])
predicted_emotion = emotion_table[predicted_label]
print(f"Predicted emotion: {predicted_emotion}")`,
    blanksExplanation: [
      { blankIndex: 1, code: "{0: 'Angry', 1: 'Disgust', 2: 'Fear', 3: 'Happy', 4: 'Neutral', 5: 'Sad', 6: 'Surprise'}", points: 3, explanation: '建立0-6标签到标准情绪英文标签的字典' },
      { blankIndex: 2, code: "ort.InferenceSession('emotion_model.onnx')", points: 3, explanation: '加载情绪ONNX模型' },
      { blankIndex: 3, code: 'ort_session.run(None, ort_inputs)', points: 3, explanation: '执行前向会话推理' },
      { blankIndex: 4, code: 'np.argmax(ort_outs[0]) / emotion_table[predicted_label]', points: 6, explanation: '获取最大分类索引并通过映射字典转换' }
    ],
    keyTakeaways: [
      '分类模型输出通常是一组未归一化的logits，取最大项类别时无需经过Softmax，直接 argmax 即可'
    ]
  },
  {
    id: '3.2.4',
    category: '3.2',
    categoryName: 'AI系统交互与CV部署',
    title: '花朵智能识别系统交互流程设计',
    scenario: '构建植物与花卉科普识别小程序。输入为RGB全彩图像，预处理为(1, 3, 224, 224)。模型推理后输出各花卉类别的置信得分，通过Softmax转换为概率，提取最大预测项并格式化为百分比形式展示（如 "Roses, Accuracy: 96.82%"）。',
    dataset: {
      name: 'flower_labels.txt & rose.jpg',
      description: '花卉细粒度分类标签与待测花朵照片',
      fields: [
        { name: 'flower_labels.txt', desc: '花卉品种列表(daisy, dandelion, roses, sunflowers, tulips)' }
      ]
    },
    tasks: [
      { order: 1, description: '加载ONNX会话与花卉类别名称文本文件', targetFile: '3.2.4-1.jpg' },
      { order: 2, description: '调用预处理流水线转换图片数据为float32类型的张量', targetFile: '3.2.4-2.jpg' },
      { order: 3, description: '执行推理并应用softmax，计算预测标签及百分比置信度并打印', targetFile: '3.2.4-3.jpg' }
    ],
    skillRequirements: ['掌握细粒度图像识别端到端推理与置信度百分比格式化输出'],
    qualityMetrics: ['推理输入名/输出名提取正确，百分比格式化精准保留2位小数'],
    coreLibraries: ['onnxruntime', 'numpy', 'scipy.special', 'PIL'],
    difficulty: '基础',
    codeTemplate: `import onnxruntime as ort
import numpy as np
import scipy.special
from PIL import Image

# 1. 加载模型与类别 4分
session = _____________('flower_model.onnx')
with open('flower_labels.txt') as f:
    labels = [line.strip() for line in f.readlines()]

input_name = session.get_inputs()[0].name
output_name = session.get_outputs()[0].name

# 2. 读取与预处理图片 4分
image = Image.open('rose.jpg').convert('RGB')
processed_image = preprocess_image(image).astype(np.float32)

# 3. 进行推理 2分
output = session._____________([output_name], {input_name: processed_image})[0]

# 4. Softmax 与百分比格式化输出 4分
probs = scipy.special._____________(output, axis=-1)
predicted_idx = np._____________(probs)
prob_percentage = np._____________(probs) * 100
predicted_label = labels[predicted_idx]
print(f"Predicted class: {predicted_label}, Accuracy: {prob_percentage:.2f}%")`,
    codeSolution: `import onnxruntime as ort
import numpy as np
import scipy.special
from PIL import Image

session = ort.InferenceSession('flower_model.onnx')
with open('flower_labels.txt') as f:
    labels = [line.strip() for line in f.readlines()]

input_name = session.get_inputs()[0].name
output_name = session.get_outputs()[0].name

image = Image.open('rose.jpg').convert('RGB')
processed_image = preprocess_image(image).astype(np.float32)

output = session.run([output_name], {input_name: processed_image})[0]
probs = scipy.special.softmax(output, axis=-1)

predicted_idx = np.argmax(probs)
prob_percentage = np.max(probs) * 100
predicted_label = labels[predicted_idx]
print(f"Predicted class: {predicted_label}, Accuracy: {prob_percentage:.2f}%")`,
    blanksExplanation: [
      { blankIndex: 1, code: "ort.InferenceSession('flower_model.onnx')", points: 2, explanation: '加载模型文件' },
      { blankIndex: 2, code: 'session.run([output_name], {input_name: processed_image})', points: 2, explanation: '模型运行推理' },
      { blankIndex: 3, code: 'scipy.special.softmax(output, axis=-1)', points: 2, explanation: 'Softmax激活计算概率分布' },
      { blankIndex: 4, code: 'np.argmax(probs) / np.max(probs) * 100', points: 4, explanation: '获取最大索引与最大置信度数值并换算为百分数' }
    ],
    keyTakeaways: [
      '置信度百分比换算技巧：np.max(probs) * 100 配合格式化字符串 {prob_percentage:.2f}%'
    ]
  },
  {
    id: '3.2.5',
    category: '3.2',
    categoryName: 'AI系统交互与CV部署',
    title: 'AI驱动的健身应用界面设计分析与优化',
    scenario: 'AI运动健身动作识别前置的人脸/人体目标检测应用（RFB-320轻量级检测模型）。使用OpenCV读取图片流，完成BGR转RGB与320x240归一化缩放，送入ONNX模型预测，随后通过非极大值抑制(hard_nms)滤除重叠候选框，利用cv2.rectangle和cv2.putText在原图绘制检测框与类别标签并保存。',
    dataset: {
      name: 'version-RFB-320.onnx & voc-model-labels.txt & imgs/',
      description: '轻量级实时目标检测模型及测试图片文件夹',
      fields: [
        { name: 'threshold', desc: '置信度过滤阈值(0.7)' },
        { name: 'iou_threshold', desc: 'IoU非极大值抑制交并比阈值(0.3)' }
      ]
    },
    tasks: [
      { order: 1, description: '使用OpenCV读取指定目录下图片，完成色彩空间BGR到RGB转换与320x240尺寸规整', targetFile: '3.2.5-1.jpg' },
      { order: 2, description: '构建ONNX Runtime会话推理输出边界框与置信度，调用NMS算法完成目标后处理筛选', targetFile: '3.2.5-2.jpg' },
      { order: 3, description: '使用OpenCV绘制矩形边框(cv2.rectangle)与标签文本(cv2.putText)，保存检测结果图片', targetFile: '3.2.5-3.jpg' }
    ],
    skillRequirements: ['熟练掌握OpenCV图像处理、目标检测深度学习推理、NMS后处理与图像标注绘制'],
    qualityMetrics: ['OpenCV图像通道转换无误，NMS后处理参数合理，绘图坐标还原准确'],
    coreLibraries: ['cv2', 'onnxruntime', 'numpy', 'os', 'time'],
    difficulty: '进阶',
    codeTemplate: `import os
import cv2
import numpy as np
import onnxruntime as ort

# 1. 加载模型与标签 4分
class_names = [name._____________() for name in open('voc-model-labels.txt').readlines()]
ort_session = _____________('version-RFB-320.onnx')
input_name = ort_session.get_inputs()[0].name

# 2. 遍历图像并进行 OpenCV 图像处理 8分
path = "imgs"
for file_name in os.listdir(path):
    img_path = os.path.join(path, file_name)
    orig_image = cv2._____________(img_path)
    image = cv2.cvtColor(orig_image, cv2._____________)
    image = cv2._____________(image, (320, 240))
    image = (image - np.array([127, 127, 127])) / 128.0
    image = np.transpose(image, [2, 0, 1])
    image = np._____________(image, axis=0).astype(np.float32)

    # 3. ONNX 推理与预测后处理 4分
    confidences, boxes = ort_session.run(None, {input_name: image})
    boxes, labels, probs = predict(orig_image.shape[1], orig_image.shape[0], confidences, boxes, threshold=0.7)

    # 4. 在原图上绘制检测框与文本 4分
    for i in range(boxes.shape[0]):
        box = boxes[i, :]
        cv2._____________(orig_image, (box[0], box[1]), (box[2], box[3]), (255, 255, 0), 4)
        label = f"{class_names[labels[i]]}: {probs[i]:.2f}"
        cv2._____________(orig_image, label, (box[0] + 20, box[1] + 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 255), 2)
    cv2.imwrite(os.path.join("results", file_name), orig_image)`,
    codeSolution: `import os
import cv2
import numpy as np
import onnxruntime as ort

class_names = [name.strip() for name in open('voc-model-labels.txt').readlines()]
ort_session = ort.InferenceSession('version-RFB-320.onnx')
input_name = ort_session.get_inputs()[0].name

result_path = "./detect_imgs_results_onnx"
if not os.path.exists(result_path):
    os.makedirs(result_path)

path = "imgs"
for file_path in os.listdir(path):
    img_path = os.path.join(path, file_path)
    orig_image = cv2.imread(img_path)
    image = cv2.cvtColor(orig_image, cv2.COLOR_BGR2RGB)
    image = cv2.resize(image, (320, 240))
    image_mean = np.array([127, 127, 127])
    image = (image - image_mean) / 128.0
    image = np.transpose(image, [2, 0, 1])
    image = np.expand_dims(image, axis=0).astype(np.float32)

    confidences, boxes = ort_session.run(None, {input_name: image})
    boxes, labels, probs = predict(orig_image.shape[1], orig_image.shape[0], confidences, boxes, 0.7)

    for i in range(boxes.shape[0]):
        box = boxes[i, :]
        cv2.rectangle(orig_image, (box[0], box[1]), (box[2], box[3]), (255, 255, 0), 4)
        label = f"{class_names[labels[i]]}: {probs[i]:.2f}"
        cv2.putText(orig_image, label, (box[0] + 20, box[1] + 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 255), 2)

    cv2.imwrite(os.path.join(result_path, file_path), orig_image)`,
    blanksExplanation: [
      { blankIndex: 1, code: 'name.strip()', points: 2, explanation: '去除行末换行符及前后空格' },
      { blankIndex: 2, code: "ort.InferenceSession('...')", points: 2, explanation: '创建目标检测ONNX运行时会话' },
      { blankIndex: 3, code: 'cv2.imread / COLOR_BGR2RGB / cv2.resize', points: 6, explanation: 'OpenCV标准图像读取、色彩空间转换与尺寸缩放' },
      { blankIndex: 4, code: 'np.expand_dims(image, axis=0)', points: 1, explanation: '增加Batch维度满足模型(1, 3, 240, 320)输入需求' },
      { blankIndex: 5, code: 'cv2.rectangle / cv2.putText', points: 4, explanation: 'OpenCV标注画框与标签文本渲染' }
    ],
    keyTakeaways: [
      'OpenCV imread 默认读入的通道顺序是 BGR，而绝大多数模型需要 RGB，必须用 cv2.cvtColor(img, cv2.COLOR_BGR2RGB) 转换',
      'cv2.rectangle 接收左上角坐标 (x1, y1) 和 右下角坐标 (x2, y2)，颜色格式为 (B, G, R)',
      '目标检测后处理关键：非极大值抑制(NMS)消除高重叠低置信候选框'
    ]
  }
];
