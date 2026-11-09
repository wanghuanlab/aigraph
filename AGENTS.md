# AIGraph 代理约定

人工智能训练师（三级）考场。主线是理论考试和操作技能考试，学习资料是辅助菜单。

## 目录

- `frontend/`：Vue 3 + Vue Router + Vite。开发地址 `http://127.0.0.1:5173/`，`/api` 代理到后端。
- `backend/`：Spring Boot 3、Java 21、Spring Data JPA。接口在 `127.0.0.1:8080`。
- `database/schema.sql`：建表脚本。`database/seed/practical/` 是操作技能题库，`database/seed/theory/` 是理论题库。表里已有题目时不要覆盖。
- `docs/`：需求、架构、接口和架构决策。
- `scripts/`：题库素材的生成和校验。源 PDF 在 git 忽略的 `local/course-docs/`。
- `tests/`：跨模块集成和端到端测试。
- `exam-assets/`：git 忽略的下载素材，约 470MB。开发服务器把它挂到 `/exam-assets`。

更细的改代码约定在 `.agents/conventions.md`。

## 运行

前端在终端里启动、重启和看日志。在仓库根目录执行 `npm --prefix frontend run dev`。页面在 `http://127.0.0.1:5173/`。

后端通过 `/ij-debugger` 启动、重启和调试。运行配置名是 `AigraphApplication`。先看当前调试会话，已有就沿用；要重启就先停掉该会话再启动。不要在终端执行 `mvn spring-boot:run`。接口在 `127.0.0.1:8080`。细则在 `.cursor/rules/dev-servers.mdc`。

数据库用仓库根目录 `.env` 里的远程 MySQL。不要把 `.env`、数据库密码或模型 API Key 写进代码、文档、日志或提交。

## 不能改的行为

- 操作技能模拟考试仍是 6 题、100 分、120 分钟。分组和分值在 `frontend/src/exam/session.ts`，改规则前先看 `docs/decisions/`。
- 理论模拟考试是 190 题、100 分、90 分钟。判断 40 题、单选 140 题、多选 10 题。
- 密码散列是 scrypt，N=16384、r=8、p=1、盐 16 字节、散列 32 字节。要能校验库里已有的散列。
- 上传的答卷文件留在浏览器 IndexedDB。账号里只保存文字答案、记录和分数。
- 阅卷密钥只留在 `llm_settings`。接口响应只给末四位。
- 默认管理员用户名是 `admin`。已有账号时不要重置密码。

## 提交和发布

只有用户明确要求时才提交、推送或执行部署。`scripts/` 里没有把 Java 进程发布到线上的脚本。
