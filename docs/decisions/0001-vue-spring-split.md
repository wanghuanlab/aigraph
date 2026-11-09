# 0001 前后端分离，Vue 与 Spring Boot

考场是主产品，资料是辅助菜单。前端用 Vue 3，后端用 Spring Boot 3 和 Spring Data JPA，通过 HTTP 分开部署。

选择这个拆分，是为了让页面和账号、题库、阅卷各自演化。MySQL 继续用已经在用的 `aigraph` 库，JPA 映射现有表，不另起一套表名。

上一版 React 页面和 Node 接口已经从仓库移除。抽题、登录、阅卷和资料都在 `frontend/` 与 `backend/`。
