# Story 1-4: AI Service Layer & Token Streaming

**Status**: done
**Epic**: Epic 1 - Instant Analysis Companion
**Started**: 2025-12-26
**Completed**: 2025-12-26
**Developer**: Gemini AI

## User Story

作为用户，我希望系统能通过 Google Gemini 模型对文本进行智能分析，并以流式（Streaming）方式快速返回结果，这样我就能获得即时的反馈，而不需要等待漫长的整个响应过程。

## Acceptance Criteria

1.  **AI Client Integration**
    - [x] 集成 `@google/genai` SDK。
    - [x] 能够读取 `settings-store` 中的 API Key 进行鉴权。
    - [x] 强制使用 `gemini-3-flash-preview` 和 `gemini-3-pro-preview` 模型。

2.  **Streaming Infrastructure**
    - [x] 实现流式响应解析器（Stream Parser），适配新 SDK 的迭代器模式。
    - [x] Background Script 通过 `chrome.runtime.connect` (Ports) 处理长连接流式响应。
    - [x] 实现 `ai-stream` 端口监听与数据回传。

3.  **Prompt Strategy**
    - [x] 创建基础的 System Prompt 模板 (`src/logic/prompts/analysis.ts`).
    - [x] 实现 "Thinking" 和 "Flash" 模式的配置注入。

4.  **Error Handling**
    - [x] 当 API Key 无效或配额超限时，返回清晰的中文错误信息。
    - [x] UI 界面包含加载状态、错误提示和实时打字机效果。

## Implementation Logic

- **Client**: 使用 `@google/genai` (Preview)。
- **Communication**: 采用 Hybrid 模式 (Bridge for controls, Ports for streaming)。
- **Store**: `ai-store` 封装了 `analyzeText` 动作，管理流式连接。

## Artifacts
- `src/logic/ai/client.ts`: AI 客户端封装
- `src/background/index.ts`: 流式端口监听器
- `src/stores/ai-store.ts`: 状态管理
- `src/side-panel/SidePanel.vue`: UI 实现
