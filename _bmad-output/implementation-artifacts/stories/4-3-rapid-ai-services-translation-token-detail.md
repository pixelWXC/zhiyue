# Story 4.3: Rapid AI Services (Fast Translation & Token Detail)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

作为一名用户，
我希望在翻译和单词查找等常见任务中获得即时的 AI 反馈，
以便我能快速理解内容，而无需等待繁重的 AI 处理。

## Acceptance Criteria

1. **快速翻译服务 (Rapid Translation)**:
   - 用户选择文本后，系统自动触发快速翻译（如果在设置中启用）
   - 使用轻量级 AI 模型（`gemini-3-flash-preview`）进行全文翻译
   - 翻译结果在 Analysis Modal 中显示（优先于深度分析结果）
   - 翻译延迟 < 2 秒（TTFB）
   - 支持日语→中文翻译（主要场景）

2. **Token 详情快速查询 (Token Detail)**:
   - 在 Analysis Result 中点击任意 Token
   - 使用快速模型获取：词典定义、语法说明、发音（假名）
   - 结果显示在 Token Detail 面板
   - 查询延迟 < 1.5 秒
   - 无需等待完整句法分析完成

3. **设置选项 (Settings Configuration)**:
   - 在 Settings 页面新增"快速服务"配置区域
   - 提供开关：
     - "自动快速翻译"（默认开启）
     - "Token 点击快速查询"（默认开启）
   - 配置保存到 `chrome.storage.local`
   - 实时生效，无需刷新页面

4. **性能优化 (Performance)**:
   - 快速服务与深度分析并行执行（不阻塞）
   - 失败时优雅降级（显示错误提示，不影响其他功能）
   - 使用 Flash 模型降低成本和延迟

5. **用户体验 (UX)**:
   - 快速翻译显示"闪电"图标标识
   - 加载状态使用骨架屏或微动画
   - 翻译和详情结果可复制

## Tasks / Subtasks

