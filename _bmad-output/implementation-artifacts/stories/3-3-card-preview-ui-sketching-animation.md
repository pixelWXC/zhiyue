# Story 3.3: Card Preview UI & "Sketching" Animation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a User,
I want to see a beautiful preview of my card being created, with a "sketching" animation while I wait,
so that the waiting time feels like a creative process rather than just loading.

## Acceptance Criteria

1.  **Generative UI State (The "Sketching" Loading):**
    *   **Given** the card generation is in progress (`isGeneratingCard` is true),
    *   **Then** the UI should display a "Skeleton" version of the card.
    *   **And** a shimmering or "sketching" animation (simulating pencil strokes) should play over the image placeholder area.
    *   **And** text placeholders should pulse gently.

2.  **Magic Card Layout (The "Souvenir"):**
    *   **Given** the card data arrives (`cardData` is populated),
    *   **Then** the card should render with a "Magic Souvenir" aesthetic (using Shadcn `Card` component as base).
    *   **And** it must display:
        *   **Target Word** (Large, centered).
        *   **Reading** (Furigana styling).
        *   **Meaning** (Clean definition).
        *   **Sentence** (The example sentence).
        *   **Hint** (Subtle, secondary text).
    *   **And** the Image should appear at the top or center with a smooth fade-in transition when ready.

3.  **Visual Polish & Integration:**
    *   **Given** the Side Panel context,
    *   **Then** the card must fit within the 300px-400px width constraint without horizontal scrolling.
    *   **And** font sizes must be legible (Base user font + Specific Japanese font stack if applicable).
    *   **And** "Export" buttons (for Story 3.4) should be visible but disabled until generation completes.

4.  **Error Handling (UI):**
    *   **Given** an error occurs (`cardError` is present),
    *   **Then** the card area should display a friendly "Humble Robot" error state (as per UX) instead of a red crash screen.
    *   **And** a "Retry" button should be available.

## Tasks / Subtasks

- [x] Task 1: Create `MagicCard` Component Structure
  - [x] Create `src/side-panel/components/MagicCard/MagicCard.vue`.
  - [x] Implement the layout using Shadcn-vue `Card`, `CardHeader`, `CardContent`, `CardFooter`.
  - [x] Define props: `data: FlashcardData | null`, `isLoading: boolean`, `image: string | null`.

- [x] Task 2: Implement "Sketching" Loading State (Generative UI)
  - [x] Create `MagicCardSkeleton.vue` (or internal template) using Tailwind `animate-pulse` or custom SVG stroke animation.
  - [x] Implement the switch logic: Show Skeleton while `isLoading` is true.

- [x] Task 3: Integrate into `SidePanel.vue`
  - [x] Add a new mechanism to trigger card generation (e.g., a "Generate Card" button in `AnalysisResult`).
  - [x] Display the `MagicCard` component (likely in a Modal or a new "Card" Tab to focus attention).
  - [x] Connect strictly to `useAiStore` state (`cardData`, `isGeneratingImage`, `imageResult`).

- [x] Task 4: Add Visual Polish (Transitions & Error)
  - [x] Add Vue `<Transition>` for the image fade-in.
  - [x] Create the "Humble Robot" error view within the card boundary.

## Dev Notes

### Architecture & Patterns
-   **Component Location**: `src/side-panel/components/MagicCard/` describes a domain-specific feature component.
-   **Style System**: Use **standard Tailwind** (no `zy-` prefix) because this exists wholly within the Side Panel context.
-   **Iconography**: Use `lucide-vue-next` for any icons (e.g., Retry, Loading).
-   **State Connection**: Read directly from `aiStore`. Do not duplicate state locally in the component.

### UX Design Specs
-   **Sketching Animation**: The UX specifies a "Sketching" feel. If complex SVG animation is too heavy, a refined `bg-gradient` shimmy with a "pencil" icon overlay can work as an MVP.
-   **Aesthetics**: "Hand-drawn" feel can be enhanced by using a slightly rounded border or a specific font for the Japanese text if available (otherwise system default).
-   **Width Constraint**: 320px is the safe minimum width to test against.

### References
-   [Source: _bmad-output/planning-artifacts/ux-design-specification.md#21-defining-experience](UX: Magic Souvenir)
-   [Source: src/types/card.ts](Data Model Definition)

## Dev Agent Record

### Agent Model Used
gemini-2.0-flash-exp

### Debug Log References
无

### Completion Notes List
- ✅ 创建了 `MagicCard.vue` 组件，实现完整的卡片布局，支持加载、错误、内容和空白四种状态
- ✅ 创建了 `MagicCardSkeleton.vue` 组件，实现 "sketching" 加载动画，包含 SVG 笔触动画和铅笔图标浮动效果
- ✅ 在 `AnalysisResult.vue` 添加 "生成魔法卡片" 按钮，触发卡片生成流程
- ✅ 在 `SidePanel.vue` 集成 MagicCard 模态窗口，连接 AI Store 状态（cardData, isGeneratingCard, imageResult 等）
- ✅ 实现自动图片生成：卡片内容生成成功后，自动调用 `generateCardImage` 生成配图
- ✅ 实现 "Humble Robot" 错误状态，友好的错误提示和重试按钮
- ✅ 实现图片淡入过渡效果（Vue Transition）
- ✅ 实现卡片宽度限制（320px-400px），适配侧边栏窄屏显示
- ✅ Dark Mode 支持完整

### File List
- src/side-panel/components/MagicCard/MagicCard.vue (新建)
- src/side-panel/components/MagicCard/MagicCardSkeleton.vue (新建)
- src/components/Analysis/AnalysisResult.vue (修改)
- src/side-panel/SidePanel.vue (修改)
- src/content/dist.css (修改)

### Senior Developer Review (AI)

#### 🟢 Review Outcome: PASS
**Date:** 2025-12-31
**Reviewer:** Antigravity

**Findings Fixed:**
- [x] **[MEDIUM][UX]** 修复了图片生成过程中不必要地显示 Skeleton 的问题（现在生成文本后会直接显示文本，图片单独占位淡入）。
- [x] **[MEDIUM][DOC]** 补充了 `src/content/dist.css` 到文件修改列表。
- [x] **[LOW][CODE]** 清理了 `MagicCard.vue` 中的冗余代码（unused refs/functions）。

**Verification:**
- AC1: Skeching 动画正常 (MagicCardSkeleton.vue)
- AC2: 魔法卡片布局符合设计规范 (MagicCard.vue)
- AC3: 侧边栏宽度适配良好
- AC4: 友好错误处理 (Humble Robot) 已实现

**Final Notes:** Implementation is solid and follows the architectural guidelines. Great work on the "Sketching" animation feel!

