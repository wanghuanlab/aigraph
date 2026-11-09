# HTTP 接口

基础地址是站点同源的 `/api`。除题库和验证码外，登录态放在 HttpOnly Cookie `aigraph_session`。错误响应是 `{ "error": "..." }`。

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| GET | `/api/exam/bank` | 操作技能题库版本、模块和 40 道题 |
| GET | `/api/exam/theory` | 理论题库，不含标准答案 |
| POST | `/api/exam/theory/check` | 核对理论练习中的一题，正文 `{ "id", "selected": [] }` |
| POST | `/api/exam/theory/grade/{id}` | 对已交卷的理论答卷评分 |
| GET | `/api/auth/captcha` | 验证码编号和 SVG |
| POST | `/api/auth/register` | 注册并登录 |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/logout` | 退出 |
| GET | `/api/auth/me` | 当前用户，未登录时 `user` 为 null |
| POST | `/api/auth/password` | 修改密码 |
| GET | `/api/learning` | 自测答案和答卷 |
| PUT | `/api/learning/quiz` | 保存自测，正文 `{ "answers": {} }` |
| PUT | `/api/learning/exams` | 保存答卷文字 |
| DELETE | `/api/learning/exams/{id}` | 删除一份答卷 |
| GET | `/api/admin/overview` | 管理员汇总 |
| GET | `/api/admin/model` | 阅卷模型，密钥只返回末四位 |
| PUT | `/api/admin/model` | 保存阅卷模型，空密钥表示沿用原密钥 |
| POST | `/api/grading/exams/{id}` | 对已交卷答卷阅卷，正文可带 `images` |

答卷保存时只保留文字。已有的阅卷结果不会被这次保存清掉。
