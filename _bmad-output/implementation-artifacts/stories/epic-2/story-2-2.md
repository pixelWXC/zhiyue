# Story 2-2: Recursive Syntax Visualization Component

**Parent Epic**: Epic 2
**Status**: in-progress
**Priority**: High

## Context
After analyzing the sentence with Gemini Pro "Thinking Mode" (implemented in Story 2-1), we receive a nested JSON structure representing the dependency tree. We need a UI component to visualize this structure in the narrow side panel (width ~300px).

## Requirements
1.  **UI/UX**:
    - FileSystem-like collapsible tree view.
    - Compact design optimized for 300px side panel.
    - Visual hierarchy through indentation and connecting lines (optional but nice).
    - Display `token` (word), `reading` (if available), `partOfSpeech`, and `role`.
    - Interactive: Click to expand/collapse nodes.
2.  **Tech Stack**:
    - Vue 3 Recursive Component (`SyntaxTreeNode.vue`).
    - Flexbox/Grid for layout.
    - Tailwind CSS/Shadcn UI for styling.
3.  **Data Structure**:
    - Input: `SyntaxNode` (defined in `src/logic/prompts/syntax-analysis.ts`).

## Acceptance Criteria
- [ ] `SyntaxTree.vue` container component created.
- [ ] `SyntaxTreeNode.vue` recursive component created.
- [ ] Tree renders correctly for nested JSON from Gemini Pro.
- [ ] Nodes show "Token" (primary), "Role" (badge/tag), "POS" (secondary).
- [ ] Expand/Collapse functionality works.
- [ ] UI handles infinite depth (conceptually) without breaking layout, though real sentences are finite.
- [ ] "Loading" state is handled (skeleton or spinner) if data is pending.
