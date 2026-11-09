# 测试

这里放跨模块的集成测试和端到端测试。

旧的 Node 账号和阅卷测试随那个接口一起删除了。抽题规则的实现在 `frontend/src/exam/session.ts` 和 `frontend/src/exam/theory.ts`。接口行为以 `docs/api/http.md` 为准。测试不要连接正在使用的远程库。
