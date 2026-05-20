# 需求文档

## 引言

为 NextChat 项目添加 Auth.js + OIDC 认证功能，作为现有 accessCode 认证的增强方案。用户可以通过 OIDC Provider（如 Keycloak、Casdoor、Auth0 等）进行 SSO 登录，同时保留现有 accessCode 认证作为兼容方案。

## 需求

### Requirement 1 - Auth.js 集成与 OIDC Provider 配置

**User Story:** As a 部署管理员，需要配置 OIDC Provider 连接参数，以便让用户通过 SSO 登录。

#### Acceptance Criteria

1. 当环境变量 `OIDC_ISSUER`、`OIDC_CLIENT_ID`、`OIDC_CLIENT_SECRET` 均配置时，启用 OIDC 登录。
2. 当上述环境变量未配置时，OIDC 登录不可用，不影响现有 accessCode 认证。
3. Auth.js 使用 JWT session 模式，不依赖数据库。

### Requirement 2 - 认证页面 OIDC 登录入口

**User Story:** As a 用户，需要在认证页面看到 OIDC 登录按钮，以便通过 SSO 快速登录。

#### Acceptance Criteria

1. 当 OIDC 已启用时，认证页面显示 OIDC 登录按钮。
2. 当 OIDC 未启用时，认证页面不显示 OIDC 登录按钮，仅显示现有 accessCode 输入框。
3. 点击 OIDC 登录按钮后，跳转到 OIDC Provider 登录页面。
4. OIDC 登录成功后，自动返回 NextChat 并进入聊天页面。

### Requirement 3 - OIDC Token 传递与服务端校验

**User Story:** As a 系统，需要将 OIDC token 安全地从客户端传递到服务端，并在服务端进行校验。

#### Acceptance Criteria

1. 客户端通过 Authorization header 传递 OIDC token，格式为 `Bearer oidc-{token}`。
2. 服务端 `parseApiKey()` 函数能识别 `oidc-` 前缀并提取 token。
3. 服务端 `auth()` 函数对 OIDC token 进行 JWT 签名验证和过期检查。
4. OIDC token 校验通过后，返回 `{ error: false }`，后续逻辑与现有认证一致。

### Requirement 4 - 与现有认证机制并存

**User Story:** As a 用户/管理员，需要 OIDC 认证与现有 accessCode 认证并存，以便平滑迁移。

#### Acceptance Criteria

1. 现有 accessCode 认证逻辑不受 OIDC 改动影响。
2. 现有 API Key 认证逻辑不受 OIDC 改动影响。
3. 用户可以同时使用 OIDC 登录和 accessCode 登录。
4. accessStore 新增 `oidcToken` 字段，不影响现有字段。