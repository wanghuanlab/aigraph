# 改代码约定

- 页面用中文。新界面沿用 `frontend/src/styles.css` 里的考场纸面：墨色、一张试题单、一个印章红。
- 前端请求走 `frontend/src/api.ts`。后端路径保持 `/api/...`，Cookie 名是 `aigraph_session`。
- JPA 实体对现有列，`ddl-auto` 保持 `none`。改表时同时改 `database/schema.sql`，并写一条 `docs/decisions/` 记录。
- 题库正文是 JSON 列。学生端不渲染 `hidden` 块，也不展示表格的 `note`。
- 阅卷只接受管理员配置的 OpenAI 兼容地址，不把浏览器传来的任意提示词转发出去。
- 校验素材用 `python3 scripts/verify-exam-assets.py`。生成素材会读 `local/course-docs/`，那个目录不进 git。
- 不要把 `local/`、`.env`、`exam-assets/`、`backend/target/` 或 `frontend/node_modules/` 加进版本库。
