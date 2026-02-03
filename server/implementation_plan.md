# 实施计划：后端 AI 代理与配额系统

## 1. 需求理解 (修正版)

系统将支持两种并存的 AI 调用模式，根据用户的登录状态自动切换：

1.  **未登录用户 (Visitor) - 保持现状**：
    - 继续使用前端现有的逻辑。
    - 用户需要在设置页面输入自己的 API Key。
    - 前端直接调用用户配置的第三方服务 (OpenAI, Gemini, DeepSeek 等)。
    - **不做任何破坏性修改**。

2.  **已登录用户 (Registered User) - 新增托管模式**：
    - 忽略用户在前端设置的 API Key。
    - 前端自动切换为调用后端代理接口。
    - 后端使用系统固定的 API Key (`Seedance1.8` 和 `Seedream4.5`) 调用指定模型。
    - 配额管理：按 **使用次数** 计费。

## 2. 详细技术方案

### 后端 (Server) 改造 (仅服务已登录用户)

1.  **环境配置**：
    - 配置 `SEEDANCE_API_KEY` 和 `SEEDREAM_API_KEY`。
    - 配置 Endpoint 和 Model Name。

2.  **新增 AI 模块 (`AiModule`)**：
    - **Controller** (`/api/ai`)：
      - `POST /chat`：处理文本请求，转发给 Seedance (Ark)。
      - `POST /image`：处理绘图请求，转发给 Seedream (Ark)。
      - **鉴权**：必须携带有效的 User Token。
    - **Service**：
      - 负责构建向 BytePlus (Ark) 的请求。
      - 调用 `UsageService` 检查并扣除用户配额（按次）。

3.  **配额系统调整**：
    - 将 `usage` 和 `users` 表中的计量单位逻辑理解为“次数”。
    - 为了兼容性，可以将 `1 次` 记录为 `tokensUsed: 1`。

### 前端 (Client) 改造 (双模式切换)

1.  **新增 AI Provider (`ServerProxyProvider`)**：
    - 在 `src/logic/ai/providers` 下新增 `server-proxy.ts`。
    - 实现 `TextGenerationProvider` 和 `ImageGenerationProvider` 接口。
    - 功能：将生成请求封装后发送给后端 `/api/ai` 接口。

2.  **修改 Provider 工厂逻辑 (`SceneService` / `useAiFactory`)**：
    - 引入 `AuthStore`。
    - **核心切换逻辑**：
      ```typescript
      if (authStore.isAuthenticated) {
        return new ServerProxyProvider(); // 登录用户走后端代理
      } else {
        return new GeminiProvider(apiKey); // 未登录用户走原有逻辑
      }
      ```
    - 这意味着已登录用户无需配置 API Key 即可使用 AI 功能。

## 3. 执行步骤

### 第一阶段：后端基础设施

1.  **配置**：在 server `.env` 添加 API Key。
2.  **API 开发**：实现 `/api/ai/chat` (支持流式) 和 `/api/ai/image`。
3.  **计费**：集成按次扣费。

### 第二阶段：前端接入

1.  **开发 Proxy Provider**：实现 `ServerProxyProvider`。
2.  **实现切换逻辑**：在获取 AI 服务实例的地方加入登录状态判断。
3.  **UI 优化**：已登录状态下，在设置页面的 API Key 输入框处显示“您正在使用官方托管通道，无需配置 Key”的提示。

### 第三阶段：测试

1.  **回归测试**：确保未登录状态下，输入 Gemini Key 仍能正常工作。
2.  **新功能测试**：登录后，无需 Key 即可生成内容，并正确扣除后端配额。

## 4. 待确认项

- **模型参数**：
  - Seedance 模型名确认使用：`seed-1-8-251228`
  - Seedream 模型名确认使用：`seedream-4-5-251128`