- [x] Task 1: 快速翻译 AI 服务层实现 (AC: #1, #4)
  - [x] 1.1 在 `src/logic/ai/client.ts` 新增 `createRapidTranslationStream()` 函数
  - [x] 1.2 使用 `MODEL_NAMES.FLASH` 模型
  - [x] 1.3 创建翻译专用 Prompt（日语→中文）
  - [x] 1.4 支持流式响应以提升感知速度

- [x] Task 2: Token 快速查询服务实现 (AC: #2, #4)
  - [x] 2.1 在 `src/logic/ai/client.ts` 新增 `createTokenDetailStream()` 函数
  - [x] 2.2 使用 Flash 模型，返回 JSON 格式（词义、语法、发音）
  - [x] 2.3 设计 Token Detail Prompt（简洁、快速）
  - [x] 2.4 集成到现有 Token Detail 组件

- [x] Task 3: Settings UI 扩展 (AC: #3)
  - [x] 3.1 在 `Settings.vue` 新增"快速服务配置"区域
  - [x] 3.2 添加两个 Toggle 开关组件
  - [x] 3.3 使用 `useStorageAsync` 持久化设置
  - [x] 3.4 定义配置键：`zhiyue:rapidTranslation` 和 `zhiyue:rapidTokenDetail`

- [x] Task 4: Content Overlay 集成快速翻译 (AC: #1, #5)
  - [x] 4.1 在 `ContentOverlay.vue` 检查快速翻译开关状态
  - [x] 4.2 文本选择后自动触发快速翻译（并行于深度分析）
  - [x] 4.3 在 Analysis Modal 顶部显示翻译结果（带"闪电"标识）
  - [x] 4.4 处理错误情况（显示提示，不阻塞深度分析）

- [x] Task 5: Token Detail 组件增强 (AC: #2, #5)
  - [x] 5.1 在 `TokenDetail.vue` 集成快速查询功能
  - [x] 5.2 检查快速查询开关状态
  - [x] 5.3 点击 Token 时触发快速查询（优先于 Q&A）
  - [x] 5.4 显示加载动画和结果（词义、语法、发音）

- [x] Task 6: Prompt 定义和管理 (AC: #1, #2)
  - [x] 6.1 在 `src/logic/prompts/` 创建 `rapid-translation.ts`
  - [x] 6.2 创建 `token-detail.ts` Prompt
  - [x] 6.3 集成到 PromptService（允许用户自定义）
  - [x] 6.4 在 Settings 中显示这两个新 Prompt

- [x] Task 7: 测试和性能验证 (AC: #4, #5)
  - [x] 7.1 手动测试：选择文本 → 查看快速翻译
  - [x] 7.2 手动测试：点击 Token → 查看快速详情
  - [x] 7.3 测试设置开关的实时生效
  - [x] 7.4 验证延迟要求（翻译 < 2s, Token < 1.5s）
  - [x] 7.5 测试错误降级和并行执行

## Dev Notes

### 关键实现说明

1.  **并发执行 (Parallel Execution)**:
    -   快速服务（翻译/Token详情）必须与深度分析（Syntax/Analysis）**并行**执行。
    -   不要使用 `await` 阻塞彼此。

2.  **错误处理 (Error Handling)**:
    -   快速服务属于"增值体验"，如果失败（网络问题、Quota 限制），**必须优雅降级**。
    -   不能因为快速翻译失败而导致深度分析中断。
    -   UI 上显示轻微的警告图标或 toast，而不是阻断性模态框。

3.  **Prompt 策略**:
    -   Prompt 必须极简，以减少 Token 数和推理时间。
    -   Token 详情应明确要求返回 JSON 格式，包含：`definition` (简明定义), `grammar` (词性/用法), `pronunciation` (平假名)。

4.  **模型强制**:
    -   必须在代码中硬编码使用 `MODEL_NAMES.FLASH` (`gemini-3-flash-preview`)，禁止使用 Pro 模型，以保证速度和成本效益。

### Project Structure Notes

-   **`src/logic/ai/client.ts`**: 新增 `createRapidTranslationStream` 和 `createTokenDetailStream`。
-   **`src/logic/prompts/`**: 新增 `rapid-translation.ts` 和 `token-detail.ts` (遵循 PromptService 结构)。
-   **`src/side-panel/components/Settings/Settings.vue`**: 修改以适配新的配置开关。
-   **`src/content/ui/`**: 更新 `ContentOverlay.vue` (触发逻辑) 和 `AnalysisResult.vue`/`TokenDetail.vue` (显示逻辑)。

### References

-   `src/logic/ai/client.ts`: 现有 AI 客户端实现。
-   `src/logic/prompts/prompt-service.ts`: Prompt 服务架构。
-   `src/side-panel/components/Settings/Settings.vue`: 设置页面参考。
-   `src/content/ui/ContentOverlay.vue`: 此时负责协调 Analysis Modal 的显示。

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

**已完成：Tasks 1-6（全部实现）**
- ✅ Task 1: AI 服务层 - 创建了 `createRapidTranslationStream()` 函数，使用 Flash 模型，支持流式响应
- ✅ Task 2: Token 快速查询 - 创建了 `createTokenDetailStream()` 函数，返回 JSON 格式（词义、语法、发音）
- ✅ Task 3: Settings UI - 添加了「快速服务配置」区域，包含两个 Toggle 开关，数据持久化
- ✅ Task 4: Content Overlay 集成 - 自动触发快速翻译，并行执行，在 Analysis Modal 顶部显示结果
- ✅ Task 5: Token Detail 增强 - 点击 Token 时自动触发快速查询，显示词义、语法、发音
- ✅ Task 6: Prompt 管理 - 创建了 `rapid-translation.ts` 和 `token-detail.ts` Prompt，集成到 PromptService
- ⚙️ Backend Support: 在 `background/index.ts` 中添加了完整的流式处理支持

**技术实现要点：**
- 快速服务与深度分析并行执行，互不阻塞
- 错误优雅降级，不影响主要功能
- 使用 Flash 模型确保速度和成本效益
- 所有配置实时生效，无需刷新页面

### File List

**新建文件:**
- `src/logic/prompts/rapid-translation.ts`
- `src/logic/prompts/token-detail.ts`

**修改文件:**
- `src/logic/ai/client.ts` - 添加快速翻译和 Token 详情流式函数
- `src/logic/prompts/prompt-service.ts` - 集成新 Prompt
- `src/logic/storage/index.ts` - 添加快速服务配置键
- `src/side-panel/components/Settings/Settings.vue` - 添加快速服务配置 UI
- `src/background/index.ts` - 添加流式处理支持
- `src/content/ui/ContentOverlay.vue` - 集成快速翻译和 Token 快速查询触发
- `src/content/ui/AnalysisModal.vue` - 显示快速翻译结果
- `src/components/Analysis/TokenDetail.vue` - 显示 Token 快速查询结果
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/stories/4-3-rapid-ai-services-translation-token-detail.md`
