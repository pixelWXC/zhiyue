# Epic 4: Polishing & UX Refinement

## Overview
Based on the feedback from the "Party Mode" session, this epic focuses on resolving critical usability issues and enhancing the overall user experience. The main goals are to make the Anki export feature truly usable, provide a UI for managing system prompts, simplify the bubble interface by migrating heavy features to the sidebar, and introduce rapid AI services for instant feedback.

## Objectives
- **Fix Anki Export**: Refactor the export mechanism to a "split" model (Image Download + HTML Copy) to solve the large Base64 issue.
- **Prompt Management**: Allow users to view and modify system prompts via a new Settings interface.
- **UI Simplification**: Slim down the bubble UI, moving complex features to the Sidebar.
- **Responsiveness**: Implement "Rapid AI Services" for instant translation and token analysis.
- **Visual Polish**: Add image previews and other visual enhancements.

## Stories

### Story 4-1: System Settings & Prompt Management
- **Goal**: Create a centralized Settings page in the Sidebar.
- **Features**:
    - Gemini API Key management (moved from Bubble).
    - Prompt Engineering Lab: View/Edit/Reset system prompts.
    - Prompts stored in `chrome.storage`.
    - "Test IPC" removal.

### Story 4-2: Bubble UI Simplification & Sidebar Migration
- **Goal**: De-clutter the Bubble UI and establish the Sidebar as the home for "Heavy" features.
- **Features**:
    - Bubble: Remove Magic Card, Deep Explanation. Keep Translation, Simple Definition.
    - Sidebar: Handle "Deep Analysis", "Magic Card Generation".
    - Communication: Bubble triggers Sidebar actions with context.

### Story 4-3: Rapid AI Services (Fast Translation & Token Detail)
- **Goal**: Reduce perceived latency and provide instant utility.
- **Features**:
    - Rapid Translation: Auto-trigger cheap model for full-text translation.
    - Token Detail: Click token -> fetch simple definition/grammar/audio via cheap model.
    - Settings: Toggles for auto-trigger.

### Story 4-4: 整句魔法卡片 (Sentence Magic Card)
- **Goal**: 实现基于整句的魔法卡片生成功能，支持用户自定义绘图风格模板。
- **核心改动**:
    - 在 Prompt Management 中新增 `sentence_card_image` 提示词模板。
    - 用户可自定义绘图风格（手绘卡通、写实、极简等）。
    - 分析结果面板的"生成魔法卡片"入口改为整句魔法卡片。
    - 简化输出流程：只展示图片 + 下载按钮，无 Anki 相关流程。
- **技术实现**:
    - 模板 + 当前整句动态拼接后直接调用多模态绘图模型。
    - 去除中间的"模型生成场景描述"步骤，提升响应速度。

### Story 4-5: 单词魔法卡片 (Word Magic Card)
- **Goal**: 实现基于单词上下文的魔法卡片生成功能，与 Anki 导入流程结合。
- **核心改动**:
    - 在 Prompt Management 中新增 `word_card_image` 提示词模板。
    - 制卡按钮入口移动到 `TokenDetail` 组件内。
    - 正确传递完整上下文：单词、读音、释义、例句。
    - Anki 卡片布局优化：图片居中显示，符合记忆卡片设计规范。
- **技术实现**:
    - 模板 + 单词上下文动态拼接后调用绘图模型。
    - 保留 Anki 导入功能（下载图片 + 复制卡片内容）。
    - 优化卡片预览 UI 布局。

### Story 4-6: UI Visual Enhancements
- **Goal**: 视觉体验优化和收尾工作。
- **Features**:
    - Image Lightbox/Preview for Magic Cards.
    - Global toast notifications cleanup.
    - "Premium" feel adjustments.
