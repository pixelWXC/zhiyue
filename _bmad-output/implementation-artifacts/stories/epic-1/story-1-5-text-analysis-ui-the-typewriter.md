# Story 1.5: Text Analysis UI (The "Typewriter")

## Description
**As a User,**
I want to see the grammatical analysis of my text appear in real-time as it is generated,
So that I don't have to wait for the full process to finish before reading.

## Acceptance Criteria
- [x] **Given** analysis is in progress
- [x] **When** new tokens arrive from the stream
- [x] **Then** they should appear sequentially in the UI (Typewriter effect)
- [x] **And** each token should display its word, reading (furigana), and POS tag
- [x] **And** the layout should handle wrapping gracefully

## Implementation Plan
1.  **Create Analysis Component**: Create `src/components/AnalysisResult.vue` (or similar).
2.  **Integrate Store**: Connect to the Pinia store where tokens are being streamed (likely `useAiStore` or similar).
3.  **Implement Styling**: Use Tailwind CSS to create the card/token layout.
    -   Container should wrap tokens.
    -   Individual tokens should show furigana (ruby) if available.
    -   POS tags should use color coding (as defined in UX specs, or generic for now).
4.  **Handle "Typewriter" Effect**: Ensure Vue's reactivity handles the array updates smoothly. Transition groups can be used for added effect.
5.  **Update Side Panel**: detailed integration into `SidePanel.vue` to show this component when analysis is active.
