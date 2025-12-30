# Story 1.6: Smart Selection Bubble & Manual Input

**Parent Epic:** Epic 1 - Instant Analysis Companion

## User Story

As a Learner,
I want to analyze text either by selecting it on a webpage or pasting it into the sidebar,
So that I can get instant AI explanations regardless of whether I am browsing or have text from another source.

## Feature Overview

This story implements the two primary ways for users to initiate analysis in Zhiyue:
1.  **Smart Selection Bubble:** A non-intrusive floating bubble that appears when text is selected on a webpage, offering quick "Analyze" and "Explain" actions.
2.  **Sidebar Manual Input:** A dedicated input area in the Side Panel where users can paste text or images for analysis.

## Acceptance Criteria

### 1. Smart Selection Bubble (Webpage Interaction)
1.  **Given** the user is on any webpage.
2.  **When** the user selects a segment of text (and releases the mouse).
3.  **Then** a small, animated "Zhiyue Logo" bubble should appear floating near the selection.
4.  **And** the bubble should:
    *   Contain "Analyze" (分析) and "Explain" (解释) quick actions.
    *   Disappear if the user clicks elsewhere or scrolls significantly.

### 2. Bubble Actions
1.  **When** the user clicks "Analyze" or "Explain" on the bubble.
2.  **Then** the result should be displayed in an **In-Page Modal** for immediate feedback.
3.  **And** the modal should include an "Open in Side Panel" button to transfer the context to the persistent sidebar for deeper study.

### 3. Sidebar Manual Input
1.  **Given** the Side Panel is open and no analysis is active.
2.  **Then** an **Input / Drop Zone** should be visible.
3.  **When** the user pastes (`Ctrl+V`) text or an image into the Sidebar.
4.  **Then** the application should process the input immediately:
    *   **Text:** Automatically trigger the Analysis flow.
    *   **Image:** Display a preview thumbnail (OCR processing reserved for Story 1.8).

### 4. Sidebar "Get Selection" Utility
1.  **Given** the Side Panel is open.
2.  **When** the user clicks the "Get Selection" (获取选中) button.
3.  **Then** the input area should be populated with the currently selected text from the active browser tab.

## Implementation Notes

-   **Content Script (`src/content-scripts/`)**:
    -   Implement `SelectionBubble.vue` and `AnalysisModal.vue`.
    -   Use Shadow DOM to isolate styles from the host page.
    -   Ensure the bubble positioning logic handles screen edges correctly.
-   **Side Panel (`src/side-panel/`)**:
    -   Implement `ManualInput.vue` to handle paste events and user input.
    -   Connect input actions to the AI Analysis Store.
-   **Architecture**:
    -   Clipboard access relies strictly on user-initiated Paste events or explicit Message passing for "Get Selection".
    -   No background clipboard polling is utilized.

