# AIGraph

人工智能训练师（三级）理论考试和操作技能考场。站点：[aigraph.wanghuanlab.com](https://aigraph.wanghuanlab.com)

主线是理论、操作两部分的练习和模拟考试。按题整理的作答笔记在「学习资料」。

```text
frontend/     Vue 3 页面
backend/      Spring Boot 3 + JPA
database/     建表脚本和题库种子
docs/         需求、架构、接口、决策
scripts/      题库素材生成与校验
tests/        跨模块测试
.agents/      给代理的改代码约定
```

## 本地运行

数据库用根目录 `.env` 的 `MYSQL_*`，指向已有的远程 MySQL。样例见 `.env.example`。空题库会在后端启动时分别从 `database/seed/practical/questions.json` 和 `database/seed/theory/questions.json` 导入。

后端在 IntelliJ IDEA 中运行 `AigraphApplication`，接口在 `127.0.0.1:8080`。

前端：

```bash
npm --prefix frontend run dev
```

页面在 `http://127.0.0.1:5173/`。构建用 `npm --prefix frontend run build`，产物在 `frontend/dist/`。

## 账号

密码只存 scrypt 散列。注册和登录需要验证码。管理员用户名是 `admin`。后台只显示汇总，不显示密码和答卷正文。阅卷用 OpenAI 兼容接口，密钥只留在服务器上，页面显示末四位。

上传文件留在当前浏览器。文字答案和分数记在账号里。

## 页面

- `/` 考场
- `/workspace/:id` 作答
- `/materials` 学习资料：按题号整理的作答笔记
- `/account` 登录和答卷
- `/admin` 后台

## License

MIT
