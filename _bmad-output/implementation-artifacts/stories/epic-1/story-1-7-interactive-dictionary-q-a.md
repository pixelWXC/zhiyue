# Story 1.7: Interactive Dictionary & Q&A

**Parent Epic:** Epic 1 - Instant Analysis Companion

## User Story

As a User,
I want to click on words to see details or ask follow-up questions,
So that I can clarify doubts about specific grammar points immediately.

## Acceptance Criteria

### 1. Token Interaction
1.  **Given** the analysis results are displayed (in Side Panel or In-Page Modal).
2.  **When** I click on a specific Token.
3.  **Then** a detail view should expand (or appearing in a dedicated area) showing:
    *   Full Meaning/Definition.
    *   Pronunciation/Reading.
    *   Dictionary Links (e.g., Jisho.org, Goo).

### 2. Q&A Integration
1.  **Given** a token is selected or general analysis is active.
2.  **When** I type a question in the "Ask AI" box.
3.  **Then** it should send the question + context (sentence + selected token) to Gemini Flash.
4.  **And** display the answer in the UI.

### 3. AI Service Implementation
1.  **Given** the user asks a question.
2.  **Then** the system should use a specific "Q&A Prompt" that provides the AI with the sentence context and grammatical role of the token.
3.  **And** return a concise, helpful explanation in Chinese.

## Implementation Notes

-   **Components**:
    -   `TokenDetail.vue`: New component to display detailed info and Q&A chat.
    -   Update `AnalysisResult.vue`: Make tokens clickable and emit selection event.
-   **State Management**:
    -   Add `selectedToken` state to `useAiStore`? Or local state?
-   **AI Service**:
    -   Add `askQuestion(context, question)` method to `useAiService`.
    -   Define `qaPrompt` in `src/services/ai/prompts.ts`.
