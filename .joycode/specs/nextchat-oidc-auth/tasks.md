# 实现任务

## 任务概览
- 总任务数: 5
- 任务分类: 开发

## 开发任务
- [ ] 1. 安装依赖与新增常量/环境变量配置
  - 安装 `next-auth@beta` 和 `jose` (JWT 验证库)
  - 在 `app/constant.ts` 新增 `OIDC_TOKEN_PREFIX` 常量
  - 在 `app/config/server.ts` 新增 OIDC 相关环境变量声明和配置读取
  - 在 `app/api/config/route.ts` 返回客户端配置中增加 `isOidc` 标识
  - _Requirements: 1_

- [ ] 2. 新增 Auth.js Route Handler 与 OIDC token 验证工具
  - 创建 `app/api/auth/[...nextauth]/route.ts`，配置 OIDC provider
  - 创建 `app/api/auth/session/route.ts`，提供 session 查询端点
  - 创建 `app/utils/oidc.ts`，实现 OIDC token 服务端验证逻辑
  - _Requirements: 1, 3_

- [ ] 3. 改造服务端 auth() 支持 OIDC token 校验
  - 修改 `app/api/auth.ts` 的 `parseApiKey()` 函数，增加 `oidc-` 前缀识别
  - 修改 `auth()` 函数，增加 OIDC token 校验分支
  - _Requirements: 3, 4_

- [ ] 4. 改造客户端 accessStore 与 getHeaders() 支持 OIDC
  - 修改 `app/store/access.ts`，新增 `oidcToken` 字段和 `isValidOidc()` 方法
  - 修改 `isAuthorized()` 方法，增加 OIDC 判断
  - 修改 `app/client/api.ts` 的 `getHeaders()` 函数，增加 OIDC token 传递
  - _Requirements: 3, 4_

- [ ] 5. 改造认证页面增加 OIDC 登录按钮
  - 修改 `app/components/auth.tsx`，增加 OIDC 登录按钮
  - 根据服务端 `isOidc` 配置控制按钮显示
  - 登录成功后将 token 存入 accessStore.oidcToken
  - _Requirements: 2_