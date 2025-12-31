# Story 3.1: Magic Card Content Generation Service

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Developer,
I want to generate a rich flashcard data model (Target Word, Sentence, Meaning, Hint, Scene Description) from the current analysis,
so that I have the structured content needed to create a high-quality Anki card.

## Acceptance Criteria

1.  **Strict Typed Data Model:**
    *   Define a `FlashcardData` interface containing:
        *   `targetWord`: The specific word/token being studied.
        *   `reading`: Furigana/Reading of the word.
        *   `sentence`: The full example sentence.
        *   `meaning`: A concise definition focused on the sentence context.
        *   `hint`: A helpful hint (e.g., related grammar point or usage note).
        *   `sceneDescription`: A highly descriptive, visual prompt for the image generator (e.g., "A hand-drawn sketch of a cat eating an apple...").
    *   Ensure all fields are strictly typed in TypeScript.

2.  **Card Generation Service:**
    *   Implement a method `generateCardContent(sentence: string, targetToken?: Token)` in `AiService` (or a dedicated `CardService`).
    *   This method should send a request to the Gemini API (Flash model is sufficient, or Pro if standardizing on "Thinking Mode" for quality).
    *   Use a dedicated System Prompt (`CARD_GEN_PROMPT`) designed to extract these fields and creatively generate the `sceneDescription`.

3.  **Scene Description Logic:**
    *   The `sceneDescription` MUST be explicitly crafted for the "Hand-Drawn Grammar Scenario" style defined in UX.
    *   It should include keywords like "minimalist sketch", "doodle style", "white background" to guide the downstream image generator.

4.  **State Management:**
    *   Update `ai-store.ts` to hold the generated `FlashcardData`.
    *   Handle "Generating" and "Error" states specifically for the card generation process (separate from the main text analysis state).

5.  **JSON Robustness:**
    *   Ensure the response parsing uses the same robust JSON handling (repairing if necessary) as the main analysis, although this is likely a non-streaming single-turn request.

## Tasks / Subtasks

- [x] Task 1: Define Data Models & State (AC: 1, 4)
  - [x] Create `FlashcardData` interface in `src/types/index.ts` (or `src/types/card.ts`).
  - [x] Update `useAiStore` (pinia) to include `cardData`, `isGeneratingCard`, and `cardError` states.
- [x] Task 2: Create System Prompt (AC: 2, 3)
  - [x] Create `src/logic/prompts/card-gen.ts`.
  - [x] Design the prompt to output the specific JSON structure.
  - [x] Include "System Persona" instructions to act as a creative curriculum designer for the `sceneDescription`.
- [x] Task 3: Implement Service Logic (AC: 2, 5)
  - [x] Add `generateCard` function to `src/logic/ai/` (expand `client.ts` or create `card-generator.ts`).
  - [x] Connect strictly to the Gemini API using the `getSettings()` API Key.
  - [x] Implement error handling and JSON parsing.

## Dev Notes

### Architecture & Patterns
-   **Service Layer**: Keep the generation logic in `src/logic/ai/`. Do not put API calls in components.
-   **Prompts**: Must be in `src/logic/prompts/`. Do not hardcode prompt strings in the service file.
-   **Store**: Use proper Pinia actions to mutate state.
-   **Model Selection**: Gemini Flash is likely sufficient and faster for this structured extraction task, but if `sceneDescription` quality is poor, allow switching to Pro (check `analyze-text` complexity decision).

### Project Structure Notes
-   Follow existing structure:
    -   `src/logic/prompts/` for prompts.
    -   `src/stores/` for state.
    -   `src/logic/ai/` for logic.

### References
-   [Architecture: AI Pipeline Management](_bmad-output/architecture.md#cross-cutting-concerns-identified)
-   [UX: The Magic Souvenir](_bmad-output/planning-artifacts/ux-design-specification.md#21-defining-experience)

## Dev Agent Record

### Agent Model Used
Gemini 2.0 Flash Thinking

### Completion Notes List
-   Confirmed this is a backend-logic-focused story. No UI components are required in this story (UI is Story 3-3).
-   Focus purely on data generation and state management.
-   Successfully implemented all three tasks:
    1. Created `FlashcardData` TypeScript interface in `src/types/card.ts` with all required fields
    2. Updated `ai-store.ts` to add card generation state management (cardData, isGeneratingCard, cardError)
    3. Created comprehensive card generation prompt with detailed scene description guidelines
    4. Implemented `card-generator.ts` service with robust JSON parsing and validation
    5. Added `generateCard` action to ai-store with proper error handling
-   Used Gemini Flash model for card generation (can be upgraded to Pro if needed)
-   Implemented robust JSON parsing with `jsonrepair` library for fault tolerance
-   Added field validation to ensure all required fields are present
-   Scene description prompt includes specific style keywords for "Hand-Drawn Grammar Scenario" aesthetic

### File List
-   `src/types/card.ts` (New) - FlashcardData interface definition
-   `src/stores/ai-store.ts` (Modified) - Added card generation state, generateCard action, and clearCardData function
-   `src/logic/prompts/card-gen.ts` (New) - Card generation system prompt and user prompt template with enhanced JSDoc
-   `src/logic/ai/card-generator.ts` (New) - Card content generation service with configurable model selection and performance monitoring
-   `src/logic/ai/card-generator.test.ts` (New) - Comprehensive unit tests for card generator (7 test cases)
-   `src/stores/ai-store.card.test.ts` (New) - Integration tests for AI store card generation (8 test cases)

## Change Log

- **2025-12-31 14:20**: Code Review & Quality Improvements (Dev Agent)
  - ✅ Added comprehensive unit tests (15 test cases total)
  - ✅ Enhanced JSDoc documentation for all public APIs
  - ✅ Added configurable model selection (flash/pro) with options parameter
  - ✅ Implemented performance monitoring with enablePerfLog option
  - ✅ Centralized error messages for easier i18n in future
  - ✅ Added clearCardData() function for fine-grained state management
  - ✅ Improved logging with [Card Gen] and [AI Store] prefixes
  - All HIGH and MEDIUM severity issues from code review resolved
  - Story status updated to 'done'

- **2025-12-31**: Story 3-1 implementation completed
  - Created FlashcardData type definition with 6 required fields
  - Integrated card generation state into ai-store (cardData, isGeneratingCard, cardError)
  - Developed comprehensive system prompt with creative scene description guidelines
  - Implemented card generation service with JSON validation and error handling
  - All acceptance criteria satisfied
  - Build verified successful
