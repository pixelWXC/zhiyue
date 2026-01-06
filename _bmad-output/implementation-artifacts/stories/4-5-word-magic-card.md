# Story 4.5: 单词魔法卡片 (Word Magic Card)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

作为一名日语单词学习者，
我希望在查看单词详情时，能直接为该单词生成一张结合了上下文例句的场景化记忆卡片，并能方便地将其导入到 Anki 中，
以便我通过图像联想（Dual Coding）更高效地记忆单词的含义和用法，同时避免手动制作卡片的繁琐。

## Acceptance Criteria

1.  **Prompt 模板管理 (Prompt Management)**:
    *   在系统 Prompt 注册表中新增 `word_card_image` 模板。
    *   **Context 结构**：Prompt 需接收 `Word` (单词), `Pronunciation` (读音), `Definition` (释义), `Sentence` (为了提供场景的例句) 四个维度的信息。
    *   **默认风格**：提供针对单词优化的"手绘卡通"默认模板，强调单词在画面中的主体地位或场景关联。

2.  **入口集成 (Ui Entry)**:
    *   在 `src/components/Analysis/TokenDetail.vue` 组件中添加"生成单词卡片" (Magic Card) 按钮。
    *   位置建议：位于单词/读音区域附近，或者底部操作栏。
    *   点击后触发生成流程，展示卡片生成界面。

3.  **生成逻辑 (Generation Logic)**:
    *   调用 `AiService` 时，需组装完整的单词上下文传给 Prompt。
    *   若当前单词没有对应的例句（TokenDetail 有时可能只显示单词），需仅基于单词+释义生成，或提示用户。

4.  **卡片展示与 Anki 导出 (Display & Export - The "Split Model")**:
    *   **展示**：生成成功后，展示大图预览。布局上应将图片居中。
    *   **导出策略**：为解决 Base64 字符串过长导致 Anki 导入失败或剪贴板卡顿的问题，**必须**采用分离式导出：
        *   **按钮 A [下载图片]**: 将生成的图片直接下载为本地文件 (PNG/JPG)。
        *   **按钮 B [复制 Anki 文本]**: 复制一段预格式化的 HTML/文本（包含 `<img src="文件名">` 占位符或仅文本信息），用户在 Anki 中粘贴文本后，再拖入下载的图片。
        *   *(可选优化)*: 如果技术允许，尝试使用 Clipboard API 写入 `image/png` Blob，但必须保留"下载文件"作为可靠回退。考虑到 Epic 要求 "Split model"，优先实现 下载+复制文本。

5.  **状态管理与反馈**:
    *   使用 `isGenerating` 状态控制 UI 加载反馈。
    *   错误处理：生成失败需提示具体原因。

## Tasks / Subtasks

