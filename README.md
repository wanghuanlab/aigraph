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

```bash
npm run dev:api
npm run dev
```

接口在 `127.0.0.1:8080`，页面在 `http://127.0.0.1:5173/`。数据库连接写在根目录 `.env` 的 `MYSQL_*`，样例见 `.env.example`。

`docker compose up` 会在本机 3306 端口另起一套空库，并执行 `database/schema.sql`。它不使用 `.env` 里的远程地址。空题库会在后端启动时分别从 `database/seed/practical/questions.json` 和 `database/seed/theory/questions.json` 导入。

前端构建：

```bash
npm run build
```

产物在 `frontend/dist/`。

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
