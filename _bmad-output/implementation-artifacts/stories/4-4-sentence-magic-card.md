# Story 4.4: 整句魔法卡片 (Sentence Magic Card)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

作为一名用户，
我希望为我当前分析的整句日语生成一张富有艺术感的魔法卡片，
以便我通过视觉化的方式记忆句子的情境，而不需要关注具体的单词或繁琐的 Anki 导出。

## Acceptance Criteria

1.  **Prompt 模板管理 (Prompt Management)**:
    *   在系统 Prompt 注册表中新增 `sentence_card_image` 模板。
    *   **关键机制**：不再通过下拉菜单 "注入风格变量"，而是直接让用户编辑整个 Prompt 模板。
    *   **拼接逻辑**：最终发送给模型的 Prompt = `用户配置模版` + `\n\n` + `待生成句子上下文`。
    *   提供默认的 "手绘卡通风格" 模板作为 System Default。

2.  **整句制卡流程 (Sentence Card Workflow)**:
    *   在 Side Panel 的深度分析结果（Analysis Result）下方，设置"生成整句卡片"入口。
    *   点击后进入整句卡片生成视图。
    *   **无风格选择器**：UI 上不需要风格选择下拉框（风格由设置里的 Prompt 决定）。
    *   **直接生成**：点击生成按钮后，系统拼接当前 Prompt 模板与句子，调用多模态模型生成图片。

3.  **极简输出界面 (Simplified Output)**:
    *   生成成功后，仅展示：
        *   生成的图片（大图预览）。
        *   "保存图片"按钮（下载为 PNG/JPG）。
    *   **不显示** Anki 相关的字段（如单词音标、释义、例句文本等）。
    *   支持重新生成。

4.  **性能与体验**:
    *   使用 `isGenerating` 状态展示加载动画。
    *   如果生成失败，提供友好的错误提示。

## Tasks / Subtasks

