# 架构

浏览器里的 Vue 应用只调用本站 `/api`。开发时 Vite 把 `/api` 转到 `127.0.0.1:8080` 的 Spring Boot。生产环境需要同一台站点把页面和 `/api` 指到这两个产物。

```text
Vue (frontend) -- /api --> Spring Boot (backend) -- JPA --> MySQL aigraph
                         \-- 阅卷 --> 管理员配置的 OpenAI 兼容接口
```

题库、账号、会话、自测、答卷文字和模型配置都在 MySQL。表结构见 `database/schema.sql`。空的操作技能题库从 `database/seed/practical/questions.json` 导入一次。空的理论题库从 `database/seed/theory/questions.json` 导入一次，对外接口不带标准答案。

后端根包是 `com.wanghuanlab.aigraph`，启动类留在这里。其余代码按职责分在子包：`web` 是接口和会话 Cookie，`account` 是账号、登录和答卷记录，`exam` 是操作技能题库，`theory` 是理论题库，`grading` 是阅卷模型和评分。

上传文件留在浏览器的 IndexedDB `aigraph-practical-exams`。下载素材从 `/exam-assets` 读取，文件在仓库根目录的 `exam-assets/`，不进 git。

`docker-compose.yml` 提供一套独立的本机 MySQL，端口 3306。当前 `.env` 指向的是服务器上的库，端口 11306。两套库不要混用。
