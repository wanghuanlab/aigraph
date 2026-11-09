# 0002 沿用 scrypt 散列，文件留在浏览器

库里的密码是 Node `scryptSync` 的结果：N=16384，r=8，p=1，盐 16 字节，散列 32 字节，均以十六进制存储。Java 用 Bouncy Castle 的同组参数校验。Spring Security 自带的 SCrypt 编码格式和这套记录对不上，所以不使用它。

答卷里的上传文件仍放在浏览器 IndexedDB。服务端只保存文字、题目列表和阅卷结果。这样换浏览器不会带走文件，也不会把大文件写进 MySQL。