- [x] Task 1: Prompt 模板定义 (AC: #1)
  - [x] 1.1 新建 `src/logic/prompts/word-card.ts`，定义 `WORD_CARD_IMAGE_PROMPT` 常量。
  - [x] 1.2 Prompt 设计：要求模型基于例句描绘场景，但重点突出目标单词的概念。
  - [x] 1.3 在 `src/logic/prompts/index.ts` 中注册 `word_card_image`。

- [x] Task 2: AI Service & Store 扩展 (AC: #3)
  - [x] 2.1 修改 `src/logic/ai/card-generator.ts`，添加 `generateWordImage(context: WordContext)` 方法。
  - [x] 2.2 `WordContext` 接口定义：包含 `word`, `kana`, `meaning`, `sentence`。
  - [x] 2.3 在 `useAiStore` (src/stores/ai-store.ts) 中添加单词卡片专属的状态 `wordCardState` (image, isGenerating, error)，与 `sentenceCardState` 区分开，避免状态冲突。

- [x] Task 3: UI 组件开发 - WordCard (AC: #4)
  - [x] 3.1 新建 `src/side-panel/components/MagicCard/WordCard.vue`。
  - [x] 3.2 实现图片展示区。
  - [x] 3.3 实现 "Split Export" 操作区：
    - [x] "保存图片" (Save Image) 按钮。
    - [x] "复制 Anki 内容" (Copy for Anki) 按钮 (生成包含单词、释义、例句的 HTML 片段)。
  - [x] 3.4 保持与 `SentenceCard` 相似的视觉风格（Consider creating a shared `MagicCardBase` component if duplication is high, otherwise Keep It Simple Separate (KISS) first）。

- [x] Task 4: 入口集成 (AC: #2)
  - [x] 4.1 修改 `src/components/Analysis/TokenDetail.vue`。
  - [x] 4.2 引入 `WordCard` 组件（使用 Modal 或 Overlay 方式展示）。
  - [x] 4.3 绑定点击事件：收集当前 Token 信息 -> 调用 Store Action -> 打开 Modal。

## Dev Notes

- **Architecture Compliance**:
  - Follow `src/logic/prompts` pattern for new prompts.
  - Keep logic in `AiService` / `card-generator.ts`, UI just renders state.
  - Use `webext-bridge` if communication between Content Script (TokenDetail is inside Main Content analysis result?) and SidePanel is needed.
  - **Correction**: `TokenDetail.vue` is likely part of the `src/content` (injected UI) or `src/components` used by `AnalysisResult.vue`. Since `AnalysisResult.vue` previously used `SidePanel` for Sentence Card generation (via `SHOW_SENTENCE_CARD_OVERLAY` or likely `SidePanel` logic), check `TokenDetail.vue` location.
  - If `TokenDetail` is in Content Script, and `WordCard.vue` needs `AiService` (which might rely on background context or SidePanel context for keys), ensure the call path is correct. Story 4-4 established `SHOW_SENTENCE_CARD_OVERLAY` for *display*. For *generation*, if triggered from Content Script, it usually sends a message to SidePanel/Background.
  - **Recommendation**: Trigger generation via message to SidePanel (which holds the AI Service & Keys), SidePanel handles generation, then sends result back or opens `WordCard` in SidePanel (or Overlay).
  - Epic Description says: "制卡按钮入口移动到 `TokenDetail` 组件内".
  - Epic 4-5 says: "保留 Anki 导入功能".

### Integration Logic
- **Trigger**: `TokenDetail` (Content) -> Message `GENERATE_WORD_CARD` -> SidePanel/Background.
- **Processing**: SidePanel invokes AI Service.
- **Display**: SidePanel shows `WordCard` Modal OR Content Overlay.
    - Story 4-5 doesn't explicitly force Overlay like 4-4. But consistency suggests Overlay if possible. However, Epic says "Anki Import flow", checking previous implementation (Story 3), Anki export might be complex.
    - Decision: Use **SidePanel Modal** for `WordCard` initially (easier for heavy HTML/Copy operations), OR **Overlay** if strictly following 4-4 pattern. Given Epic 4-2 goal is "Bubble triggers Sidebar actions", putting the "Heavy" card interface in Sidebar (SidePanel) is safer and aligned with Epic 4-2.
    - **Refined Plan**: Click in `TokenDetail` -> Open SidePanel (if closed) -> Switch to Word Card View.

### Project Structure Notes

- `src/components/Analysis/TokenDetail.vue`: existing file.
- `src/logic/prompts/word-card.ts`: new file.
- `src/side-panel/components/MagicCard/WordCard.vue`: new file.

### References

- [Epic 4 Definition](_bmad-output/implementation-artifacts/epic-4-launch.md)
- [Story 4-4](_bmad-output/implementation-artifacts/stories/4-4-sentence-magic-card.md) (Reference for Prompt/Service pattern)
- [Story 4-2](_bmad-output/implementation-artifacts/stories/4-2-bubble-ui-simplification-sidebar-migration.md) (Reference for SidePanel migration strategy)

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash

### Debug Log References

- Fixed `generateWordImage` call signature in `ai-store`.
- Implemented `WordCard` component with Split Export model.
- Integrated `WordCard` into `TokenDetail.vue` via Modal.
- Adapted `buildWordCardPrompt` for better prompt construction.
- Adjusted Anki clipboard content format.

### Completion Notes List

- Implemented "Word Magic Card" feature with distinction from Sentence Magic Card.
- Used "Split Model" for Anki export: Download Image + Copy HTML Text.
- Prompt engineering focused on "Scene Illustration" based on context.
- UI integrated into TokenDetail with a flashcard-style preview.

### File List

- `src/logic/prompts/word-card.ts` (New)
- `src/logic/prompts/word-card.spec.ts` (New)
- `src/logic/prompts/index.ts` (Modified)
- `src/logic/prompts/prompt-service.ts` (Modified)
- `src/logic/ai/card-generator.ts` (Modified)
- `src/stores/ai-store.ts` (Modified)
- `src/side-panel/components/MagicCard/WordCard.vue` (New)
- `src/components/Analysis/TokenDetail.vue` (Modified)