- [x] Task 1: Prompt 模板定义与注册 (AC: #1)
  - [x] 1.1 在 `src/logic/prompts/sentence-card.ts` 定义 `SENTENCE_CARD_IMAGE_PROMPT` 常量（内容见 Dev Notes）。
  - [x] 1.2 在 `src/logic/prompts/index.ts` 注册新模板，使其在 Settings 中可见。
  - [x] 1.3 实现简单的 Prompt 拼接函数：`buildSentenceCardPrompt(template, sentence)`.

- [x] Task 2: AI Service & Store 扩展 (AC: #2, #4)
  - [x] 2.1 在 `src/logic/ai/card-generator.ts` 添加 `generateSentenceImage(sentence)` 方法。
  - [x] 2.2 逻辑：获取当前配置的 Prompt -> 拼接句子 -> 调用 `AiService.generateImage`。
  - [x] 2.3 在 `useAiStore` 中添加整句卡片相关的状态。

- [x] Task 3: UI 组件开发 - Output View (AC: #2, #3)
  - [x] 3.1 新建 `src/side-panel/components/MagicCard/SentenceCard.vue`。
  - [x] 3.2 **UI 简化**：移除原计划的风格选择器。只保留"生成"按钮、图片预览区、下载按钮。
  - [x] 3.3 实现生成和下载逻辑。

- [x] Task 4: 入口集成 (AC: #2)
  - [x] 4.1 修改 `AnalysisResult.vue`，添加"生成整句魔法卡片"按钮。
  - [x] 4.2 在 `SidePanel.vue` 中集成 SentenceCard 模态框。

- [x] Task 5: 交互优化 - 网页全屏展示 (User Request)
  - [x] 5.1 定义 Sidebar -> Content Script 通信协议 (`SHOW_SENTENCE_CARD_OVERLAY`).
  - [x] 5.2 Content Script 监听消息并在当前页面创建/显示全屏 Overlay.
  - [x] 5.3 移植 `SentenceCard` 组件逻辑到 Content Script Overlay 中（或新建 `SentenceCardOverlay.vue`）.
  - [x] 5.4 修改 SidePanel 逻辑：生成成功后发送消息给 Content Script，关闭/隐藏 SidePanel 上的相关状态.
  - [x] 5.5 确保图片由 Content Script 渲染，并未被网页样式污染 (Shadow DOM).

## Dev Notes

### Default Prompt Template (Defaults to Hand-Drawn Style)

```text
[系统 / 提示]
你是一名专门为中国学习者制作场景化手绘卡通日语学习卡片的插画助手。
请认真遵守以下规则。
🎨 风格规则
始终采用纯手绘风格：
草图线条、粗糙笔触、涂鸦感
禁止写实、禁止照片级阴影、禁止 3D
画风友好、可爱、适合学习
使用柔和的学习型配色
画布可按需要选择横向或纵向。
加入简约但有表现力的卡通元素：
小图标、符号、小角色
学习感 doodle（书、笔、对话框等）
若输入含有版权角色，必须用视觉相似但法律不同的替代角色。
🧩 内容规则
需要根据给定的日语句子制作场景化学习卡片。
目标是：
让学习者通过“看到一个场景”，理解句子结构，并让句中关键词以角色身份出现。
具体要求：
绘制一个简单的场景，体现该日语句子的含义。
将句子中的重要日语词语拟人化或物件化：
动词 → 动作角色
名词 → 场景物品或卡通物体
形容词 → 表情夸张的小角色
这些关键词必须中日双语标注，标注方式可为：
直接用手绘箭头指向场景中的对应角色或道具
或者在场景外单独画一个小区域，放置该单词的小画面 + 中日文本
所有文本必须简短、清晰、手写风格。

卡片需包含：
原句（日语）
中文翻译
3–6 个关键词（中文和日语）
一个符合句意的场景画面
注意保持留白，确保视觉清晰。

🚫 禁止事项
禁止：
写实或 3D 图像
直接使用版权角色
输出长段落
画面过于拥挤
使用数字 UI 风格或严格排版

🖼️ 任务

基于以下日语句子，创作一张场景化手绘卡通日语记忆卡片：
```

### Prompt Construction Logic
The final prompt sent to the model should be:
```javascript
const finalPrompt = `${userConfiguredTemplate}\n\n${sentence}`;
```

### Project Structure Notes
*   **`src/logic/prompts/sentence-card.ts`**: Store the default template here.
*   **Settings Persistence**: Because the prompt is long, ensure `chrome.storage.local` handles it correctly (it does, quota is ample for text).

### References
*   [Epic 4 Definition](_bmad-output/implementation-artifacts/epic-4-launch.md)

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash Thinking Experimental (2026-01-06)

### Debug Log References

N/A - 实施过程顺利，无重大调试问题

### Completion Notes List

1. ✅ **Prompt 模板系统扩展**: 成功添加 `sentence_card_image` Prompt 到系统注册表，支持用户在设置中自定义整句卡片生成提示词
2. ✅ **手绘卡通风格默认模板**: 实现了详细的日语学习场景化手绘卡片 Prompt，包含风格规则、内容规则和禁止事项
3. ✅ **AI 服务层扩展**: 在 `card-generator.ts` 中添加 `generateSentenceImage` 函数，整合 Prompt 服务和图片生成 API
4. ✅ **Store 状态管理**: 在 `useAiStore` 中添加完整的整句卡片生成状态（isGenerating, image, error）和方法（generate, clear）
5. ✅ **极简 UI 组件**: 创建 `SentenceCard.vue`，仅显示生成按钮、加载状态、图片预览和下载功能，完全不包含 Anki 相关逻辑
6. ✅ **入口集成**: 在 `AnalysisResult.vue` 添加紫色-粉色渐变按钮，在 `SidePanel.vue` 中添加模态框展示整句卡片组件
7. ✅ **用户体验优化**: 
   - 生成按钮使用独特的紫-粉渐变色，与单词卡片（蓝-紫）区分
   - 加载动画和友好的错误提示
   - 图片下载功能直接保存 PNG 格式
   - 支持重新生成功能
8. ✅ **全屏交互优化** (Task 5):
   - 生成卡片后，SidePanel 自动发送消息通知 Content Script
   - 在 Content Script (网页覆盖层) 中全屏展示大图
   - 支持全屏下载图片，显著提升查看体验

### File List

**新增文件:**
- `src/logic/prompts/sentence-card.ts` - 整句卡片 Prompt 模板和拼接函数
- `src/side-panel/components/MagicCard/SentenceCard.vue` - 整句卡片 UI 组件

**修改文件:**
- `src/logic/prompts/index.ts` - 导出整句卡片 Prompt
- `src/logic/prompts/prompt-service.ts` - 注册整句卡片 Prompt 到服务
- `src/logic/ai/card-generator.ts` - 添加整句图片生成方法
- `src/stores/ai-store.ts` - 添加整句卡片状态和方法
- `src/components/Analysis/AnalysisResult.vue` - 添加整句卡片生成按钮
- `src/side-panel/SidePanel.vue` - 集成整句卡片模态框
- `src/side-panel/components/MagicCard/SentenceCard.vue` - 添加全屏查看逻辑
- `src/content/ui/SentenceCardOverlay.vue` - 新增全屏卡片展示组件
- `src/content/ui/ContentOverlay.vue` - 集成全屏卡片组件与消息监听
